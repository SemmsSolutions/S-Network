# BuildConnect — Antigravity Build Prompts

Use these prompts in sequence inside Antigravity. Each prompt is self-contained and references the memory.md context.

---

## PROMPT 0 — Project Initialization

```
Read memory.md, files.md, and TECHSTACK.md.

Set up the BuildConnect monorepo with this structure:
- /build-connect-web (Angular 17 project)
- /build-connect-mobile (Flutter project)
- /supabase (migrations + functions)

Initialize Angular with routing and SCSS. Install @supabase/supabase-js and Tailwind CSS.
Initialize Flutter project. Install all packages from tools.md.
Initialize Supabase locally with `supabase init`.

Do not build any features yet. Just set up the skeleton.
```

---

## PROMPT 1 — Supabase Backend

```
Read DESIGN_DOC.md and memory.md.

Set up the complete Supabase backend for BuildConnect:

1. Run the full database schema from DESIGN_DOC.md section 3.1 (all tables: profiles, categories, businesses, business_images, business_services, leads, reviews)
2. Add all indexes from section 3.2
3. Apply all RLS policies from section 5
4. Create the storage bucket named "build-connect-media" with public read access
5. Seed the categories table with the 9 construction categories from memory.md

Place all SQL in supabase/migrations/ in numbered files.
```

---

## PROMPT 2 — Supabase Edge Functions

```
Read DESIGN_DOC.md section 4 and memory.md.

Create the following Supabase Edge Functions in supabase/functions/:

1. search-businesses — accepts { query, city, category_id, lat, lng, radius }, returns paginated verified businesses sorted by relevance + distance
2. create-lead — authenticated, creates a lead record linked to authenticated user
3. update-lead-status — authenticated vendor only, updates lead status field
4. get-vendor-analytics — returns profile_views, total_leads, conversion_rate for authenticated vendor
5. approve-vendor — admin only, sets is_verified = true on a business

Each function must validate auth, handle errors, and return proper JSON responses.
```

---

## PROMPT 3 — Angular: Core Setup

```
Read TECHSTACK.md and files.md.

In the Angular project (build-connect-web), set up:

1. SupabaseService in core/services/supabase.service.ts — initialize client from environment.ts
2. AuthService — login, register, logout, current user stream
3. Auth guard (redirect to /login if not authenticated)
4. Vendor guard (redirect if role !== 'vendor')
5. Shared models (TypeScript interfaces): Business, Lead, Review, Profile, Category
6. App routing module with lazy-loaded modules: /auth, /search, /vendor, /admin
7. Tailwind configured with the BuildConnect color palette from DESIGN_DOC.md section 7.4

Do not build any pages yet. Foundation only.
```

---

## PROMPT 4 — Angular: User-Facing Pages

```
Read DESIGN_DOC.md section 7 and memory.md.

Build the user-facing Angular pages for BuildConnect:

1. Home page — hero section with search bar, category grid (9 construction categories), featured/verified vendors section
2. Search results page — business cards grid, filter sidebar (category, city, verified), sort options (rating/distance)
3. Business profile page — full details: name, category, location, contact (call + WhatsApp buttons), portfolio image gallery, services list, star ratings, reviews list, "Request Quote" sticky CTA button
4. Lead form modal — fields: project type (dropdown), budget range (min/max), description (textarea), timeline; auto-fills user name + phone from profile

Use the BuildConnect design system: HEX: #C11212 secondary,HEX: #4A658B primary, and white theme based site and bg Syne for headings, DM Sans for body.
All pages must be mobile-responsive.
```

---

## PROMPT 5 — Angular: Vendor Dashboard

```
Read DESIGN_DOC.md and memory.md.

Build the vendor dashboard module in Angular (behind vendor guard):

1. Dashboard home — stats cards (total leads, new leads, profile views, conversion rate)
2. Lead inbox page — list of leads with status chips (new/contacted/converted/lost), lead detail drawer showing project type, budget, description, user contact info, action buttons to update status + WhatsApp user
3. Profile editor page — edit business name, description, services, areas served, upload portfolio images to Supabase Storage
4. Subscribe to Supabase Realtime on the leads table filtered by their business_id — show badge count when new lead arrives

All vendor routes under /vendor/* protected by vendor guard.
```

