# S-Network — PROMPT 15 (ADMIN PANEL + LOGIN FIX)
## Full Admin Control System + Vendor Registration Gate + 406 Login Loop Fix
## FOR CLAUDE OPUS — Final execution prompt

> **Session Setup:** Paste memory_v4.md into Opus before this prompt.
> **What's already done:** Prompts 0–13 complete. Auth unified. Verification schema exists.
> **What this fixes:** 406 login loop, vendor registration gate, full admin control panel.
> **iOS:** Web-only for now. No Flutter iOS work in this prompt.
> **No automated tests.** Manual verification only.
> Work through every part completely. No stubs. No TODOs. Full working code only.

---

```
Read memory_v4.md, DESIGN_DOC.md, and VENDOR_VERIFICATION_SYSTEM.md.

The S-Network app has a critical login loop bug and needs a complete admin control system
with vendor registration gating. Implement everything below in exact order.

---

PART A — FIX THE 406 LOGIN LOOP (CRITICAL — DO THIS FIRST)

The bug:
  User registers → auth trigger creates profile row → callback.component.ts fetches profile
  using .single() → if trigger hasn't committed yet (race condition) → PostgREST returns
  406 Not Acceptable (no rows found with .single()) → app crashes → redirects back to login
  → user stuck in infinite loop between login page and role selection page.

A1. Fix the Postgres trigger to be more robust.
    In supabase/migrations/011_admin_controls.sql, replace the existing trigger function:

    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    DECLARE
      user_role text;
      user_name text;
      user_phone text;
    BEGIN
      -- Extract role safely, default to 'user' if not provided
      user_role := COALESCE(
        NEW.raw_user_meta_data->>'role',
        'user'
      );

      -- Map 'vendor' role from registration to 'pending_vendor'
      -- Vendors cannot access the system until admin approves
      IF user_role = 'vendor' THEN
        user_role := 'pending_vendor';
      END IF;

      user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1),
        'User'
      );

      user_phone := COALESCE(
        NEW.phone,
        NEW.raw_user_meta_data->>'phone',
        ''
      );

      INSERT INTO public.profiles (id, name, phone, role, avatar_url, created_at)
      VALUES (
        NEW.id,
        user_name,
        user_phone,
        user_role,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        now()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        role = CASE
          WHEN profiles.role IS NULL THEN EXCLUDED.role
          ELSE profiles.role  -- never overwrite an existing role
        END;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

A2. Update the profiles table to accept 'pending_vendor' role:
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('user', 'pending_vendor', 'vendor', 'admin'));

A3. Fix callback.component.ts — replace the entire profile fetch logic:

    In src/app/modules/auth/callback/callback.component.ts:

    Replace ALL existing profile fetch code with this retry-with-backoff implementation:

    ```typescript
    import { Component, OnInit } from '@angular/core';
    import { Router } from '@angular/router';
    import { SupabaseService } from '../../core/services/supabase.service';

    @Component({
      selector: 'app-callback',
      template: `
        <div class="flex items-center justify-center min-h-screen bg-[#F8F5F0]">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85D26] mx-auto mb-4"></div>
            <p class="text-gray-600 font-[DM Sans]">Setting up your account...</p>
          </div>
        </div>
      `
    })
    export class CallbackComponent implements OnInit {

      constructor(
        private router: Router,
        private supabase: SupabaseService
      ) {}

      async ngOnInit(): Promise<void> {
        try {
          // Step 1: Get the session (handles OAuth code exchange)
          const { data: { session }, error: sessionError } =
            await this.supabase.client.auth.getSession();

          if (sessionError || !session) {
            console.error('No session after callback:', sessionError);
            await this.router.navigate(['/auth/login']);
            return;
          }

          // Step 2: Fetch profile with retry (fixes 406 race condition)
          const profile = await this.fetchProfileWithRetry(session.user.id);

          if (!profile) {
            // Profile genuinely doesn't exist even after retries
            // Create it manually as fallback
            await this.createProfileFallback(session.user);
            await this.router.navigate(['/home']);
            return;
          }

          // Step 3: Route by role
          this.routeByRole(profile.role);

        } catch (err) {
          console.error('Callback error:', err);
          await this.router.navigate(['/auth/login']);
        }
      }

      private async fetchProfileWithRetry(
        userId: string,
        maxAttempts = 5,
        delayMs = 500
      ): Promise<any | null> {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          const { data, error } = await this.supabase.client
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();  // Returns null if not found — no 406 error

          if (data) return data;

          if (attempt < maxAttempts) {
            // Exponential backoff: 500ms, 1000ms, 1500ms, 2000ms
            await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
          }
        }
        return null;
      }

      private async createProfileFallback(user: any): Promise<void> {
        // Emergency fallback: trigger didn't fire, create profile manually
        await this.supabase.client.from('profiles').upsert({
          id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          phone: user.phone || user.user_metadata?.phone || '',
          role: user.user_metadata?.role === 'vendor' ? 'pending_vendor' : 'user',
          avatar_url: user.user_metadata?.avatar_url || ''
        }, { onConflict: 'id' });
      }

      private routeByRole(role: string): void {
        switch (role) {
          case 'admin':
            this.router.navigate(['/admin']);
            break;
          case 'vendor':
            this.router.navigate(['/vendor/dashboard']);
            break;
          case 'pending_vendor':
            this.router.navigate(['/auth/pending-approval']);
            break;
          case 'user':
          default:
            this.router.navigate(['/home']);
            break;
        }
      }
    }
    ```

A4. Fix ALL other places in the app that use .single() on profiles table.
    Search the entire Angular codebase for:
      .from('profiles').select().single()
    Replace every occurrence with:
      .from('profiles').select().maybeSingle()
    Then add a null check after each one:
      if (!data) { handle gracefully — do not crash }

A5. Fix AuthService.getProfile() similarly:
    In src/app/core/services/auth.service.ts, update the profile fetch method to use
    .maybeSingle() and handle null result without throwing.

A6. Update VendorGuard and AdminGuard to handle 'pending_vendor' role:
    VendorGuard: allow role === 'vendor' OR role === 'admin'. Block 'pending_vendor'.
    AdminGuard: allow role === 'admin' only.
    PendingVendorGuard (NEW): allow role === 'pending_vendor' only.
      Route /auth/pending-approval is protected by PendingVendorGuard.
      A vendor who has been approved (role = 'vendor') visiting this route
      gets redirected to /vendor/dashboard.

A7. Create the Pending Approval screen:
    File: src/app/modules/auth/pending-approval/pending-approval.component.ts

    Full screen showing:
    - S-Network logo at top
    - Large clock icon (orange, animated pulse)
    - Heading: "Account Under Review"
    - Body text: "Your registration is successful. Our admin team is reviewing your
      documents. You will receive an email once your account is approved.
      This usually takes 1–2 business days."
    - Your submitted details summary (fetch from vendor_verifications table):
      Show: business name, GST number (masked: show first 4 + last 2 chars), submission date
    - "Contact Support" link (mailto: youremail@domain.com)
    - "Logout" button at bottom (calls supabase.auth.signOut() → redirect to /auth/login)

    This page is shown to pending_vendor role users ONLY.
    If a pending_vendor tries to navigate anywhere else, guards redirect here.

---

PART B — DATABASE: Admin Controls Schema

B1. Create supabase/migrations/011_admin_controls.sql with ALL of the following:

    -- Admin Overrides Table (CORE of the ranking system)
    CREATE TABLE IF NOT EXISTS admin_overrides (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
      override_type text NOT NULL CHECK (
        override_type IN (
          'homepage_featured',  -- appears in "Featured" section on home page
          'homepage_popular',   -- appears in "Popular" section on home page
          'homepage_recommended', -- appears in "Recommended" section
          'search_pinned',      -- pinned to top of search results globally
          'category_pinned'     -- pinned to top of a specific category search
        )
      ),
      position_order int NOT NULL DEFAULT 1, -- 1 = top, 2 = second, etc.
      category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
        -- only used when override_type = 'category_pinned'
      city text,
        -- optional: pin only for a specific city's search
      is_active boolean DEFAULT true,
      created_by uuid REFERENCES profiles(id),
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now(),

      -- One business can only hold one position per override type per category
      UNIQUE(business_id, override_type, category_id)
    );

    CREATE INDEX idx_overrides_type ON admin_overrides(override_type);
    CREATE INDEX idx_overrides_active ON admin_overrides(is_active);
    CREATE INDEX idx_overrides_position ON admin_overrides(override_type, position_order);

    -- RLS for admin_overrides
    ALTER TABLE admin_overrides ENABLE ROW LEVEL SECURITY;

    -- Public can read active overrides (needed for homepage + search ranking)
    CREATE POLICY "Public reads active overrides"
      ON admin_overrides FOR SELECT
      USING (is_active = true);

    -- Only admins can write
    CREATE POLICY "Admin manages overrides"
      ON admin_overrides FOR ALL
      USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );

    -- Email notification log (tracks sent emails to prevent duplicates)
    CREATE TABLE IF NOT EXISTS email_notifications (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      recipient_id uuid REFERENCES profiles(id),
      recipient_email text NOT NULL,
      email_type text NOT NULL CHECK (
        email_type IN (
          'vendor_registration_received',
          'vendor_approved',
          'vendor_rejected',
          'new_lead_received',
          'verification_approved',
          'verification_rejected'
        )
      ),
      subject text,
      sent_at timestamp DEFAULT now(),
      metadata jsonb
    );

    ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Admin reads all emails" ON email_notifications FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

B2. Update search-businesses edge function to respect admin_overrides:
    In supabase/functions/search-businesses/index.ts, update the query logic:

    The function must now return results in this exact priority order:
    1. search_pinned businesses (from admin_overrides where override_type='search_pinned'
       AND is_active=true), ordered by position_order ASC
    2. category_pinned businesses matching the searched category
    3. is_premium=true businesses, sorted by rating DESC
    4. is_verified=true businesses, sorted by rating DESC
    5. All other businesses, sorted by rating DESC then total_reviews DESC

    Implementation approach:
    - First query: get all active overrides for 'search_pinned' and 'category_pinned'
    - Build an ordered list of pinned business IDs
    - Second query: get all matching businesses (existing search logic)
    - Merge: pinned businesses first (in position order), then non-pinned results
    - Remove duplicates (a pinned business should not appear twice)

B3. Add homepage fetch edge function — supabase/functions/get-homepage-data/index.ts:
    No auth required.
    Input: { city? }
    Returns:
    {
      featured: Business[],      -- admin_overrides type='homepage_featured', position ordered
      popular: Business[],       -- admin_overrides type='homepage_popular', position ordered
      recommended: Business[],   -- admin_overrides type='homepage_recommended', position ordered
      top_rated: Business[],     -- top 8 by rating, no override
      recent: Business[]         -- last 8 verified businesses by created_at
    }
    If city provided: filter top_rated and recent by city
    Override sections (featured/popular/recommended): ignore city filter
    Deploy: supabase functions deploy get-homepage-data

---

PART C — VENDOR REGISTRATION: Complete Gated Flow

C1. Update the registration form for vendors (Angular):
    In src/app/modules/auth/register/register.component.ts + .html:

    When user selects role = "Vendor", show a multi-step registration wizard
    (replace single form with stepper):

    STEP 1 — Account Details:
      Full Name (required)
      Email (required, email format validation)
      Password (required, min 8 chars)
      Phone Number (required, Indian format +91XXXXXXXXXX)
      [Next →]

    STEP 2 — Business Details:
      Business Name (required)
      Business Category (required, dropdown of 9 categories)
      Business Address (required)
      City (required)
      State (required)
      Description (required, min 50 chars)
      Years in Business (optional, number)
      [← Back] [Next →]

    STEP 3 — Documents (ALL fields shown, none are skipped):
      Section heading: "Document Verification"
      Subtext: "Submit your business documents to get verified on S-Network.
      Documents are reviewed by our admin team within 1–2 business days."

      GST Certificate:
        GST Number text input with live format validation
        File upload (PDF/JPG/PNG, max 5MB)
        Status: required for Verified badge, optional for basic listing

      MSME / Udyam Certificate:
        Udyam Number text input with live format validation
        File upload (PDF/JPG/PNG, max 5MB)

      Note: "You must submit at least one document (GST or MSME) to complete registration."
      Submit button disabled if neither document pair is complete.

      [← Back] [Submit Registration]

    On Submit:
      1. supabase.auth.signUp with metadata: { full_name, phone, role: 'vendor' }
         (trigger will set role to 'pending_vendor' automatically)
      2. After signUp: do NOT auto-login — show "Check your email" message
      3. Upload documents to storage: verifications/{userId}/gst.pdf + msme.pdf
      4. After email verification click → user is now in auth system with pending_vendor role
      5. On next login → callback.component detects pending_vendor → redirects to pending-approval page
      6. Meanwhile: call submit-verification edge function with uploaded document URLs

    NOTE: For vendors who skip email confirmation (if disabled in Supabase):
      After signUp → immediately fetch session → upload docs → navigate to /auth/pending-approval

C2. Flutter equivalent — update register_screen.dart:
    Same 3-step stepper using Flutter's Stepper widget.
    Step 3: file_picker for document uploads, same validation rules.
    On complete: same flow as Angular.
    After registration: navigate to PendingApprovalScreen (new screen).

C3. Create PendingApprovalScreen in Flutter (lib/features/auth/pending_approval_screen.dart):
    Same content as Angular pending-approval component (A7).
    Logout button → Supabase.instance.client.auth.signOut() → go_router to /login.

C4. Update Flutter auth router:
    In router.dart: add route /pending-approval → PendingApprovalScreen
    In auth state listener: if role == 'pending_vendor' → go('/pending-approval')
    All other routes: if role == 'pending_vendor' → redirect to /pending-approval

---

PART D — ADMIN PANEL: Complete Implementation

All admin routes: /admin/* — protected by AdminGuard (role = 'admin' only).
Admin panel uses a sidebar layout with navigation.
Design: dark sidebar (#1A1A2E), white content area, orange accents (#E85D26).

D1. Admin Shell Layout (src/app/modules/admin/admin-shell.component.ts + .html):
    LEFT SIDEBAR (fixed, 240px wide):
      S-Network logo + "Admin Panel" label
      Navigation links:
        📊 Dashboard          → /admin
        👥 Vendors            → /admin/vendors
        ⏳ Pending Approvals  → /admin/vendors/pending (with badge count)
        📋 All Leads          → /admin/leads
        🏆 Rankings           → /admin/rankings
        📂 Categories         → /admin/categories
        🔔 Notifications      → /admin/notifications
        ⚙️  Settings          → /admin/settings
      Bottom: logged-in admin name + avatar + Logout button

    MAIN CONTENT AREA: <router-outlet>

D2. Admin Dashboard (src/app/modules/admin/dashboard/admin-dashboard.component.ts):
    Route: /admin

    Stats row (4 cards):
      🕐 Pending Approvals — count of pending_vendor registrations
      ✅ Active Vendors — count of approved vendors
      📋 Total Leads Today — count of leads created today
      👤 Total Users — count of role='user' profiles

    Urgent Actions panel:
      List of last 5 pending vendor registrations
      Each row: business name, submitted date, [Review →] button → navigates to vendor detail

    Recent Activity:
      Last 10 leads across all vendors
      Each row: vendor name, lead project type, budget, status, time ago

    All data fetched via Supabase queries with admin service role or through RLS policies
    that allow admin role full read access.

D3. Vendor Management (src/app/modules/admin/vendors/):

    D3a. Vendor List Page — /admin/vendors:
      Tab bar: All | Pending | Approved | Rejected
      Search bar: search by business name, owner name, phone, city
      Filter dropdowns: Category | City | Verification Status
      
      Table columns:
        Business Name | Owner Name | Phone | Category | City | Reg Date | Status | Documents | Actions

      Status chips:
        pending_vendor → orange "⏳ Pending"
        vendor (verified) → green "✅ Approved"
        vendor (not verified) → blue "Active"
        rejected → red "❌ Rejected"

      Documents column: shows "GST ✓ / —" and "MSME ✓ / —" icons
      
      Actions per row:
        [View Details] → opens vendor detail drawer/modal
        [Approve] (only for pending) → calls approve flow
        [Reject] (only for pending) → opens rejection modal

      Pagination: 25 per page. CSV Export button.

    D3b. Vendor Detail Drawer (shown when clicking View Details):
      Full-width right drawer, slides in from right.
      
      SECTION 1 — Business Info:
        Business name, category, city, address, description
        Registration date, submission count
      
      SECTION 2 — Owner Info:
        Full name, email, phone
        Role (current)
      
      SECTION 3 — Documents (CRITICAL):
        GST Number: show full number + copy button
        Link: "Verify at gstn.gov.in →" (opens new tab)
        GST Certificate: embedded PDF (<iframe>) or image (<img>) viewer
        "Open in new tab" button for documents
        
        MSME Number: show full number + copy button
        Link: "Verify at udyamregistration.gov.in →" (opens new tab)
        MSME Certificate: same viewer
        
        If document not provided: show "Not submitted" in grey
      
      SECTION 4 — Actions (bottom of drawer):
        Only shown when role = 'pending_vendor':
        [✅ Approve Vendor] (green, full width)
          → Confirm dialog: "Approve [Business Name] and grant login access?"
          → On confirm: call approve-vendor-registration edge function
          → Close drawer, refresh list, show success toast
        
        [❌ Reject Registration] (red, full width)
          → Inline form: rejection reason textarea (required)
          → [Confirm Rejection] button
          → On confirm: call reject-vendor-registration edge function
          → Close drawer, refresh list, show rejection toast

D4. Lead Monitoring (src/app/modules/admin/leads/admin-leads.component.ts):
    Route: /admin/leads

    Filters row:
      Vendor search (autocomplete dropdown)
      Date range picker (From — To)
      Status filter: All | New | Contacted | Converted | Lost
      Lead type: All | Enquiry | Call

    Table columns:
      Lead ID | Vendor Name | User Name | Project Type | Budget | City | Status | Date | Actions

    Row click → Lead Detail Modal:
      All lead fields displayed
      Vendor contact info
      User contact info (phone, can click to call)
      Status history (if stored)
      Admin note field (admin can add a private note to any lead)

    Stats row above table:
      Total Leads (filtered count) | New | Contacted | Converted | Conversion Rate %

    CSV Export button.

D5. Rankings Override (src/app/modules/admin/rankings/admin-rankings.component.ts):
    Route: /admin/rankings

    This is the MAIN POWER FEATURE. Three sections:

    SECTION 1 — Homepage Control:
      Three columns side by side:
        "Featured Vendors" | "Popular Vendors" | "Recommended Vendors"
      
      Each column:
        Shows current vendors in order (draggable to reorder)
        Each item: position number + business name + category + city + remove (×) button
        Max: Featured = 6 slots, Popular = 8 slots, Recommended = 6 slots
        [+ Add Vendor] button → opens vendor search modal
      
      Vendor Search Modal:
        Search input (autocomplete, searches all approved vendors)
        Shows: business name, category, city, rating
        Click to add → assigned to that section at next available position
      
      [Save Homepage Configuration] button (orange, prominent)
        → Batch upserts all changes to admin_overrides table

    SECTION 2 — Search Result Pinning:
      Table of currently pinned vendors:
        Position | Business Name | Category | City | Pinned Since | [Remove]
      
      "Pin a vendor to top of search" panel:
        Vendor search autocomplete
        Position number input (1, 2, 3...)
        Optional: limit to specific city (dropdown)
        [Pin Vendor] button → inserts into admin_overrides with type='search_pinned'
      
      Note: "Pinned vendors appear above all other results globally"

    SECTION 3 — Category Rankings:
      Category dropdown (select one of 9 categories)
      Shows current pinned vendors for that category
      Same add/remove/reorder interface as search pinning but scoped to category
      Inserting sets override_type='category_pinned', category_id = selected category

    All changes saved immediately (no separate save button for adds/removes)
    [Save Homepage Configuration] saves the position reordering only

D6. Admin Settings (src/app/modules/admin/settings/admin-settings.component.ts):
    Route: /admin/settings

    Email Configuration:
      Test email send button (sends to admin email)
      View recent sent emails (from email_notifications table)

    Category Management:
      Full CRUD for categories (already built — just add to admin nav)

    Platform Stats:
      Total registered users
      Total vendors (by status breakdown)
      Total leads (by month chart — last 6 months)
      Most active cities

---

PART E — EDGE FUNCTIONS: Admin Registration Flow

E1. Create supabase/functions/approve-vendor-registration/index.ts

    Auth required: admin only (check profiles.role = 'admin')
    Body: { vendor_user_id, business_id? }

    Logic:
    1. Verify caller is admin
    2. UPDATE profiles SET role = 'vendor' WHERE id = vendor_user_id AND role = 'pending_vendor'
    3. If business_id provided: UPDATE businesses SET is_active = true WHERE id = business_id
    4. If no business_id: find business by owner_id WHERE owner_id = vendor_user_id
    5. UPDATE businesses SET is_active = true
    6. Get vendor email from auth.users (use service role key for this — admin only operation)
    7. Send approval email via Resend:
       To: vendor email
       Subject: "Your S-Network account has been approved!"
       Body HTML:
       "Dear [name],
        Congratulations! Your S-Network vendor account for [business name] has been approved.
        You can now log in at [site URL] and start receiving leads.
        Welcome to S-Network!"
    8. INSERT into email_notifications log
    9. INSERT notification for vendor: "🎉 Your account has been approved! Log in to get started."
    10. Return: { success: true, message: 'Vendor approved' }

    IMPORTANT: Use Resend for email (resend.com — free tier 100 emails/day).
    Import using fetch to Resend API:
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'S-Network <noreply@yourdomain.com>',
        to: [vendorEmail],
        subject: 'Your S-Network account has been approved!',
        html: emailHtml
      })
    });

E2. Create supabase/functions/reject-vendor-registration/index.ts

    Auth required: admin only
    Body: { vendor_user_id, rejection_reason }

    Logic:
    1. Verify caller is admin
    2. Validate rejection_reason is not empty — return 400 if missing
    3. UPDATE profiles SET role = 'pending_vendor' WHERE id = vendor_user_id
       (keep as pending_vendor, do not delete — they can reapply)
    4. UPDATE businesses SET is_active = false WHERE owner_id = vendor_user_id
    5. UPDATE vendor_verifications SET status = 'rejected', rejection_reason = rejection_reason
       WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = vendor_user_id)
    6. UPDATE businesses SET verification_status = 'rejected' WHERE owner_id = vendor_user_id
    7. Send rejection email via Resend:
       Subject: "Update on your S-Network registration"
       Body: "Dear [name], Unfortunately your vendor registration was not approved.
       Reason: [rejection_reason]
       You may reapply by contacting our support team or updating your information."
    8. INSERT into email_notifications log
    9. INSERT notification for vendor
    10. Return: { success: true }

E3. Update review-verification edge function to also handle role transitions:
    When approving: if profiles.role = 'pending_vendor' → set to 'vendor'
    (This handles the case where verification comes after initial login access was granted)

E4. Add RESEND_API_KEY to Supabase Edge Function secrets:
    supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
    (Developer gets this from resend.com after creating account)

    Deploy all new functions:
    supabase functions deploy approve-vendor-registration
    supabase functions deploy reject-vendor-registration
    supabase functions deploy get-homepage-data
    supabase functions deploy review-verification  (updated version)

---

PART F — ANGULAR: Homepage Ranking Integration

F1. Update HomeComponent to use get-homepage-data edge function:
    In src/app/modules/user/home/home.component.ts:

    Replace all separate business fetch calls with a single call to get-homepage-data.
    Show these sections IN ORDER when data is available:
      1. "Featured" section — only if admin_overrides featured array is non-empty
      2. "Popular Near You" — only if popular array is non-empty
      3. "Recommended" — only if recommended array is non-empty
      4. "Top Rated" — always shown (fallback data)
      5. "Recently Added" — always shown

    If no override sections have data (admin hasn't configured rankings yet):
    Skip sections 1-3 entirely. Show only Top Rated + Recently Added.

    Loading state: show skeleton cards for each section.
    Error state: show "Unable to load listings" with retry button.

F2. Update search-businesses call to pass admin overrides:
    The edge function already handles prioritization.
    No frontend changes needed — results come back pre-sorted.
    Verify: pinned vendors appear first in search results on frontend.

---

PART G — FLUTTER MOBILE: Admin Panel (Web-Only Admin)

Admin panel is WEB ONLY. Do not build admin screens in Flutter.

In Flutter: admin users who log in → redirect to web admin URL in external browser:
    if (profile.role == 'admin') {
      launchUrl(Uri.parse('https://yourdomain.com/admin'));
      // or show message: "Please use the web app for admin functions"
    }

Update Flutter router.dart: admin role → show AdminRedirectScreen:
    "Admin features are available on the web app at yourdomain.com/admin"
    [Open Web Admin →] button using url_launcher

---

PART H — MANUAL VERIFICATION (No Automated Tests)

Test each flow manually. Fix any step that fails before moving to the next.

H1. LOGIN LOOP FIX:
    [ ] Register as new user (email/password)
    [ ] Open browser DevTools → Network tab
    [ ] Click email verification link
    [ ] Observe: callback.component loads
    [ ] Observe: profiles fetch uses maybeSingle() — NO 406 error in Network tab
    [ ] Observe: user redirected to /home correctly
    [ ] Repeat with Google OAuth login
    [ ] Open 2 tabs — login in both simultaneously — NO NavigatorLockError

H2. VENDOR REGISTRATION GATE:
    [ ] Register as new vendor — fill all 3 steps — upload at least 1 document
    [ ] After registration: see "Check your email" message — cannot access app
    [ ] Click email verification link → redirected to /auth/pending-approval
    [ ] Pending-approval screen shows: business name, submission date, logout button
    [ ] Try manually visiting /vendor/dashboard — redirected back to /auth/pending-approval
    [ ] Try manually visiting /home — redirected back to /auth/pending-approval
    [ ] Supabase Studio: confirm profiles.role = 'pending_vendor' for this user
    [ ] Supabase Studio: confirm vendor_verifications has a row with status='pending'

H3. ADMIN APPROVAL FLOW:
    [ ] Login as admin
    [ ] Navigate to /admin/vendors → see pending vendor in Pending tab
    [ ] Click vendor → drawer opens → see all details + documents
    [ ] Documents render in drawer (PDF or image visible)
    [ ] Click Approve → confirm dialog → confirm
    [ ] Supabase Studio: profiles.role = 'vendor' for that user
    [ ] Supabase Studio: businesses.is_active = true
    [ ] Check email_notifications table: approval email logged
    [ ] Vendor logs in → goes to /vendor/dashboard (not pending-approval)
    [ ] Vendor dashboard loads without errors

H4. ADMIN REJECTION FLOW:
    [ ] Register another test vendor
    [ ] As admin: reject with reason "Test rejection"
    [ ] Vendor logs in → still sees /auth/pending-approval
    [ ] Pending-approval screen shows rejection reason
    [ ] Supabase Studio: vendor_verifications.status = 'rejected'

H5. RANKINGS CONTROL:
    [ ] As admin: go to /admin/rankings
    [ ] Add 3 vendors to "Featured" section, set positions 1, 2, 3
    [ ] Save homepage configuration
    [ ] Open home page as regular user
    [ ] Verify: Featured section shows correct vendors in correct order
    [ ] As admin: pin a vendor to search results (Position 1)
    [ ] Search for "contractor" on home page
    [ ] Verify: pinned vendor appears first regardless of rating

H6. LEAD MONITORING:
    [ ] As user: submit 3 leads to different vendors
    [ ] As admin: go to /admin/leads
    [ ] Verify: all 3 leads visible
    [ ] Filter by one vendor → only their leads shown
    [ ] Filter by status "New" → only new leads shown

H7. FULL FLOW E2E:
    [ ] User registers → uses app → submits quote to a vendor
    [ ] Admin sees pending vendor → approves
    [ ] Vendor logs in → sees lead in dashboard → updates status
    [ ] Admin sees lead status update in /admin/leads
    [ ] Admin pins vendor to homepage featured
    [ ] User sees vendor on homepage in Featured section
```
