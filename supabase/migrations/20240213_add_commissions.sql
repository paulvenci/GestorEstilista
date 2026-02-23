-- Create new migration for adding commission columns to profiles
-- Run this in your Supabase Dashboard > SQL Editor

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS product_commission_rate numeric DEFAULT 0;

-- Optional: Ensure RLS policy allows update (if not already handled)
-- Usually profiles update policy allows users to update their own profile OR admins to update any.
-- The current issue is likely just missing columns.
