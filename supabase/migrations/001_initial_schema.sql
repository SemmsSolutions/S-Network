-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";
create extension if not exists "postgis";

-- Profiles (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone text unique,
  role text check (role in ('user','vendor','admin')) default 'user',
  avatar_url text,
  created_at timestamp default now()
);

-- Categories
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  icon text,
  slug text unique,
  created_at timestamp default now()
);

-- Businesses (CORE)
create table businesses (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references profiles(id) on delete cascade,
  name text not null,
  description text,
  category_id uuid references categories(id),
  phone text,
  whatsapp text,
  address text,
  city text,
  state text,
  location geography(point, 4326),
  rating numeric default 0,
  total_reviews int default 0,
  total_leads int default 0,
  is_verified boolean default false,
  is_premium boolean default false,
  is_active boolean default true,
  created_at timestamp default now()
);

-- Business Images (Portfolio)
create table business_images (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  image_url text,
  caption text,
  created_at timestamp default now()
);

-- Business Services
create table business_services (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  service_name text,
  created_at timestamp default now()
);

-- Leads
create table leads (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  user_id uuid references profiles(id),
  user_name text,
  user_phone text,
  message text,
  budget_min numeric,
  budget_max numeric,
  project_type text,
  timeline text,
  status text default 'new' check (status in ('new','contacted','converted','lost')),
  created_at timestamp default now()
);

-- Reviews
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  user_id uuid references profiles(id),
  rating int check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp default now()
);
