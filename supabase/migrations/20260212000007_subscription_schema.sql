-- Create plans table
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric DEFAULT 0,
  max_users integer DEFAULT 1,
  max_branches integer DEFAULT 1,
  features jsonb DEFAULT '{}'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on plans
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Create policy for reading plans (Public read for authenticated users)
CREATE POLICY "Authenticated users can view plans" ON public.plans
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for managing plans (Superadmin only)
CREATE POLICY "Superadmins can manage plans" ON public.plans
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'superadmin'
    )
  );


-- Modify tenants table to include subscription fields
ALTER TABLE public.tenants 
  ADD COLUMN plan_id uuid REFERENCES public.plans(id),
  ADD COLUMN status text CHECK (status IN ('active', 'suspended', 'pending_payment')) DEFAULT 'active',
  ADD COLUMN next_billing_date timestamptz,
  ADD COLUMN contact_email text,
  ADD COLUMN contact_phone text;


-- Create tenant_payments table
CREATE TABLE public.tenant_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_date timestamptz DEFAULT now(),
  payment_method text,
  reference_id text,
  status text CHECK (status IN ('completed', 'pending', 'failed')) DEFAULT 'completed',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on tenant_payments
ALTER TABLE public.tenant_payments ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing payments (Owner of tenant only + Superadmin)
-- Simplifying to allow users in the same tenant to see payments if they are admins (role check needed ideally but for now allow tenant members)
-- Better: Only superadmins and tenant admins. Let's start with broader read for simplicity or restrict.
-- Let's stick to standard pattern: tenants can see their own payments.

CREATE POLICY "Users can view payments of their tenant" ON public.tenant_payments
  FOR SELECT USING (
    tenant_id = (select tenant_id from public.profiles where id = auth.uid())
  );

-- Create policy for managing payments (Superadmin only)
CREATE POLICY "Superadmins can manage payments" ON public.tenant_payments
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'superadmin'
    )
  );

-- Insert Default Plans
INSERT INTO public.plans (name, price, max_users, max_branches, features) VALUES
('Gratis', 0, 1, 1, '{"basic_reports": true}'),
('Básico', 15000, 3, 1, '{"advanced_reports": true, "whatsapp": true}'),
('Pro', 30000, 9999, 3, '{"all_features": true}');
