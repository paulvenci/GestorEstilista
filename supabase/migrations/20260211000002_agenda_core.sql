-- Clients Table
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants on delete cascade not null,
  full_name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.clients enable row level security;

create policy "Users can view clients in same tenant"
on public.clients for select
using (tenant_id = get_auth_tenant_id());

create policy "Users can manage clients in same tenant"
on public.clients for all
using (tenant_id = get_auth_tenant_id());


-- Services Table
create table public.services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants on delete cascade not null,
  name text not null,
  duration_min integer not null default 30,
  price decimal(10, 2) default 0,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.services enable row level security;

create policy "Users can view services in same tenant"
on public.services for select
using (tenant_id = get_auth_tenant_id());

create policy "Users can manage services in same tenant"
on public.services for all
using (tenant_id = get_auth_tenant_id());


-- Appointments Table
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants on delete cascade not null,
  client_id uuid references public.clients on delete set null,
  stylist_id uuid references public.profiles on delete cascade not null,
  service_id uuid references public.services on delete set null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status text check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'blocked')) default 'pending',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint valid_time_range check (end_time > start_time)
);

alter table public.appointments enable row level security;

create policy "Users can view appointments in same tenant"
on public.appointments for select
using (tenant_id = get_auth_tenant_id());

create policy "Users can manage appointments in same tenant"
on public.appointments for all
using (tenant_id = get_auth_tenant_id());

-- Availability Check Function
create or replace function public.check_availability(
  p_stylist_id uuid,
  p_start_time timestamp with time zone,
  p_end_time timestamp with time zone,
  p_exclude_appointment_id uuid default null
)
returns boolean
language sql stable
as $$
  select not exists (
    select 1 from public.appointments
    where stylist_id = p_stylist_id
      and status not in ('cancelled')
      and (id != p_exclude_appointment_id or p_exclude_appointment_id is null)
      and (
        (start_time < p_end_time and end_time > p_start_time)
      )
  );
$$;
