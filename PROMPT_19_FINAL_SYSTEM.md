# S-Network — PROMPT 19 (FULL SYSTEM COMPLETION)
## Full audit + mobile parity + web fixes + new color system + feature enhancements
## Use with Claude Opus — paste memory_v6.md first

> This is the definitive final prompt. Covers everything.
> Read the ENTIRE codebase before writing any code.
> No stubs. No TODOs. Production-ready code only.

---

```
Read memory_v6.md completely before starting.

You are acting as senior mobile engineer + backend auditor + UI architect simultaneously.
Audit every file, fix every broken thing, complete every missing feature.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART A — NEW DESIGN SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The reference image shows: deep navy background, vivid crimson red, 
metallic chrome accents, high contrast, bold. Update all colors:

OLD → NEW:
  Primary orange #E85D26 → Crimson Red    #CC0000
  Secondary navy #1A1A2E → Deep Navy      #0A1628
  Surface warm   #F8F5F0 → Surface white  #F5F6FA
  Accent                 → Chrome silver  #C0C8D8

ANGULAR — Update in styles.scss + every component:
  :root {
    --primary:     #CC0000;
    --primary-dark:#990000;
    --secondary:   #0A1628;
    --secondary-2: #0D1F3C;
    --surface:     #F5F6FA;
    --card-bg:     #FFFFFF;
    --text-main:   #0A1628;
    --text-muted:  #6B7A99;
    --border:      #E2E8F0;
    --success:     #16A34A;
    --warning:     #D97706;
    --chrome:      #C0C8D8;
    --glow-red:    rgba(204,0,0,0.15);
    --glow-navy:   rgba(10,22,40,0.08);
  }

Logo — S and N in #CC0000 (crimson), rest in current context color:
  Web:    <span class="text-[#CC0000] font-black">S</span>-<span class="text-[#CC0000] font-black">N</span>etwork
  Flutter: S and N in Color(0xFFCC0000)

Button styles (update everywhere):
  Primary:   bg #CC0000 hover #990000, white text, rounded-xl, font-semibold
  Secondary: border-2 border-[#CC0000] text-[#CC0000] hover:bg-red-50
  Nav/Header bg: #0A1628
  Active nav item: bg-[#CC0000] text-white OR left-border-4 border-[#CC0000]

Card accent: subtle red left border on important cards (4px solid #CC0000)
Badge verified: bg #FEE2E2 text #CC0000 border border-[#CC0000]/20

FLUTTER — Replace entire AppTheme:
  primaryColor: Color(0xFFCC0000)
  backgroundColor: Color(0xFF0A1628)
  surface: Color(0xFFF5F6FA)
  AppBar: backgroundColor Color(0xFF0A1628)
  ElevatedButton: backgroundColor Color(0xFFCC0000)
  FAB: backgroundColor Color(0xFFCC0000)
  BottomNavBar: backgroundColor Color(0xFF0A1628), selectedItem Color(0xFFCC0000)
  Chip selected: Color(0xFFCC0000)
  CircularProgressIndicator: valueColor Color(0xFFCC0000)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART B — FLUTTER: COMPLETE REBUILD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

B1. main.dart — DEFINITIVE version (hardcoded keys, no env):

  ```dart
  import 'package:flutter/material.dart';
  import 'package:flutter/services.dart';
  import 'package:supabase_flutter/supabase_flutter.dart';
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import 'router.dart';
  import 'shared/theme/app_theme.dart';

  Future<void> main() async {
    WidgetsFlutterBinding.ensureInitialized();
    await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    await Supabase.initialize(
      url: 'https://exqvpzijavrbpfzqixnk.supabase.co',
      anonKey: 'YOUR_SUPABASE_ANON_KEY',
      authOptions: const FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
        autoRefreshToken: true,
      ),
      debug: false,
    );
    runApp(const ProviderScope(child: SNetworkApp()));
  }

  class SNetworkApp extends ConsumerWidget {
    const SNetworkApp({super.key});
    @override
    Widget build(BuildContext context, WidgetRef ref) {
      return MaterialApp.router(
        title: 'S-Network',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.theme,
        routerConfig: ref.watch(routerProvider),
      );
    }
  }
  ```

B2. router.dart — Clean, complete navigation (no watchers that crash):

  ```dart
  import 'package:flutter/material.dart';
  import 'package:go_router/go_router.dart';
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import 'package:supabase_flutter/supabase_flutter.dart';

  // Import all screens
  import 'features/home/home_screen.dart';
  import 'features/auth/login_screen.dart';
  import 'features/auth/register_screen.dart';
  import 'features/auth/pending_approval_screen.dart';
  import 'features/search/search_screen.dart';
  import 'features/search/search_results_screen.dart';
  import 'features/listing/business_profile_screen.dart';
  import 'features/vendor/vendor_dashboard_screen.dart';
  import 'features/vendor/vendor_leads_screen.dart';
  import 'features/vendor/vendor_profile_editor_screen.dart';
  import 'features/vendor/vendor_analytics_screen.dart';
  import 'features/user/user_profile_screen.dart';
  import 'features/user/saved_screen.dart';
  import 'features/notifications/notifications_screen.dart';
  import 'shared/screens/admin_redirect_screen.dart';

  final routerProvider = Provider<GoRouter>((ref) {
    return GoRouter(
      initialLocation: '/',
      debugLogDiagnostics: false,
      redirect: (context, state) {
        final session = Supabase.instance.client.auth.currentSession;
        final loc = state.matchedLocation;

        // Public routes — no redirect needed
        final publicRoutes = ['/', '/login', '/register', '/search',
                              '/pending-approval'];
        if (publicRoutes.any((r) => loc == r || loc.startsWith('/business'))) {
          return null;
        }

        // Protected routes — need session
        if (session == null) return '/login?from=${Uri.encodeComponent(loc)}';

        return null; // Allow all other routes for authenticated users
      },
      routes: [
        // PUBLIC
        GoRoute(path: '/', builder: (c, s) => const HomeScreen()),
        GoRoute(path: '/login', builder: (c, s) => const LoginScreen()),
        GoRoute(path: '/register', builder: (c, s) => const RegisterScreen()),
        GoRoute(path: '/pending-approval', builder: (c, s) => const PendingApprovalScreen()),
        GoRoute(path: '/search', builder: (c, s) => const SearchScreen()),
        GoRoute(path: '/search/results', builder: (c, s) => SearchResultsScreen(
          query: s.uri.queryParameters['q'] ?? '',
          city: s.uri.queryParameters['city'],
          category: s.uri.queryParameters['category'],
        )),
        GoRoute(path: '/business/:slug', builder: (c, s) => BusinessProfileScreen(
          slug: s.pathParameters['slug']!,
        )),

        // USER
        GoRoute(path: '/profile', builder: (c, s) => const UserProfileScreen()),
        GoRoute(path: '/saved', builder: (c, s) => const SavedScreen()),
        GoRoute(path: '/notifications', builder: (c, s) => const NotificationsScreen()),

        // VENDOR (shell with bottom nav)
        ShellRoute(
          builder: (context, state, child) => VendorShell(child: child),
          routes: [
            GoRoute(path: '/vendor/dashboard', builder: (c, s) => const VendorDashboardScreen()),
            GoRoute(path: '/vendor/leads', builder: (c, s) => const VendorLeadsScreen()),
            GoRoute(path: '/vendor/profile', builder: (c, s) => const VendorProfileEditorScreen()),
            GoRoute(path: '/vendor/analytics', builder: (c, s) => const VendorAnalyticsScreen()),
          ],
        ),

        // ADMIN
        GoRoute(path: '/admin', builder: (c, s) => const AdminRedirectScreen()),
      ],
    );
  });

  // Vendor shell with bottom navigation
  class VendorShell extends StatelessWidget {
    final Widget child;
    const VendorShell({super.key, required this.child});
    @override
    Widget build(BuildContext context) {
      final location = GoRouterState.of(context).matchedLocation;
      int currentIndex = 0;
      if (location.startsWith('/vendor/leads')) currentIndex = 1;
      if (location.startsWith('/vendor/analytics')) currentIndex = 2;
      if (location.startsWith('/vendor/profile')) currentIndex = 3;

      return Scaffold(
        body: child,
        bottomNavigationBar: NavigationBar(
          backgroundColor: const Color(0xFF0A1628),
          indicatorColor: const Color(0xFFCC0000),
          selectedIndex: currentIndex,
          onDestinationSelected: (i) {
            final routes = ['/vendor/dashboard', '/vendor/leads',
                           '/vendor/analytics', '/vendor/profile'];
            context.go(routes[i]);
          },
          destinations: const [
            NavigationDestination(icon: Icon(Icons.dashboard_outlined, color: Colors.white54),
              selectedIcon: Icon(Icons.dashboard, color: Colors.white), label: 'Dashboard'),
            NavigationDestination(icon: Icon(Icons.inbox_outlined, color: Colors.white54),
              selectedIcon: Icon(Icons.inbox, color: Colors.white), label: 'Leads'),
            NavigationDestination(icon: Icon(Icons.analytics_outlined, color: Colors.white54),
              selectedIcon: Icon(Icons.analytics, color: Colors.white), label: 'Analytics'),
            NavigationDestination(icon: Icon(Icons.person_outline, color: Colors.white54),
              selectedIcon: Icon(Icons.person, color: Colors.white), label: 'Profile'),
          ],
        ),
      );
    }
  }
  ```

B3. HomeScreen — implement completely:
    - Public: no auth needed
    - AppBar: S-Network logo (S and N in red) + search icon + notifications bell (if logged in)
    - Hero search bar: keyword input + city input + Search button (red)
    - Category grid: 3-column grid, 9 categories with emoji + name + tap to search
    - "Near Me" button: geolocator → calls get-nearby-businesses
    - Featured Vendors: horizontal scroll cards (from admin_overrides or top rated)
    - Top Rated: ListView of top 8 verified businesses
    - Each BusinessCard:
        - Cover image (CachedNetworkImage with placeholder)
        - Verified badge overlay (green chip bottom-left)
        - Business name (bold)
        - Category + city row
        - Star rating + review count
        - Three action buttons: 📞 Call | 💬 WhatsApp | 📋 Quote
        - Bookmark icon (heart, toggles saved state)
    - If not logged in: show "Login / Register" banner at bottom
      "Join S-Network to send enquiries and track your projects →"

B4. SearchResultsScreen — complete:
    - Receives query, city, category as params
    - Shows results from Supabase businesses table directly (no edge function needed for basic)
    - Filter FAB → FilterBottomSheet:
        Category chips (all 9), City TextField, Rating filter (stars), Verified toggle
    - Sort bottom sheet: Relevance | Rating | Distance | Newest
    - Paginated list (load more on scroll end, 20 per page)
    - Empty state: illustration + "No results found" + "Clear filters" button
    - Each result: BusinessCard widget (same as HomeScreen)

B5. BusinessProfileScreen — all sections:
    - PageView gallery (swipeable images, placeholder if none)
    - Header: name, verified badge, rating, open/closed status
    - Sticky bottom bar: 📞 Call | 💬 WhatsApp | 📋 Get Quote (red)
    - About section: description, year, employees, website link
    - Services: Wrap of chips
    - Working hours: Mon-Sun table
    - Location: Text address + "Open in Maps" button
    - Reviews: average + bar chart + individual review cards
    - Write review: modal (authenticated only)
    - Similar businesses: horizontal scroll

    Get Quote tap:
      If not logged in → show LoginPromptBottomSheet with "Try our app" banner
      If logged in → LeadFormBottomSheet:
        Project type dropdown, budget range, description, name (pre-filled), phone
        Submit → calls create-lead edge function
        On success: success SnackBar + close sheet

B6. LoginScreen — complete:
    - Email + password form
    - Validation: required, email format, min 8 chars
    - Login button (red, shows CircularProgressIndicator when loading)
    - Error messages: friendly, mapped (see fix below)
    - "Forgot password?" → resetPasswordForEmail
    - "Don't have an account? Register" → go('/register')
    - Google OAuth button
    - Phone OTP tab (if Twilio configured)
    - After login: router redirect handles navigation

B7. RegisterScreen — 3-step stepper for vendors, 1-step for users:
    Step 1 (all): name, email, password, confirm password, phone, role toggle
    Step 2 (vendor): business name, category dropdown (load from DB), address, city, state, description
    Step 3 (vendor): document upload (GST + MSME, at least one required)
    Submit → supabase.auth.signUp() → profile trigger fires → redirect by role

B8. VendorDashboardScreen — complete:
    AppBar: "Dashboard" + notification badge icon + logout icon
    Stats row (4 cards): Total Leads | New Today | Profile Views | Conversion %
    Verification banner (orange/green/red based on status)
    Profile completeness LinearProgressIndicator (0-100%)
    Recent leads list (last 5): tap → LeadDetailScreen
    Quick actions row: [Edit Profile] [View All Leads] [Analytics]

B9. VendorLeadsScreen — complete:
    TabBar: All | New (badge) | Contacted | Converted | Lost
    Each tab: ListView of LeadCard widgets
    LeadCard shows: project type emoji + type, budget, user name, time ago, status chip
    Tap → LeadDetailScreen
    LeadDetailScreen:
      Full project details
      User contact: name, phone (tap to call), city
      Status dropdown (update on change)
      Vendor notes TextField (auto-saves on blur)
      WhatsApp button: opens wa.me/91{phone}
    Pull to refresh on all tabs

B10. VendorProfileEditorScreen — tabbed:
    Tab 1: Basic Info (name, description, phone, whatsapp, website, city, state)
    Tab 2: Portfolio (image grid, add/remove, CachedNetworkImage)
    Tab 3: Services (chip input: type + add, removable chips)
    Tab 4: Materials (accordion of 7 groups, checkbox per item)
    Tab 5: Verification (status card + document upload form)
    Save FAB on each tab

B11. UserProfileScreen — complete:
    Avatar with initials circle (red background)
    Edit name/phone/city
    My Leads: list of submitted leads with status
    Saved: grid of saved businesses
    Settings: change password, notification preferences
    Logout button (red, bottom)

B12. NotificationsScreen:
    List of notifications, newest first
    Each: icon by type + title + body + time ago
    Tap: mark read + navigate
    "Mark all as read" button
    Empty state: "No notifications yet"

B13. Supabase Realtime for vendor:
    In VendorDashboardScreen initState():
    Subscribe to notifications table for current user_id
    On INSERT: show local notification + increment badge
    Unsubscribe in dispose()

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART C — FLUTTER BUILD FIX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

C1. android/app/build.gradle.kts — final correct version:
  ```kotlin
  android {
      namespace = "com.snetwork.app"
      compileSdk = 34

      defaultConfig {
          applicationId = "com.snetwork.app"
          minSdk = 21
          targetSdk = 34
          versionCode = 1
          versionName = "1.0.0"
          multiDexEnabled = true
      }

      buildTypes {
          release {
              isMinifyEnabled = false
              isShrinkResources = false
              signingConfig = signingConfigs.getByName("debug")
          }
          debug {
              isDebuggable = true
          }
      }

      compileOptions {
          sourceCompatibility = JavaVersion.VERSION_17
          targetCompatibility = JavaVersion.VERSION_17
      }

      kotlinOptions {
          jvmTarget = "17"
      }
  }

  dependencies {
      implementation("androidx.multidex:multidex:2.0.1")
      coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.0.4")
  }
  ```

C2. pubspec.yaml — clean dependencies:
  ```yaml
  name: s_network
  description: S-Network - Find. Verify. Build.
  version: 1.0.0+1

  environment:
    sdk: '>=3.0.0 <4.0.0'

  dependencies:
    flutter:
      sdk: flutter
    supabase_flutter: ^2.3.4
    flutter_riverpod: ^2.4.10
    riverpod: ^2.4.10
    go_router: ^13.2.1
    cached_network_image: ^3.3.1
    shared_preferences: ^2.2.3
    geolocator: ^11.0.0
    flutter_local_notifications: ^17.1.2
    image_picker: ^1.0.7
    url_launcher: ^6.2.6
    connectivity_plus: ^6.0.3
    intl: ^0.19.0
    shimmer: ^3.0.0
    flutter_rating_bar: ^4.0.1

  flutter:
    uses-material-design: true
    assets:
      - assets/images/
      - assets/icons/
  ```

C3. Run after all changes:
  flutter clean && flutter pub get
  flutter build apk --release --no-shrink
  adb install -r build/app/outputs/flutter-apk/app-release.apk

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART D — WEB APP FIXES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

D1. Fix ALL remaining .single() calls on profiles:
    Search: supabase.from('profiles').select(anything).single()
    Replace all with .maybeSingle()
    Add null check after each.

D2. Fix business-profile.component.ts (500 on create-lead):
    The edge function is deployed but the Angular call may have wrong headers.
    Ensure the call passes the auth token:
    
    const { data, error } = await this.supabase.client.functions.invoke('create-lead', {
      body: {
        business_id: this.business.id,
        project_type: form.projectType,
        message: form.description,
        budget_min: form.budgetMin,
        budget_max: form.budgetMax,
        user_name: this.currentUser?.name,
        user_phone: this.currentUser?.phone,
        user_city: form.city
      }
    });
    
    The client.functions.invoke() automatically adds the Authorization header.
    Do NOT manually add headers — supabase-js handles this.

D3. Fix category dropdown in registration (if still broken):
    In vendor onboarding step 2, load categories on component init:
    
    async loadCategories() {
      const { data, error } = await this.supabase.client
        .from('categories')
        .select('id, name, slug, icon')
        .order('name');
      if (!error && data) this.categories = data;
    }
    
    In HTML: ensure *ngFor uses categories array, not a hardcoded list.

D4. Fix vendor profile image upload:
    Ensure bucket name is exactly 's-network-media' (lowercase, hyphenated).
    Ensure upload path: `businesses/${businessId}/portfolio/${uuid}.${ext}`
    
    After upload, insert URL into business_images table:
    const { data } = await supabase.storage
      .from('s-network-media')
      .upload(path, file);
    const url = supabase.storage.from('s-network-media').getPublicUrl(path).data.publicUrl;
    await supabase.from('business_images').insert({ business_id, image_url: url });

D5. Fix vendor verification documents upload:
    In vendor profile editor, verification tab:
    Upload file → get URL → call submit-verification edge function with URLs.
    
    The submit-verification function MUST receive URLs (not files).
    Upload files first to storage, then pass URLs to the edge function.

D6. Fix admin verifications page (400 error):
    Use the two-step query from Prompt 18 Section 4.
    Do NOT use PostgREST nested profiles:owner_id alias.

D7. Fix admin rankings page (403 error):
    Ensure the upsert includes category_id: null when not category-specific:
    await supabase.from('admin_overrides').upsert({
      business_id: id,
      override_type: 'homepage_featured',
      category_id: null,          // REQUIRED — part of unique constraint
      position_order: position,
      is_active: true,
      created_by: currentUserId
    }, { onConflict: 'business_id,override_type,category_id' });

D8. Fix logout in all sidebars:
    Centralize in AuthService.logout():
    await this.supabase.client.auth.signOut({ scope: 'local' });
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';

D9. Fix navbar — login/register visible to unauthenticated users on ALL pages.

D10. Fix search results page — ensure URL params sync with filters:
    When filter changes → update URL → results reload.
    Browser back button → restores previous filter state.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART E — BACKEND AUDIT + FIXES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

E1. Redeploy ALL edge functions with CORS headers:
    Every edge function MUST start with:
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PATCH, DELETE',
    };
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    
    Functions missing CORS: search-businesses, get-homepage-data, get-nearby-businesses,
    get-vendor-analytics, update-lead-status, submit-verification, review-verification.
    Add to ALL of them.

E2. Fix search-businesses edge function:
    Must handle empty/missing params gracefully:
    - Empty query → return all verified businesses for the city
    - Missing city → return by rating DESC, no geo filter
    - Invalid category_id → ignore filter, return all
    - Always return: id, name, category_id, city, rating, total_reviews,
      is_verified, is_premium, verification_status, cover_image_url, phone, whatsapp
    - join category name: .select('*, categories(name, icon, slug)')

E3. Fix get-vendor-analytics:
    Must return 0 (not null) for every numeric field:
    {
      total_leads: Number(data?.total ?? 0),
      new_leads: Number(data?.new_count ?? 0),
      contacted_leads: Number(data?.contacted_count ?? 0),
      converted_leads: Number(data?.converted_count ?? 0),
      conversion_rate: Number(data?.total) > 0 
        ? Math.round((Number(data?.converted_count ?? 0) / Number(data?.total)) * 100) 
        : 0,
      total_views: Number(data?.views ?? 0),
    }

E4. Redeploy all functions:
    supabase functions deploy create-lead
    supabase functions deploy update-lead-status
    supabase functions deploy search-businesses
    supabase functions deploy get-homepage-data
    supabase functions deploy get-vendor-analytics
    supabase functions deploy approve-vendor-registration
    supabase functions deploy reject-vendor-registration
    supabase functions deploy submit-verification
    supabase functions deploy review-verification
    supabase functions deploy increment-view-count
    supabase functions deploy get-nearby-businesses

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART F — NEW FEATURES (non-breaking enhancements)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

F1. USER: "Compare Businesses" (Web + Mobile)
    User selects up to 3 businesses (checkbox on card)
    Floating compare bar appears: "Compare (N) →"
    Compare page: side-by-side table:
      Rating | Reviews | Category | City | Services count | Verified | Response rate
    Mobile: horizontal scroll table
    Web: fixed 3-column table

F2. USER: Recently Viewed (Web + Mobile)
    Store last 5 viewed business IDs in localStorage/SharedPreferences
    Show "Recently Viewed" section on HomeScreen if history exists
    Each card: same BusinessCard component

F3. VENDOR: Quick Reply Templates
    In VendorLeadsScreen, when opening a lead:
    "Quick Reply" button shows 4 preset message templates:
      "Thank you for your enquiry! I'll contact you within 24 hours."
      "I've reviewed your project. Can we schedule a call to discuss details?"
      "I'm available to visit your site this week. Please share your address."
      "Your project is within my service area. Here's my rough estimate: ₹___"
    Tapping a template copies it to the vendor notes field.

F4. VENDOR: Response Time Badge
    Calculate avg response time from leads data:
    avg_response_hours = AVG(contacted_at - created_at) WHERE status != 'new'
    Show on vendor public profile: "⚡ Usually responds in Xh"
    Update via calculate-vendor-metrics edge function.

F5. USER: Enquiry Status Tracker (Mobile)
    In UserProfileScreen, "My Enquiries" tab:
    Timeline view of each lead submitted:
      Submitted → Vendor Viewed → Contacted → Confirmed
    Progress indicator (stepper) showing current status
    Shows vendor name, project type, date

F6. WEB: "Top Vendors This Week" Widget
    On homepage, below featured vendors:
    Query: businesses with most leads in last 7 days, limit 4
    Show as highlighted card row with "🔥 Trending" badge

F7. VENDOR: Portfolio Showcase (enhanced)
    In VendorProfileEditorScreen, portfolio tab:
    - Tag each image by work type: Exterior | Interior | Kitchen | Bathroom | Commercial
    - Reorder images via drag
    - Set a "Featured" image (shown as cover in search cards)
    On BusinessProfileScreen: gallery filtered by tag tabs

F8. "Mobile App Banner" on Web
    Show dismissible banner in web app (once per session):
    "📱 Get instant lead notifications on the S-Network app! [Download →]"
    Appears at top of page, slides down, can be closed.
    Store dismissal in sessionStorage.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART G — PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

G1. All Supabase queries must have .limit() — never unbounded.
G2. BusinessCard image: use Supabase CDN transform for thumbnails:
    ?width=400&height=280&resize=cover appended to storage URLs
G3. Angular: verify all modules are lazy-loaded (loadChildren)
G4. Flutter: all lists use ListView.builder (never ListView with children)
G5. Flutter: all images use CachedNetworkImage with shimmer placeholder
G6. Debounce search input: 350ms on both platforms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART H — FINAL VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After all changes, run:
  ng build --configuration production (zero errors)
  flutter clean && flutter build apk --release --no-shrink (zero errors)

Test every flow:

ANONYMOUS:
[ ] Open web → home page (not login)
[ ] Open Flutter app → home screen visible
[ ] Search "contractor" → results load on both platforms
[ ] Open business profile → all sections render

AUTH:
[ ] Register user (email+password) → /home with navbar
[ ] Register vendor (3 steps + docs) → /pending-approval
[ ] Login → correct redirect by role
[ ] Login modal on "Get Quote" when not logged in
[ ] Google OAuth → works on web
[ ] Logout from every sidebar → home page

VENDOR:
[ ] Vendor dashboard stats (no NaN, no null)
[ ] Leads inbox tabs all load
[ ] Lead detail shows user name + phone
[ ] Update status → user gets notification
[ ] Portfolio upload → no "bucket not found"
[ ] Verification doc upload → shows in admin

ADMIN:
[ ] Pending vendors list loads
[ ] Documents visible (PDF/image rendered)
[ ] Approve vendor → email sent
[ ] Rankings page → add to featured → no 403
[ ] Lead monitoring → full user details visible

UI:
[ ] S and N are crimson #CC0000 everywhere
[ ] Navbar background is deep navy #0A1628
[ ] Primary buttons are crimson red
[ ] No orange left anywhere

FLUTTER SPECIFIC:
[ ] APK installs and opens on Samsung
[ ] Navigation between all screens works
[ ] Bottom nav highlights correct tab
[ ] Back button works everywhere
[ ] All forms validate and submit
[ ] Realtime notifications work
```
