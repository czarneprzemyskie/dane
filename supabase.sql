-- Supabase / Postgres schema for the app

-- Profiles table (linked with Supabase Auth users)
create table if not exists profiles (
  id uuid primary key,
  username text unique not null,
  created_at timestamptz default now()
);

-- Plates table
create table if not exists plates (
  id text primary key,
  registration text not null,
  owner text references profiles(username) on delete set null,
  notes text,
  created_at timestamptz default now()
);

-- Posts table
create table if not exists posts (
  id text primary key,
  author text not null,
  title text not null,
  body text not null,
  created_at timestamptz default now()
);
