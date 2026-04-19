# S-Network — FINAL COMPLETION PROMPT
## Fix everything + complete all features in one pass

> Paste memory_v6.md before this. Run FINAL_FIX.sql in Supabase Studio first.

---

```
Read memory_v6.md. You are fixing and completing the S-Network app.
The SQL fixes are already applied in Supabase. Now fix the code.

Work through every section. No TODOs. No stubs. Complete working code only.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1 — FIX SUPABASE SERVICE (supabase.service.ts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Replace the entire Supabase client initialization with:

  export const supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
    {
      auth: {
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 's-network-auth-token',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        lock: (...args: any[]) => {
          const cb = args.find((a: any) => typeof a === 'function');
          return cb ? cb() : Promise.resolve();
        }
      }
    }
  );

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2 — FIX callback.component.ts (406 login loop)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Replace entire component with:

  @Component({ selector: 'app-callback',
    template: `<div class="flex items-center justify-center h-screen">
      <div class="text-center"><div class="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="text-gray-600">Setting up your account...</p></div></div>` })
  export class CallbackComponent implements OnInit {
    constructor(private router: Router, private supabase: SupabaseService) {}
    async ngOnInit() {
      try {
        const { data: { session } } = await this.supabase.client.auth.getSession();
        if (!session) { this.router.navigate(['/auth/login']); return; }
        const profile = await this.getProfileWithRetry(session.user.id);
        if (!profile) {
          await this.supabase.client.from('profiles').upsert({
            id: session.user.id, name: session.user.email?.split('@')[0] || 'User',
            phone: '', role: 'user', avatar_url: ''
          }, { onConflict: 'id' });
          this.router.navigate(['/home']); return;
        }
        const routes: Record<string,string> = {
          admin: '/admin', vendor: '/vendor/dashboard',
          pending_vendor: '/auth/pending-approval', user: '/home'
        };
        this.router.navigate([routes[profile.role] || '/home']);
      } catch { this.router.navigate(['/auth/login']); }
    }
    private async getProfileWithRetry(uid: string, tries = 5): Promise<any> {
      for (let i = 1; i <= tries; i++) {
        const { data } = await this.supabase.client.from('profiles')
          .select('*').eq('id', uid).maybeSingle();
        if (data) return data;
        if (i < tries) await new Promise(r => setTimeout(r, 500 * i));
      }
      return null;
    }
  }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3 — FIX EVERY .single() CALL ON profiles TABLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Search entire codebase for: .from('profiles').select(anything).single()
Replace every occurrence with .maybeSingle()
After each: add null check — if (!data) handle gracefully, do not crash.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4 — FIX REGISTRATION FORM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In register.component.ts, the form MUST include these controls:
  name: [required, minLength(2)]
  email: [required, email]
  password: [required, minLength(8)]
  confirmPassword: [required]
  phone: [required, pattern /^[6-9]\d{9}$/]
  role: [required] — values: 'user' | 'vendor'

Add cross-validator: passwords must match.

For role='vendor', show Step 2 (business details) and Step 3 (documents).
For role='user', submit directly after Step 1.

The signUp call must be:
  supabase.auth.signUp({
    email, password,
    options: { data: { full_name: name, phone, role } }
  })
Do NOT manually insert into profiles — trigger handles it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5 — FIX verifications.component.ts (400 error)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The query `profiles:owner_id(full_name,phone)` is wrong — PostgREST cannot
resolve this alias. Fix the query to use a two-step approach:

Step 1: fetch verifications with businesses join:
  supabase.from('vendor_verifications')
    .select('*, businesses(id, name, city, owner_id)')
    .order('submitted_at', { ascending: false })

Step 2: for each result, separately fetch the owner profile:
  supabase.from('profiles').select('name, phone').eq('id', business.owner_id).maybeSingle()

OR use a flat query without the nested profiles alias:
  supabase.from('vendor_verifications')
    .select(`
      *,
      businesses!inner(id, name, city, owner_id)
    `)
    .order('submitted_at', { ascending: false })

Then fetch profiles separately in the component for each owner_id.
This removes the 400 error completely.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6 — FIX admin-rankings.component.ts (403 error)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The 403 on admin_overrides upsert means the admin RLS policy wasn't applying.
SQL is already fixed. Now verify the Angular call is correct:

The upsert must include onConflict parameter:
  supabase.from('admin_overrides').upsert(overrideData, {
    onConflict: 'business_id,override_type,category_id'
  })

Where overrideData must have ALL three conflict columns present, even if null:
  { business_id: id, override_type: type, category_id: null,
    position_order: pos, is_active: true, created_by: currentUserId }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 7 — FIX create-lead edge function (400 error)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Open supabase/functions/create-lead/index.ts.
The 400 means either:
  a) Required field validation is rejecting the request, OR
  b) The business_id doesn't exist in the businesses table

Fix the function to:
  1. Accept: { business_id, project_type, message, budget_min?, budget_max?, timeline? }
  2. Validate only business_id and project_type are required. Rest optional.
  3. Get user from auth (if authenticated) or use null for anonymous
  4. Insert into leads table
  5. Increment businesses.total_leads using:
     UPDATE businesses SET total_leads = COALESCE(total_leads,0)+1 WHERE id=business_id
  6. Return 200 { success: true, lead_id: data.id }
  7. Return 400 only if business_id or project_type missing
  8. Return 500 with error message for all other errors

Redeploy: supabase functions deploy create-lead

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 8 — FIX NAVIGATION (no navbar after login)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The app must have two layout shells:

PUBLIC LAYOUT — no auth needed:
  Routes: /, /auth/login, /auth/register, /auth/callback, /auth/pending-approval
  Has: minimal header with logo + login/register buttons only

