-- Create tenants table
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  slug text unique not null,
  logo_url text
);

-- Enable RLS on tenants
alter table public.tenants enable row level security;

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  tenant_id uuid references public.tenants on delete cascade,
  full_name text,
  role text check (role in ('superadmin', 'admin', 'stylist')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Create helper function to get current user's tenant_id
create or replace function public.get_auth_tenant_id()
returns uuid
language sql stable
security definer
as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

-- RLS Policies for Tenants
create policy "Users can view their own tenant"
on public.tenants
for select
using (
  id = get_auth_tenant_id()
);

-- RLS Policies for Profiles
-- 1. Users can always view their own profile
create policy "Users can view own profile"
on public.profiles
for select
using (
  auth.uid() = id
);

-- 2. Users can view other profiles in the same tenant
create policy "Users can view profiles in same tenant"
on public.profiles
for select
using (
  tenant_id = get_auth_tenant_id()
);

-- 3. Only SuperAdmins or System actions can insert/update other profiles
-- For now, we will rely on Service Role for user management or add precise policies later.
