alter table public.messages
  add column if not exists reply_note_body text,
  add column if not exists reply_note_track text,
  add column if not exists reply_note_artist text;
