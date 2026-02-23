-- Enable RLS on appointments table
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts (clean slate for appointments)
DROP POLICY IF EXISTS "Users can view appointments in same tenant" ON public.appointments;
DROP POLICY IF EXISTS "Users can manage appointments in same tenant" ON public.appointments;

-- Policy for SELECT: 
-- Admins/Receptionists can see all in tenant.
-- Stylists can see only appointments where they are the stylist.
-- Clients can see only their own appointments (future proofing).
CREATE POLICY "Users can view own appointments or full tenant if admin"
ON public.appointments
FOR SELECT
USING (
  (tenant_id = get_auth_tenant_id()) AND (
    -- Admin or Receptionist regex check on role
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' ~* '^(admin|receptionist|superadmin)$'
    OR
    -- Stylist check: owner of the appointment record as stylist
    stylist_id = auth.uid()
    OR
    -- Client check: owner of the appointment record as client
    client_id::text = auth.uid()::text
  )
);

-- Policy for INSERT/UPDATE/DELETE:
-- Admins/Receptionists can manage all.
-- Stylists can manage only their own.
CREATE POLICY "Users can manage own appointments or full tenant if admin"
ON public.appointments
FOR ALL
USING (
  (tenant_id = get_auth_tenant_id()) AND (
    -- Admin or Receptionist
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' ~* '^(admin|receptionist|superadmin)$'
    OR
    -- Stylist: owner as stylist
    stylist_id = auth.uid()
  )
)
WITH CHECK (
  (tenant_id = get_auth_tenant_id()) AND (
    -- Admin or Receptionist
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' ~* '^(admin|receptionist|superadmin)$'
    OR
    -- Stylist: owner as stylist
    stylist_id = auth.uid()
  )
);
