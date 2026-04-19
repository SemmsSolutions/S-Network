# commands.md — BuildConnect Development Playbook

## Phase 0 — Project Setup

### Initialize Monorepo
```bash
mkdir build-connect && cd build-connect
git init
mkdir supabase build-connect-web build-connect-mobile
```

### Supabase CLI Setup
```bash
npm install -g supabase
supabase init
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### Angular Web Setup
```bash
cd build-connect-web
npm install -g @angular/cli
ng new build-connect-web --routing --style=scss
cd build-connect-web
npm install @supabase/supabase-js
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

### Flutter Mobile Setup
```bash
cd build-connect-mobile
flutter create build_connect_mobile
cd build_connect_mobile
flutter pub add supabase_flutter geolocator go_router riverpod flutter_riverpod cached_network_image flutter_local_notifications
```

---

## Phase 1 — Backend (Do This First)

### Step 1.1 — Run DB Migrations
```bash
supabase db push
# OR paste SQL directly in Supabase Studio SQL editor
```

### Step 1.2 — Enable Extensions
```sql
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";
create extension if not exists "postgis";
```

### Step 1.3 — Run Schema
```bash
# Run in order:
# 001_initial_schema.sql
# 002_rls_policies.sql
# 003_indexes.sql
# 004_seed_categories.sql
```

### Step 1.4 — Create Storage Bucket
```bash
# In Supabase Studio → Storage → New Bucket
# Name: build-connect-media
# Public: YES
```

### Step 1.5 — Deploy Edge Functions
```bash
supabase functions deploy search-businesses
supabase functions deploy create-lead
supabase functions deploy update-lead-status
supabase functions deploy get-vendor-analytics
supabase functions deploy approve-vendor
```

### Step 1.6 — Test APIs
```bash
# Test search function
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/search-businesses \
  -H "Content-Type: application/json" \
  -d '{"query": "contractor", "city": "Chennai"}'
```

---

## Phase 2 — Web App (Angular)

### Step 2.1 — Setup Supabase Service
```bash
# Create core/services/supabase.service.ts
# Initialize client with URL + anon key from environment.ts
```

### Step 2.2 — Build in This Order
```
1. Auth module (login + register)
2. Shared models (Business, Lead, Review)
3. Home page (search bar + category grid)
4. Search results page (business cards + filters)
5. Business profile page (gallery + quote button)
6. Lead form modal (quote request)
7. Vendor dashboard (lead inbox)
8. Vendor profile editor
9. Admin approval panel
```

### Step 2.3 — Run Dev Server
```bash
cd build-connect-web
ng serve
# Runs on http://localhost:4200
```

### Step 2.4 — Build for Production
```bash
ng build --configuration production
```

### Step 2.5 — Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

---

## Phase 3 — Mobile App (Flutter)

### Step 3.1 — Initialize Supabase in Flutter
```dart
// In main.dart
await Supabase.initialize(
  url: const String.fromEnvironment('SUPABASE_URL'),
  anonKey: const String.fromEnvironment('SUPABASE_ANON_KEY'),
);
```

### Step 3.2 — Build in This Order
```
1. App theme (colors, typography)
2. Auth screens (login + register)
3. Home + search screen
4. Search results + filter sheet
5. Business profile screen + portfolio viewer
6. Lead form bottom sheet
7. Vendor dashboard
8. Vendor leads list + detail screen
9. Push notifications setup
```

### Step 3.3 — Run on Device
```bash
cd build_connect_mobile
flutter run
# Or: flutter run -d chrome (for web preview)
```

### Step 3.4 — Build Release APK
```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

### Step 3.5 — Build iOS
```bash
flutter build ios --release
```

---

## Phase 4 — Testing

### Test Lead Flow (End-to-End)
```
1. Register as user
2. Search "contractor in Chennai"
3. Open a business profile
4. Submit quote request
5. Login as vendor
6. Verify lead appears in dashboard
7. Update lead status to "contacted"
```

### Test Admin Flow
```
1. Login as admin (set role = 'admin' in profiles table)
2. View pending vendors
3. Approve a vendor
4. Verify vendor appears in search
```

---

## Phase 5 — SEO (Web Only)

### Add Angular Universal (SSR)
```bash
ng add @angular/ssr
ng build --configuration production
```

### Generate Sitemap
```bash
# Use sitemap npm package
npm install sitemap
# Create scripts/generate-sitemap.ts
```

---

## Useful Supabase Commands

```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# View local DB
supabase studio

# Reset local DB
supabase db reset

# Generate TypeScript types from schema
supabase gen types typescript --local > src/app/shared/models/database.types.ts
```
