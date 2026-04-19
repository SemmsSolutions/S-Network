-- Profiles
alter table profiles enable row level security;
create policy "Users can view all profiles" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Businesses
alter table businesses enable row level security;
create policy "Public can view active businesses" on businesses for select using (is_active = true);
create policy "Owner can insert" on businesses for insert with check (auth.uid() = owner_id);
create policy "Owner can update own" on businesses for update using (auth.uid() = owner_id);

-- Leads
alter table leads enable row level security;
create policy "User can create lead" on leads for insert with check (auth.uid() = user_id);
create policy "Vendor can view their leads" on leads for select
  using (exists (select 1 from businesses b where b.id = leads.business_id and b.owner_id = auth.uid()));

-- Reviews
alter table reviews enable row level security;
create policy "Public can read reviews" on reviews for select using (true);
create policy "Authenticated user can insert review" on reviews for insert with check (auth.uid() = user_id);
