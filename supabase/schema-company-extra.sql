-- Champs entreprise supplémentaires (Réglages + bulletin)
alter table public.companies add column if not exists director_name text;
alter table public.companies add column if not exists company_email text;
alter table public.companies add column if not exists company_address text;
alter table public.companies add column if not exists logo_url text;

-- Autres personnalisés sur les lignes de paie (max 2)
alter table public.payroll_items add column if not exists other1_label text;
alter table public.payroll_items add column if not exists other1_amount numeric(14,2) default 0;
alter table public.payroll_items add column if not exists other2_label text;
alter table public.payroll_items add column if not exists other2_amount numeric(14,2) default 0;
