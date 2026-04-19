-- Create storage bucket: build-connect-media
insert into storage.buckets (id, name, public) 
values ('build-connect-media', 'build-connect-media', true) 
on conflict (id) do update set public = true;

-- Set up storage RLS
create policy "Public Access" 
  on storage.objects for select 
  using ( bucket_id = 'build-connect-media' );

create policy "Authenticated users can upload media" 
  on storage.objects for insert 
  with check ( bucket_id = 'build-connect-media' and auth.role() = 'authenticated' );

create policy "Users can update their own objects" 
  on storage.objects for update 
  using ( bucket_id = 'build-connect-media' and owner = auth.uid() );

create policy "Users can delete their own objects" 
  on storage.objects for delete 
  using ( bucket_id = 'build-connect-media' and owner = auth.uid() );
