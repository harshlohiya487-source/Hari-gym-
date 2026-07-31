-- GymDesk multi-tenant database schema for Supabase (safe to re-run anytime)
-- Run in Supabase Dashboard -> SQL Editor -> New query -> paste ALL of this -> Run

create extension if not exists pgcrypto;

drop table if exists attendance cascade;
drop table if exists payments cascade;
drop table if exists members cascade;
drop table if exists plans cascade;
drop table if exists gyms cascade;

create table gyms (
  id uuid primary key references auth.users(id) on delete cascade,
  gym_name text not null,
  owner_name text,
  language text default 'en',
  timings text,
  trial_start date default current_date,
  subscription_status text default 'trial',
  subscription_expiry date,
  razorpay_subscription_id text,
  created_at timestamptz default now()
);

create table plans (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid references gyms(id) on delete cascade not null,
  name text not null,
  days int not null,
  fee numeric not null
);

create table members (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid references gyms(id) on delete cascade not null,
  name text not null,
  phone text not null,
  plan_id uuid references plans(id),
  fee numeric,
  join_date date not null default current_date,
  expiry_date date not null,
  created_at timestamptz default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid references gyms(id) on delete cascade not null,
  member_id uuid references members(id) on delete set null,
  member_name text,
  amount numeric not null,
  method text,
  plan_name text,
  paid_on date not null default current_date,
  razorpay_payment_id text
);

create table attendance (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid references gyms(id) on delete cascade not null,
  member_id uuid references members(id) on delete cascade not null,
  attended_on date not null default current_date,
  unique (member_id, attended_on)
);

alter table gyms enable row level security;
alter table plans enable row level security;
alter table members enable row level security;
alter table payments enable row level security;
alter table attendance enable row level security;

drop policy if exists "own gym" on gyms;
create policy "own gym" on gyms for all using (auth.uid() = id);

drop policy if exists "own plans" on plans;
create policy "own plans" on plans for all using (auth.uid() = gym_id);

drop policy if exists "own members" on members;
create policy "own members" on members for all using (auth.uid() = gym_id);

drop policy if exists "own payments" on payments;
create policy "own payments" on payments for all using (auth.uid() = gym_id);

drop policy if exists "own attendance" on attendance;
create policy "own attendance" on attendance for all using (auth.uid() = gym_id);
