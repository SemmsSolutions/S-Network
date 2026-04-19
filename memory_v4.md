# memory.md — S-Network (v4 — FINAL)

## Product
- **Name:** S-Network | **Tagline:** Find. Verify. Build.
- **Type:** Exclusive construction platform for a selected organization
- **Bundle ID:** com.snetwork.app | **Deep Link:** io.snetwork.app

## Build Progress
- [x] Prompts 0–10: Core app (Angular + Flutter + Supabase)
- [x] Prompt 11: Justdial feature audit
- [x] Prompt 12: Full debug pass
- [x] Prompt 13: Auth unification (3 methods, Postgres trigger)
- [ ] **Prompt 14 (CURRENT):** Auth error fix + Verification system + Full deploy

## Auth (UNIFIED — same on web AND mobile)
- Email + Password
- Phone OTP (Twilio via Supabase — requires manual Twilio setup)
- Google OAuth (requires manual Google Cloud Console setup)
- Profile auto-created by Postgres trigger on auth.users INSERT
- Lock fix: dynamic callback finder (...args) => args.find(fn) pattern
- flowType: 'pkce' on both platforms

## Known Auth Errors Being Fixed in Prompt 14
- `TypeError: callback is not a function at SupabaseAuthClient.lock` → fix: dynamic args.find
- `400 Bad Request /otp` → fix: enable Phone provider in Supabase Dashboard (Twilio)
- `400 Bad Request Google` → fix: enable Google provider in Supabase Dashboard

## Vendor Verification System (NEW — added in Prompt 14)
- Exclusive org platform: vendors optionally submit GST + MSME documents
- States: unverified → pending → verified / rejected
- Resubmission allowed after rejection
- Badge: green ✓ Verified shown on profile + search cards
- No badge shown for unverified/pending/rejected (public-facing)
- Admin reviews documents and approves/rejects with reason
- New tables: vendor_verifications (migration 010)
- New columns on businesses: verification_status, verified_at, verification_rejection_reason
- New edge functions: submit-verification, review-verification

## Platforms
- **Web:** Angular 17 SSR → Hostinger VPS → Nginx + PM2 (port 4000)
- **Android:** Flutter → Play Store (.aab release)
- **iOS:** Flutter → Codemagic cloud build → App Store (no Mac)
- **Backend:** Supabase (all services)

## Complete DB Tables (17 tables)
profiles, categories, businesses, business_images, business_services,
leads, reviews, saved_businesses, business_views, notifications,
review_helpful, business_faqs, reported_businesses, search_logs,
material_category_groups, material_items, business_materials,
vendor_verifications

## Edge Functions (16 total)
search-businesses, create-lead, update-lead-status, get-vendor-analytics,
approve-vendor, increment-view-count, get-nearby-businesses, send-notification,
get-lead-stats, vendor-reply-review, toggle-helpful-review, log-call-lead,
calculate-vendor-metrics, submit-verification, review-verification

## Material Categories (7 groups, seeded)
Structural & Foundation | Carpentry & Woodwork | Glass & Windows |
Interior Design & Finishing | Plumbing | Electrical | Miscellaneous
(No sizes/specs in names — go in custom_description)

## Design System
- Primary: #E85D26 | Secondary: #1A1A2E | Surface: #F8F5F0
- Fonts: Syne (headings) + DM Sans (body)
- Verified badge: #2ECC71 green pill

## Files to Read for Context
- VENDOR_VERIFICATION_SYSTEM.md — full verification flow and schema
- VPS_DEPLOYMENT.md — Nginx, PM2, GitHub Actions
- DESIGN_DOC.md — schema, architecture, RLS
- PROMPT_14_FINAL_OPUS.md — current active prompt
