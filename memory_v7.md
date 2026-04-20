# memory.md — S-Network (v7 — CURRENT)

## Product
- **Name:** S-Network | **Tagline:** Find. Verify. Build.
- **Bundle ID:** com.snetwork.app
- **Supabase Project:** exqvpzijavrbpfzqixnk

## NEW COLOR SYSTEM (from reference image)
- Primary Red:    #CC0000 (was #E85D26 orange — FULLY REPLACED)
- Primary Dark:   #990000
- Deep Navy:      #0A1628 (was #1A1A2E)
- Navy 2:         #0D1F3C
- Surface:        #F5F6FA
- Chrome accent:  #C0C8D8
- Logo: S and N always in #CC0000

## App Status
- Web: deployed on Hostinger VPS, Angular SSR + PM2 + Nginx
- Mobile: Flutter APK, crash fixed (R8 disabled, hardcoded Supabase keys)
- iOS: Web app on Safari (no native build)
- Admin: Web only

## Current Issues Being Fixed (Prompt 19)
- Flutter app crashes on open → fixed by hardcoding Supabase keys in main.dart
- Mobile missing 30% of web features → being completed
- Flutter navigation broken → complete router rebuild with ShellRoute
- create-lead 500 error → redeploy with CORS + service role fix
- Admin verifications 400 → two-step query fix
- Admin rankings 403 → category_id: null in upsert
- Colors too mild → full design system update to crimson + deep navy

## User Roles
- user → /home (public browsing + auth required for quotes)
- pending_vendor → /auth/pending-approval (gated)
- vendor → /vendor/dashboard (ShellRoute with bottom nav)
- admin → /admin (web only, Flutter redirects to web)

## Architecture
- Public routes: /, /search, /business/:slug (no auth needed)
- Quote/leads: require login (modal prompt if not logged in)
- Vendor routes: ShellRoute with 4-tab bottom nav
- Admin: web-only panel

## DB Tables (20): profiles, categories, businesses, business_images,
  business_services, leads, reviews, saved_businesses, business_views,
  notifications, review_helpful, business_faqs, reported_businesses,
  search_logs, material_category_groups, material_items,
  business_materials, vendor_verifications, admin_overrides, email_notifications

## Edge Functions (16 deployed)
  create-lead, update-lead-status, search-businesses, get-homepage-data,
  get-vendor-analytics, approve-vendor-registration, reject-vendor-registration,
  submit-verification, review-verification, increment-view-count,
  get-nearby-businesses, calculate-vendor-metrics, log-call-lead,
  toggle-helpful-review, vendor-reply-review, get-lead-stats

## Key Files for Session
1. memory_v7.md (this file)
2. PROMPT_19_FINAL_SYSTEM.md
