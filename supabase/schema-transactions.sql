-- Historique des transactions de dépôt (FedaPay / simulation)
create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  payroll_id uuid references public.payrolls(id) on delete set null,
  payment_date date not null default (current_date),
  salary_month text,
  phone_used text,
  amount numeric(14,2) not null default 0,
  fees_operator numeric(14,2) default 0,
  reference text,
  provider text default 'fedapay',
  status text default 'completed',
  created_at timestamptz default now() not null
);

create index if not exists payment_transactions_company_idx
  on public.payment_transactions(company_id);

alter table public.payment_transactions enable row level security;

create policy "payment_tx_own" on public.payment_transactions
  for all using (auth.uid() = company_id)
  with check (auth.uid() = company_id);

-- Champs utiles sur payrolls
alter table public.payrolls add column if not exists deposit_phone text;
alter table public.payrolls add column if not exists deposit_reference text;
