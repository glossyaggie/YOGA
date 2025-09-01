create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  stripe_customer_id text,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "read own profile" on profiles for select using (auth.uid() = id);
create policy "insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "update own profile" on profiles for update using (auth.uid() = id);

create table if not exists passes (
  id bigserial primary key,
  name text not null,
  description text,
  credits int not null,
  unlimited boolean not null default false,
  validity_days int,
  stripe_price_id text unique not null,
  is_active boolean not null default true
);
alter table passes enable row level security;
create policy "public read passes" on passes for select using (true);

create table if not exists purchases (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  pass_id bigint references passes(id),
  stripe_payment_intent text unique,
  purchased_at timestamptz default now()
);
alter table purchases enable row level security;
create policy "read own purchases" on purchases for select using (auth.uid() = user_id);

create table if not exists credit_ledger (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  pass_id bigint,
  delta int not null,
  reason text not null,
  ref_id bigint,
  created_at timestamptz default now()
);
alter table credit_ledger enable row level security;
create policy "read own ledger" on credit_ledger for select using (auth.uid() = user_id);

create table if not exists classes (
  id bigserial primary key,
  title text not null,
  instructor text,
  duration_mins int not null default 60
);
alter table classes enable row level security;
create policy "public read classes" on classes for select using (true);

create table if not exists sessions (
  id bigserial primary key,
  class_id bigint references classes(id) on delete cascade,
  starts_at timestamptz not null,
  capacity int not null default 20
);
alter table sessions enable row level security;
create policy "public read sessions" on sessions for select using (true);

create table if not exists bookings (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  session_id bigint references sessions(id),
  created_at timestamptz default now(),
  unique(user_id, session_id)
);
alter table bookings enable row level security;
create policy "read own bookings" on bookings for select using (auth.uid() = user_id);
