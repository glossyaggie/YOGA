-- Add new fields to profiles table for customer signup
alter table profiles add column if not exists first_name text;
alter table profiles add column if not exists last_name text;
alter table profiles add column if not exists phone_number text;
alter table profiles add column if not exists waiver_accepted boolean default false;
alter table profiles add column if not exists waiver_accepted_at timestamptz;

-- Update RLS policies to allow reading own profile with new fields
drop policy if exists "read own profile" on profiles;
create policy "read own profile" on profiles for select using (auth.uid() = id);

-- Update insert policy to allow inserting with new fields
drop policy if exists "insert own profile" on profiles;
create policy "insert own profile" on profiles for insert with check (auth.uid() = id);

-- Update update policy to allow updating with new fields
drop policy if exists "update own profile" on profiles;
create policy "update own profile" on profiles for update using (auth.uid() = id);
