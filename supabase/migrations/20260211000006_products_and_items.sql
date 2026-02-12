-- Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  cost numeric(10,2) DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  low_stock_threshold integer DEFAULT 5,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view products in same tenant"
ON public.products FOR SELECT
USING (tenant_id = get_auth_tenant_id());

CREATE POLICY "Users can manage products in same tenant"
ON public.products FOR ALL
USING (tenant_id = get_auth_tenant_id());

-- Create Transaction Items Table (Detail)
CREATE TABLE IF NOT EXISTS public.transaction_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  item_type text CHECK (item_type IN ('service', 'product')) NOT NULL,
  item_id uuid NOT NULL, -- Logical FK, can point to services or products
  name text NOT NULL, -- Snapshot of name at time of sale
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for Transaction Items
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transaction items in same tenant"
ON public.transaction_items FOR SELECT
USING (tenant_id = get_auth_tenant_id());

CREATE POLICY "Users can insert transaction items in same tenant"
ON public.transaction_items FOR INSERT
WITH CHECK (tenant_id = get_auth_tenant_id());

-- Index for performance
CREATE INDEX idx_products_tenant ON public.products(tenant_id);
CREATE INDEX idx_tx_items_transaction ON public.transaction_items(transaction_id);
