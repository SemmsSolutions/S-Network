# memory.md — S-Network (v5)

## Product
- **Name:** S-Network | **Tagline:** Find. Verify. Build.
- **Type:** Exclusive construction platform for a selected organization
- **Bundle ID:** com.snetwork.app
- **iOS:** Web app on Safari (no native iOS build currently)

## Build Progress
- [x] Prompts 0–10: Core app built
- [x] Prompt 11: Feature audit
- [x] Prompt 12: Debug pass
- [x] Prompt 13: Auth unification (3 methods + Postgres trigger)
- [x] Prompt 14: Verification system + material categories
- [ ] **Prompt 15 (CURRENT):** Login loop fix + admin panel + vendor registration gate

## Critical Bug Being Fixed
- **406 Login Loop:** profiles.single() crashes on race condition with trigger
  Fix: maybeSingle() + retry with exponential backoff (5 attempts, 500ms delay)
  File: callback.component.ts + all other .single() calls on profiles table

## User Roles
- `user` — regular user, can search, view, submit leads
- `pending_vendor` — just registered, awaiting admin approval, BLOCKED from app
- `vendor` — approved by admin, full vendor dashboard access
- `admin` — full system control, no Flutter admin panel (web only)

## Vendor Registration Flow (NEW)
1. Vendor registers with 3-step wizard (account → business → documents)
2. Must upload at least one: GST certificate OR MSME certificate
3. Role set to 'pending_vendor' by Postgres trigger (never 'vendor' on registration)
4. Vendor sees /auth/pending-approval screen — cannot access any other page
5. Admin reviews documents in /admin/vendors → approves/rejects
6. On approve: role → 'vendor', email sent, vendor can now login fully
7. On reject: stays 'pending_vendor', rejection reason shown, can reapply

## Admin Panel (WEB ONLY — no Flutter admin)
- /admin — dashboard with stats + urgent actions
- /admin/vendors — all vendors with pending/approved/rejected tabs
- /admin/leads — all system leads with filters
- /admin/rankings — homepage + search + category ranking override
- /admin/categories — CRUD categories
- /admin/settings — email config + platform stats

## Ranking Priority (search + homepage)
1. admin_overrides (search_pinned / category_pinned) — highest
2. is_premium = true, sorted by rating
3. is_verified = true, sorted by rating
4. All others, sorted by rating + reviews

## Email System
- Provider: Resend (resend.com, free tier 100/day)
- Secret: RESEND_API_KEY in Supabase Edge Function secrets
- Emails: registration received, approved, rejected

## DB Tables (18 tables)
profiles, categories, businesses, business_images, business_services,
leads, reviews, saved_businesses, business_views, notifications,
review_helpful, business_faqs, reported_businesses, search_logs,
material_category_groups, material_items, business_materials,
vendor_verifications, admin_overrides, email_notifications

## Edge Functions (18 total)
search-businesses (updated), create-lead, update-lead-status,
get-vendor-analytics, approve-vendor (old — superseded),
increment-view-count, get-nearby-businesses, send-notification,
get-lead-stats, vendor-reply-review, toggle-helpful-review,
log-call-lead, calculate-vendor-metrics, submit-verification,
review-verification (updated), approve-vendor-registration (NEW),
reject-vendor-registration (NEW), get-homepage-data (NEW)

## Migrations (in order)
001_initial_schema.sql
002_rls_policies.sql
003_indexes.sql
004_seed_categories.sql
005_feature_gaps.sql (or 007)
006_auth_fixes.sql (or 008)
007_material_categories.sql (or 009)
008_vendor_verification.sql (or 010)
009_admin_controls.sql (or 011) ← CURRENT

## Key Files for Opus Session
- memory_v5.md (this file)
- VENDOR_VERIFICATION_SYSTEM.md
- VPS_DEPLOYMENT.md
- DESIGN_DOC.md
- PROMPT_15_ADMIN_LOGIN_FIX.md ← current active prompt
