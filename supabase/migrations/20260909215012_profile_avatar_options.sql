alter table public.profiles
  add column if not exists avatar_emoji text
    check (avatar_emoji is null or char_length(avatar_emoji) <= 8),
  add column if not exists avatar_color text
    check (avatar_color is null or avatar_color in ('#7a4a2a', '#22231f', '#b39a76', '#6f7c57', '#315c67', '#a64d3c'));
