-- Create new migration for ensuring RLS policies allow profiles update
-- Run this in your Supabase Dashboard > SQL Editor

-- Enable RLS just in case (if not enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can update any profile in their tenant
DROP POLICY IF EXISTS "Admins can update any profile in tenant" ON public.profiles;
CREATE POLICY "Admins can update any profile in tenant" ON public.profiles
    FOR UPDATE
    USING (
        auth.uid() = id -- User updates self
        OR
        (
            SELECT role FROM public.profiles WHERE id = auth.uid()
        ) = 'admin' -- Or user is an Admin
        -- Optional: Add tenant check if you have multi-tenant logic (AND tenant_id = profiles.tenant_id)
    );

-- Policy: Admin can select any profile (to view team)
DROP POLICY IF EXISTS "Admins can view any profile in tenant" ON public.profiles;
CREATE POLICY "Admins can view any profile in tenant" ON public.profiles
    FOR SELECT
    USING (
        auth.uid() = id
        OR
        (
            SELECT role FROM public.profiles WHERE id = auth.uid()
        ) = 'admin'
    );
