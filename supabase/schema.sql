-- =============================================================================
--  Schema + Row Level Security for the static site's private data.
--
--  Run this once in the Supabase SQL editor.
--
--  The whole security model rests on RLS. The anon key ships in the browser by
--  design, so these policies -- not the key -- are what keep student marks
--  private. Nothing here is optional.
-- =============================================================================

-- ---------------------------------------------------------------- results ---

create table if not exists public.results (
  id              uuid primary key default gen_random_uuid(),
  roll_no         text not null,
  student_name    text not null,
  programme       text not null,
  semester        text not null,
  exam_session    text not null,           -- e.g. 'Odd 2026-27'
  subjects        jsonb not null default '[]'::jsonb,
  marks_obtained  numeric,
  marks_max       numeric,
  sgpa            numeric,
  status          text not null default 'PASS'
                    check (status in ('PASS', 'FAIL', 'ATKT', 'WITHHELD')),
  -- Nothing is visible to students until the exam cell publishes it.
  published       boolean not null default false,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (roll_no, semester, exam_session)
);

create index if not exists results_roll_lookup
  on public.results (roll_no, published);

alter table public.results enable row level security;

-- Anonymous visitors may read ONLY published rows, and only by exact roll
-- number. Postgres cannot constrain the predicate itself, so the client always
-- queries with .eq('roll_no', ...) -- but even a crafted query cannot return
-- unpublished rows.
--
-- NOTE: this policy does allow an anon caller to enumerate published rows if
-- they guess roll numbers. That is the same exposure as any public result
-- gazette. If the institution requires per-student privacy, add a second
-- factor (date of birth) to the lookup -- see the commented policy below.
drop policy if exists "anon reads published results" on public.results;
create policy "anon reads published results"
  on public.results for select
  to anon
  using (published = true);

-- Stricter alternative: require a matching date of birth as a second factor.
-- alter table public.results add column dob date;
-- drop policy if exists "anon reads published results" on public.results;
-- create policy "anon reads published results with dob"
--   on public.results for select to anon
--   using (published = true and dob::text = current_setting('request.headers', true)::json->>'x-dob');

-- Only signed-in staff may write.
drop policy if exists "staff manage results" on public.results;
create policy "staff manage results"
  on public.results for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ------------------------------------------------------- certificates -------
--
--  VERIFICATION ONLY. This table records certificates the registrar has
--  already issued, so a third party can confirm one is genuine. There is
--  deliberately no issuance or document-generation path here: a system that
--  mints degree certificates is the exact mechanism of the fake-degree fraud
--  this institution was sanctioned for. Records are inserted from the
--  registrar's authoritative list, never created ad hoc.

create table if not exists public.certificates (
  id                 uuid primary key default gen_random_uuid(),
  certificate_no     text not null unique,
  student_name       text not null,
  programme          text not null,
  award_year         int  not null,
  enrollment_no      text,
  -- 'VERIFIED'  - present in the registrar's record
  -- 'REVOKED'   - issued then withdrawn; must be reported, not hidden
  -- 'WITHHELD'  - under review
  status             text not null default 'VERIFIED'
                       check (status in ('VERIFIED', 'REVOKED', 'WITHHELD')),
  registrar_remarks  text,
  recorded_by        uuid references auth.users (id),
  created_at         timestamptz not null default now()
);

create index if not exists certificates_lookup
  on public.certificates (certificate_no);

alter table public.certificates enable row level security;

-- Verification is a public good: anyone may check a number. The response
-- carries only the fields the verify page displays.
drop policy if exists "anon verifies certificates" on public.certificates;
create policy "anon verifies certificates"
  on public.certificates for select
  to anon
  using (true);

drop policy if exists "staff manage certificates" on public.certificates;
create policy "staff manage certificates"
  on public.certificates for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ------------------------------------------------------------- staff --------

create table if not exists public.staff (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null,
  role        text not null default 'editor'
                check (role in ('registrar', 'exam_cell', 'editor')),
  created_at  timestamptz not null default now()
);

alter table public.staff enable row level security;

drop policy if exists "staff read own row" on public.staff;
create policy "staff read own row"
  on public.staff for select
  to authenticated
  using (user_id = auth.uid());

-- Helper used by every write policy above.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff where user_id = auth.uid());
$$;

-- --------------------------------------------------------- audit log --------
--
--  Results and certificate records are exactly the data most worth tampering
--  with. Every write is logged, append-only, and readable only by staff.

create table if not exists public.audit_log (
  id          bigserial primary key,
  actor       uuid references auth.users (id),
  action      text not null,
  table_name  text not null,
  row_id      text,
  detail      jsonb,
  at          timestamptz not null default now()
);

alter table public.audit_log enable row level security;

drop policy if exists "staff read audit" on public.audit_log;
create policy "staff read audit"
  on public.audit_log for select
  to authenticated
  using (public.is_staff());

create or replace function public.log_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (actor, action, table_name, row_id, detail)
  values (
    auth.uid(),
    tg_op,
    tg_table_name,
    coalesce(new.id::text, old.id::text),
    case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists results_audit on public.results;
create trigger results_audit
  after insert or update or delete on public.results
  for each row execute function public.log_change();

drop trigger if exists certificates_audit on public.certificates;
create trigger certificates_audit
  after insert or update or delete on public.certificates
  for each row execute function public.log_change();

-- -----------------------------------------------------------------------------
--  After running this:
--    1. Create staff users in Authentication > Users (invite by email).
--    2. Insert a matching row into public.staff for each, with their role.
--       insert into public.staff (user_id, full_name, role)
--       values ('<uuid from auth.users>', 'Name', 'exam_cell');
--    3. Disable public sign-ups: Authentication > Providers > Email >
--       "Allow new users to sign up" OFF. Staff accounts are invite-only.
-- -----------------------------------------------------------------------------
