-- 1. get_public_availability
-- Retorna slots disponibles para un tenant y estilista en una fecha.
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
        v_work_start := COALESCE(v_booking_settings.work_start_time, v_work_start);
        v_work_end := COALESCE(v_booking_settings.work_end_time, v_work_end);
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
        
        EXECUTE format('SELECT COALESCE(($1).%I, true)', v_day_field)
        INTO v_is_workday
        USING v_booking_settings;
        
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
        
        -- Slot start & end in database timezone (UTC generally, but dates map to logical time)
        -- Usar p_date directamente como base
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

-- 2. create_public_booking
-- Crea la cita pública de forma segura
CREATE OR REPLACE FUNCTION public.create_public_booking(
    p_tenant_slug text,
    p_stylist_id uuid,
    p_service_id uuid,
    p_start_time timestamp with time zone,
    p_client_name text,
    p_client_phone text,
    p_client_email text DEFAULT NULL,
    p_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id uuid;
    v_tenant_status text;
    v_booking_settings record;
    v_service record;
    v_end_time timestamp with time zone;
    v_conflicting boolean;
    v_client_id uuid;
    v_appointment_id uuid;
    v_confirmation_msg text := 'Su cita ha sido agendada exitosamente.';
BEGIN
    -- Validaciones básicas ya hechas en frontend, pero por si acaso.
    IF p_tenant_slug IS NULL OR p_stylist_id IS NULL OR p_service_id IS NULL OR p_start_time IS NULL OR p_client_name IS NULL OR p_client_phone IS NULL THEN
        RAISE EXCEPTION 'Faltan campos obligatorios';
    END IF;

    -- 1. Obtener tenant
    SELECT id, status INTO v_tenant_id, v_tenant_status
    FROM public.tenants
    WHERE slug = p_tenant_slug;
    
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Negocio no encontrado.';
    END IF;
    
    IF v_tenant_status != 'active' THEN
        RAISE EXCEPTION 'Este negocio no está aceptando citas en este momento.';
    END IF;

    -- 2. Verificar booking_settings
    SELECT * INTO v_booking_settings
    FROM public.booking_settings
    WHERE tenant_id = v_tenant_id;
    
    IF FOUND AND NOT COALESCE(v_booking_settings.booking_enabled, true) THEN
        RAISE EXCEPTION 'El agendamiento en línea está desactivado.';
    END IF;
    
    IF FOUND AND v_booking_settings.confirmation_message IS NOT NULL THEN
        v_confirmation_msg := v_booking_settings.confirmation_message;
    END IF;

    -- 3. Obtener servicio para calcular end_time
    SELECT duration_min, name INTO v_service
    FROM public.services
    WHERE id = p_service_id AND tenant_id = v_tenant_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Servicio no encontrado.';
    END IF;

    -- Calcular end_time
    v_end_time := p_start_time + make_interval(mins := v_service.duration_min);

    -- 4. Verificar disponibilidad del profesional (sin solapamiento)
    SELECT EXISTS (
        SELECT 1 FROM public.appointments
        WHERE stylist_id = p_stylist_id
          AND tenant_id = v_tenant_id
          AND status != 'cancelled'
          AND start_time < v_end_time
          AND end_time > p_start_time
    ) INTO v_conflicting;
    
    IF v_conflicting THEN
        RAISE EXCEPTION 'El profesional ya tiene una cita en ese horario. Por favor, selecciona otro horario.';
    END IF;

    -- 5. Buscar o crear cliente
    SELECT id INTO v_client_id
    FROM public.clients
    WHERE tenant_id = v_tenant_id AND phone = p_client_phone
    LIMIT 1;
    
    IF v_client_id IS NULL THEN
        INSERT INTO public.clients (tenant_id, full_name, email, phone)
        VALUES (v_tenant_id, p_client_name, p_client_email, p_client_phone)
        RETURNING id INTO v_client_id;
    END IF;

    -- 6. Crear la cita
    INSERT INTO public.appointments (
        tenant_id,
        client_id,
        stylist_id,
        service_id,
        start_time,
        end_time,
        status,
        notes
    )
    VALUES (
        v_tenant_id,
        v_client_id,
        p_stylist_id,
        p_service_id,
        p_start_time,
        v_end_time,
        'pending',
        COALESCE(p_notes, 'Reserva online - ' || p_client_name)
    )
    RETURNING id INTO v_appointment_id;

    RETURN json_build_object(
        'success', true,
        'appointment', json_build_object(
            'id', v_appointment_id,
            'start_time', p_start_time,
            'end_time', v_end_time,
            'status', 'pending',
            'service_name', v_service.name,
            'client_name', p_client_name
        ),
        'message', v_confirmation_msg
    );
END;
$$;
