# memory.md — S-Network (UPDATED v3)

## Core Product Identity
- **Product Name:** S-Network
- **Type:** Construction-focused local discovery + lead generation platform
- **Tagline:** Find. Verify. Build.
- **Bundle ID:** com.snetwork.app
- **Deep Link Scheme:** io.snetwork.app

## Current Build Status
- [x] Prompts 0–10: Core app built (Angular web + Flutter mobile + Supabase backend)
- [x] Prompt 11: Justdial feature audit + gaps filled
- [x] Prompt 12: Full debug + endpoint testing
- [ ] Prompt 13: Auth unification + material categories (IN PROGRESS)
- [ ] Prompt 14: Final production deployment

## Authentication (UNIFIED — ALL THREE on BOTH platforms)
- Email + Password
- Phone OTP (via Twilio + Supabase)
- Google OAuth (via Supabase + Google Cloud Console)
Same on web (Angular) AND mobile (Flutter). No exceptions.

## Auth Architecture
- Profile row auto-created by Postgres trigger on auth.users INSERT
- NO manual profile creation in app code
- Role stored in profiles.role (DB-authoritative — never from localStorage)
- Web: PKCE flow, storageKey: 's-network-auth-token', no NavigatorLockError
- Mobile: deep link callback via io.snetwork.app://login-callback

## Platforms
- **Web:** Angular 17 SSR → Hostinger VPS → Nginx + PM2 (port 4000)
- **Android:** Flutter → Play Store (app-release.aab)
- **iOS:** Flutter → Codemagic cloud build → App Store (no Mac needed)
- **Backend:** Supabase (Postgres + Auth + Storage + Realtime + Edge Functions)

## Material Categories (7 groups, seeded in DB)
1. Structural & Foundation
2. Carpentry & Woodwork
3. Glass & Windows
4. Interior Design & Finishing
5. Plumbing
6. Electrical
7. Miscellaneous
NO sizes/specs in item names — those go in custom_description field

## DB Tables (complete list)
profiles, categories, businesses, business_images, business_services,
leads, reviews, saved_businesses, business_views, notifications,
review_helpful, business_faqs, reported_businesses, search_logs,
material_category_groups, material_items, business_materials

## Edge Functions (complete list — 15 total)
1. search-businesses (updated: premium boost, vacation filter, rating filter, sort)
2. create-lead
3. update-lead-status (also calls calculate-vendor-metrics)
4. get-vendor-analytics
5. approve-vendor
6. increment-view-count
7. get-nearby-businesses
8. send-notification
9. get-lead-stats
10. vendor-reply-review
11. toggle-helpful-review
12. log-call-lead
13. calculate-vendor-metrics
14. search-businesses (already #1)
(Note: 14 unique functions)

## Known Issues Fixed
- NavigatorLockAcquireTimeoutError → fixed via PKCE + storageKey config
- 400/404 errors → fixed via RLS policy corrections
- Auth mismatch between web/mobile → fixed via unified 3-method auth
- Profile not created for OAuth users → fixed via Postgres trigger

## VPS Config
- OS: Ubuntu 22.04 LTS
- Reverse proxy: Nginx → port 4000
- App server: PM2 cluster mode
- SSL: Certbot / Let's Encrypt
- Auto-deploy: GitHub Actions on push to main

## Design System
- Primary: #E85D26 | Secondary: #1A1A2E | Surface: #F8F5F0
- Fonts: Syne (headings) + DM Sans (body)

## Out of Scope (MVP)
- In-app payments, real-time chat, AI estimation, material marketplace

## Key Files
- PRD.md, DESIGN_DOC.md, TECHSTACK.md, VPS_DEPLOYMENT.md
- files.md, commands.md, tools.md
- PROMPT_11_FEATURE_AUDIT.md
- PROMPT_12_DEBUG.md
- PROMPT_13_AUTH_FIX.md ← current
- PROMPT_14_FINAL_DEPLOY.md ← next
