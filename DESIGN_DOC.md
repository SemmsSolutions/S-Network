# Design Document
## BuildConnect — System & UX Design
**Version:** 1.0

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────┐
│              CLIENT LAYER                   │
│  ┌──────────────┐    ┌──────────────────┐   │
│  │  Angular Web │    │  Flutter Mobile  │   │
│  │  (Vercel)    │    │  (iOS + Android) │   │
│  └──────┬───────┘    └────────┬─────────┘   │
└─────────┼────────────────────┼─────────────┘
          │                    │
          ▼                    ▼
┌─────────────────────────────────────────────┐
│           SUPABASE BACKEND                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Postgres │  │   Auth   │  │ Storage  │  │
│  │   (DB)   │  │  (JWT)   │  │ (Images) │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────┐  ┌──────────────────────────┐ │
│  │ Realtime │  │    Edge Functions        │ │
│  │ (Leads)  │  │  (Business Logic)        │ │
│  └──────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 2. Module Architecture

### 2.1 Core Modules

| Module | Responsibility |
|---|---|
| Auth Module | Sign up, login, JWT, role management |
| Search Module | Keyword + geo search, filters, ranking |
| Listing Module | Business profiles, portfolio, contact |
| Lead Module | Quote form, lead lifecycle, notifications |
| Vendor Module | Dashboard, lead management, analytics |
| Admin Module | Approval, moderation, monitoring |

### 2.2 Data Flow

```
User Input (search query + location)
        ↓
Search Module → Postgres full-text + geo query
        ↓
Results rendered as Listing Cards
        ↓
User opens Listing Page
        ↓
User clicks "Request Quote"
        ↓
Lead Module creates lead record
        ↓
Realtime triggers vendor notification
        ↓
Vendor views lead in dashboard
        ↓
Vendor updates lead status
```

---

## 3. Database Schema

### 3.1 Core Tables

```sql
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
```

### 3.2 Key Indexes

```sql
-- Full-text search
create index idx_business_name_trgm on businesses using gin (name gin_trgm_ops);
create index idx_business_city on businesses (city);

-- Geo search
create index idx_location on businesses using gist (location);

-- Lead lookups
create index idx_leads_business on leads (business_id);
create index idx_leads_status on leads (status);
```

---

## 4. API Design (Supabase Edge Functions)

### Endpoints

| Function | Method | Description |
|---|---|---|
| `/search-businesses` | POST | Full-text + geo search |
| `/create-lead` | POST | Submit quote request |
| `/update-lead-status` | PATCH | Vendor updates lead |
| `/get-vendor-analytics` | GET | Profile views, lead counts |
| `/approve-vendor` | POST | Admin approves vendor |

### Search Function Logic
```
Input: { query, city, category_id, lat, lng, radius }
1. Filter by city + category (if provided)
2. Full-text similarity on name + description
3. If lat/lng provided → order by geo distance
4. Filter is_active = true, is_verified = true
5. Return paginated results (20 per page)
```

---

## 5. Row Level Security (RLS) Policies

```sql
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
```

---

## 6. Storage Architecture

```
Supabase Storage Bucket: build-connect-media

Structure:
  build-connect-media/
    businesses/
      {businessId}/
        portfolio/
          img1.jpg
          img2.jpg
        logo/
          logo.jpg
    avatars/
      {userId}/
        avatar.jpg
```

**Policies:** Public read, authenticated write for own folders.

---

## 7. UX Design Principles

### 7.1 Design Philosophy
- **Portfolio-first** — Images sell construction services, not text
- **Trust signals prominent** — Verified badge, ratings, review count always visible
- **One-tap lead** — Quote request should never be more than 2 taps away
- **Mobile-optimized listings** — Cards with large images, clear CTA

### 7.2 Key Screens (Web)

| Screen | Purpose |
|---|---|
| Home | Hero search bar + category grid + featured vendors |
| Search Results | List/grid of business cards with filters sidebar |
| Business Profile | Full listing: gallery, services, reviews, quote button |
| Vendor Dashboard | Lead inbox, analytics, profile editor |
| Admin Panel | Pending approvals, reported content |

### 7.3 Key Screens (Mobile)

| Screen | Purpose |
|---|---|
| Home | Search + nearby categories |
| Search Results | Scrollable cards |
| Business Profile | Swipeable gallery, sticky CTA |
| Vendor Lead Inbox | Lead cards with status chips |
| Notifications | New lead alerts |

### 7.4 Design System

```

---

## 8. Realtime Strategy

Use Supabase Realtime to subscribe to new leads in the vendor dashboard:

```
Vendor logs in → subscribes to leads channel filtered by their business_id
New lead INSERT → vendor receives push + in-app notification
```

---

## 9. SEO Strategy (Web)

- `/contractors-in-{city}` → Category + city landing pages
- `/business/{slug}` → Individual vendor pages with structured data
- Schema.org `LocalBusiness` markup on every listing
- Auto-generated sitemap

---

## 10. Platform-Specific Considerations

### Web (Angular)
- SSR (Angular Universal) for SEO on listing pages
- Lazy-loaded modules per feature
- Shared component library (search bar, business card, lead form)

### Mobile (Flutter)
- Shared `core` package (models, services, API calls)
- Separate UI packages: `user_app`, `vendor_app`
- Flutter Local Notifications for lead alerts
- Geolocator plugin for GPS
- Cached Network Image for portfolio images