---

## PROMPT 6 — Flutter: Core + Auth

```
Read TECHSTACK.md, files.md, and memory.md.

Set up the Flutter app for BuildConnect:

1. Initialize Supabase in main.dart using supabase_flutter
2. Set up go_router with routes: /login, /register, /home, /search, /business/:id, /vendor/dashboard, /vendor/leads, /vendor/profile
3. App theme (app_theme.dart) — colors from DESIGN_DOC.md: primary HEX: #C11212, secondary #4A658B, surface #F8F5F0; Google Fonts Syne for headings, DM Sans for body
4. AuthService (Riverpod provider) — login, register, logout, auth state stream
5. Login screen + Register screen with role selection (user/vendor)
6. Auth redirect: if vendor → VendorDashboard, if user → HomeScreen
```

---

## PROMPT 7 — Flutter: User Screens

```
Read DESIGN_DOC.md section 7.3 and memory.md.

Build the user-facing Flutter screens:

1. HomeScreen — search bar, horizontal category chips, nearby businesses list using geolocator for auto-detect
2. SearchResultsScreen — scrollable list of BusinessCard widgets, filter bottom sheet (category, city)
3. BusinessProfileScreen — swipeable portfolio image gallery (PageView), business details, contact action buttons (call + WhatsApp), sticky "Request Quote" FAB
4. LeadFormSheet — bottom sheet with: project type dropdown, budget range slider, description field, submit button that calls create-lead edge function

BusinessCard widget: image thumbnail, name, category chip, star rating, verified badge, city.
Use cached_network_image for all portfolio images.
```

---

## PROMPT 8 — Flutter: Vendor Screens

```
Read DESIGN_DOC.md and memory.md.

Build the vendor Flutter screens:

1. VendorDashboardScreen — stats cards (total leads, new leads today, profile views), navigation to leads + profile
2. LeadsListScreen — list of lead cards with status color chips, pull-to-refresh, filter by status
3. LeadDetailScreen — full lead info: project type, budget, description, user name + phone, action buttons (WhatsApp, call, update status dropdown)
4. ProfileEditorScreen — edit all business fields, image upload to Supabase Storage using image_picker
5. Set up flutter_local_notifications + Supabase Realtime subscription — trigger local notification when new lead INSERT detected for this vendor's business_id
```

---

## PROMPT 9 — Angular: Admin Panel

```
Read memory.md and DESIGN_DOC.md.

Build the admin module in Angular (behind admin guard):

1. Admin dashboard — counts: pending approvals, total vendors, total leads today
2. Pending vendors page — list of unapproved businesses, each with Approve/Reject buttons that call the approve-vendor edge function
3. Reviews moderation page — list all reviews, ability to delete fake/abusive ones
4. Categories management page — add/edit/delete construction categories

Admin route: /admin/* protected by admin guard (checks role === 'admin' from profiles table).
```

---

## PROMPT 10 — SEO + Deployment

```
Read commands.md and TECHSTACK.md.

Finalize web deployment for BuildConnect:

1. Add Angular Universal (SSR) using `ng add @angular/ssr`
2. Create SEO-friendly routes:
   - /contractors-in-chennai, /architects-in-mumbai, etc. (dynamic city pages)
   - Each business profile page has schema.org LocalBusiness JSON-LD meta tags
3. Generate and serve a sitemap.xml
4. Set up Vercel deployment with vercel.json config for Angular SSR
5. Add Google Analytics / PostHog snippet to index.html
6. Ensure all environment variables are set in Vercel dashboard

For Flutter:
- Update pubspec.yaml with correct app name "BuildConnect" and bundle ID com.buildconnect.app
- Create release keystore for Android
- Set up .github/workflows for auto-build on push to main
```

---

## TIPS FOR USING THESE PROMPTS

1. Always paste the content of memory.md at the start of a new Antigravity session
2. Run prompts in order — each depends on the previous
3. After each prompt, test the specific feature before moving to the next
4. Use `supabase gen types typescript` after schema changes to keep types in sync
5. Test the complete lead flow (user → search → quote → vendor receives) after Prompt 5
