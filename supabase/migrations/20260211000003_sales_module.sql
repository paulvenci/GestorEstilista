-- Add commission_rate to profiles
ALTER TABLE public.profiles 
ADD COLUMN commission_rate integer DEFAULT 0;

-- Create transactions table
CREATE TABLE public.transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
    client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
    stylist_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    total_amount decimal(10, 2) NOT NULL DEFAULT 0,
    commission_amount decimal(10, 2) NOT NULL DEFAULT 0,
    payment_method text NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'other')),
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Transactions

-- 1. Users can view transactions from their tenant
CREATE POLICY "Users can view tenant transactions"
ON public.transactions
FOR SELECT
USING (
    tenant_id = get_auth_tenant_id()
);

-- 2. Users can insert transactions for their tenant
CREATE POLICY "Users can insert tenant transactions"
ON public.transactions
FOR INSERT
WITH CHECK (
    tenant_id = get_auth_tenant_id()
);

-- 3. Users can update transactions for their tenant (e.g. correct notes)
CREATE POLICY "Users can update tenant transactions"
ON public.transactions
FOR UPDATE
USING (
    tenant_id = get_auth_tenant_id()
);
