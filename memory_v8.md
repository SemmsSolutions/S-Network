# memory.md — S-Network (v8 — CURRENT)

## Product
- **Name:** S-Network | **Tagline:** Find. Verify. Build.
- **Supabase:** exqvpzijavrbpfzqixnk
- **Bundle ID:** com.snetwork.app

## Design System (FINAL)
- Red:          #CC0000 | RedDark: #990000 | RedLight: #FFEBEB
- Navy:         #0A1628 | Navy2: #0D1F3C
- Surface:      #F7F8FC
- Font:         Inter (web) | System (Flutter)
- Logo: S and N always #CC0000, bold/black weight

## App Layout — Web (Justdial-level structure)
- Sticky navbar: logo + city selector + search bar + mic + actions + login
- Home: carousel + featured cards | category grid | grouped sections |
        popular searches | featured vendors | top rated | how it works |
        about stats | popular categories tabs | mobile app banner | footer
- Business profile: breadcrumb + image mosaic + header + action bar + tabs + sidebar

## Deployment
- Web: Hostinger VPS, Angular SSR + PM2 + Nginx + SSL
- Mobile: Flutter APK (R8 disabled, hardcoded Supabase keys)
- Admin: Web only (/admin)

## Roles & Routes
- user → public routes + /profile + /saved (auth required for leads)
- pending_vendor → /auth/pending-approval only
- vendor → /vendor/* with bottom nav (ShellRoute)
- admin → /admin (web only)

## Key Facts for Prompts
- Supabase anon key hardcoded in Flutter main.dart (no env vars)
- categories table has 9 rows (seeded)
- businesses table has cover_image_url, slug columns (added in DB_FIX_V4.sql)
- All edge functions need CORS headers at top
- create-lead uses SUPABASE_SERVICE_ROLE_KEY (set as Supabase secret)

## Prompt Files
1. memory_v8.md (this)
2. PROMPT_20_JUSTDIAL_UPGRADE.md
3. DB_FIX_V4.sql (run first in Supabase Studio)
