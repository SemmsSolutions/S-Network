# S-Network — PROMPT 18 (FINAL FIX — DEPLOY READY)
## Senior debugger pass — fix all remaining issues
## Run DB_FIX_V3.sql in Supabase FIRST, then use this prompt with Opus

> Paste memory_v6.md before this prompt.
> DB_FIX_V3.sql has already been run in Supabase Studio.
> No stubs. No TODOs. Complete working code only.

---

```
Read memory_v6.md. Fix every issue below completely. Work section by section.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 1 — create-lead Edge Function (500 error)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The 500 is caused by the edge function using SUPABASE_SERVICE_ROLE_KEY
which may not be set as a secret, and by calling an RPC that didn't exist
(now fixed in DB). Rewrite supabase/functions/create-lead/index.ts:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Use service role for all DB ops (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get calling user (optional)
    let userId: string | null = null;
    let userEmail: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      if (user) {
        userId = user.id;
        userEmail = user.email ?? null;
      }
    }

    // Parse body
    const body = await req.json().catch(() => ({}));
    const {
      business_id, project_type, message,
      budget_min, budget_max, timeline,
      user_name, user_phone, user_city
    } = body;

    if (!business_id) {
      return new Response(JSON.stringify({ error: 'business_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (!project_type) {
      return new Response(JSON.stringify({ error: 'project_type required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify business exists
    const { data: business, error: bizError } = await supabaseAdmin
      .from('businesses')
      .select('id, name, owner_id')
      .eq('id', business_id)
      .maybeSingle();

    if (bizError || !business) {
      return new Response(JSON.stringify({ error: 'Business not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Insert lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .insert({
        business_id,
        user_id: userId,
        user_name: user_name ?? null,
        user_phone: user_phone ?? null,
        user_email: userEmail,
        user_city: user_city ?? null,
        project_type,
        message: message ?? null,
        budget_min: budget_min ? Number(budget_min) : null,
        budget_max: budget_max ? Number(budget_max) : null,
        timeline: timeline ?? null,
        status: 'new',
        type: 'enquiry',
      })
      .select()
      .single();

    if (leadError) throw new Error(leadError.message);

    // Increment leads counter
    await supabaseAdmin.rpc('increment_business_leads', {
      business_id_param: business_id
    });

    // Notify vendor
    if (business.owner_id) {
      await supabaseAdmin.from('notifications').insert({
        user_id: business.owner_id,
        title: '🔔 New Lead Received',
        body: `${user_name ?? 'A user'} enquired about ${project_type} for "${business.name}"`,
        type: 'new_lead',
        ref_id: lead.id,
        is_read: false,
      });
    }

    // Send confirmation email to user (if Resend configured)
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey && userEmail) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'S-Network <noreply@snetwork.app>',
          to: [userEmail],
          subject: `Your enquiry has been sent to ${business.name}`,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#1A1A2E;padding:16px 24px;border-radius:8px 8px 0 0">
              <h2 style="color:#fff;margin:0"><span style="color:#E85D26">S</span>-<span style="color:#E85D26">N</span>etwork</h2>
            </div>
            <div style="padding:24px;border:1px solid #eee;background:#fff">
              <h3>Your enquiry was sent! ✅</h3>
              <p>Hi ${user_name ?? 'there'},</p>
              <p>Your <strong>${project_type}</strong> enquiry has been sent to <strong>${business.name}</strong>.</p>
              <p>They will contact you within 24 hours. You can track your enquiry status by logging into your account.</p>
            </div>
          </div>`
        })
      });
    }

    return new Response(JSON.stringify({ success: true, lead_id: lead.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('create-lead error:', err);
    return new Response(JSON.stringify({ error: err?.message ?? 'Server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

After writing the file: supabase functions deploy create-lead

Also set the service role secret if not set:
  supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  (Get this from Supabase Dashboard → Settings → API → service_role key)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 2 — update-lead-status: send notification + email
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In supabase/functions/update-lead-status/index.ts, after updating the lead
status in the DB, add this code:

  // Get full lead details for notification
  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select('*, businesses!inner(name, owner_id)')
    .eq('id', lead_id)
    .single();

  const statusMessages: Record<string, { title: string; body: string; subject: string }> = {
    contacted: {
      title: '✅ Vendor has responded!',
      body: `${lead.businesses.name} has contacted you about your ${lead.project_type} request.`,
      subject: `${lead.businesses.name} responded to your S-Network enquiry`
    },
    converted: {
      title: '🎉 Your project is confirmed!',
      body: `${lead.businesses.name} has accepted your ${lead.project_type} project.`,
      subject: `Your project with ${lead.businesses.name} is confirmed!`
    },
    lost: {
      title: '📋 Enquiry status updated',
      body: `Your enquiry with ${lead.businesses.name} has been closed.`,
      subject: `Update on your S-Network enquiry`
    }
  };

  const msg = statusMessages[newStatus];
  if (msg && lead.user_id) {
    // In-app notification
    await supabaseAdmin.from('notifications').insert({
      user_id: lead.user_id,
      title: msg.title,
      body: msg.body,
      type: 'lead_status_update',
      ref_id: lead.id,
      is_read: false
    });

    // Email (if user has email)
    if (lead.user_email) {
      const resendKey = Deno.env.get('RESEND_API_KEY');
      if (resendKey) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'S-Network <noreply@snetwork.app>',
            to: [lead.user_email],
            subject: msg.subject,
            html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <div style="background:#1A1A2E;padding:16px 24px;border-radius:8px 8px 0 0">
                <h2 style="color:#fff;margin:0"><span style="color:#E85D26">S</span>-<span style="color:#E85D26">N</span>etwork</h2>
              </div>
              <div style="padding:24px;border:1px solid #eee">
                <h3>${msg.title}</h3>
                <p>${msg.body}</p>
                <p style="color:#888;font-size:13px">Project: ${lead.project_type} | Budget: ₹${lead.budget_min ?? '?'}–₹${lead.budget_max ?? '?'}</p>
              </div>
            </div>`
          })
        });
      }
    }
  }

Deploy: supabase functions deploy update-lead-status

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 3 — ADMIN LEAD MONITORING (full user details)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In src/app/modules/admin/leads/admin-leads.component.ts,
replace the leads query with:

  const { data: leads } = await this.supabase.client
    .from('leads')
    .select(`
      id, project_type, message, budget_min, budget_max, timeline,
      status, type, created_at, admin_note,
      user_id, user_name, user_phone, user_email, user_city,
      businesses!inner(id, name, city, owner_id,
        profiles:owner_id(name, phone)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100);

The leads table now has user_name, user_phone, user_email, user_city columns
(added by DB_FIX_V3.sql). Display them in the admin leads table.

Admin lead detail modal must show ALL of these fields:
  LEAD INFO:
    Project Type | Budget Range | Description | Timeline | Date & Time | Lead ID

  CUSTOMER DETAILS (full section):
    Name: lead.user_name OR profile lookup by user_id
    Phone: lead.user_phone (clickable tel: link)
    Email: lead.user_email (clickable mailto: link)  
    City: lead.user_city
    Account: lead.user_id ? "Registered user" : "Anonymous enquiry"

  VENDOR DETAILS:
    Business Name | Owner Name | Owner Phone | City

  ACTIONS:
    Status update dropdown
    Admin note textarea (auto-saves on blur via UPDATE leads SET admin_note=?)
    [Call User] button — tel:{phone}
    [Email User] button — mailto:{email}

In admin-leads.component.html, the table row shows:
  Vendor | Customer Name | Customer Phone | Project | Budget | City | Status | Date | [View]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 4 — VERIFICATION DOCUMENTS IN ADMIN (Image 2 fix)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Image 2 shows "No verification record" — this is because either:
a) The vendor never submitted documents (skipped the step), OR
b) The verifications.component query can't find the record

Fix the admin verifications component to handle both cases:

In admin/verifications/verifications.component.ts:

  // Load all businesses with pending status, even without verification records
  async loadData() {
    // Get ALL pending_vendor profile users
    const { data: pendingProfiles } = await this.supabase.client
      .from('profiles')
      .select('id, name, phone')
      .eq('role', 'pending_vendor');

    // Get their businesses
    const pendingIds = pendingProfiles?.map(p => p.id) ?? [];
    
    const { data: businesses } = await this.supabase.client
      .from('businesses')
      .select('id, name, city, owner_id, created_at')
      .in('owner_id', pendingIds.length ? pendingIds : ['no-match']);

    // Get verifications for those businesses
    const bizIds = businesses?.map(b => b.id) ?? [];
    const { data: verifications } = await this.supabase.client
      .from('vendor_verifications')
      .select('*')
      .in('business_id', bizIds.length ? bizIds : ['no-match']);

    const verifMap: Record<string, any> = {};
    verifications?.forEach(v => verifMap[v.business_id] = v);
    const profileMap: Record<string, any> = {};
    pendingProfiles?.forEach(p => profileMap[p.id] = p);

    // Combine into display list
    this.pendingVendors = (businesses ?? []).map(biz => ({
      business: biz,
      owner: profileMap[biz.owner_id],
      verification: verifMap[biz.id] ?? null  // null means no docs submitted
    }));
  }

In the admin vendor detail drawer, for the DOCUMENTS section:

  <div *ngIf="selectedVendor.verification; else noDocs">
    <!-- GST -->
    <div *ngIf="selectedVendor.verification.gst_number">
      <p><strong>GST Number:</strong> {{selectedVendor.verification.gst_number}}
        <a href="https://www.gstn.gov.in" target="_blank">Verify ↗</a>
      </p>
      <ng-container *ngIf="selectedVendor.verification.gst_certificate_url">
        <img *ngIf="isImage(selectedVendor.verification.gst_certificate_url)"
             [src]="selectedVendor.verification.gst_certificate_url"
             class="max-w-full rounded border mt-2">
        <iframe *ngIf="!isImage(selectedVendor.verification.gst_certificate_url)"
                [src]="sanitize(selectedVendor.verification.gst_certificate_url)"
                width="100%" height="400" class="border rounded mt-2"></iframe>
        <a [href]="selectedVendor.verification.gst_certificate_url" target="_blank"
           class="text-blue-600 text-sm block mt-1">Open document in new tab ↗</a>
      </ng-container>
    </div>

    <!-- MSME same structure -->
    <div *ngIf="selectedVendor.verification.msme_number" class="mt-4">
      <p><strong>MSME/Udyam:</strong> {{selectedVendor.verification.msme_number}}
        <a href="https://udyamregistration.gov.in" target="_blank">Verify ↗</a>
      </p>
      <!-- same image/iframe pattern -->
    </div>
  </div>
  <ng-template #noDocs>
    <div class="bg-yellow-50 border border-yellow-200 rounded p-3">
      <p class="text-yellow-800 text-sm">⚠️ This vendor has not submitted verification documents.
        You can still approve their account or ask them to submit documents first.</p>
    </div>
  </ng-template>

isImage(url: string): boolean {
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(url ?? '');
}
sanitize(url: string) {
  return this.domSanitizer.bypassSecurityTrustResourceUrl(url);
}
Inject DomSanitizer in constructor.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 5 — HOME PAGE: Login Button for Existing Users
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In home.component.ts:
  Show login/register buttons only when user is NOT logged in.
  When logged in: show user avatar + name instead.

In home.component.html, at the top of the hero section or in the main navbar:

  <!-- Public navbar (shown when not logged in) -->
  <nav class="bg-[#1A1A2E] sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
    <span class="text-xl font-bold font-[Syne]">
      <span class="text-[#E85D26]">S</span>-<span class="text-[#E85D26]">N</span>etwork
    </span>
    
    <!-- Search bar (center) -->
    <div class="flex-1 max-w-lg mx-8 hidden md:flex">
      <input type="text" placeholder="Search contractors, architects..."
             class="w-full rounded-l-xl px-4 py-2 text-sm bg-white border-0 outline-none">
      <button class="bg-[#E85D26] text-white px-4 rounded-r-xl text-sm">Search</button>
    </div>

    <!-- Right side — role-based -->
    <div class="flex items-center gap-3">
      <ng-container *ngIf="!currentUser; else loggedIn">
        <a routerLink="/auth/login"
           class="text-white text-sm border border-white/30 px-4 py-2 rounded-xl hover:bg-white/10 transition">
          Login
        </a>
        <a routerLink="/auth/register"
           class="bg-[#E85D26] text-white text-sm px-4 py-2 rounded-xl hover:bg-orange-600 transition">
          Register Free
        </a>
      </ng-container>
      <ng-template #loggedIn>
        <!-- Notification bell -->
        <app-notification-bell></app-notification-bell>
        <!-- User avatar dropdown -->
        <div class="relative" (clickOutside)="showUserMenu = false">
          <button (click)="showUserMenu = !showUserMenu"
                  class="flex items-center gap-2 text-white hover:text-orange-400">
            <div class="w-8 h-8 rounded-full bg-[#E85D26] flex items-center justify-center text-sm font-bold">
              {{currentUser.name?.charAt(0) | uppercase}}
            </div>
            <span class="text-sm hidden md:block">{{currentUser.name}}</span>
          </button>
          <div *ngIf="showUserMenu" 
               class="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border py-2 z-50">
            <ng-container [ngSwitch]="currentUser.role">
              <ng-container *ngSwitchCase="'admin'">
                <a routerLink="/admin" class="menu-item">🏠 Admin Panel</a>
              </ng-container>
              <ng-container *ngSwitchCase="'vendor'">
                <a routerLink="/vendor/dashboard" class="menu-item">📊 Dashboard</a>
                <a routerLink="/vendor/leads" class="menu-item">📋 My Leads</a>
                <a routerLink="/vendor/profile" class="menu-item">⚙️ Profile</a>
              </ng-container>
              <ng-container *ngSwitchDefault>
                <a routerLink="/profile" class="menu-item">👤 My Profile</a>
                <a routerLink="/saved" class="menu-item">❤️ Saved</a>
              </ng-container>
            </ng-container>
            <hr class="my-1">
            <button (click)="authService.logout()" class="menu-item w-full text-left text-red-500">
              🚪 Logout
            </button>
          </div>
        </div>
      </ng-template>
    </div>
  </nav>

Add to global styles.scss:
  .menu-item {
    @apply block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 cursor-pointer;
  }

In home.component.ts:
  currentUser: any = null;
  showUserMenu = false;
  
  ngOnInit() {
    this.supabase.client.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        const { data } = await this.supabase.client
          .from('profiles').select('*').eq('id', session.user.id).maybeSingle();
        this.currentUser = data;
      } else {
        this.currentUser = null;
      }
    });
  }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 6 — REGISTRATION & LOGIN FIXES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6a. Registration: ensure password field exists and signUp is called correctly.
    In register.component.ts, the signUp call MUST be:

    const { data, error } = await this.supabase.client.auth.signUp({
      email: this.form.get('email')!.value.trim().toLowerCase(),
      password: this.form.get('password')!.value,
      options: {
        data: {
          full_name: this.form.get('name')!.value.trim(),
          phone: this.form.get('phone')!.value.trim(),
          role: this.form.get('role')!.value  // 'user' or 'vendor'
        }
      }
    });

    if (error) {
      // Show friendly error messages
      const errorMessages: Record<string, string> = {
        'User already registered': 'An account with this email already exists. Please login.',
        'Password should be at least 6 characters': 'Password must be at least 8 characters.',
        'Invalid email': 'Please enter a valid email address.',
      };
      this.errorMessage = errorMessages[error.message] ?? error.message;
      return;
    }

    // Success: since email confirm is OFF, user is auto-logged in
    // Check if session exists immediately
    const { data: { session } } = await this.supabase.client.auth.getSession();
    if (session) {
      // Route based on role
      if (this.form.get('role')!.value === 'vendor') {
        this.router.navigate(['/auth/pending-approval']);
      } else {
        this.router.navigate(['/home']);
      }
    } else {
      // Email confirmation is ON — show "check email" message
      this.showEmailSentMessage = true;
    }

6b. Login page — add "Forgot password?" flow:
    In login.component.ts:
    
    async forgotPassword() {
      const email = this.loginForm.get('email')!.value;
      if (!email) { this.error = 'Enter your email first'; return; }
      const { error } = await this.supabase.client.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth/reset-password'
      });
      if (error) { this.error = error.message; return; }
      this.message = 'Password reset email sent! Check your inbox.';
    }

6c. Login error handling — map Supabase errors to friendly messages:
    const friendlyErrors: Record<string, string> = {
      'Invalid login credentials': '❌ Incorrect email or password.',
      'Email not confirmed': '📧 Please verify your email first.',
      'Too many requests': '⏳ Too many attempts. Please wait a moment.',
    };

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 7 — UI OVERHAUL (Web + Mobile)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Apply these changes to EVERY page:

ANGULAR — global styles.scss additions:
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  :root {
    --primary: #E85D26;
    --secondary: #1A1A2E;
    --surface: #F8F5F0;
    --success: #22C55E;
    --card-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }

  body { background: var(--surface); font-family: 'DM Sans', sans-serif; }
  h1,h2,h3 { font-family: 'Syne', sans-serif; color: var(--secondary); }

  .btn-primary {
    background: var(--primary); color: white; border: none;
    padding: 10px 24px; border-radius: 12px; font-weight: 600;
    cursor: pointer; transition: background 0.15s;
    &:hover { background: #d44e1a; }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }

  .card {
    background: white; border-radius: 16px;
    box-shadow: var(--card-shadow); overflow: hidden;
  }

  .badge-verified {
    background: #DCFCE7; color: #16A34A; font-size: 12px;
    padding: 2px 8px; border-radius: 999px; font-weight: 600;
  }

  .badge-pending { background: #FEF3C7; color: #D97706; }
  .badge-new { background: #DBEAFE; color: #1D4ED8; }

Logo everywhere — find every occurrence of "S-Network" text and replace with:
  <span class="logo"><span class="s">S</span>-<span class="n">N</span>etwork</span>
  
  CSS: .logo .s, .logo .n { color: #E85D26; font-weight: 800; }

FLUTTER — in app_theme.dart, replace entire theme:
  static ThemeData get theme => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: const Color(0xFFE85D26),
      brightness: Brightness.light,
    ),
    fontFamily: 'DMSans',
    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFF1A1A2E),
      foregroundColor: Colors.white,
      elevation: 0,
      titleTextStyle: TextStyle(
        fontFamily: 'Syne', fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white
      ),
    ),
    cardTheme: CardTheme(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      color: Colors.white,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFFE85D26),
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        textStyle: const TextStyle(fontWeight: FontWeight.w600),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true, fillColor: Colors.grey.shade50,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE5E7EB))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE85D26), width: 2)),
    ),
  );

