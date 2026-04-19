# S-Network — PROMPT 13
## Auth Unification + Material Categories + Cross-Platform Parity Fix
## (Fixes the mismatch between Web and Mobile — run before Prompt 14)

> Paste memory.md into Antigravity before running this.
> Assumes: Angular web + Flutter mobile + Supabase backend already built (Prompts 0–12 done).
> DO NOT rebuild anything already working. Only fix and add.

---

```
Read memory.md, DESIGN_DOC.md, and TECHSTACK.md.

The S-Network app has a critical mismatch between web and mobile. Fix everything in this prompt
before touching anything else. Work through each part completely.

---

PART A — SUPABASE: Fix Auth + Profile Creation

A1. Create a Postgres trigger that auto-creates a profile row whenever a new user
    signs up via ANY method (email, phone OTP, Google OAuth):

    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    BEGIN
      INSERT INTO public.profiles (id, name, phone, role, avatar_url)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
      )
      ON CONFLICT (id) DO NOTHING;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

    This means: regardless of platform or auth method, profile is ALWAYS created.
    Remove all manual profile-creation code from Angular and Flutter — the trigger handles it.

A2. Fix NavigatorLockAcquireTimeoutError on web.
    In the Angular SupabaseService initialization, update the client config:

    const supabase = createClient(url, anonKey, {
      auth: {
        storage: window.localStorage,
        storageKey: 's-network-auth-token',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    });

    This prevents multiple browser tabs fighting over the auth session lock.

A3. Fix 400/404 Supabase errors.
    These are caused by RLS blocking reads or malformed queries.
    In Supabase Studio, go to each failing table and verify:

    For the businesses table — the current select policy should allow public read
    of is_active=true rows WITHOUT requiring auth. Confirm this policy exists:
      CREATE POLICY "Public can view active businesses"
      ON businesses FOR SELECT
      USING (is_active = true);
    If missing, add it.

    For the leads table — confirm vendors can only see their own business leads:
      CREATE POLICY "Vendor views own leads"
      ON leads FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM businesses b
          WHERE b.id = leads.business_id
          AND b.owner_id = auth.uid()
        )
      );

    For profiles table — confirm public select is enabled (needed for review author names):
      CREATE POLICY "Public read profiles"
      ON profiles FOR SELECT USING (true);

A4. Add to supabase/migrations/008_auth_fixes.sql:
    All SQL from A1, A2 config note (comment only), A3 policies.

---

PART B — SUPABASE: Material Categories Schema

B1. Add to supabase/migrations/009_material_categories.sql:

    -- Material category groups (7 groups)
    CREATE TABLE IF NOT EXISTS material_category_groups (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      name text NOT NULL,
      icon text,
      sort_order int DEFAULT 0,
      created_at timestamp DEFAULT now()
    );

    -- Individual materials within each group
    CREATE TABLE IF NOT EXISTS material_items (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      group_id uuid REFERENCES material_category_groups(id) ON DELETE CASCADE,
      name text NOT NULL,
      description text,
      sort_order int DEFAULT 0,
      created_at timestamp DEFAULT now()
    );

    -- Links a vendor/business to materials they supply or work with
    CREATE TABLE IF NOT EXISTS business_materials (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
      material_item_id uuid REFERENCES material_items(id) ON DELETE CASCADE,
      custom_description text,
      UNIQUE(business_id, material_item_id)
    );

    RLS:
    ALTER TABLE material_category_groups ENABLE ROW LEVEL SECURITY;
    ALTER TABLE material_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE business_materials ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Public read material groups" ON material_category_groups FOR SELECT USING (true);
    CREATE POLICY "Public read material items" ON material_items FOR SELECT USING (true);
    CREATE POLICY "Public read business materials" ON business_materials FOR SELECT USING (true);
    CREATE POLICY "Vendor manages own materials" ON business_materials FOR ALL
      USING (EXISTS (SELECT 1 FROM businesses b WHERE b.id = business_materials.business_id AND b.owner_id = auth.uid()));

B2. Seed all 7 material category groups and their items.
    INSERT INTO material_category_groups (name, icon, sort_order) VALUES
    ('Structural & Foundation', '🏗️', 1),
    ('Carpentry & Woodwork', '🪵', 2),
    ('Glass & Windows', '🪟', 3),
    ('Interior Design & Finishing', '🎨', 4),
    ('Plumbing', '🔧', 5),
    ('Electrical', '⚡', 6),
    ('Miscellaneous', '🔩', 7);

    Then INSERT all items per group (name only, NO sizes/specs — those go in custom_description):
    Group 1 - Structural & Foundation:
      Steel (TMT Bars), Cement (PPC), Cement (OPC), Red Bricks, Fly Ash Bricks, AAC Blocks,
      Hollow Blocks, M-Sand, P-Sand, Blue Metal Aggregates, Binding Wire, Cover Blocks,
      Waterproofing Chemicals, Anti-Termite Treatment

    Group 2 - Carpentry & Woodwork:
      Teak Wood, Neem Wood, Sal Wood, Plywood (BWP Grade), Plywood (MR Grade), MDF Board,
      HDF Board, Particle Board, Sunmica Laminates, PVC Laminates, Decorative Veneers,
      Fevicol Adhesive, Araldite Adhesive, Butt Hinges, Auto Hinges, Telescopic Drawer Channels,
      Soft-Close Drawer Channels, Mortise Handles, Cabinet Knobs, Tower Bolts, PVC Edge Banding

    Group 3 - Glass & Windows:
      Toughened Glass, Tinted Glass, Frosted Glass, Fluted Glass, UPVC Windows,
      Aluminium Powder-Coated Frames, Silicone Sealant, Rubber Gaskets, Glass Clips,
      Spider Fittings, Bathroom Mirrors, Decorative Wall Mirrors, SS Mosquito Mesh, Velcro Mesh

    Group 4 - Interior Design & Finishing:
      Gypsum Boards, POP False Ceiling, Grid Ceiling, PVC Ceiling Panels, Wall Putty,
      Wall Primer, Interior Emulsion Paint, Exterior Emulsion Paint, Wallpapers,
      Charcoal Louvers, WPC Wall Panels, Vitrified Tiles, Italian Marble, Granite,
      Wooden Flooring, Profile Handles, Tandem Boxes, Pull-Out Baskets, Hettich Fittings, Hafele Fittings

    Group 5 - Plumbing:
      PVC Drainage Pipes, CPVC Hot/Cold Pipes, UPVC Main Lines, Pipe Elbows, Pipe Tee Fittings,
      Union Fittings, Couplers, End Caps, Reducers, Wall-Hung Closets, Floor Mount EWC,
      Wash Basins, Health Faucets, Wall Mixers, Diverters, Pillar Cocks, Waste Pipes,
      Bottle Traps, Teflon Tape, Solvent Cement, Overhead Water Tank

    Group 6 - Electrical:
      PVC Conduit Pipes (Heavy-Duty), PVC Conduit Pipes (Medium), FR Wires, FRLS Wires,
      Modular Switches, Modular Sockets, Dimmers, Step Regulators, MCB, RCCB, Isolators,
      Distribution Boards, Metal Concealed Boxes, PVC Surface Boxes, LED Downlights,
      COB Strip Lights, Profile Lights, Chandeliers, Chemical Earthing Kit, Copper Earthing Strips

    Group 7 - Miscellaneous:
      Screws, Star Nails, Concrete Nails, Wall Plugs, Digital Door Locks, Cylindrical Door Locks,
      Curtain Tracks, Curtain Brackets, Curtain Finials

---

PART C — ANGULAR WEB: Unified Auth (ALL THREE METHODS)

C1. Replace the entire auth module login/register components with a unified implementation.

    LOGIN PAGE (src/app/modules/auth/login/login.component.ts + .html):
    Show 3 tabs:
      Tab 1: "Email" → email input + password input + Login button
      Tab 2: "Phone OTP" → phone input (with +91 prefix) + Send OTP button
                         → OTP input appears after send → Verify button
      Tab 3: "Google" → "Continue with Google" button (icon + text)

    All tabs on the SAME page. No separate pages.

    Email login:
      supabase.auth.signInWithPassword({ email, password })

    Phone OTP:
      Step 1: supabase.auth.signInWithOtp({ phone: '+91' + phone })
      Step 2: supabase.auth.verifyOtp({ phone: '+91' + phone, token: otp, type: 'sms' })

    Google OAuth:
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/auth/callback' }
      })

    REGISTER PAGE (src/app/modules/auth/register/register.component.ts + .html):
    Fields: Full Name, Email, Password, Phone Number, Role (User / Vendor toggle)
    Below fields: "Or register with Google" button (Google handles name/email auto-fill)

    Email register:
      supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name, phone: phone, role: role } }
      })

    Google register:
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
          queryParams: { access_type: 'offline', prompt: 'consent' }
        }
      })
      After OAuth callback: check if profile.role is set. If not, show a Role Selection modal
      (user must pick User or Vendor before proceeding).

    AUTH CALLBACK ROUTE (src/app/modules/auth/callback/callback.component.ts):
    Route: /auth/callback
    On load: supabase.auth.getSession() → if session exists → check profile.role
      if role = 'vendor' AND no business exists → redirect to /vendor/onboarding
      if role = 'vendor' AND business exists → redirect to /vendor/dashboard
      if role = 'user' → redirect to /home
      if role = 'admin' → redirect to /admin

    DO NOT manually create profile rows in Angular — the Supabase trigger (Part A1) handles it.

C2. Auth state management (AuthService):
    - On app init (APP_INITIALIZER): call supabase.auth.getSession() to restore session
    - supabase.auth.onAuthStateChange() → update BehaviorSubject<Session | null>
    - getProfile(): fetches profiles row for current user (call once after login, cache result)
    - All guards check this cached profile, not localStorage role

C3. Google OAuth setup in Supabase Dashboard:
    Add to the implementation notes (developer must do manually):
    1. Supabase Dashboard → Auth → Providers → Google → Enable
    2. Add Client ID and Secret from Google Cloud Console
    3. Add authorized redirect URI: https://YOUR_PROJECT.supabase.co/auth/v1/callback
    4. Add site URL: https://yourdomain.com
    5. Add redirect URL: https://yourdomain.com/auth/callback

---

PART D — FLUTTER MOBILE: Unified Auth (ALL THREE METHODS)

D1. Replace login_screen.dart and register_screen.dart with unified implementations.

    LOGIN SCREEN (lib/features/auth/login_screen.dart):
    Use a TabBar with 3 tabs: Email | Phone OTP | Google

    Tab 1 - Email:
      TextFormField for email + TextFormField for password (obscured)
      ElevatedButton "Login"
      await Supabase.instance.client.auth.signInWithPassword(email: email, password: password)

    Tab 2 - Phone OTP:
      State 1: TextFormField for phone (with +91 prefix)
               ElevatedButton "Send OTP"
               await Supabase.instance.client.auth.signInWithOtp(phone: '+91$phone')
      State 2 (after OTP sent): TextFormField for 6-digit OTP
               ElevatedButton "Verify"
               await Supabase.instance.client.auth.verifyOTP(
                 phone: '+91$phone', token: otp, type: OtpType.sms)

    Tab 3 - Google:
      ElevatedButton.icon with Google logo SVG asset
      await Supabase.instance.client.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: 'io.snetwork.app://login-callback'
      )
      Handle deep link callback in router

    REGISTER SCREEN (lib/features/auth/register_screen.dart):
    TextFormFields: Full Name, Email, Password, Phone
    SegmentedButton or ToggleButtons: role selection (User / Vendor)
    ElevatedButton "Create Account"
    await Supabase.instance.client.auth.signUp(
      email: email,
      password: password,
      data: {'full_name': name, 'phone': phone, 'role': role}
    )

    "Or continue with Google" OutlinedButton.icon
    After Google OAuth: check profile.role — if null, show RoleSelectionDialog

    DO NOT manually insert into profiles table — trigger handles it (Part A1).

D2. Auth state management (AuthService with Riverpod):
    authStateProvider: StreamProvider listening to Supabase.instance.client.auth.onAuthStateChange
    profileProvider: FutureProvider that fetches profiles row after auth state = signed in
    All guards/redirects use profileProvider.role, never SharedPreferences role

D3. Post-login navigation (in router.dart):
    ref.listen(authStateProvider, (_, state) {
      if (state.event == AuthChangeEvent.signedIn) {
        final profile = ref.read(profileProvider);
        if (profile.role == 'vendor') {
          // check if business exists
          context.go(hasBusinesss ? '/vendor/dashboard' : '/vendor/onboarding');
        } else if (profile.role == 'admin') {
          context.go('/admin');
        } else {
          context.go('/home');
        }
      }
      if (state.event == AuthChangeEvent.signedOut) {
        context.go('/login');
      }
    });

D4. iOS deep link setup for Google OAuth callback:
    In ios/Runner/Info.plist add:
    <key>CFBundleURLTypes</key>
    <array>
      <dict>
        <key>CFBundleURLSchemes</key>
        <array>
          <string>io.snetwork.app</string>
        </array>
      </dict>
    </array>

    In android/app/src/main/AndroidManifest.xml add intent filter:
    <intent-filter>
      <action android:name="android.intent.action.VIEW"/>
      <category android:name="android.intent.category.DEFAULT"/>
      <category android:name="android.intent.category.BROWSABLE"/>
      <data android:scheme="io.snetwork.app"/>
    </intent-filter>

---

PART E — IOS BUILD STRATEGY (Codemagic — No Mac Needed)

E1. Create codemagic.yaml in the Flutter project root:

    workflows:
      ios-release:
        name: iOS Release Build
        max_build_duration: 60
        environment:
          flutter: stable
          xcode: latest
          cocoapods: default
          vars:
            BUNDLE_ID: "com.snetwork.app"
            APP_STORE_APPLE_ID: Encrypted(YOUR_APPLE_ID)
          xcode_scheme: Runner
        scripts:
          - name: Set up code signing
            script: |
              keychain initialize
              app-store-connect fetch-signing-files $BUNDLE_ID \
                --type IOS_APP_STORE \
                --create
              keychain add-certificates
              xcode-project use-profiles
          - name: Get Flutter packages
            script: flutter pub get
          - name: Flutter build iOS
            script: |
              flutter build ios --release --no-codesign
              xcode-project build-ipa \
                --workspace ios/Runner.xcworkspace \
                --scheme Runner
        artifacts:
          - build/ios/ipa/*.ipa
          - /tmp/xcodebuild_logs/*.log
        publishing:
          app_store_connect:
            auth: integration
            submit_to_testflight: true

E2. Add to pubspec.yaml (if not present):
    - supabase_flutter: ^2.0.0
    - app_links: ^6.0.0   # handles deep links for OAuth callback on mobile
    - google_sign_in: ^6.0.0  # optional if using Supabase OAuth (not needed if using Supabase OAuth directly)

E3. Update AndroidManifest.xml minSdkVersion to 21 (required by supabase_flutter v2)

E4. Add to README.md:
    iOS Build Instructions (No Mac Required):
    1. Sign up at codemagic.io (free tier: 500 build minutes/month)
    2. Connect your GitHub repo
    3. Select Flutter workflow
    4. Add Apple Developer account credentials in Codemagic settings
    5. Trigger build → download IPA → upload to TestFlight

---

PART F — ANGULAR WEB: Material Categories UI

F1. In src/app/shared/models/material.model.ts:
    export interface MaterialGroup { id, name, icon, sort_order }
    export interface MaterialItem { id, group_id, name, description, sort_order }
    export interface BusinessMaterial { id, business_id, material_item_id, custom_description, item?: MaterialItem }

F2. MaterialService (src/app/core/services/material.service.ts):
    getMaterialGroups(): Observable<MaterialGroup[]>
      → supabase.from('material_category_groups').select('*').order('sort_order')
    getMaterialItems(groupId: string): Observable<MaterialItem[]>
      → supabase.from('material_items').select('*').eq('group_id', groupId).order('sort_order')
    getBusinessMaterials(businessId: string): Observable<BusinessMaterial[]>
      → supabase.from('business_materials').select('*, material_items(*)').eq('business_id', businessId)
    updateBusinessMaterials(businessId, selectedIds, descriptions): Promise<void>

F3. On Business Profile Page — add "Materials & Products" section:
    Show accordion grouped by category group (e.g., "⚡ Electrical", "🔧 Plumbing")
    Inside each group: chips/tags of material items this vendor works with
    If vendor added a custom_description: show it as a tooltip or sub-text under the item name
    Only show groups that have at least 1 item selected by this vendor
    If vendor has no materials listed: hide section entirely (do not show empty section)

F4. On Vendor Profile Editor — add "Materials & Products" tab:
    Full-width accordion of all 7 groups
    Inside each group: checkbox list of all material items
    Checked = vendor offers/works with this material
    Below each checked item: optional text input "Add description (e.g. brands, sizes, specs)"
    Save button at bottom → calls updateBusinessMaterials()

F5. On Search Results — add "Materials" filter:
    Dropdown: "Filter by material category" → shows 7 group names
    On select: adds material_group filter to search query
    Update search-businesses edge function to support:
      optional filter: material_group_id → JOIN business_materials → material_items → group_id = ?

---

PART G — FLUTTER MOBILE: Material Categories UI

G1. Add models: MaterialGroup, MaterialItem, BusinessMaterial (in lib/core/models/)

G2. MaterialService (lib/core/services/material_service.dart):
    Same 4 methods as Angular version but using Dart/supabase_flutter syntax

G3. Business Profile Screen — "Materials & Products" section:
    ExpansionTile for each material group (only groups with items for this vendor)
    Inside: Wrap widget with Chip for each material item
    Custom description shown below chip if present

G4. Vendor Profile Editor Screen — "Materials" tab:
    CheckboxListTile for each material item, grouped under ExpansionTile per group
    On check: add to selected list
    On uncheck: remove from selected list
    Tapping checked item: show TextFormField for custom description
    Save FloatingActionButton → calls MaterialService.updateBusinessMaterials()

---

PART H — VERIFY EVERYTHING WORKS (Manual Checklist — No Automation)

After completing all parts above, manually verify each item:

AUTH:
[ ] Web: Email login → creates session → redirects correctly by role
[ ] Web: Phone OTP → sends SMS → verify OTP → creates session → redirects
[ ] Web: Google OAuth → opens Google → redirects to /auth/callback → profile role check
[ ] Web: Register new user → profile row auto-created by trigger (check Supabase Studio)
[ ] Web: Register new vendor → redirected to /vendor/onboarding after auth
[ ] Web: No NavigatorLockAcquireTimeoutError in browser console (open 2 tabs to test)
[ ] Web: No 400/404 errors when loading home page or search results (check Network tab)
[ ] Mobile: Email login → works → correct navigation
[ ] Mobile: Phone OTP → works → correct navigation
[ ] Mobile: Google OAuth → opens browser → deep link returns to app → correct navigation
[ ] Mobile: Register vendor → redirected to vendor onboarding
[ ] Both: Logout → session cleared → redirected to login
[ ] Both: Token expiry → auto-refresh works → no sudden logouts

MATERIAL CATEGORIES:
[ ] Supabase: material_category_groups has 7 rows
[ ] Supabase: material_items has all items (approx 100+ rows, no sizes in names)
[ ] Web vendor: can open Materials tab, check/uncheck items, add descriptions, save
[ ] Web profile: Materials section shows correctly grouped items for vendor
[ ] Mobile vendor: can select materials in profile editor, save works
[ ] Mobile profile: Materials section renders with ExpansionTile per group

CROSS-PLATFORM PARITY:
[ ] Same features available on web and mobile
[ ] Same auth methods available on web and mobile
[ ] Vendor onboarding flow works on both platforms
[ ] Lead submission works on both platforms
[ ] Vendor receives leads on both platforms
[ ] Material categories visible on business profile on both platforms
```
