create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 80),
  track_id text not null,
  track_name text not null,
  artist_name text not null,
  artwork_url text,
  preview_url text,
  track_url text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index if not exists notes_active_idx
  on public.notes (expires_at desc, created_at desc);

alter table public.notes enable row level security;

grant select on public.notes to anon, authenticated;
grant insert, update, delete on public.notes to authenticated;

drop policy if exists "Active notes are publicly viewable" on public.notes;
drop policy if exists "Users can create their own notes" on public.notes;
drop policy if exists "Users can update their own notes" on public.notes;
drop policy if exists "Users can delete their own notes" on public.notes;

create policy "Active notes are publicly viewable"
  on public.notes
  for select
  to anon, authenticated
  using (expires_at > now());

create policy "Users can create their own notes"
  on public.notes
  for insert
  to authenticated
  with check ((select auth.uid()) = author_id);

create policy "Users can update their own notes"
  on public.notes
  for update
  to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

create policy "Users can delete their own notes"
  on public.notes
  for delete
  to authenticated
  using ((select auth.uid()) = author_id);