Flutter logo widget (use in all AppBars):
  Widget sNetworkLogo({double size = 20, bool darkBg = true}) {
    return RichText(text: TextSpan(
      style: TextStyle(fontSize: size, fontFamily: 'Syne', fontWeight: FontWeight.bold),
      children: [
        TextSpan(text: 'S', style: const TextStyle(color: Color(0xFFE85D26))),
        TextSpan(text: '-', style: TextStyle(color: darkBg ? Colors.white : const Color(0xFF1A1A2E))),
        TextSpan(text: 'N', style: const TextStyle(color: Color(0xFFE85D26))),
        TextSpan(text: 'etwork', style: TextStyle(color: darkBg ? Colors.white : const Color(0xFF1A1A2E))),
      ]
    ));
  }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 8 — LOGOUT EVERYWHERE (final fix)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In auth.service.ts, the ONLY logout method:
  async logout(): Promise<void> {
    try {
      await this.supabase.client.auth.signOut({ scope: 'local' });
    } catch (e) { console.warn('Logout warning:', e); }
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';  // Hard redirect, clears all Angular state
  }

Search entire codebase for every logout button, link, or (click) handler.
Replace ALL of them with: (click)="authService.logout()"
Do NOT re-implement logout logic anywhere else.

Flutter logout:
  Future<void> logout(WidgetRef ref) async {
    try { await Supabase.instance.client.auth.signOut(); } catch (_) {}
    ref.invalidate(profileProvider);
    if (context.mounted) context.go('/');
  }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 9 — NOTIFICATION BELL (Web)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create src/app/shared/components/notification-bell/notification-bell.component.ts

