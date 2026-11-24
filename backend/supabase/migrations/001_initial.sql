create extension if not exists pgcrypto;

create table if not exists public.users (
    id uuid primary key default gen_random_uuid(),
    name varchar(100) not null,
    email varchar(254) not null unique,
    password_hash text not null,
    token_version integer not null default 0,
    reset_password_token text,
    reset_password_expires timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists users_reset_password_token_idx
    on public.users(reset_password_token);

create table if not exists public.resumes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references public.users(id) on delete cascade,
    contact jsonb not null default '{}'::jsonb,
    education jsonb not null default '[]'::jsonb,
    experience jsonb not null default '[]'::jsonb,
    skills jsonb not null default '[]'::jsonb,
    projects jsonb not null default '[]'::jsonb,
    certifications jsonb not null default '[]'::jsonb,
    summary text not null default '',
    is_completed boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists resumes_user_id_idx
    on public.resumes(user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_resumes_updated_at on public.resumes;
create trigger set_resumes_updated_at
before update on public.resumes
for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.resumes enable row level security;
