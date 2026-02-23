-- Add settings column to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}'::jsonb;

-- Create RPC function to securely update tenant settings
CREATE OR REPLACE FUNCTION public.update_tenant_settings(p_settings jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- Get current user's tenant
  v_tenant_id := get_auth_tenant_id();
  
  -- Basic validation: Ensure user is authenticated and belongs to a tenant
  IF v_tenant_id IS NULL THEN
      RAISE EXCEPTION 'Not authorized: No tenant found for user';
  END IF;

  -- Optional: Helper check to ensure user has permission (e.g. is admin)
  -- For now, we assume any user with access to the app (which requires RLS) can update settings if exposed in UI
  -- Ideally, check for 'admin' role in profiles if that column exists and is populated reliably
  
  -- Update the settings
  -- We use the || operator to merge existing settings with new ones (partial update)
  UPDATE public.tenants
  SET settings = COALESCE(settings, '{}'::jsonb) || p_settings
  WHERE id = v_tenant_id;
END;
$$;