Full implementation:
  - On init: fetch last 10 unread notifications for current user
  - Subscribe to Supabase Realtime on notifications for current user's id
  - Show badge count (red dot) when unread > 0
  - Click bell: toggle dropdown panel
  - Panel shows notifications list with time-ago, icon by type, read/unread styling
  - Click notification: mark as read (UPDATE is_read=true) + navigate to ref page
  - "Mark all read" button

Toast on new notification:
  Simple fixed-position toast (bottom-right), auto-dismiss 4 seconds.
  Uses Angular CDK Overlay or simple absolute div with animation.

Register bell component in SharedModule and add to EVERY authenticated navbar:
  - User navbar
  - Vendor sidebar header
  - Admin sidebar header

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL BUILD + DEPLOY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ng build --configuration production → fix all TypeScript errors
2. npm run build:ssr → confirm server.mjs exists
3. flutter analyze → fix all warnings
4. flutter build apk --release → confirm APK builds
5. Deploy Angular to VPS:
   cd /var/www/s-network && git pull
   cd s-network-web && npm ci && npm run build:ssr
   pm2 reload ecosystem.config.js --update-env
6. Test: curl https://yourdomain.com/health → { status: 'ok' }

FINAL CHECKLIST:
[ ] Anonymous user visits site → home page (not login)
[ ] Login/Register buttons visible in navbar for logged-out users
[ ] Register with email+password → profile created → correct redirect
[ ] Login → navbar shows user name + avatar
[ ] Get Quote without login → login modal appears (not redirect)
[ ] Submit lead → no 500 error → success message
[ ] Vendor receives notification in real-time
[ ] User receives email confirmation
[ ] Admin leads page → shows full name, phone, email, city for each lead
[ ] Admin verifications → shows documents OR "no docs" warning
[ ] Approve vendor → vendor email sent
[ ] Status update → user notified in-app + email
[ ] Logout from every sidebar → goes to home page
[ ] S and N are red everywhere
[ ] No console errors on any page
```