AUTH LAYOUT — requires login:
  Routes: /home, /search, /business/:slug, /profile, /saved
  Routes: /vendor/*, /admin/*
  Has: full sticky navbar with:
    Left: S-Network logo
    Center: search bar (keyword + city)
    Right: notifications bell + user avatar dropdown

The user dropdown shows by role:
  user: Profile | Saved | My Leads | Logout
  vendor: Dashboard | Leads | Profile | Analytics | Logout
  pending_vendor: Pending Approval | Logout
  admin: Admin Panel | Logout

After login, app MUST show the navbar. It should never be invisible.
The AppComponent must render the appropriate layout based on the current route.

In app.component.ts:
  isPublicRoute = computed(() => {
    const url = this.router.url;
    return url.startsWith('/auth') || url === '/';
  });

In app.component.html:
  <app-public-navbar *ngIf="isPublicRoute()"></app-public-navbar>
  <app-auth-navbar *ngIf="!isPublicRoute() && isLoggedIn()"></app-auth-navbar>
  <router-outlet></router-outlet>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 9 — FIX ROUTE GUARDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AuthGuard: checks session exists. If not → /auth/login
  Also: if role=pending_vendor → /auth/pending-approval

VendorGuard extends AuthGuard:
  Allows role: vendor OR admin
  Blocks pending_vendor → /auth/pending-approval
  Blocks user → /home

AdminGuard:
  Allows role: admin only
  Others → /home

PendingVendorGuard:
  Allows role: pending_vendor only
  vendor → /vendor/dashboard
  user → /home
  admin → /admin

Guards read role from profiles table via maybeSingle() — never from localStorage.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 10 — CREATE PENDING APPROVAL PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create src/app/modules/auth/pending-approval/pending-approval.component.ts

Shows:
  - Large orange clock icon (pulsing animation)
  - "Account Under Review" heading (Syne font)
  - "Your registration was successful. Our admin team is reviewing your
    documents. You will be notified once approved (1–2 business days)."
  - Contact support link
  - Logout button (signOut → navigate to /auth/login)

Protected by PendingVendorGuard.
If approved vendor visits this URL → redirect to /vendor/dashboard.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 11 — FIX PROFILE EDITOR STORAGE UPLOAD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In profile-editor.component.ts, the upload uses wrong bucket name.
Fix to use bucket: 's-network-media' (created by FINAL_FIX.sql)

Upload path must be: businesses/{businessId}/portfolio/{uuid}.{ext}

Before upload:
  const allowedTypes = ['image/jpeg','image/png','image/webp','application/pdf'];
  if (!allowedTypes.includes(file.type)) { show error; return; }
  if (file.size > 5*1024*1024) { show error "Max 5MB"; return; }
  const ext = file.name.split('.').pop();
  const path = `businesses/${businessId}/portfolio/${crypto.randomUUID()}.${ext}`;

Upload call:
  const { data, error } = await supabase.storage
    .from('s-network-media')
    .upload(path, file, { upsert: false });
  if (error) { show error message; return; }
  const url = supabase.storage.from('s-network-media').getPublicUrl(path).data.publicUrl;

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 12 — FIX FLUTTER AUTH TO MATCH WEB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In lib/main.dart, initialize Supabase:
  await Supabase.initialize(
    url: const String.fromEnvironment('SUPABASE_URL'),
    anonKey: const String.fromEnvironment('SUPABASE_ANON_KEY'),
    authOptions: const FlutterAuthClientOptions(
      authFlowType: AuthFlowType.pkce,
      autoRefreshToken: true,
    ),
  );

In router.dart, auth state listener:
  ref.listen(authStateProvider, (_, state) {
    final role = ref.read(profileProvider).asData?.value?.role;
    if (state.value?.event == AuthChangeEvent.signedIn) {
      switch(role) {
        case 'admin': context.go('/admin-redirect'); break;
        case 'vendor': context.go('/vendor/dashboard'); break;
        case 'pending_vendor': context.go('/pending-approval'); break;
        default: context.go('/home');
      }
    }
    if (state.value?.event == AuthChangeEvent.signedOut) context.go('/login');
  });

Profile fetch: use maybeSingle() not single(). Add retry logic same as web.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 13 — PRODUCTION BUILD + DEPLOY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After all fixes:

1. Run: ng build --configuration production
   Fix ALL TypeScript errors before deploying.

2. Run: npm run build:ssr
   Confirm: dist/s-network-web/server/server.mjs exists

3. On VPS:
   cd /var/www/s-network && git pull origin main
   cd s-network-web && npm ci && npm run build:ssr
   pm2 reload ecosystem.config.js --update-env
   curl http://localhost:4000/health  → must return { status: 'ok' }

4. Update Supabase Auth → URL Configuration:
   Site URL: https://yourdomain.com
   Redirect URLs:
     https://yourdomain.com/auth/callback
     http://localhost:4200/auth/callback

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANUAL CHECKS AFTER ALL FIXES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Register as user — password field visible — no 406 after registration
[ ] Login as user — navbar visible — home page loads
[ ] Register as vendor — 3-step form — category dropdown loads all 9
[ ] After vendor registration — pending approval screen shown
[ ] Admin login — /admin dashboard loads — no 403 on rankings page
[ ] Admin rankings — add vendor to featured — saves without error
[ ] Admin verifications — pending vendor visible — approve works
[ ] Vendor login after approval — /vendor/dashboard loads
[ ] Vendor profile — upload image — no "Bucket not found" error
[ ] Business profile — "Get Quote" — no 400 on create-lead
[ ] Flutter: login → correct screen by role → no crashes
```
