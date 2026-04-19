# S-Network — PROMPT 12
## Full Debug + Endpoint Testing + Production Readiness
## (Run AFTER Prompt 11 is complete)

> Paste memory.md into Antigravity before running this prompt.
> This is the FINAL pass before launch. Zero tolerance for errors.

---

```
Read memory.md. The S-Network Angular web app, Flutter mobile app, and Supabase backend
are fully built. All features from Justdial audit (Prompt 11) are implemented.

Perform a complete debug and production readiness check. Fix every issue found.
Work through each part in order. Do not skip any section.

---

PART A — SUPABASE EDGE FUNCTION TESTING

Test every edge function. Fix any that fail.

A1. search-businesses
  TEST 1: POST with { "query": "contractor", "city": "Chennai" }
    EXPECT: 200, array of businesses, each has id/name/rating/is_verified/distance_km/is_open_now
  TEST 2: POST with { "query": "", "city": "Chennai" }
    EXPECT: 200, returns all verified Chennai businesses (not error)
  TEST 3: POST with { "query": "contractor", "city": "Chennai", "verified_only": true }
    EXPECT: 200, all results have is_verified = true
  TEST 4: POST with { "query": "contractor", "city": "Chennai", "rating_min": 4 }
    EXPECT: 200, all results have rating >= 4
  TEST 5: POST with { "query": "contractor", "city": "Chennai", "sort_by": "rating" }
    EXPECT: 200, results sorted rating DESC
  TEST 6: POST with no body
    EXPECT: 200 with empty array OR 400 with clear error message — NOT 500
  FIX: Any test that returns 500, crashes, or returns wrong data shape

A2. create-lead
  TEST 1: POST without Authorization header
    EXPECT: 401 Unauthorized
  TEST 2: POST with valid auth + { "business_id": valid_id, "project_type": "renovation", "message": "I need help", "budget_min": 50000, "budget_max": 100000 }
    EXPECT: 201 or 200, lead record created, businesses.total_leads incremented
  TEST 3: POST with valid auth + non-existent business_id
    EXPECT: 400 or 404 with clear error message — NOT silent success
  FIX: Ensure total_leads is incremented atomically using RPC or UPDATE ... SET total_leads = total_leads + 1

A3. update-lead-status
  TEST 1: PATCH without auth
    EXPECT: 401
  TEST 2: PATCH with valid vendor auth + { "lead_id": valid_id, "status": "contacted" }
    EXPECT: 200, lead status updated, contacted_at timestamp set
  TEST 3: PATCH where vendor tries to update a lead for ANOTHER vendor's business
    EXPECT: 403 Forbidden
  TEST 4: PATCH with invalid status value { "status": "randomstring" }
    EXPECT: 400 with message "Invalid status"
  FIX: After status update, call calculate-vendor-metrics for this business_id

A4. get-vendor-analytics
  TEST 1: GET without auth
    EXPECT: 401
  TEST 2: GET with valid vendor auth (vendor with 0 leads)
    EXPECT: 200, { total_leads: 0, new_leads: 0, profile_views: 0, conversion_rate: 0 } — NOT null/undefined values
  TEST 3: GET with valid vendor auth (vendor with leads)
    EXPECT: 200, correct counts for each status
  FIX: Ensure ALL numeric fields default to 0, never return null

A5. approve-vendor
  TEST 1: POST without auth
    EXPECT: 401
  TEST 2: POST with non-admin user auth
    EXPECT: 403 Forbidden
  TEST 3: POST with admin auth + { "business_id": valid_id }
    EXPECT: 200, businesses.is_verified = true, notification created for vendor
  TEST 4: POST with admin auth + non-existent business_id
    EXPECT: 404 Not Found
  FIX: Confirm role check uses DB role from profiles table, NOT from JWT claims alone

A6. increment-view-count
  TEST 1: POST with { "business_id": valid_id } (no auth)
    EXPECT: 200, businesses.total_views incremented
  TEST 2: POST same business_id + same IP within 1 hour (simulate duplicate)
    EXPECT: 200 but total_views NOT incremented again (deduplication works)
  TEST 3: POST with invalid business_id
    EXPECT: 400 or 404 — NOT silent success
  FIX: Deduplication logic must use INSERT INTO business_views ... ON CONFLICT DO NOTHING

A7. get-nearby-businesses
  TEST 1: POST with { "lat": 13.0827, "lng": 80.2707, "radius_km": 10 }
    EXPECT: 200, businesses sorted by distance_km ASC
  TEST 2: POST with { "lat": 13.0827, "lng": 80.2707, "radius_km": 10, "category_id": valid_id }
    EXPECT: 200, only businesses of that category
  TEST 3: POST with missing lat
    EXPECT: 400 "lat and lng are required"
  FIX: Ensure PostGIS extension is enabled. Test ST_DWithin query directly in Supabase SQL editor

A8. vendor-reply-review
  TEST 1: POST without auth
    EXPECT: 401
  TEST 2: POST with vendor auth + { "review_id": review_on_their_business, "reply": "Thank you!" }
    EXPECT: 200, reviews.vendor_reply updated
  TEST 3: POST with vendor auth + review_id that belongs to ANOTHER vendor's business
    EXPECT: 403 Forbidden
  FIX: Ownership check must JOIN reviews → businesses → owner_id = auth.uid()

A9. log-call-lead
  TEST 1: POST without auth (anonymous)
    EXPECT: 200, lead created with type='call', user_id = null
  TEST 2: POST with auth + { "business_id": valid_id }
    EXPECT: 200, lead created with type='call', user_id = caller's uid
  TEST 3: Multiple calls from same user to same business in same day
    EXPECT: All logged (no deduplication for calls — each is a real call event)
  FIX: Ensure businesses.total_leads incremented on call lead

A10. calculate-vendor-metrics
  TEST 1: POST with valid vendor auth + { "business_id": their_business_id }
    EXPECT: 200, response_rate and avg_response_time_hours updated on businesses table
  TEST 2: POST for business with 0 leads
    EXPECT: 200, { response_rate: 0, avg_response_time_hours: 0 } — NOT division by zero error
  TEST 3: POST for business where vendor has no contacted_at timestamps yet
    EXPECT: 200, avg_response_time_hours = 0 (not null/NaN)
  FIX: All division operations must have NULLIF denominator checks

A11. toggle-helpful-review
  TEST 1: POST without auth
    EXPECT: 401
  TEST 2: POST with auth + { "review_id": valid_id } (first time)
    EXPECT: 200, { "helpful": true, "count": 1 }, review_helpful record inserted
  TEST 3: POST same review_id again (toggle off)
    EXPECT: 200, { "helpful": false, "count": 0 }, record deleted

---

PART B — RLS POLICY AUDIT

Run each test directly in Supabase Studio using "Test as user" feature OR via the client SDK.

B1. businesses table
  ✓ Anonymous user can SELECT businesses where is_active = true
  ✓ Anonymous user CANNOT SELECT businesses where is_active = false
  ✗ Anonymous user CANNOT INSERT into businesses
  ✗ Vendor can INSERT their own business (owner_id = their uid)
  ✗ Vendor CANNOT UPDATE another vendor's business
  ✓ Vendor CAN UPDATE their own business

B2. leads table
  ✗ Anonymous user CANNOT INSERT leads (must be authenticated)
  ✗ User A CANNOT view User B's submitted leads
  ✓ Vendor CAN view leads where business.owner_id = their uid
  ✗ Vendor CANNOT view leads for another vendor's business
  ✗ User CANNOT update lead status (vendor only)

B3. reviews table
  ✓ Anonymous CAN SELECT all reviews
  ✗ Anonymous CANNOT INSERT reviews
  ✓ Authenticated user CAN INSERT review (their own user_id)
  ✗ User CANNOT delete another user's review
  ✓ Admin CAN delete any review (check admin policy exists)

B4. profiles table
  ✓ Anyone CAN SELECT profiles (needed for review author names)
  ✗ User CANNOT UPDATE another user's profile
  ✓ User CAN UPDATE their own profile

B5. notifications table
  ✗ User CANNOT read another user's notifications
  ✓ User CAN read their own notifications
  ✓ User CAN mark their own notifications as read

B6. saved_businesses table
  ✓ User CAN insert their own saves
  ✗ User CANNOT see another user's saves
  ✓ User CAN delete their own saves

FIX: For every ✗ test that passes when it should be blocked, or every ✓ test that is blocked when it shouldn't be, correct the RLS policy.

---

PART C — ANGULAR TYPESCRIPT + RUNTIME AUDIT

C1. TypeScript compilation
  Run: ng build --configuration production
  REQUIRED: Zero TypeScript errors. Fix every single one.
  Common fixes needed:
  - Replace all 'any' types with proper interface types
  - Add null checks before accessing nested properties (business?.location?.city)
  - All Supabase query returns typed using the generated database.types.ts
  - All @Input() and @Output() decorators properly typed

C2. Run: npx tsc --noEmit --strict
  Fix all strict mode violations

C3. All HTTP/Supabase calls must handle 3 states — verify each component:
  - Loading state (spinner or skeleton shown)
  - Success state (data rendered)
  - Error state (error message shown, not blank screen)
  Components to check: HomeComponent, SearchResultsComponent, BusinessProfileComponent,
  VendorDashboardComponent, LeadsComponent, AdminDashboardComponent

C4. Memory leaks — check every component with subscriptions:
  - Every Observable subscription must unsubscribe in ngOnDestroy
  - Use takeUntilDestroyed() or async pipe where possible
  - Supabase Realtime channel must be removed in ngOnDestroy:
    supabase.removeChannel(channel) on destroy

C5. Route guard correctness:
  - /vendor/* → VendorGuard → if role !== 'vendor' AND role !== 'admin' → redirect to /home
  - /admin/* → AdminGuard → if role !== 'admin' → redirect to /home
  - /auth/login + /auth/register → if already logged in → redirect to /home
  - Test each guard by manually visiting the URLs

C6. Navigation after auth:
  - After login: redirect vendor → /vendor/dashboard, user → /home, admin → /admin
  - After register as vendor: redirect to /vendor/onboarding (if no business) or /vendor/dashboard
  - After logout: redirect to /home, clear all stored state

C7. Form validation — check every form has:
  - Required field indicators
  - Error messages shown on blur (not just on submit)
  - Submit button disabled while loading
  - No double-submission (disable button on first click until response)

C8. Image handling:
  - All <img> tags use NgOptimizedImage directive
  - All images have explicit width and height attributes
  - All remote images have a fallback src (placeholder image)
  - Portfolio gallery handles 0 images (shows "No portfolio images yet" state)

C9. Mobile responsiveness:
  - Test every page at 375px width (iPhone SE)
  - Test every page at 768px width (tablet)
  - No horizontal scroll on any page
  - All buttons minimum 44px tap target

C10. 404 handling:
  - Invalid business slug (/business/nonexistent) → show 404 component with "Business not found" + CTA to search
  - All other unknown routes → redirect to /home or show 404 page

---

PART D — FLUTTER AUDIT

D1. Run: flutter analyze
  REQUIRED: Zero errors, zero warnings. Fix all of them.

D2. Run: flutter test
  Fix any test failures (or add basic widget tests if none exist)

D3. All async operations must handle 3 states:
  - Loading: CircularProgressIndicator or Shimmer effect
  - Success: data widget
  - Error: error widget with retry button
  Check screens: HomeScreen, SearchResultsScreen, BusinessProfileScreen,
  VendorDashboardScreen, LeadsListScreen

D4. Memory leak prevention:
  - All StreamSubscriptions cancelled in dispose()
  - Supabase Realtime channel removed in dispose():
    Supabase.instance.client.removeChannel(channel)
  - All TextEditingControllers disposed in dispose()
  - All AnimationControllers disposed in dispose()

D5. Navigation correctness:
  - After login: role check → route to correct screen
  - Back button from BusinessProfileScreen → returns to SearchResultsScreen (not crashes)
  - Deep link: snetwork://business/{slug} opens BusinessProfileScreen directly

D6. Image loading:
  - All images use CachedNetworkImage with:
    placeholder: shimmer or grey box
    errorWidget: grey box with icon
  - Portfolio PageView handles 0 images gracefully

D7. Offline handling:
  - Wrap main data fetches in try/catch for SocketException
  - Show "No internet connection" banner (connectivity_plus package)
  - Retry button on error states

D8. Performance:
  - All BusinessCard widgets use const constructor where possible
  - ListView.builder used for all lists (NOT ListView with children:[])
  - Search results: implement pagination with scroll-to-bottom load more
  - No setState() calls that rebuild the entire widget tree unnecessarily — use Riverpod providers correctly

D9. Form validation in Flutter:
  - All TextFormFields have validators
  - Form.validate() called before submission
  - No submission while loading (button shows CircularProgressIndicator)

D10. Permissions:
  - Location: ask permission before accessing geolocator, handle denied gracefully
  - Microphone (voice search): ask permission, handle denied gracefully
  - Storage/camera (image picker): ask permission, handle denied gracefully
  - Push notifications: ask permission on app launch (with explanation)

D11. Realtime subscription (vendor lead notifications):
  - Subscription only active when vendor is logged in
  - On new lead INSERT: show local notification + update lead count badge
  - Subscription removed on logout

---

PART E — SECURITY AUDIT

E1. No secrets in source code:
  Run: git log --all --full-history -- "*.env" (confirm .env never committed)
  Run: grep -r "service_role" src/ (must return nothing)
  Run: grep -r "supabaseServiceKey" lib/ (must return nothing)
  FIX: If found, remove from git history using git filter-branch

E2. Admin role check is DB-sourced:
  Admin guard must query profiles table for role, NOT read from localStorage or JWT claims
  Reason: JWT claims could be manipulated; DB is authoritative
  Implementation: AuthService.getRole() must do: supabase.from('profiles').select('role').eq('id', user.id).single()

E3. File upload security:
  In Angular upload service AND Flutter image upload:
  - Validate file type before upload: only allow image/jpeg, image/png, image/webp
  - Validate file size: reject files > 5MB
  - Generate a random UUID filename (never use original filename): ${uuid()}.jpg
  - Upload to user-scoped path: businesses/{businessId}/portfolio/{uuid}.jpg

E4. Input sanitization:
  - All text inputs going into DB are trimmed of whitespace
  - No raw HTML insertion in Angular (no innerHTML with user content)
  - Review comments and business descriptions: strip HTML tags before saving

E5. Rate limiting:
  - search-businesses edge function: consider that Supabase has no built-in rate limiting
  - Add a simple IP-based check: if more than 60 requests per minute from same IP, return 429
  - For MVP this is optional but document it as a known gap

---

PART F — DEPLOYMENT READINESS

F1. Angular production build:
  Run: ng build --configuration production
  MUST: Complete with 0 errors
  CHECK: No chunk exceeds 1MB (if it does, investigate and lazy-load the module)
  CHECK: dist/s-network-web/server/server.mjs exists after build

F2. Angular SSR server:
  Run: node dist/s-network-web/server/server.mjs
  GET http://localhost:4000/ → must return valid HTML with <title>S-Network</title>
  GET http://localhost:4000/health → must return { "status": "ok" }
  GET http://localhost:4000/business/test-slug → must return HTML (not crash on missing slug)

F3. PM2 config validation:
  Run: pm2 start ecosystem.config.js --no-daemon
  MUST: Process starts without error
  Run: pm2 status → shows "online"
  Run: curl http://localhost:4000/ → returns HTML

F4. Environment variables:
  All these must be set in .env.production (and documented in .env.example):
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
  - NODE_ENV=production
  - PORT=4000
  Confirm none have placeholder values like "YOUR_KEY_HERE"

F5. Nginx config:
  Run: nginx -t -c /path/to/nginx/s-network.conf
  MUST: "syntax is ok" and "test is successful"

F6. GitHub Actions workflow:
  Validate syntax: install actionlint and run on .github/workflows/deploy.yml
  All required secrets documented in DEPLOY.md:
  - VPS_HOST, VPS_USER, VPS_SSH_KEY, SUPABASE_URL, SUPABASE_ANON_KEY

F7. Flutter release build:
  Run: flutter build apk --release
  MUST: Complete with 0 errors
  CHECK: Output APK exists at build/app/outputs/flutter-apk/app-release.apk
  CHECK: App name shows "S-Network" (not default Flutter app name)
  CHECK: Package name is com.snetwork.app (not com.example.anything)

---

PART G — END-TO-END FLOW TESTS

Run each complete flow manually. Fix any step that fails.

FLOW 1 — New user registers and submits a lead:
  Step 1: Open web app → click Register → fill name, email, phone, role=user → submit
  Step 2: Verify profile row created in Supabase profiles table with role='user'
  Step 3: Search "civil contractor" in search bar
  Step 4: Verify results appear with correct data (name, category, city, rating)
  Step 5: Click on a business → profile page loads with gallery, services, contact info
  Step 6: Click "Request Quote" → fill form → submit
  Step 7: Verify lead row created in leads table with status='new'
  Step 8: Verify businesses.total_leads incremented

FLOW 2 — Vendor receives and manages a lead:
  Step 1: Register as vendor → complete onboarding → submit for approval
  Step 2: Verify business row created with is_verified=false
  Step 3: Admin approves via admin panel
  Step 4: Verify is_verified=true, notification created for vendor
  Step 5: User submits lead to this vendor's business (from Flow 1)
  Step 6: Vendor opens dashboard → sees lead in "New" tab
  Step 7: Vendor clicks lead → views project details → clicks WhatsApp button
  Step 8: Vendor updates status to "Contacted" → verify contacted_at is set
  Step 9: Verify calculate-vendor-metrics updated response_rate on businesses table

FLOW 3 — Near Me search on mobile:
  Step 1: Open Flutter app → grant location permission
  Step 2: Tap "Near Me" on home screen
  Step 3: Verify get-nearby-businesses called with device lat/lng
  Step 4: Results shown sorted by distance
  Step 5: Tap a business → profile loads
  Step 6: Tap "Call" → log-call-lead called → phone dialer opens

FLOW 4 — Vendor analytics:
  Step 1: Vendor has 5 leads (2 new, 2 contacted, 1 converted)
  Step 2: Vendor opens /vendor/analytics
  Step 3: Verify: Total leads = 5, Conversion rate = 20%, charts render correctly
  Step 4: Verify profile views count matches number of increment-view-count calls made

FLOW 5 — Admin moderation:
  Step 1: Login as admin (role='admin' in profiles table)
  Step 2: Navigate to /admin/approvals
  Step 3: See a pending vendor → click Approve
  Step 4: Verify business is_verified=true in DB, vendor receives notification
  Step 5: Navigate to /admin/reviews → find a review → click Delete
  Step 6: Verify review removed from DB and from the business profile page

---

FINAL OUTPUT REQUIRED:

After completing all parts, provide a structured report:

## Debug Report — S-Network

### Part A — Edge Functions
| Function | Tests Passed | Issues Found | Fixed |
|---|---|---|---|
| search-businesses | N/N | ... | ... |
(repeat for all 11 functions)

### Part B — RLS Policies
List each policy test: PASS or FAIL (and fix applied)

### Part C — Angular
List all TypeScript errors fixed, runtime bugs fixed, memory leaks fixed

### Part D — Flutter
List all analyzer warnings fixed, crashes fixed, performance issues fixed

### Part E — Security
List each check: PASS or action taken

### Part F — Deployment
List each check: PASS or action taken

### Part G — E2E Flows
| Flow | All Steps Passed | Issues Found | Fixed |
|---|---|---|---|
(repeat for all 5 flows)

### Known Remaining Issues (if any)
List anything that could not be fixed, with reason and workaround

### Launch Readiness
READY TO LAUNCH ✅ / NOT READY — [list blockers] ❌
```
