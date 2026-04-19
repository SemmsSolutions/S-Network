# S-Network — PROMPT 11
## Justdial Feature Audit + Gap Fill
## (Run this AFTER Prompts 0–10 are complete)

> Paste memory.md into Antigravity before running this prompt.
> This prompt assumes: Angular web + Flutter mobile + all 10 Supabase edge functions are already built and deployed.

---

```
Read memory.md, PRD.md, and DESIGN_DOC.md.

The S-Network app (Angular web + Flutter mobile + Supabase backend) has been built through Prompt 10.
Now perform a COMPLETE Justdial feature parity audit and implement every missing feature.
Do NOT rebuild anything already done. Only ADD what is missing.

---

PART A — BACKEND GAPS (Supabase)

Check if these tables exist. If not, create new migration file supabase/migrations/007_feature_gaps.sql:

1. saved_businesses table (if missing):
   id uuid, user_id uuid → profiles, business_id uuid → businesses, created_at timestamp
   RLS: user can insert/delete/select own rows only

2. business_views table (if missing):
   id uuid, business_id uuid, viewer_ip text, viewed_at timestamp
   RLS: insert for all (anon ok), select only for business owner

3. notifications table (if missing):
   id uuid, user_id uuid, title text, body text, type text, is_read boolean default false,
   ref_id uuid, created_at timestamp
   RLS: user can select/update own notifications only

4. review_helpful table (new):
   id uuid, review_id uuid → reviews, user_id uuid → profiles, created_at timestamp
   UNIQUE(review_id, user_id) — one vote per user per review
   RLS: authenticated insert, public select

5. business_faqs table (new):
   id uuid, business_id uuid → businesses, question text, answer text, created_at timestamp
   RLS: public select, owner insert/update/delete

6. Add missing columns to businesses table (ALTER TABLE — check each exists first):
   ALTER TABLE businesses ADD COLUMN IF NOT EXISTS slug text unique;
   ALTER TABLE businesses ADD COLUMN IF NOT EXISTS year_established int;
   ALTER TABLE businesses ADD COLUMN IF NOT EXISTS employee_count text;
   ALTER TABLE businesses ADD COLUMN IF NOT EXISTS website_url text;
   ALTER TABLE businesses ADD COLUMN IF NOT EXISTS working_hours jsonb;
   ALTER TABLE businesses ADD COLUMN IF NOT EXISTS languages_spoken text[];
   ALTER TABLE businesses ADD COLUMN IF NOT EXISTS service_areas text[];
   ALTER TABLE businesses ADD COLUMN IF NOT EXISTS total_views int default 0;
   ALTER TABLE businesses ADD COLUMN IF NOT EXISTS total_leads int default 0;
   ALTER TABLE businesses ADD COLUMN IF NOT EXISTS response_rate numeric default 0;
   ALTER TABLE businesses ADD COLUMN IF NOT EXISTS avg_response_time_hours numeric default 0;
   ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_on_vacation boolean default false;

7. Add missing columns to leads table:
   ALTER TABLE leads ADD COLUMN IF NOT EXISTS type text default 'enquiry' CHECK (type IN ('enquiry','call'));
   ALTER TABLE leads ADD COLUMN IF NOT EXISTS vendor_notes text;
   ALTER TABLE leads ADD COLUMN IF NOT EXISTS contacted_at timestamp;
   ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_at timestamp;

8. Add missing columns to reviews table:
   ALTER TABLE reviews ADD COLUMN IF NOT EXISTS vendor_reply text;
   ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_count int default 0;

Check if these edge functions exist. If not, create them:

9. supabase/functions/increment-view-count/index.ts
   - Accepts: { business_id }
   - Upserts into business_views (one record per IP per hour — deduplicate by viewer_ip + DATE_TRUNC('hour', now()))
   - Increments businesses.total_views
   - Returns: { success: true }
   - Auth: not required (anonymous views count)

10. supabase/functions/get-nearby-businesses/index.ts
    - Accepts: { lat, lng, radius_km (default 10), category_id?, limit (default 20) }
    - Uses ST_DWithin to find businesses within radius
    - Orders by distance ASC
    - Returns: businesses array with distance_km field
    - Handles missing lat/lng: returns 400 with clear message

11. supabase/functions/vendor-reply-review/index.ts
    - Accepts: { review_id, reply }
    - Auth required: caller must be owner of the business linked to review_id
    - Updates reviews.vendor_reply
    - Returns: { success: true }

12. supabase/functions/toggle-helpful-review/index.ts
    - Accepts: { review_id }
    - Auth required
    - If user already voted: DELETE from review_helpful, decrement reviews.helpful_count
    - If not voted: INSERT into review_helpful, increment reviews.helpful_count
    - Returns: { helpful: true/false, count: number }

13. supabase/functions/log-call-lead/index.ts
    - Accepts: { business_id }
    - Auth: not required (log even anonymous calls)
    - Inserts lead with type='call', user_id = auth.uid() if authenticated
    - Increments businesses.total_leads
    - Returns: { success: true }

14. supabase/functions/calculate-vendor-metrics/index.ts
    - Accepts: { business_id }
    - Calculates:
      response_rate = (leads where status != 'new') / total_leads * 100
      avg_response_time_hours = AVG(contacted_at - created_at) in hours
    - Updates businesses.response_rate and avg_response_time_hours
    - Call this function whenever a vendor updates lead status
    - Returns: { response_rate, avg_response_time_hours }

15. supabase/functions/search-businesses/index.ts — UPDATE existing function:
    - Premium businesses (is_premium=true) get +0.3 score boost
    - On-vacation businesses (is_on_vacation=true) are excluded from results
    - Add support for: rating_min filter (only return businesses with rating >= rating_min)
    - Add support for: verified_only boolean filter
    - Add support for: sort_by param: 'relevance' | 'rating' | 'newest' | 'most_reviewed'
    - Return these extra fields per business: distance_km (if lat/lng provided), is_open_now (calculated from working_hours + current time)

Deploy all new/updated functions:
supabase functions deploy increment-view-count
supabase functions deploy get-nearby-businesses
supabase functions deploy vendor-reply-review
supabase functions deploy toggle-helpful-review
supabase functions deploy log-call-lead
supabase functions deploy calculate-vendor-metrics
supabase functions deploy search-businesses

---

PART B — ANGULAR WEB GAPS

Check each feature. If missing, add it. If present, skip.

B1. SEARCH AUTOCOMPLETE
In the search bar component (navbar + hero):
- On keyup (debounced 300ms): query businesses table for name ILIKE '%{query}%' LIMIT 8
- Show dropdown with: business name, category, city
- Also suggest category names that match query
- Keyboard navigation (arrow keys + enter)
- Click suggestion navigates to /search?q={name} or /search?category={slug}

B2. VOICE SEARCH
In search bar component (web only):
- Add microphone icon button
- On click: use Web Speech API (window.SpeechRecognition)
- On result: populate search input and trigger search
- Show "Listening..." state
- Graceful fallback if browser does not support it (hide button)

B3. "NEAR ME" BUTTON
On home page hero and search bar:
- Add "Near Me" button with location pin icon
- On click: browser geolocation → get lat/lng → call get-nearby-businesses edge function
- Show results filtered by 10km radius
- If permission denied: show friendly error, suggest typing city manually

B4. RECENTLY VIEWED BUSINESSES
- In a service (RecentlyViewedService): store last 5 business IDs in localStorage
- On BusinessProfileComponent init: push current business to recently viewed list
- On home page: show "Recently Viewed" horizontal scroll section if list is not empty
- Each card shows cover image, name, category

B5. SEARCH HISTORY
- In SearchHistoryService: store last 10 search terms in localStorage
- On SearchResultsComponent: save current query to history
- On SearchComponent (search bar focused): show "Recent Searches" list with clock icon
- Each item clickable to re-run that search
- "Clear history" button at bottom of list

B6. BUSINESS OPEN/CLOSED STATUS
- Create a utility function: isBusinessOpen(working_hours: WorkingHours): boolean
  Uses current browser time + day of week to check against working_hours jsonb
- Show "Open Now" (green chip) or "Closed" (red chip) on:
  1. BusinessCard component (search results)
  2. BusinessProfileComponent header
- Update search-businesses edge function to return is_open_now field (already done in Part A)

B7. COMPARE BUSINESSES
- Add "Compare" checkbox to BusinessCard
- CompareService: stores up to 3 selected business IDs
- Floating compare bar at bottom of screen when 1+ businesses selected: "Compare (N) ▶"
- /compare page: side-by-side table showing: name, category, rating, reviews, services, areas, verified status, year established, response rate
- Clear comparison button

B8. SHARE BUSINESS PROFILE
- On BusinessProfileComponent: "Share" button
- On desktop: copy URL to clipboard + show "Link copied!" toast
- On mobile (if supported): use Web Share API (navigator.share)
- Include: title = business name, url = canonical profile URL

B9. REPORT A BUSINESS
- On BusinessProfileComponent: "Report" link (subtle, small, near bottom)
- Opens a modal: reason dropdown (Fake listing | Wrong info | Spam | Closed business | Other) + description textarea
- Creates a record in a new reported_businesses table (business_id, reporter_id, reason, description, created_at)
- Admin panel gets a "Reports" tab showing all reports
- Add reported_businesses table to migration 007_feature_gaps.sql

B10. CALL TRACKING
- On BusinessProfileComponent "Call" button click:
  BEFORE opening the phone dialer (tel: link), call log-call-lead edge function
- Show call number in a modal first (Justdial style): "Calling [name]... [phone number]"
- Then auto-open tel:{phone} link after 1 second

B11. SOCIAL LOGIN
- Add Google OAuth button on login + register pages
- Use Supabase OAuth: supabase.auth.signInWithOAuth({ provider: 'google' })
- After OAuth: check if profile exists for this user, if not → create profile record
- Redirect to intended page after login

B12. PHONE OTP LOGIN (if not already using it)
- Login form: toggle between "Email/Password" and "Phone OTP" tabs
- Phone OTP flow: enter phone → receive OTP → verify
- Use supabase.auth.signInWithOtp({ phone }) and supabase.auth.verifyOtp()

B13. VENDOR "ON VACATION" TOGGLE
- In VendorDashboardComponent: toggle switch "Business Active / On Vacation"
- On vacation = true: business hidden from search results
- Shows banner on their public profile: "This business is temporarily unavailable"

B14. BUSINESS FAQ SECTION
- On BusinessProfileComponent: FAQ section below reviews (collapsible accordion)
- Shows FAQs from business_faqs table
- Vendors add/edit FAQs in their profile editor (question + answer pairs)

B15. TRENDING SEARCHES ON HOME PAGE
- Create a search_logs table: query text, city text, created_at timestamp
- Log every search (non-empty query) to search_logs
- Home page: "Trending in [city]" section showing top 8 most searched terms in last 7 days
- Query: SELECT query, COUNT(*) FROM search_logs WHERE city = ? AND created_at > now() - interval '7 days' GROUP BY query ORDER BY count DESC LIMIT 8

B16. POPULAR IN YOUR CITY
- Home page section: "Popular in [city]" (below featured vendors)
- Query businesses by city, order by total_views DESC, limit 6
- Show as horizontal scroll cards

B17. REVIEW HELPFULNESS
- On each review card: "Helpful? 👍 (N)" button
- On click: call toggle-helpful-review edge function
- Update count immediately (optimistic update)
- Filled thumbs up icon if current user has voted

B18. VENDOR RESPONSE RATE + TIME ON PROFILE
- On BusinessProfileComponent, in the trust signals row:
  "Responds to N% of enquiries" (response_rate)
  "Usually responds within Xh" (avg_response_time_hours)
- These values come from the businesses table (updated by calculate-vendor-metrics function)

B19. PROFILE COMPLETENESS BANNER
- In VendorDashboardComponent:
  Calculate completeness %: (fields filled / total fields) * 100
  Fields: name, description, phone, address, category, images(>0), services(>0), working_hours
  Show progress bar + checklist of missing items
  "Complete your profile to get more leads"

B20. CITY-BASED HOMEPAGE MEMORY
- CityService: stores selected city in localStorage
- On app init: read stored city, pre-populate city selector everywhere
- On city change: update stored value, re-fetch home page data for that city

---

PART C — FLUTTER MOBILE GAPS

Check each feature. If missing, add it. If present, skip.

C1. ONBOARDING SCREENS (if not built)
- 3-slide onboarding shown only on first app launch (check SharedPreferences flag)
- Slide 1: Search professionals | Slide 2: View portfolios | Slide 3: Get quotes fast
- Skip button + Get Started button

C2. VOICE SEARCH
- In SearchScreen: microphone FAB
- Use speech_to_text Flutter package
- On result: populate search field and trigger search
- Permission handling: ask for microphone permission, graceful deny state

C3. "NEAR ME" ON HOME SCREEN
- "Near Me" chip on HomeScreen category row
- Tap → request location permission → get lat/lng → call get-nearby-businesses edge function
- Show results in full SearchResultsScreen

C4. RECENTLY VIEWED
- RecentlyViewedService using shared_preferences package
- Store last 5 business IDs on profile screen open
- HomeScreen: "Recently Viewed" horizontal list widget

C5. SEARCH HISTORY
- SearchHistoryService using shared_preferences
- Show below search bar when focused (before user types)
- Each history item has clock icon + delete icon
- Clear all button

C6. OPEN/CLOSED STATUS ON CARDS
- BusinessCardWidget: show "Open" (green) / "Closed" (red) chip
- Calculate from business.working_hours + device current time

C7. SHARE BUTTON
- In BusinessProfileScreen AppBar: share icon
- Tap → use share_plus package
- Share: "Check out [name] on S-Network: https://yourdomain.com/business/{slug}"

C8. CALL TRACKING
- In BusinessProfileScreen "Call" button:
  First call log-call-lead edge function
  Then use url_launcher: launchUrl(Uri.parse('tel:${business.phone}'))

C9. VENDOR ON-VACATION TOGGLE
- In VendorDashboardScreen: SwitchListTile "Mark as On Vacation"
- Updates businesses.is_on_vacation
- Shows warning: "Your profile will be hidden from search while on vacation"

C10. FAQ SECTION IN PROFILE
- BusinessProfileScreen: expandable FAQ section using ExpansionTile widgets
- Vendor: FAQEditorScreen to add/edit/delete FAQs

C11. REVIEW HELPFULNESS
- ReviewCard widget: "Helpful (N)" TextButton
- Tap → call toggle-helpful-review → update count in UI

C12. VENDOR RESPONSE METRICS ON PROFILE
- BusinessProfileScreen trust row: response rate + avg response time chips

C13. COMPARE FEATURE (mobile-friendly version)
- Long press on BusinessCard → "Add to Compare"
- Floating compare button shows when 2+ selected
- CompareScreen: scrollable comparison table (horizontal scroll for 3 businesses)

C14. PROFILE COMPLETENESS
- VendorDashboardScreen: LinearProgressIndicator with % label
- Tappable → shows checklist of missing profile fields

C15. REPORT BUSINESS
- BusinessProfileScreen: overflow menu (3-dot icon) → "Report this business"
- Bottom sheet with reason dropdown + description
- Calls insert on reported_businesses table

---

IMPORTANT INSTRUCTIONS:
1. For each item: check if it already exists in the codebase first
2. If it exists and works correctly → add a comment "// ALREADY IMPLEMENTED - SKIPPED"
3. If it exists but is broken → fix it
4. If it does not exist → implement it fully
5. All new DB changes go in supabase/migrations/007_feature_gaps.sql
6. All new Angular services/components follow the existing folder structure in files.md
7. All new Flutter screens/widgets follow the existing feature folder structure
8. After implementing, list every item with status: ADDED | FIXED | ALREADY EXISTED
```
