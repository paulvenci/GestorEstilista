-- ENSURE CATALOG TABLES EXIST (SERVICES & PRODUCTS)
-- Run this in Supabase > SQL Editor

-- 1. SERVICES TABLE
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    duration_min INTEGER DEFAULT 30,
    price NUMERIC DEFAULT 0,
    active BOOLEAN DEFAULT true
);

-- Enable RLS for Services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Policies for Services
DROP POLICY IF EXISTS "View Services" ON public.services;
CREATE POLICY "View Services" ON public.services FOR SELECT USING (true); -- Publicly visible or valid user? Usually valid user.
-- Let's make it visible to authenticated users for now
DROP POLICY IF EXISTS "Auth Users View Services" ON public.services;
CREATE POLICY "Auth Users View Services" ON public.services FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Manage Services" ON public.services;
CREATE POLICY "Admin Manage Services" ON public.services FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC DEFAULT 0, -- Precio Venta
    cost NUMERIC DEFAULT 0,  -- Costo
    stock INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    active BOOLEAN DEFAULT true
);

-- Enable RLS for Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policies for Products
DROP POLICY IF EXISTS "View Products" ON public.products;
CREATE POLICY "View Products" ON public.products FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Manage Products" ON public.products;
CREATE POLICY "Admin Manage Products" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. TRANSACTION ITEMS (If not exists, though referenced in secure_financials.sql)
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tenant_id UUID NOT NULL,
    transaction_id UUID NOT NULL, -- References transactions.id (assumed exists)
    service_id UUID REFERENCES public.services(id),
    product_id UUID REFERENCES public.products(id),
    item_type TEXT CHECK (item_type IN ('service', 'product')),
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC DEFAULT 0
);
-- Note: RLS for transaction_items was handled in previous script.
