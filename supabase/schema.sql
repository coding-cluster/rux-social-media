create extension if not exists pgcrypto;

create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique
    check (handle = lower(handle) and handle ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null
    check (char_length(trim(display_name)) between 1 and 80),
  bio text
    check (bio is null or char_length(bio) <= 280),
  avatar_path text,
  avatar_emoji text
    check (avatar_emoji is null or char_length(avatar_emoji) <= 8),
  avatar_color text
    check (avatar_color is null or avatar_color in ('#7a4a2a', '#22231f', '#b39a76', '#6f7c57', '#315c67', '#a64d3c')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  caption text check (caption is null or char_length(caption) <= 280),
  image_path text not null,
  image_width integer not null check (image_width > 0),
  image_height integer not null check (image_height > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 280),
  created_at timestamptz not null default now()
);

create table public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table public.saves (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table public.reposts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (sender_id <> receiver_id)
);

create index posts_created_at_idx on public.posts (created_at desc);
create index posts_author_created_at_idx on public.posts (author_id, created_at desc);
create index comments_post_created_at_idx on public.comments (post_id, created_at);
create index likes_post_idx on public.likes (post_id);
create index saves_user_created_at_idx on public.saves (user_id, created_at desc);
create index reposts_post_idx on public.reposts (post_id);
create index messages_sender_receiver_created_at_idx
  on public.messages (sender_id, receiver_id, created_at desc);
create index messages_receiver_sender_created_at_idx
  on public.messages (receiver_id, sender_id, created_at desc);

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, handle, display_name)
  values (
    new.id,
    lower(coalesce(
      nullif(new.raw_user_meta_data ->> 'handle', ''),
      'user_' || substr(replace(new.id::text, '-', ''), 1, 8)
    )),
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'New user')
  );
  return new;
end;
$$;

create trigger rux_on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function private.set_updated_at();

create or replace view public.feed_posts
with (security_invoker = true)
as
select
  p.id,
  p.author_id,
  pr.handle as author_handle,
  pr.display_name as author_display_name,
  pr.avatar_path as author_avatar_path,
  p.caption,
  p.image_path,
  p.image_width,
  p.image_height,
  (select count(*)::integer from public.likes l where l.post_id = p.id) as like_count,
  (select count(*)::integer from public.comments c where c.post_id = p.id) as comment_count,
  exists (
    select 1 from public.likes l
    where l.post_id = p.id and l.user_id = (select auth.uid())
  ) as liked_by_me,
  exists (
    select 1 from public.saves s
    where s.post_id = p.id and s.user_id = (select auth.uid())
  ) as saved_by_me,
  p.created_at
from public.posts p
join public.profiles pr on pr.id = p.author_id;

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.saves enable row level security;
alter table public.reposts enable row level security;
alter table public.messages enable row level security;

revoke all on table
  public.profiles,
  public.posts,
  public.comments,
  public.likes,
  public.saves,
  public.reposts,
  public.messages,
  public.feed_posts
from anon, authenticated;

grant select on public.profiles, public.posts, public.comments,
  public.likes, public.saves, public.reposts, public.feed_posts
to anon, authenticated;

grant update on public.profiles to authenticated;
grant select, insert, update, delete on public.posts, public.comments to authenticated;
grant select, insert, delete on public.likes, public.saves, public.reposts to authenticated;
grant select, insert, delete on public.messages to authenticated;
grant update (read_at) on public.messages to authenticated;

create policy "Public profiles are viewable"
  on public.profiles for select to anon, authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Posts are publicly viewable"
  on public.posts for select to anon, authenticated
  using (true);

create policy "Users can create their own posts"
  on public.posts for insert to authenticated
  with check ((select auth.uid()) = author_id);

create policy "Users can update their own posts"
  on public.posts for update to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

create policy "Users can delete their own posts"
  on public.posts for delete to authenticated
  using ((select auth.uid()) = author_id);

create policy "Comments are publicly viewable"
  on public.comments for select to anon, authenticated
  using (true);

create policy "Users can create their own comments"
  on public.comments for insert to authenticated
  with check ((select auth.uid()) = author_id);

create policy "Users can update their own comments"
  on public.comments for update to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

create policy "Users can delete their own comments"
  on public.comments for delete to authenticated
  using ((select auth.uid()) = author_id);

create policy "Likes are publicly viewable"
  on public.likes for select to anon, authenticated
  using (true);

create policy "Users can like posts"
  on public.likes for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can remove their own likes"
  on public.likes for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can view their own saves"
  on public.saves for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can save posts"
  on public.saves for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can remove their own saves"
  on public.saves for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Reposts are publicly viewable"
  on public.reposts for select to anon, authenticated
  using (true);

create policy "Users can create their own reposts"
  on public.reposts for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can remove their own reposts"
  on public.reposts for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can view their own messages"
  on public.messages for select to authenticated
  using (
    (select auth.uid()) = sender_id
    or (select auth.uid()) = receiver_id
  );

create policy "Users can send messages as themselves"
  on public.messages for insert to authenticated
  with check ((select auth.uid()) = sender_id);

create policy "Users can delete their own conversations"
  on public.messages for delete to authenticated
  using (
    (select auth.uid()) = sender_id
    or (select auth.uid()) = receiver_id
  );

create policy "Receivers can mark messages as read"
  on public.messages for update to authenticated
  using ((select auth.uid()) = receiver_id)
  with check ((select auth.uid()) = receiver_id);

insert into storage.buckets (id, name, public)
values ('posts', 'posts', true), ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Users can upload post images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'posts'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users can update their post images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'posts'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'posts'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users can delete their post images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'posts'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users can upload avatars"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users can update their avatars"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users can delete their avatars"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
