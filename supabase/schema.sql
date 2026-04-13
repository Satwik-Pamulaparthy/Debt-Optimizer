-- ─── Profiles ────────────────────────────────────────────────────────────────
-- Extends auth.users with app-specific data.
-- Row is created automatically on sign-up via the trigger below.

create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  name           text not null default '',
  country        text not null default 'US',
  currency       text not null default 'USD',
  monthly_income numeric(12,2) not null default 0,
  monthly_expenses numeric(12,2) not null default 0,
  goal           text not null default 'balanced',
  selected_strategy text not null default 'avalanche',
  onboarding_complete boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Trigger: create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, country, currency)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'country', 'US'),
    coalesce(new.raw_user_meta_data->>'currency', 'USD')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ─── Debts ────────────────────────────────────────────────────────────────────

create table if not exists public.debts (
  id               text primary key default gen_random_uuid()::text,
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  institution      text not null default '',
  type             text not null default 'other',
  balance          numeric(12,2) not null,
  original_balance numeric(12,2) not null,
  minimum_payment  numeric(12,2) not null,
  apr              numeric(6,4) not null,
  due_date         smallint not null default 15,
  late_fee         numeric(8,2) not null default 0,
  credit_limit     numeric(12,2),
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger debts_updated_at before update on public.debts
  for each row execute procedure public.set_updated_at();

-- ─── Bank Accounts ────────────────────────────────────────────────────────────

create table if not exists public.bank_accounts (
  id           text primary key default gen_random_uuid()::text,
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  institution  text not null default '',
  type         text not null default 'checking',
  balance      numeric(12,2) not null default 0,
  mask         text,
  last_updated timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.profiles      enable row level security;
alter table public.debts         enable row level security;
alter table public.bank_accounts enable row level security;

-- Profiles
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Debts
create policy "Users can view own debts"
  on public.debts for select using (auth.uid() = user_id);
create policy "Users can insert own debts"
  on public.debts for insert with check (auth.uid() = user_id);
create policy "Users can update own debts"
  on public.debts for update using (auth.uid() = user_id);
create policy "Users can delete own debts"
  on public.debts for delete using (auth.uid() = user_id);

-- Bank accounts
create policy "Users can view own accounts"
  on public.bank_accounts for select using (auth.uid() = user_id);
create policy "Users can insert own accounts"
  on public.bank_accounts for insert with check (auth.uid() = user_id);
create policy "Users can update own accounts"
  on public.bank_accounts for update using (auth.uid() = user_id);
create policy "Users can delete own accounts"
  on public.bank_accounts for delete using (auth.uid() = user_id);
