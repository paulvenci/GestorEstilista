-- Add name and rename price to unit_price in appointment_items
ALTER TABLE public.appointment_items 
ADD COLUMN IF NOT EXISTS name text;

ALTER TABLE public.appointment_items 
RENAME COLUMN price TO unit_price;
