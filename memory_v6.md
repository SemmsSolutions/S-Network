# memory.md — S-Network (v6 — CURRENT)

## Product
- **Name:** S-Network | **Tagline:** Find. Verify. Build.
- **Type:** Exclusive construction platform for a selected organization
- **iOS:** Progressive Web App (Safari) — no native build
- **Admin:** Web only

## CURRENT STATE (what's broken right now)
- Registration: no password field, auth broken
- Categories dropdown: empty (not seeded or RLS blocking)
- Admin: locked out (manually changed role, no credentials)
- User login: no navbar/navigation after login
- Login: loops between login and role-selection page
- App is ~60% complete

## Prompt Execution Status
- [x] 0–10: Core app built
- [x] 11: Feature audit
- [x] 12: Debug pass
- [x] 13: Auth unification
- [x] 14: Verification + material categories
- [x] 15: Admin panel + login fix (written, may not be fully executed)
- [ ] **16 (CURRENT):** Full audit + all fixes + 100% feature completion

## Emergency Admin Credentials (after running migration 012)
- Email: admin@snetwork.app
- Password: SNetwork@Admin2024!
- CHANGE AFTER FIRST LOGIN

## User Roles
- `user` → /home (search, browse, submit leads)
- `pending_vendor` → /auth/pending-approval ONLY (gated)
- `vendor` → /vendor/dashboard (after admin approval)
- `admin` → /admin (web only)

## App Layout Architecture
- PublicLayoutComponent: /, /auth/* (minimal navbar)
- AuthLayoutComponent: /home, /search, /business/*, /profile (full navbar + sidebar)
- VendorShell: /vendor/* (full navbar, vendor sidebar)
- AdminShellComponent: /admin/* (dark sidebar layout)

## No Role Selection Page
- Role is set at REGISTRATION (user vs vendor toggle)
- callback.component.ts routes directly by role
- No post-login role selection step

## DB Tables (20 total)
profiles, categories, businesses, business_images, business_services,
leads, reviews, saved_businesses, business_views, notifications,
review_helpful, business_faqs, reported_businesses, search_logs,
material_category_groups, material_items, business_materials,
vendor_verifications, admin_overrides, email_notifications

## Migrations
001–011 (existing) + 012_seed_admin.sql (NEW — run first)

## Edge Functions (18 deployed)
search-businesses, create-lead, update-lead-status, get-vendor-analytics,
increment-view-count, get-nearby-businesses, send-notification, get-lead-stats,
vendor-reply-review, toggle-helpful-review, log-call-lead, calculate-vendor-metrics,
submit-verification, review-verification, approve-vendor-registration,
reject-vendor-registration, get-homepage-data

## Key Files for Opus Session (paste in this order)
1. memory_v6.md (this file)
2. VENDOR_VERIFICATION_SYSTEM.md
3. PROMPT_16_FULL_AUDIT_FIX.md
