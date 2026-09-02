-- KoyaPay V1 — Schéma initial
-- À exécuter dans Supabase → SQL Editor

-- Profil entreprise (lié à auth.users)
create table if not exists public.companies (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone text,
  phone_country text default '+229',
  whatsapp text,
  email text,
  stamp_url text,        -- cachet
  signature_url text,    -- signature
  balance numeric(14,2) default 0 not null,
  onboarding_done boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Employés
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  mobile_money text not null,   -- +229...
  whatsapp text,
  base_salary numeric(14,2) default 0 not null,
  cnss boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists employees_company_idx on public.employees(company_id);

-- RLS
alter table public.companies enable row level security;
alter table public.employees enable row level security;

create policy "companies_own" on public.companies
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "employees_own" on public.employees
  for all using (auth.uid() = company_id) with check (auth.uid() = company_id);

-- Créer automatiquement la ligne company à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.companies (id, email, phone, phone_country)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'phone_country', '+229')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
