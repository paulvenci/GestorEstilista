-- 1. get_public_availability (FIXED v2)
CREATE OR REPLACE FUNCTION public.get_public_availability(
    p_tenant_slug text,
    p_stylist_id uuid,
    p_date date
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id uuid;
    v_tenant_status text;
    v_booking_settings record;
    v_work_start text := '09:00';
    v_work_end text := '19:00';
    v_slot_interval_min integer := 30;
    v_day_of_week integer;
    v_is_workday boolean := true;
    
    v_start_time timestamp with time zone;
    v_end_time timestamp with time zone;
    v_appointments json;
    v_slots jsonb := '[]'::jsonb;
    
    v_current_minutes integer;
    v_end_minutes integer;
    v_hours integer;
    v_mins integer;
    v_time_str text;
    v_slot_start timestamp with time zone;
    v_slot_end timestamp with time zone;
    v_is_occupied boolean;
    v_is_past boolean;
    
    v_day_field text;
BEGIN
    -- 1. Get tenant
    SELECT id, status INTO v_tenant_id, v_tenant_status
    FROM public.tenants
    WHERE slug = p_tenant_slug;
    
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Negocio no encontrado';
    END IF;
    
    IF v_tenant_status != 'active' THEN
        RAISE EXCEPTION 'Negocio no activo';
    END IF;

    -- 2. Get booking settings
    SELECT * INTO v_booking_settings
    FROM public.booking_settings
    WHERE tenant_id = v_tenant_id;
    
    IF FOUND THEN
        -- Cast time to text for COALESCE and compatibility with later logic
        v_work_start := COALESCE(v_booking_settings.work_start_time::text, v_work_start);
        v_work_end := COALESCE(v_booking_settings.work_end_time::text, v_work_end);
        v_slot_interval_min := COALESCE(v_booking_settings.slot_interval_min, v_slot_interval_min);
        
        -- Verificar si es día laboral
        v_day_of_week := EXTRACT(DOW FROM p_date); -- 0=Sun, 1=Mon...
        
        v_day_field := CASE v_day_of_week
            WHEN 0 THEN 'work_sunday'
            WHEN 1 THEN 'work_monday'
            WHEN 2 THEN 'work_tuesday'
            WHEN 3 THEN 'work_wednesday'
            WHEN 4 THEN 'work_thursday'
            WHEN 5 THEN 'work_friday'
            WHEN 6 THEN 'work_saturday'
        END;
        
        -- FIX v2: Use to_jsonb to access dynamic field safely
        v_is_workday := COALESCE((to_jsonb(v_booking_settings) ->> v_day_field)::boolean, true);
        
        IF NOT v_is_workday THEN
            RETURN json_build_object('slots', '[]'::jsonb, 'closed', true, 'message', 'Cerrado este día.');
        END IF;
    END IF;

    -- 3. Get existing appointments for that stylist on that date
    v_start_time := p_date + time '00:00:00';
    v_end_time := p_date + time '23:59:59';
    
    SELECT COALESCE(json_agg(json_build_object('start_time', a.start_time, 'end_time', a.end_time)), '[]'::json)
    INTO v_appointments
    FROM public.appointments a
    WHERE a.stylist_id = p_stylist_id
      AND a.tenant_id = v_tenant_id
      AND a.status != 'cancelled'
      AND a.start_time >= v_start_time
      AND a.start_time <= v_end_time;
      
    -- 4. Generate available time slots
    v_current_minutes := CAST(split_part(v_work_start, ':', 1) AS integer) * 60 + CAST(split_part(v_work_start, ':', 2) AS integer);
    v_end_minutes := CAST(split_part(v_work_end, ':', 1) AS integer) * 60 + CAST(split_part(v_work_end, ':', 2) AS integer);

    WHILE v_current_minutes < v_end_minutes LOOP
        v_hours := v_current_minutes / 60;
        v_mins := v_current_minutes % 60;
        v_time_str := lpad(v_hours::text, 2, '0') || ':' || lpad(v_mins::text, 2, '0');
        
        v_slot_start := p_date + make_interval(hours := v_hours, mins := v_mins);
        v_slot_end := v_slot_start + make_interval(mins := v_slot_interval_min);
        
        -- Check if slot overlaps with any existing appointment
        SELECT EXISTS (
            SELECT 1 FROM json_array_elements(v_appointments) as appt
            WHERE v_slot_start < (appt->>'end_time')::timestamp with time zone 
              AND v_slot_end > (appt->>'start_time')::timestamp with time zone
        ) INTO v_is_occupied;
        
        -- Don't show past slots for today
        v_is_past := v_slot_start < now();
        
        v_slots := v_slots || jsonb_build_object(
            'time', v_time_str,
            'available', NOT v_is_occupied AND NOT v_is_past
        );
        
        v_current_minutes := v_current_minutes + v_slot_interval_min;
    END LOOP;

    RETURN json_build_object(
        'slots', v_slots,
        'closed', false,
        'work_start', v_work_start,
        'work_end', v_work_end
    );
END;
$$;
