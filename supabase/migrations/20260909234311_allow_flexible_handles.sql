alter table public.profiles
  drop constraint if exists profiles_handle_check;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, handle, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'handle', ''),
      'user_' || substr(replace(new.id::text, '-', ''), 1, 8)
    ),
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'New user')
  );
  return new;
end;
$$;
