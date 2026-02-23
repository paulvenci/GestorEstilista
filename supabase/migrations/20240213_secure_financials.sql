-- Secure Financial Data (Transactions & Commissions)
-- Run this in your Supabase Dashboard > SQL Editor

-- 1. Enable RLS on financial tables
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "View Transactions" ON public.transactions;
DROP POLICY IF EXISTS "Manage Transactions" ON public.transactions;
DROP POLICY IF EXISTS "View Items" ON public.transaction_items;

-- 3. Create Policies for TRANSACTIONS

-- SELECT: Admins see all. Stylists see only where they are the 'stylist_id'.
CREATE POLICY "View Transactions" ON public.transactions
FOR SELECT
USING (
  auth.uid() = stylist_id OR is_admin()
);

-- INSERT: Admins and Stylists can create transactions (Sales)
-- Usually stylists create their own sales.
CREATE POLICY "Create Transactions" ON public.transactions
FOR INSERT
WITH CHECK (
  auth.uid() = stylist_id OR is_admin()
);

-- UPDATE/DELETE: Only Admins can modify/delete sales history?
-- Or maybe Stylists can update ONLY if status is 'pending'? (Assuming sales are final for now)
-- Let's allow Admins mostly.
CREATE POLICY "Admin Manage Transactions" ON public.transactions
FOR UPDATE
USING ( is_admin() );

CREATE POLICY "Admin Delete Transactions" ON public.transactions
FOR DELETE
USING ( is_admin() );

-- 4. Create Policies for TRANSACTION ITEMS
-- Visibility depends on the parent transaction
CREATE POLICY "View Items" ON public.transaction_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = transaction_items.transaction_id
    AND (t.stylist_id = auth.uid() OR is_admin())
  )
);

CREATE POLICY "Insert Items" ON public.transaction_items
FOR INSERT
WITH CHECK (
  -- Can insert if they can insert the parent transaction (simplified check)
  -- Or just allow authenticated users to insert items linked to their tx
  auth.role() = 'authenticated'
);
