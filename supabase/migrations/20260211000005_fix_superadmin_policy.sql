-- Fix SuperAdmin Policy Recursion
-- Problem: The policy "SuperAdmins can full access profiles" queries 'profiles' table directly.
-- Since the user triggers RLS, checking this policy triggers RLS on 'profiles' again -> Infinite Loop.

-- Solution: Encapsulate the check in a SECURITY DEFINER function.
-- SECURITY DEFINER functions run with the privileges of the creator (postgres/admin), which Bypasses RLS.

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  );
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "SuperAdmins can full access profiles" ON public.profiles;

-- Create new policy using the secure function
CREATE POLICY "SuperAdmins can full access profiles"
ON public.profiles
FOR ALL
USING (
  public.is_superadmin()
);
