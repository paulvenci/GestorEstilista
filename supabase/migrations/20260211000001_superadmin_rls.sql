-- Allow SuperAdmins to view and manage ALL tenants
create policy "SuperAdmins can full access tenants"
on public.tenants
for all
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'superadmin'
  )
);

-- Allow SuperAdmins to view and manage ALL profiles
create policy "SuperAdmins can full access profiles"
on public.profiles
for all
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'superadmin'
  )
);
