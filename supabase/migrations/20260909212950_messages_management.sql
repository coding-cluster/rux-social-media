grant delete on public.messages to authenticated;

create policy "Users can delete their own conversations"
  on public.messages for delete to authenticated
  using (
    (select auth.uid()) = sender_id
    or (select auth.uid()) = receiver_id
  );
