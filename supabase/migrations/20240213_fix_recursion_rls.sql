-- FIX INFINITE RECURSION IN RLS

-- 1. Create a SECURITY DEFINER function to check role without triggering RLS recursively
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing policies on PROFILES to start fresh and avoid conflicts
DROP POLICY IF EXISTS "Admins can update any profile in tenant" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view any profile in tenant" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by users who created them." ON public.profiles; -- Default Supabase template policy name

-- 3. Create CLEAN policies using the secure function

-- SELECT: Users see themselves, Admins see everyone
CREATE POLICY "View Profiles" ON public.profiles
FOR SELECT
USING (
  auth.uid() = id OR is_admin()
);

-- UPDATE: Users update themselves, Admins update everyone
CREATE POLICY "Update Profiles" ON public.profiles
FOR UPDATE
USING (
  auth.uid() = id OR is_admin()
);

-- INSERT: Admins can create profiles (for new users)
CREATE POLICY "Insert Profiles" ON public.profiles
FOR INSERT
WITH CHECK (
  is_admin() OR auth.uid() = id -- In case of self-registration
);
