create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists follows_following_idx
  on public.follows (following_id, created_at desc);

alter table public.follows enable row level security;

grant select on public.follows to anon, authenticated;
grant insert, delete on public.follows to authenticated;

drop policy if exists "Users can view their follows" on public.follows;
drop policy if exists "Follows are publicly viewable" on public.follows;
drop policy if exists "Users can follow people" on public.follows;
drop policy if exists "Users can unfollow people" on public.follows;

create policy "Follows are publicly viewable"
  on public.follows
  for select
  to anon, authenticated
  using (true);

create policy "Users can follow people"
  on public.follows
  for insert
  to authenticated
  with check ((select auth.uid()) = follower_id and follower_id <> following_id);

create policy "Users can unfollow people"
  on public.follows
  for delete
  to authenticated
  using ((select auth.uid()) = follower_id);
