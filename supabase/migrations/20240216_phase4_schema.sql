-- Add commission settings to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS commission_type text DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed_rent')),
ADD COLUMN IF NOT EXISTS fixed_rent_cost integer DEFAULT 0;

-- Create appointment_items table for multi-service support
CREATE TABLE IF NOT EXISTS public.appointment_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
    item_id uuid NOT NULL, -- Reference to services or products ID (can't strict FK easily if mixed, but usually services)
    item_type text DEFAULT 'service' CHECK (item_type IN ('service', 'product')),
    price integer DEFAULT 0,
    quantity integer DEFAULT 1
);

-- Enable RLS
ALTER TABLE public.appointment_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appointment_items (inherit access from appointment ideally, but practically same as appointments)
CREATE POLICY "Users can view appointment items of their tenant"
ON public.appointment_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.id = appointment_items.appointment_id
        AND a.tenant_id = get_auth_tenant_id()
    )
);

CREATE POLICY "Users can insert appointment items for their tenant"
ON public.appointment_items FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.id = appointment_items.appointment_id
        AND a.tenant_id = get_auth_tenant_id()
    )
);

CREATE POLICY "Users can update appointment items for their tenant"
ON public.appointment_items FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.id = appointment_items.appointment_id
        AND a.tenant_id = get_auth_tenant_id()
    )
);

CREATE POLICY "Users can delete appointment items for their tenant"
ON public.appointment_items FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.id = appointment_items.appointment_id
        AND a.tenant_id = get_auth_tenant_id()
    )
);

-- Basic Migration: Move existing services to items (if any exist and table is empty)
INSERT INTO public.appointment_items (appointment_id, item_id, item_type, price)
SELECT id, service_id, 'service', 0 -- Price might be 0 because we didn't store historical price in appointment
FROM public.appointments
WHERE service_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM public.appointment_items WHERE appointment_items.appointment_id = appointments.id);
