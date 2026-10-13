-- Interview Prep Tracker - Neon (Postgres) schema
-- Run with `npm run db:migrate`, or paste into Neon Console > SQL Editor and click Run.
-- Safe to re-run.

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  username text unique not null check (username ~ '^[a-z0-9_]{3,20}$'),
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists friendships (
  id integer generated always as identity primary key,
  requester uuid not null references users(id) on delete cascade,
  addressee uuid not null references users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  check (requester <> addressee)
);

-- One row per pair, whichever direction the request went.
create unique index if not exists friendships_pair
  on friendships (least(requester, addressee), greatest(requester, addressee));
create index if not exists friendships_addressee on friendships (addressee);

create table if not exists progress (
  user_id uuid primary key references users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
