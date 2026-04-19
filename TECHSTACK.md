# Tech Stack
## BuildConnect — Technology Decisions

---

## 1. Backend

| Tool | Purpose | Why |
|---|---|---|
| **Supabase** | Full backend platform | Postgres + Auth + Storage + Realtime in one |
| **Postgres** | Primary database | Relational, supports PostGIS + pg_trgm |
| **PostGIS** | Geo queries | Distance-based search ("near me") |
| **pg_trgm** | Full-text search | Fast trigram similarity for MVP search |
| **Supabase Auth** | JWT authentication | Built-in, supports email + phone + OAuth |
| **Supabase Storage** | Image hosting | CDN-backed, direct upload from client |
| **Supabase Realtime** | Live lead notifications | Postgres CDC, no extra infra |
| **Edge Functions** (Deno) | Business logic APIs | Serverless, close to DB |

---

## 2. Web Frontend

| Tool | Purpose | Why |
|---|---|---|
| **Angular 17+** | Web app framework | Consistent with your existing stack |
| **Angular Universal** | SSR for SEO | Critical for city/category landing pages |
| **Tailwind CSS** | Styling | Rapid UI development |
| **@supabase/supabase-js** | Backend client | Official SDK |
| **Mapbox GL JS** | Maps (optional MVP+) | Better than Google Maps for cost |
| **Vercel** | Hosting | Zero-config Angular deployments |

---

## 3. Mobile Frontend

| Tool | Purpose | Why |
|---|---|---|
| **Flutter** | Cross-platform mobile | Single codebase for iOS + Android |
| **supabase_flutter** | Backend client | Official Dart SDK |
| **geolocator** | GPS location | Auto-detect user location |
| **flutter_local_notifications** | Lead push alerts | Vendor gets notified instantly |
| **cached_network_image** | Image caching | Smooth portfolio gallery |
| **go_router** | Navigation | Declarative routing |
| **riverpod** | State management | Simple, testable |

---

## 4. Dev Tools

| Tool | Purpose |
|---|---|
| **Supabase Studio** | Visual DB management, RLS testing |
| **Postman / Hoppscotch** | API testing |
| **GitHub** | Version control |
| **GitHub Actions** | CI/CD (auto deploy to Vercel on push) |
| **Figma** | UI design (optional but recommended) |

---

## 5. Analytics & Monitoring

| Tool | Purpose |
|---|---|
| **PostHog** | Product analytics (free tier) |
| **Sentry** | Error monitoring (web + mobile) |
| **Supabase Dashboard** | DB performance, query monitoring |

---

## 6. Infrastructure Overview

```
                      GitHub (source)
                           │
              ┌────────────┴────────────┐
              │                         │
         GitHub Actions            GitHub Actions
              │                         │
         Vercel Deploy            Flutter Build (CI)
         (Angular Web)            (APK/IPA)
              │                         │
         Users (Web)              App Store / Play Store
              │                         │
              └────────────┬────────────┘
                           │
                      Supabase
                    (single backend)
```

---

## 7. Folder Structure

### Web (Angular)
```
src/
  app/
    core/                    # Guards, interceptors, services
    shared/                  # Reusable components, pipes
    modules/
      auth/                  # Login, register
      user/                  # Search, listings, lead form
      vendor/                # Dashboard, leads, profile
      admin/                 # Approvals, moderation
  assets/
  environments/
```

### Mobile (Flutter)
```
lib/
  core/
    models/                  # Business, Lead, Review, Profile
    services/                # SupabaseService, AuthService
    utils/
  features/
    auth/
    search/
    listing/
    vendor/
      leads/
      profile/
    notifications/
  shared/
    widgets/
    theme/
```

---

## 8. Environment Variables

### Angular (environment.ts)
```typescript
export const environment = {
  production: false,
  supabaseUrl: 'YOUR_SUPABASE_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY'
};
```

### Flutter (.env)
```
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

---

## 9. Third-Party Costs (MVP)

| Service | Free Tier | Paid |
|---|---|---|
| Supabase | 500MB DB, 1GB storage, 50K MAU | $25/mo (Pro) |
| Vercel | Unlimited hobby | $20/mo (Pro, for SSR) |
| PostHog | 1M events/mo | Free for MVP |
| Sentry | 5K errors/mo | Free for MVP |

**Total MVP cost: $0–$45/month**
