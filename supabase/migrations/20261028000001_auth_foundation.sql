-- ============================================================================
-- Migration 001: Supabase Auth foundation
--
-- Additive and safe to run on the live database: it does not change or remove
-- any existing data and does not touch RLS yet (that is migration 002).
--
-- Roles live in auth.users.raw_app_meta_data (only the service role can write
-- it, users cannot edit it):  { role, teacher_id, must_change_password }
-- ============================================================================

-- Link domain rows to their Supabase Auth user
alter table public.teachers
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

alter table public.accountant_credentials
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

-- Passwords move to Supabase Auth (bcrypt). Column stays only until the
-- migration script has copied the old values and scrubbed them.
alter table public.accountant_credentials alter column password drop not null;

-- ── RLS helper functions (read the signed JWT, no table lookups) ─────────────
create or replace function public.app_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
$$;

create or replace function public.app_teacher_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'teacher_id', '')::uuid
$$;

create or replace function public.is_admin()      returns boolean language sql stable as $$ select public.app_role() = 'admin' $$;
create or replace function public.is_teacher()    returns boolean language sql stable as $$ select public.app_role() = 'teacher' $$;
create or replace function public.is_accountant() returns boolean language sql stable as $$ select public.app_role() = 'accountant' $$;
create or replace function public.is_staff()      returns boolean language sql stable as $$ select public.app_role() in ('admin', 'teacher', 'accountant') $$;
