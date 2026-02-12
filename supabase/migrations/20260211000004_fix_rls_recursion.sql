-- Fix RLS Infinite Recursion
-- Problem: 'get_auth_tenant_id' queries 'profiles', which triggers 'profiles' policy, which calls 'get_auth_tenant_id'.
-- Solution: 
-- 1. Ensure 'get_auth_tenant_id' is SECURITY DEFINER (It was, but maybe owner issues).
-- 2. Create a separate secure mapping table or just try to optimize.
-- Alternative: We can drop the policy "Users can view profiles in same tenant" and allow "Enable read access for all authenticated users" on profiles? 
-- No, we want isolation.

-- Attempt 1: Explicitly set search_path and ensure config.
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Attempt 2: Refine the policy to avoid using the function for the row itself?
-- No, the function is needed for the comparator.

-- Attempt 3: Granting BYPASSRLS to the function owner (usually postgres) is automatic.
-- Maybe the current user is NOT postgres?
-- Let's try to grant usage on a separate view?

-- Let's try to break the loop by excluding the current user's row from the policy check? 
-- No, the loop happens inside the function call.

-- REAL FIX: 
-- We will duplicate the tenant_id into a JWT claim via a hook, OR easier:
-- Create a new table 'tenant_members' to store the relationship, avoiding the self-reference on profiles.

CREATE TABLE IF NOT EXISTS public.tenant_members (
    user_id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants NOT NULL
);

-- Copy existing data
INSERT INTO public.tenant_members (user_id, tenant_id)
SELECT id, tenant_id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Enable RLS on new table
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- Policy for tenant_members: Users can view their own membership
CREATE POLICY "Users can view own tenant membership"
ON public.tenant_members
FOR SELECT
USING (auth.uid() = user_id);

-- Update function to read from tenant_members instead of profiles
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid();
$$;

-- Now 'get_auth_tenant_id' reads 'tenant_members' (which is safe), 
-- and 'profiles' policy uses 'get_auth_tenant_id'. 
-- No loop.

-- Update Trigger to maintain tenant_members
CREATE OR REPLACE FUNCTION public.handle_profile_tenant_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.tenant_members (user_id, tenant_id)
  VALUES (NEW.id, NEW.tenant_id)
  ON CONFLICT (user_id) DO UPDATE SET tenant_id = NEW.tenant_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_change_sync_tenant ON public.profiles;

CREATE TRIGGER on_profile_change_sync_tenant
AFTER INSERT OR UPDATE OF tenant_id ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_profile_tenant_sync();

-- Ensure existing profiles are synced (again, just in case)
INSERT INTO public.tenant_members (user_id, tenant_id)
SELECT id, tenant_id FROM public.profiles
ON CONFLICT (user_id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id;
