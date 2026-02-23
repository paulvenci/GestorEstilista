-- Allow admins to delete commission payouts
CREATE POLICY "Admins can delete payouts for their tenant"
ON public.commission_payouts
FOR DELETE
USING (
  auth.uid() IN (
    SELECT profiles.id
    FROM profiles
    WHERE profiles.tenant_id = commission_payouts.tenant_id
    AND profiles.role = 'admin'
  )
);
