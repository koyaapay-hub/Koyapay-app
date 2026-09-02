-- KoyaPay — Tables Paie & Suivi
-- À exécuter dans Supabase → SQL Editor (après le schéma initial)

create table if not exists public.payrolls (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  payment_date date not null,
  status text not null default 'draft'
    check (status in ('draft','scheduled','processing','completed','partial','cancelled')),
  employee_count int not null default 0,
  total_net numeric(14,2) not null default 0,
  fees numeric(14,2) not null default 0,
  total_deposit numeric(14,2) not null default 0,
  deposit_method text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists payrolls_company_idx on public.payrolls(company_id);

create table if not exists public.payroll_items (
  id uuid primary key default gen_random_uuid(),
  payroll_id uuid not null references public.payrolls(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete set null,
  first_name text not null,
  last_name text not null,
  mobile_money text not null,
  base_salary numeric(14,2) not null default 0,
  commission numeric(14,2) not null default 0,
  primes numeric(14,2) not null default 0,
  transport numeric(14,2) not null default 0,
  autres numeric(14,2) not null default 0,
  retenues numeric(14,2) not null default 0,
  net numeric(14,2) not null default 0,
  status text not null default 'pending'
    check (status in ('pending','paid','failed')),
  fail_reason text,
  retries int not null default 0,
  bulletin_sent boolean not null default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists payroll_items_payroll_idx on public.payroll_items(payroll_id);

alter table public.payrolls enable row level security;
alter table public.payroll_items enable row level security;

create policy "payrolls_own" on public.payrolls
  for all using (auth.uid() = company_id) with check (auth.uid() = company_id);

create policy "payroll_items_own" on public.payroll_items
  for all using (
    exists (
      select 1 from public.payrolls p
      where p.id = payroll_id and p.company_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.payrolls p
      where p.id = payroll_id and p.company_id = auth.uid()
    )
  );
