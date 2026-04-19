# S-Network — PROMPT 16
## Full Codebase Audit + Critical Fix + 100% Feature Completion
## FOR CLAUDE OPUS — Most comprehensive prompt in the series

> **Session Setup:** Paste memory_v5.md first, then this entire prompt.
> **Current app state:** ~60% complete. Critical auth/UI/navigation broken.
> **What this does:** Full audit → fix every broken thing → complete the app to 100%.
> **Platforms:** Angular web + Flutter mobile. No iOS native. Admin = web only.
> **Rules:** No TODOs. No stubs. No partial code. Every file complete and working.
> Work through all 8 phases in order. Do not skip. Do not summarize — implement.

---

```
You are acting as a senior full-stack auditor, debugger, and engineer simultaneously.
Read the entire codebase — every Angular file, every Flutter file, every Supabase
edge function, every migration — before writing a single line of fix code.

Then execute all 8 phases below completely.

---

══════════════════════════════════════════════════════
PHASE 1 — FULL CODEBASE AUDIT (READ FIRST, FIX LATER)
══════════════════════════════════════════════════════

Scan every file in the project. Produce an internal audit report covering:

CRITICAL ISSUES (app-breaking):
- Auth flow: does registration collect email + password? Is signUp called correctly?
- Profile trigger: does it fire on every auth method? Does it handle all roles?
- Category fetch: does the categories table have data? Does the Angular service fetch it?
- Navigation: does any route guard exist? Does the navbar/sidebar render after login?
- Admin access: is there any seeded admin account? Can admin log in at all?
- 406 loop: is .single() still used anywhere on profiles?
- RLS policies: do they allow the queries actually being made?
- Edge functions: are all deployed? Are any returning 500?

MEDIUM ISSUES (feature-breaking):
- Form validation: are required fields enforced on all forms?
- Error handling: do API errors surface to the user or silently fail?
- Loading states: do any components hang on empty data with no feedback?
- Auth guards: are vendor/admin routes actually protected?
- Mobile: does Flutter auth match Angular auth flow?

LOW ISSUES (polish/performance):
- Bundle sizes, unused imports, console.log statements left in
- Missing meta tags, missing error boundaries
- Unoptimized queries (missing .limit() calls)

Output this audit as structured comments at the top of your response,
then proceed to fix everything found.

---

══════════════════════════════════════════════════════
PHASE 2 — EMERGENCY FIXES (DO THESE BEFORE ANYTHING ELSE)
══════════════════════════════════════════════════════

These 5 issues are completely blocking the app. Fix them first.

─────────────────────────────────────────────
FIX 1: ADMIN ACCOUNT RECOVERY
─────────────────────────────────────────────

The admin was created by manually changing the role in Supabase Studio.
There are no admin credentials to log in with. The app is locked.

Create supabase/migrations/012_seed_admin.sql:

  -- Create admin user via Supabase Auth (run this in Supabase SQL editor ONCE)
  -- Step 1: Insert into auth.users (Supabase internal table)
  -- NOTE: This uses a known approach for seeding admin users safely

  -- First check if admin already exists to prevent duplicate
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM auth.users WHERE email = 'admin@snetwork.app'
    ) THEN
      -- Insert auth user
      INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        role,
        aud
      ) VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000',
        'admin@snetwork.app',
        crypt('SNetwork@Admin2024!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Super Admin","role":"admin"}',
        now(),
        now(),
        'authenticated',
        'authenticated'
      );
    END IF;
  END $$;

  -- The trigger will auto-create the profile with role='admin'
  -- But since we're seeding directly, also ensure profiles row:
  INSERT INTO public.profiles (id, name, phone, role, avatar_url)
  SELECT
    u.id,
    'Super Admin',
    '',
    'admin',
    ''
  FROM auth.users u
  WHERE u.email = 'admin@snetwork.app'
  ON CONFLICT (id) DO UPDATE SET role = 'admin';

Also create a script: scripts/reset-admin.sql with instructions:
  /* Run this in Supabase Studio → SQL Editor if you ever lose admin access.
   * Admin credentials after running:
   * Email: admin@snetwork.app
   * Password: SNetwork@Admin2024!
   * Change the password immediately after first login via /admin/settings.
   */

Add this to README.md under "Emergency Admin Recovery" section.

─────────────────────────────────────────────
FIX 2: REGISTRATION PASSWORD FIELD
─────────────────────────────────────────────

The registration form is not collecting a password. This means Supabase
signUp is being called without a password, which either fails silently
or creates a passwordless account.

In src/app/modules/auth/register/register.component.ts:

STEP 1 form group MUST include:
  email: FormControl with Validators.required + Validators.email
  password: FormControl with Validators.required + Validators.minLength(8)
  confirmPassword: FormControl with Validators.required
  name: FormControl with Validators.required + Validators.minLength(2)
  phone: FormControl with Validators.required + Validators.pattern(/^[6-9]\d{9}$/)
  role: FormControl with Validators.required (values: 'user' | 'vendor')

Add cross-field validator for password match:
  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { passwordMismatch: true };
  }

HTML for step 1 MUST show:
  - Email input (type="email")
  - Password input (type="password") with show/hide toggle
  - Confirm Password input (type="password")
  - Full Name input
  - Phone input (with +91 prefix display)
  - Role toggle: "I am a User" / "I am a Vendor"
  - Password strength indicator (weak/medium/strong based on length+complexity)
  - "Already have an account? Login" link

Error messages shown BELOW each field on touch:
  email: "Please enter a valid email address"
  password: "Password must be at least 8 characters"
  confirmPassword: "Passwords do not match"
  name: "Full name is required"
  phone: "Enter a valid 10-digit Indian mobile number"

The signUp call MUST be:
  await supabase.auth.signUp({
    email: form.email,
    password: form.password,
    options: {
      data: {
        full_name: form.name,
        phone: form.phone,
        role: form.role   // trigger maps 'vendor' → 'pending_vendor'
      }
    }
  })

─────────────────────────────────────────────
FIX 3: CATEGORY DROPDOWN NOT LOADING
─────────────────────────────────────────────

The category dropdown in Step 2 of vendor registration shows only
"Select category" with no options. Root causes to fix:

3a. Verify categories table is seeded. In supabase/migrations/004_seed_categories.sql,
    confirm these exact rows exist (INSERT ... ON CONFLICT DO NOTHING):
    Civil Contractor, Residential Builder, Commercial Contractor,
    Turnkey Contractor, Architect, Interior Designer, Electrician,
    Plumber, Material Supplier

3b. Fix the Angular CategoryService:
    In src/app/core/services/category.service.ts:
    
    getCategories(): Observable<Category[]> {
      return from(
        this.supabase.client
          .from('categories')
          .select('id, name, icon, slug')
          .order('name', { ascending: true })
      ).pipe(
        map(({ data, error }) => {
          if (error) {
            console.error('Category fetch error:', error);
            return [];
          }
          return data || [];
        }),
        catchError(err => {
          console.error('Category service error:', err);
          return of([]);
        })
      );
    }

3c. Fix the registration component to load categories on init:
    In register.component.ts ngOnInit():
      this.categoryService.getCategories().subscribe(cats => {
        this.categories = cats;
        // If no categories loaded, show error message
        if (cats.length === 0) {
          this.categoryError = 'Unable to load categories. Please refresh.';
        }
      });

3d. Fix the RLS policy — categories must be publicly readable:
    In migrations, confirm this policy exists:
    CREATE POLICY "Public read categories"
      ON categories FOR SELECT USING (true);
    If missing, add it to 012_seed_admin.sql.

3e. In the HTML template for the category dropdown:
    <select formControlName="categoryId" [class.error]="categoryCtrl.invalid && categoryCtrl.touched">
      <option value="" disabled selected>Select category</option>
      <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.name }}</option>
    </select>
    <span class="error-msg" *ngIf="categories.length === 0 && !loading">
      Loading categories failed. <button (click)="loadCategories()">Retry</button>
    </span>

─────────────────────────────────────────────
FIX 4: USER NAVIGATION — NO NAVBAR/SIDEBAR AFTER LOGIN
─────────────────────────────────────────────

After login, users see nothing. No navbar, no sidebar, no navigation.
The app appears broken. Fix the entire navigation architecture.

4a. App Shell Architecture:
    The app needs two shell layouts:

    PUBLIC SHELL (no auth required):
      Routes: /, /auth/login, /auth/register, /auth/callback, /auth/pending-approval
      Layout: minimal navbar (logo + Login/Register buttons)
      File: src/app/layouts/public-layout/public-layout.component.ts

    AUTHENTICATED SHELL (auth required):
      Routes: /home, /search, /business/:slug, /saved, /profile
      Routes: /vendor/*, /admin/* (role-specific)
      Layout: full navbar + role-appropriate sidebar
      File: src/app/layouts/auth-layout/auth-layout.component.ts

4b. Create the authenticated shell layout:
    TOP NAVBAR (full width, sticky, #1A1A2E background):
      Left: S-Network logo (click → /home)
      Center: Search bar (condensed version with city selector)
      Right: notification bell + user avatar + dropdown menu

    USER DROPDOWN MENU (role-based):
      For 'user' role:
        My Profile | Saved Businesses | My Leads | Settings | Logout
      For 'vendor' role:
        Dashboard | My Listings | Leads | Analytics | Settings | Logout
      For 'admin' role:
        Admin Panel | Settings | Logout

    LEFT SIDEBAR (collapsible, shown on /home and /search):
      Category list (all 9 categories, clickable filter)
      Popular Cities section
      Hide sidebar on /vendor/* and /admin/*

4c. User Home Dashboard (/home):
    After login as 'user', this is what they see.
    This page must render fully with:
      - Top search bar (prominent)
      - Category grid (9 categories with icons)
      - Featured vendors (from admin_overrides or top rated)
      - Popular in your city (if location known)
      - Recently added vendors
    If no vendors exist in DB yet: show "Be the first to explore" empty state
    with illustration and CTA "Browse Categories"

4d. Route configuration in app.routes.ts:
    Use a route structure with layout components as parents:

    PUBLIC routes (no guard):
      { path: '', component: PublicLayoutComponent, children: [
        { path: '', component: LandingPageComponent },
        { path: 'auth/login', component: LoginComponent },
        { path: 'auth/register', component: RegisterComponent },
        { path: 'auth/callback', component: CallbackComponent },
        { path: 'auth/pending-approval', component: PendingApprovalComponent },
      ]}

    AUTHENTICATED routes (AuthGuard):
      { path: '', component: AuthLayoutComponent, canActivate: [AuthGuard], children: [
        { path: 'home', component: HomeComponent },
        { path: 'search', component: SearchResultsComponent },
        { path: 'business/:slug', component: BusinessProfileComponent },
        { path: 'saved', component: SavedComponent },
        { path: 'profile', component: UserProfileComponent },
      ]}

    VENDOR routes (VendorGuard):
      { path: 'vendor', component: AuthLayoutComponent, canActivate: [VendorGuard], children: [
        { path: 'dashboard', component: VendorDashboardComponent },
        { path: 'leads', component: VendorLeadsComponent },
        { path: 'profile', component: VendorProfileEditorComponent },
        { path: 'analytics', component: VendorAnalyticsComponent },
        { path: 'onboarding', component: VendorOnboardingComponent },
      ]}

    ADMIN routes (AdminGuard):
      { path: 'admin', component: AdminShellComponent, canActivate: [AdminGuard], children: [
        { path: '', component: AdminDashboardComponent },
        { path: 'vendors', component: AdminVendorsComponent },
        { path: 'leads', component: AdminLeadsComponent },
        { path: 'rankings', component: AdminRankingsComponent },
        { path: 'categories', component: AdminCategoriesComponent },
        { path: 'settings', component: AdminSettingsComponent },
      ]}

    PENDING VENDOR guard:
      { path: 'auth/pending-approval', canActivate: [PendingVendorGuard], ... }

4e. Guards implementation:

    AuthGuard:
      canActivate(): checks supabase.auth.getSession() → if no session → navigate('/auth/login')
      Also checks role: if 'pending_vendor' → navigate('/auth/pending-approval')

    VendorGuard extends AuthGuard:
      Additionally checks role === 'vendor' || role === 'admin'
      If role === 'pending_vendor' → navigate('/auth/pending-approval')
      If role === 'user' → navigate('/home')

    AdminGuard extends AuthGuard:
      Checks role === 'admin' only
      Else → navigate('/home')

    PendingVendorGuard:
      Checks role === 'pending_vendor'
      If role === 'vendor' → navigate('/vendor/dashboard')
      If role === 'user' → navigate('/home')
      If role === 'admin' → navigate('/admin')

─────────────────────────────────────────────
FIX 5: LOGIN FLOW COMPLETE REWRITE
─────────────────────────────────────────────

The login flow redirects to role selection after login instead of going
directly to the correct dashboard. Fix the entire login → callback → route flow.

5a. Login page must be clean and complete:
    Email input + Password input + Login button
    "Forgot password?" link (calls supabase.auth.resetPasswordForEmail)
    "Don't have an account? Register" link
    Divider "OR"
    "Continue with Google" button
    "Login with Phone OTP" tab (if Twilio configured)
    
    On submit:
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) → show error message (DO NOT REDIRECT)
        Common errors to handle:
          "Invalid login credentials" → "Email or password is incorrect"
          "Email not confirmed" → "Please verify your email first"
          "User not found" → "No account found with this email"
      if success → navigate to /auth/callback (handles routing by role)

5b. Remove the role selection page entirely.
    Role is captured at REGISTRATION, not at login.
    Any component/route for role selection after login must be deleted.

5c. callback.component.ts final version (from Prompt 15 Part A3):
    Uses maybeSingle() + retry backoff → routes by role.
    Confirm this is the version currently in the codebase.
    If not: implement it now (full code in Prompt 15 Part A3).

---

══════════════════════════════════════════════════════
PHASE 3 — SECURITY HARDENING
══════════════════════════════════════════════════════

After the 5 critical fixes, harden the security across the stack.

S1. Angular — No secrets in environment files committed to git:
    Verify .gitignore includes: .env, environment.prod.ts (if it has real keys)
    Supabase anon key IS safe to commit (it is public by design)
    Service role key must NEVER be in Angular code — only in Edge Function secrets

S2. Input sanitization in Angular:
    All text inputs displayed back to user: use Angular's DomSanitizer or pure pipes
    No [innerHTML] bindings with user-provided content anywhere
    Review component: sanitize the comment text before rendering

S3. File upload security:
    In any file upload component (portfolio images, verification docs):
    Before calling supabase.storage.upload():
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      const maxSizeMB = 5;
      if (!allowedTypes.includes(file.type)) {
        this.uploadError = 'Only JPG, PNG, WebP, and PDF files are allowed';
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        this.uploadError = 'File size must be under 5MB';
        return;
      }
      // Generate random filename to prevent path traversal
      const ext = file.name.split('.').pop();
      const safeName = `${crypto.randomUUID()}.${ext}`;

S4. Form double-submission prevention:
    Every form submit button must:
    - Be disabled while loading (isLoading = true → [disabled]="isLoading")
    - Show a spinner while loading
    - Re-enable only after response received (success OR error)

S5. Route guard consistency:
    Verify every sensitive route has a guard. Test by manually navigating to:
    /admin → should redirect to /auth/login if not admin
    /vendor/dashboard → should redirect if not vendor
    /auth/pending-approval → should redirect if role is not pending_vendor

S6. Supabase RLS final audit:
    Open Supabase Studio → Authentication → Policies
    Verify these tables have RLS ENABLED and correct policies:
    profiles, businesses, leads, reviews, vendor_verifications,
    admin_overrides, notifications, saved_businesses
    
    Add to 012_seed_admin.sql any missing policies found:
    -- Critical missing policy often found:
    CREATE POLICY IF NOT EXISTS "Users can read own profile"
      ON profiles FOR SELECT
      USING (auth.uid() = id OR true);  -- public read needed for review author names
    
    -- Businesses: authenticated users can create for themselves
    CREATE POLICY IF NOT EXISTS "Vendor creates own business"
      ON businesses FOR INSERT
      WITH CHECK (auth.uid() = owner_id);

---

══════════════════════════════════════════════════════
PHASE 4 — COMPLETE ALL MISSING FEATURES (60% → 100%)
══════════════════════════════════════════════════════

Implement every feature needed to make S-Network a complete Justdial equivalent.
Check each feature — if already built, verify it works. If missing, build it.

─────────────────────────────────────────────
USER FEATURES
─────────────────────────────────────────────

U1. Search page (/search) — fully functional:
    URL: /search?q=contractor&city=Chennai&category=civil-contractor&page=1
    
    Left sidebar (desktop) / filter sheet (mobile):
      Category checkboxes (all 9)
      City text input
      Rating filter (star buttons: 1★ 2★ 3★ 4★ 5★)
      Verified only toggle
      Sort: Relevance | Rating | Distance | Newest
    
    Results area:
      "Showing N results for '[query]' in [city]"
      Business card grid (2 columns desktop, 1 column mobile)
      Pagination (20 per page, prev/next + page numbers)
      Empty state: illustration + "No businesses found" + "Clear filters" button
    
    BusinessCard component (complete):
      Cover image (with fallback placeholder)
      Verified badge (green ✓ if verified)
      Premium badge (gold border if premium)
      Business name (truncated at 40 chars)
      Category chip
      Star rating (filled/half/empty stars) + review count
      City + short address
      "Open Now" / "Closed" chip (from working_hours)
      Three action buttons: 📞 Call | 💬 WhatsApp | 📋 Get Quote
      Bookmark icon (top right of card)
    
    Call button behavior:
      Click → shows phone number in tooltip/modal
      Logs call lead via log-call-lead edge function
      Mobile: opens tel: link after 1 second
    
    WhatsApp button:
      Opens https://wa.me/91{phone}?text=Hi, I found you on S-Network...
    
    Get Quote button:
      Opens LeadFormModal (if logged in) OR prompts to login first

U2. Business Profile Page (/business/:slug) — complete:
    All sections from Prompt 5 must be implemented and working.
    Verify each section renders correctly:
    
    [ ] Breadcrumb navigation
    [ ] Header: name, badges, rating, open/closed
    [ ] Action buttons (Call, WhatsApp, Get Quote) — sticky on mobile
    [ ] Portfolio gallery with lightbox
    [ ] About section with all business details
    [ ] Services offered (chips)
    [ ] Service areas (chips)
    [ ] Working hours table
    [ ] Contact section with map (use OpenStreetMap embed, free)
    [ ] Reviews section with rating breakdown bars
    [ ] Write a review (authenticated users only)
    [ ] Vendor FAQ accordion
    [ ] Similar businesses (same category + city)
    [ ] SEO: og tags + schema.org JSON-LD

U3. User Profile (/profile):
    My Details: edit name, phone, city
    Change Password: old password + new password + confirm
    My Submitted Leads: table of all leads user submitted
      Columns: Business, Project Type, Budget, Status, Date
    My Reviews: list of reviews user wrote
    Saved Businesses: grid of bookmarked businesses
    Danger Zone: Delete account button (with confirmation)

U4. Lead Form Modal — complete:
    Fields:
      Project Type: dropdown (New Construction | Renovation | Interior | Electrical | Plumbing | Other)
      Budget Range: two number inputs (Min ₹ | Max ₹) OR a range slider
      Project Description: textarea, min 20 chars, max 500 chars, live character count
      Your Name: pre-filled from profile, editable
      Your Phone: pre-filled from profile, editable
      Preferred Contact Time: Morning | Afternoon | Evening (optional)
    
    Submit flow:
      Validate all fields
      Call create-lead edge function
      On success: close modal + show toast "Your enquiry has been sent to [business name]!"
      On error: show error message, keep modal open

U5. Reviews system — complete:
    Write Review modal (on business profile, logged in users):
      Star selector (1–5, click to select, hover preview)
      Text area: "Share your experience" (min 20 chars)
      Submit button
      
    After submit:
      Update businesses.rating with new average (trigger or edge function)
      Show review immediately in list (optimistic update)
      
    Review card:
      User initial avatar (colored circle with first letter)
      User name (from profiles)
      Star display
      Date (formatted: "2 days ago" or "15 Jan 2025")
      Review text
      Vendor reply (if exists, shown indented below with "Owner replied:" label)
      Helpful button (thumbs up + count)

─────────────────────────────────────────────
VENDOR FEATURES
─────────────────────────────────────────────

V1. Vendor Onboarding Wizard — complete multi-step flow:
    (Shown after first login when vendor has been approved but has no business profile)
    
    Step 1: Business Details
      Business Name, Category (dropdown — loaded from DB), Description (min 50 chars)
      Year established (number), Number of employees (dropdown ranges)
    
    Step 2: Location & Contact
      Address (full text), City, State
      "Use my location" button (browser geolocation → reverse geocode)
      Phone, WhatsApp (optional), Website (optional)
      Working hours: 7-day grid (Mon–Sun), each day: open/close toggle + time pickers
    
    Step 3: Portfolio
      Image upload (multi-select, up to 10 images)
      Each image: caption text field, "Set as cover" radio button
      Upload progress bar per image
    
    Step 4: Services
      Chip input: type service name + press Enter to add
      Maximum 20 services
      Service areas: same chip input for areas served
    
    Step 5: Materials (from material categories)
      Accordion of 7 material groups
      Checkbox list per group, custom description field per checked item
    
    Step 6: Verification Documents
      GST Certificate (number + file upload)
      MSME Certificate (number + file upload)
      At least one required
      "Submit for Verification" button
    
    Stepper: shows step names, current step highlighted, completed steps checked ✓
    Progress bar at top
    Save progress: each step saves to DB immediately on "Next" click

V2. Vendor Dashboard (/vendor/dashboard) — complete:
    Stats row:
      Total Leads | New Leads Today | Profile Views (last 30 days) | Avg Response Time
    
    Verification status banner (orange/blue/green/red per status)
    
    Profile completeness card:
      Progress bar (% complete)
      Missing items list (clickable → navigate to that section of profile editor)
    
    Recent Leads table (last 10):
      Project Type | Budget | Status chip | Time ago | [View →] button
    
    Quick Actions:
      [Edit Profile] [Upload Portfolio] [View All Leads] [View Analytics]

V3. Vendor Leads (/vendor/leads) — complete:
    Tabs: All | New | Contacted | Converted | Lost (with counts per tab)
    
    Lead card (expanded):
      User name + phone + masked email
      Project type + budget range
      Description (full text, expandable)
      Location (city)
      Submitted date + time ago
      Status dropdown (update on change, calls update-lead-status)
      WhatsApp button (opens wa.me with pre-filled message)
      Call button
      Vendor notes textarea (auto-saves on blur)
    
    Filters: date range + search by project type
    Export CSV button (leads data for this vendor)

V4. Vendor Analytics (/vendor/analytics):
    Date range picker (last 7 / 30 / 90 days)
    
    Charts (using Chart.js, already in tech stack):
      Profile views line chart (daily)
      Leads by day bar chart
      Lead status distribution doughnut chart
    
    Stats cards:
      Total views | Total leads | Conversion rate | Response rate
    
    Top enquiry types (bar chart by project_type)
    Lead source breakdown: enquiry vs call

V5. Vendor Profile Editor (/vendor/profile):
    Tab bar: Basic Info | Portfolio | Services & Materials | Working Hours | Verification
    
    Each tab saves independently.
    All fields from onboarding wizard, but editable.
    
    Basic Info tab: all text fields + on-vacation toggle
    Portfolio tab: image manager (add/remove/reorder/set cover)
    Services & Materials tab: chip editors + material category checkboxes
    Working Hours tab: 7-day grid with time pickers
    Verification tab: (from Prompt 14 D4)

─────────────────────────────────────────────
ADMIN FEATURES (complete — web only)
─────────────────────────────────────────────

A1. Admin Dashboard (/admin):
    All from Prompt 15 Part D2.
    Ensure stats cards show real counts from DB.
    Urgent actions list is real-time (Supabase subscription on vendor_verifications).

A2. Vendor Management (/admin/vendors):
    All from Prompt 15 Part D3.
    Vendor Detail Drawer must render documents using:
      PDF: <iframe [src]="sanitizedUrl" width="100%" height="400px">
      Image: <img [src]="imageUrl" style="max-width:100%">
    Use DomSanitizer.bypassSecurityTrustResourceUrl() for iframes.

A3. Lead Monitoring (/admin/leads):
    All from Prompt 15 Part D4.
    Table is paginated (25 per page).
    Admin note: admin can add private note to any lead (stored in leads.admin_note column).
    Add column: ALTER TABLE leads ADD COLUMN IF NOT EXISTS admin_note text;

A4. Rankings Override (/admin/rankings):
    All from Prompt 15 Part D5.
    Drag-to-reorder implemented using Angular CDK DragDrop.
    Import: import { DragDropModule } from '@angular/cdk/drag-drop';
    Each drag updates position_order in admin_overrides table.

A5. Category Management (/admin/categories):
    Table of all categories with: name, icon, slug, business count
    [+ Add Category] button → inline form: name, icon (emoji picker), slug (auto-generated)
    Edit button → inline edit
    Delete button → confirmation dialog → only if 0 businesses in that category

A6. Admin Settings (/admin/settings):
    Change Admin Password:
      Current password | New password | Confirm new password
      Calls supabase.auth.updateUser({ password: newPassword })
    
    Add New Admin:
      Email input + [Invite Admin] button
      Creates new user with role='admin' (uses Edge Function with service role key)
    
    Platform Overview:
      Total registered users, total vendors by status, total leads by month
      Simple table/list format (no charts needed here)
    
    Email Configuration:
      Shows current email provider (Resend)
      Test email button (sends to admin's own email)
      Recent emails log (last 20 from email_notifications table)

─────────────────────────────────────────────
NOTIFICATION SYSTEM — complete
─────────────────────────────────────────────

N1. Notification bell in navbar (all authenticated roles):
    Bell icon with badge count (unread notifications)
    Click → dropdown panel showing last 10 notifications
    Each notification: icon + title + body + time ago + is_read state
    Click notification → marks as read + navigates to relevant page
    "Mark all as read" button at bottom of panel
    
    Real-time: subscribe to notifications table via Supabase Realtime
    On new INSERT for current user → increment badge count + show toast

N2. Notification types and navigation targets:
    new_lead → vendor goes to /vendor/leads
    verification_approved → vendor goes to /vendor/dashboard
    verification_rejected → vendor goes to /vendor/profile?tab=verification
    vendor_approved → vendor goes to /vendor/dashboard
    verification_request → admin goes to /admin/vendors (pending tab)

---

══════════════════════════════════════════════════════
PHASE 5 — FLUTTER MOBILE: SYNC WITH WEB
══════════════════════════════════════════════════════

Ensure Flutter mobile has feature parity with web for user + vendor flows.
Admin is web-only. Do not build admin screens in Flutter.

F1. Auth flow (match web exactly):
    Login screen: email+password + Google OAuth + Phone OTP tabs
    Register screen: same 3-step wizard as web (for vendors)
    Callback/redirect: same role-based routing logic
    PendingApprovalScreen: same content as web

F2. Fix Flutter router for new role structure:
    In router.dart:
    authStateProvider listener:
      'user' → go('/home')
      'vendor' → go('/vendor/dashboard')
      'pending_vendor' → go('/pending-approval')
      'admin' → show AdminRedirectScreen (open web admin in browser)
    
    GoRouter redirect on every route:
      Check session exists → else /login
      Check role allows this route → else appropriate redirect

F3. HomeScreen: match web sections (Featured, Popular, Top Rated, Recent)
    Call get-homepage-data edge function on load.

F4. SearchResultsScreen: full filters working (category, city, rating, verified)
    BusinessCard widget: all action buttons working (call, WhatsApp, quote)

F5. BusinessProfileScreen: all sections complete
    Portfolio swipeable gallery
    Lead form bottom sheet (same fields as web)
    Reviews section with write review

F6. User profile screens: edit profile, my leads, saved businesses

F7. Vendor screens: dashboard, leads list, profile editor, analytics (simplified)

F8. Notification handling: local notifications for new leads (Realtime subscription)

F9. Error handling pattern (apply to ALL screens):
    abstract class BaseState {}
    class Loading extends BaseState {}
    class Success<T> extends BaseState { final T data; }
    class Failure extends BaseState { final String message; }
    
    Every screen uses this pattern. No screen shows blank white on error.

---

══════════════════════════════════════════════════════
PHASE 6 — PERFORMANCE OPTIMIZATION
══════════════════════════════════════════════════════

P1. All Supabase queries must have .limit() applied:
    Search results: .limit(20)
    Homepage featured: .limit(6)
    Homepage popular: .limit(8)
    Notifications: .limit(20)
    Admin leads table: .limit(25)
    No unbounded queries allowed.

P2. Angular: implement route-level lazy loading for ALL modules:
    Verify all loadChildren() use arrow function syntax:
    { path: 'vendor', loadChildren: () => import('./modules/vendor/vendor.module').then(m => m.VendorModule) }
    
    Run: ng build --configuration production --stats-json
    Open stats in browser. No chunk should exceed 500kb.
    If exceeded: identify and split the large module.

P3. Image optimization:
    All <img> tags: use NgOptimizedImage + loading="lazy" + explicit width/height
    Supabase storage image URLs: append ?width=400&quality=80 for card thumbnails
    Full-size images (profile/gallery): load at original quality only when opened

P4. Supabase query optimization:
    Verify these indexes exist (add to migration if missing):
    CREATE INDEX IF NOT EXISTS idx_businesses_city ON businesses(city);
    CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category_id);
    CREATE INDEX IF NOT EXISTS idx_businesses_verified ON businesses(is_verified, is_active);
    CREATE INDEX IF NOT EXISTS idx_leads_business ON leads(business_id);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

P5. Flutter performance:
    ListView.builder for all lists (never ListView with children array)
    const constructors on all stateless widgets
    CachedNetworkImage for all remote images
    Riverpod: use select() to avoid unnecessary rebuilds

---

══════════════════════════════════════════════════════
PHASE 7 — FINAL INTEGRATION TEST (MANUAL — NO AUTOMATION)
══════════════════════════════════════════════════════

Test every flow. Fix anything that fails.

ADMIN RECOVERY:
[ ] Run 012_seed_admin.sql in Supabase Studio SQL editor
[ ] Login at /auth/login with admin@snetwork.app / SNetwork@Admin2024!
[ ] Admin sees /admin dashboard (not redirected elsewhere)
[ ] Immediately change password via /admin/settings

USER REGISTRATION + FLOW:
[ ] Register as new user (fill ALL fields including password)
[ ] Receive email verification (if enabled) OR auto-login
[ ] Redirected to /home (not to role selection page)
[ ] Navbar visible with user's name in avatar dropdown
[ ] Search "contractor" → results appear
[ ] Open business profile → all sections load
[ ] Submit lead → success toast shown
[ ] View /profile → see submitted lead in My Leads

VENDOR REGISTRATION + APPROVAL:
[ ] Register as vendor (3-step form with documents)
[ ] Category dropdown loads all 9 categories
[ ] Documents uploaded successfully
[ ] After registration → redirected to /auth/pending-approval
[ ] Logout → login again → still sees /auth/pending-approval (gated)
[ ] Admin logs in → /admin/vendors → sees pending vendor
[ ] Admin opens vendor detail → documents visible in drawer
[ ] Admin clicks Approve → confirmation → confirm
[ ] Vendor logs in → now redirected to /vendor/dashboard (not pending page)
[ ] Vendor completes onboarding wizard (portfolio + services + materials)
[ ] Vendor profile shows "Pending Verification" banner (docs submitted)

ADMIN RANKING:
[ ] Admin goes to /admin/rankings
[ ] Adds 2 vendors to Featured section → saves
[ ] Opens /home as user → Featured section shows those 2 vendors
[ ] Admin pins a vendor to search position 1
[ ] User searches any keyword → pinned vendor appears first

ADMIN REJECTION:
[ ] Register another test vendor
[ ] Admin rejects with reason "Test"
[ ] Vendor logs in → sees /auth/pending-approval with rejection reason
[ ] Resubmit button works

FLUTTER MOBILE:
[ ] App launches → splash → login screen
[ ] Login as user → home screen with categories
[ ] Search → results → open profile → all sections
[ ] Submit lead → success
[ ] Login as vendor → vendor dashboard
[ ] View leads tab → see submitted lead

---

══════════════════════════════════════════════════════
PHASE 8 — VPS DEPLOYMENT FINAL STEPS
══════════════════════════════════════════════════════

D1. Run migration 012_seed_admin.sql in Supabase Studio BEFORE deploying

D2. Deploy all updated/new edge functions:
    supabase functions deploy search-businesses
    supabase functions deploy get-homepage-data
    supabase functions deploy approve-vendor-registration
    supabase functions deploy reject-vendor-registration
    supabase functions deploy submit-verification
    supabase functions deploy review-verification
    supabase functions deploy create-lead
    supabase functions deploy log-call-lead
    supabase functions deploy increment-view-count
    supabase functions deploy get-vendor-analytics
    supabase functions deploy calculate-vendor-metrics

D3. Set required Supabase secrets (if not already set):
    supabase secrets set RESEND_API_KEY=your_resend_key
    supabase secrets set SITE_URL=https://yourdomain.com

D4. Angular production build:
    ng build --configuration production
    MUST complete with 0 errors.
    Fix every TypeScript error before proceeding.

D5. SSR build:
    ng run s-network-web:server
    node dist/s-network-web/server/server.mjs &
    curl http://localhost:4000/health → must return { status: 'ok' }

D6. Deploy to VPS:
    cd /var/www/s-network && git pull origin main
    cd s-network-web && npm ci && npm run build:ssr
    pm2 reload ecosystem.config.js --update-env

D7. Flutter Android build:
    flutter build apk --release
    Install on test device and run through manual verification flows above

---

POST-COMPLETION CHECKLIST:

After all 8 phases complete, verify:
[ ] Admin can log in with seeded credentials
[ ] User registration collects password (test: try to register with blank password — should fail)
[ ] Category dropdown loads all 9 options
[ ] After login as user → navbar visible + /home loads
[ ] After login as vendor (approved) → /vendor/dashboard visible
[ ] No 406 errors in browser console/network tab
[ ] No role-selection page shown to any user (it should not exist)
[ ] /admin is inaccessible without admin role (test by logging in as user and visiting /admin)
[ ] All 9 categories visible in search filter sidebar
[ ] Business cards show in search results
[ ] Lead form submits without error
[ ] Vendor sees submitted lead in dashboard
```
