-- Create branches table
CREATE TABLE public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  phone text,
  is_main boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on branches
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing branches (Users can view branches of their tenant)
CREATE POLICY "Users can view branches of their tenant" ON public.branches
  FOR SELECT USING (
    tenant_id = (select tenant_id from public.profiles where id = auth.uid())
  );

-- Create policy for managing branches (Tenant Admins and Superadmins)
CREATE POLICY "Admins can manage branches" ON public.branches
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() 
      and (role = 'superadmin' OR (role = 'admin' AND tenant_id = branches.tenant_id))
    )
  );


-- Update profiles table to link to branch
ALTER TABLE public.profiles 
  ADD COLUMN branch_id uuid REFERENCES public.branches(id);

-- Auto-create a main branch for existing tenants and link users
DO $$
DECLARE
    t record;
    main_branch_id uuid;
BEGIN
    FOR t IN SELECT * FROM public.tenants LOOP
        -- Create main branch for tenant
        INSERT INTO public.branches (tenant_id, name, is_main)
        VALUES (t.id, 'Casa Matriz', true)
        RETURNING id INTO main_branch_id;

        -- Update existing profiles of this tenant to belong to the main branch
        UPDATE public.profiles 
        SET branch_id = main_branch_id 
        WHERE tenant_id = t.id;
    END LOOP;
END $$;
