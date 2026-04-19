# S-Network — PROMPT 17 (FINAL AUDIT + DEPLOYMENT READY)
## Last comprehensive fix before production deployment
## Run with Claude Opus — paste memory_v6.md first

---

```
Read memory_v6.md. This is the absolute final pass before deployment.
Fix every issue listed. Implement every missing feature. No TODOs. No stubs.
Complete working code only. Work section by section without skipping.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1 — PUBLIC HOME (no login required)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL ARCHITECTURE CHANGE: The home page must be PUBLIC.
Anyone can visit the site, browse categories, search, and view vendor profiles
WITHOUT logging in. Login is only required to submit a quote.

1a. Update app.routes.ts — make these routes PUBLIC (no AuthGuard):
    / → HomeComponent
    /search → SearchResultsComponent  
    /business/:slug → BusinessProfileComponent
    /categories → CategoriesComponent

    Only these routes require login:
    /vendor/* → VendorGuard
    /admin/* → AdminGuard
    /profile → AuthGuard
    /saved → AuthGuard

1b. Update AuthGuard — only redirect to login if the route REQUIRES auth.
    Do NOT guard the home page, search, or business profiles.

1c. On app startup (AppComponent ngOnInit):
    - Do NOT redirect to login if no session
    - Only redirect to login when user tries an action that requires auth
    - Remember intended URL for redirect-after-login

1d. Flutter router.dart — same logic:
    Home, Search, BusinessProfile: accessible without login
    GoRouter redirect: only redirect if trying to access protected route

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2 — QUOTE REQUEST WITHOUT LOGIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When an unauthenticated user clicks "Get Quote" on a business profile:

2a. Angular — in business-profile.component.ts, onGetQuote():
    Check if session exists:
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Store intended action
        sessionStorage.setItem('pendingQuote', JSON.stringify({
          businessId: this.business.id,
          businessName: this.business.name
        }));
        // Show login prompt modal (NOT full page redirect)
        this.showLoginPromptModal = true;
        return;
      }
      // Logged in — show quote form directly
      this.showQuoteForm = true;

2b. Login Prompt Modal (LoginPromptModalComponent):
    A centered overlay modal (not full page) showing:
    
    Header: "Sign in to send your enquiry"
    Body: "Create a free account or sign in to contact [Business Name]
           and get your project quote."
    
    Buttons:
      [Login] → navigate to /auth/login?redirect=/business/{slug}
      [Create Account] → navigate to /auth/register?redirect=/business/{slug}
    
    PLUS a "Try our mobile app" banner at bottom of modal:
      Orange banner with app icon: 
      "📱 Get faster responses on the S-Network mobile app"
      [Download Android] button linking to Play Store URL
      (or just show the banner text if not yet published)
    
    [✕ Close] button to dismiss

2c. After login, check for pendingQuote in sessionStorage:
    In callback.component.ts, after routing by role:
      const pendingQuote = sessionStorage.getItem('pendingQuote');
      if (pendingQuote && profile.role === 'user') {
        const { businessId } = JSON.parse(pendingQuote);
        sessionStorage.removeItem('pendingQuote');
        this.router.navigate(['/business', businessSlug], 
          { queryParams: { openQuote: 'true' } });
      }
    
    In business-profile.component.ts ngOnInit():
      if (this.route.snapshot.queryParams['openQuote'] === 'true') {
        // Auto-open quote form if user just logged in
        setTimeout(() => this.showQuoteForm = true, 500);
      }

2d. Flutter: same pattern
    onGetQuoteTap():
      if (!supabase.auth.currentSession) {
        SharedPreferences.setString('pendingQuoteBusiness', business.id);
        showLoginPromptBottomSheet(context, business.name);
        return;
      }
      showQuoteFormBottomSheet(context);
    
    LoginPromptBottomSheet: shows login/register options + mobile app banner

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3 — FIX create-lead EDGE FUNCTION (400 error)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rewrite supabase/functions/create-lead/index.ts completely:

  import { serve } from "https://deno.land/std/http/server.ts";
  import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

  serve(async (req) => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      // Parse body safely
      let body: any = {};
      try { body = await req.json(); } catch { body = {}; }

      const { business_id, project_type, message, budget_min, budget_max,
              timeline, user_name, user_phone } = body;

      // Only business_id and project_type required
      if (!business_id) return new Response(
        JSON.stringify({ error: 'business_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      if (!project_type) return new Response(
        JSON.stringify({ error: 'project_type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

      // Get auth user (optional — allows anonymous leads)
      let userId: string | null = null;
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const userClient = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_ANON_KEY')!,
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data: { user } } = await userClient.auth.getUser();
        if (user) userId = user.id;
      }

      // Insert lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          business_id,
          user_id: userId,
          user_name: user_name || null,
          user_phone: user_phone || null,
          project_type,
          message: message || null,
          budget_min: budget_min || null,
          budget_max: budget_max || null,
          timeline: timeline || null,
          status: 'new',
          type: 'enquiry'
        })
        .select()
        .single();

      if (leadError) throw leadError;

      // Increment total_leads on business
      await supabase.rpc('increment_business_leads', { business_id_param: business_id })
        .catch(() => supabase.from('businesses')
          .update({ total_leads: supabase.sql`total_leads + 1` })
          .eq('id', business_id));

      // Notify vendor
      const { data: business } = await supabase
        .from('businesses')
        .select('owner_id, name')
        .eq('id', business_id)
        .single();

      if (business?.owner_id) {
        await supabase.from('notifications').insert({
          user_id: business.owner_id,
          title: '🔔 New Lead Received',
          body: `${user_name || 'Someone'} is enquiring about ${project_type} for your business ${business.name}`,
          type: 'new_lead',
          ref_id: lead.id,
          is_read: false
        });
      }

      return new Response(
        JSON.stringify({ success: true, lead_id: lead.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message || 'Internal error' }),
        { status: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
      );
    }
  });

Deploy: supabase functions deploy create-lead

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4 — FIX VENDOR DOCUMENTS VISIBLE IN ADMIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4a. Fix the verifications.component.ts query (removes 400 error):

    Replace the bad PostgREST join with two separate queries:

    async loadVerifications(statusFilter?: string) {
      // Step 1: Get verifications with businesses
      let query = this.supabase.client
        .from('vendor_verifications')
        .select('*, businesses!inner(id, name, city, owner_id)')
        .order('submitted_at', { ascending: false });

      if (statusFilter) query = query.eq('status', statusFilter);

      const { data: verifications, error } = await query;
      if (error) { console.error(error); return; }

      // Step 2: Enrich with owner profile data
      const ownerIds = [...new Set(verifications.map(v => v.businesses?.owner_id).filter(Boolean))];
      const { data: profiles } = await this.supabase.client
        .from('profiles')
        .select('id, name, phone')
        .in('id', ownerIds);

      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

      this.verifications = verifications.map(v => ({
        ...v,
        ownerName: profileMap[v.businesses?.owner_id]?.name || 'Unknown',
        ownerPhone: profileMap[v.businesses?.owner_id]?.phone || ''
      }));
    }

4b. Display documents in the admin verification detail modal.
    The document URLs (gst_certificate_url, msme_certificate_url) are stored
    in vendor_verifications table. Render them properly:

    For PDF files (url ends with .pdf):
      <iframe [src]="sanitizer.bypassSecurityTrustResourceUrl(docUrl)"
              width="100%" height="400" class="border rounded"></iframe>
      <a [href]="docUrl" target="_blank" class="text-blue-600 text-sm">Open in new tab ↗</a>

    For image files:
      <img [src]="docUrl" class="max-w-full rounded shadow" alt="Document">
      <a [href]="docUrl" target="_blank" class="text-blue-600 text-sm">Open in new tab ↗</a>

    Detect file type:
      isImage(url: string): boolean {
        return /\.(jpg|jpeg|png|webp)$/i.test(url);
      }

    Add DomSanitizer injection to the component constructor.

4c. Admin verification modal must show ALL of:
    - Business name, category, city
    - Owner name, phone, email
    - GST number + certificate (rendered above)
    - MSME number + certificate (rendered above)
    - Verification links: gstn.gov.in and udyamregistration.gov.in
    - Submission date + attempt count
    - [Approve] and [Reject with Reason] buttons

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5 — FIX LEAD MONITORING (full user info)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5a. Admin leads query must return complete user information.
    In admin-leads.component.ts:

    const { data } = await supabase.from('leads')
      .select(`
        *,
        businesses!inner(id, name, owner_id,
          profiles:owner_id(name, phone)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    For user info, join profiles:
    If lead.user_id exists: fetch from profiles
    If not (anonymous lead): use lead.user_name and lead.user_phone directly

    Admin lead detail modal shows:
      PROJECT INFO: type, budget range, description, timeline, date
      USER/CUSTOMER: name, phone (from lead.user_name/phone OR profiles join)
      VENDOR: business name, owner name, phone
      STATUS: current status with update dropdown
      ADMIN NOTE: text field for admin private notes (saved to leads.admin_note)

5b. Vendor dashboard lead detail must also show full user info:
    Same query structure on vendor side.
    Lead card shows: user name, phone, project details, budget, status chip.

5c. Ensure leads table has admin_note column:
    In supabase/migrations or run directly:
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS admin_note text;

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6 — FIX LOGOUT IN ALL SIDEBARS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Logout is broken in all sidebars. Fix in ONE shared AuthService method:

In auth.service.ts:
  async logout(): Promise<void> {
    await this.supabase.client.auth.signOut();
    // Clear all cached state
    this.currentProfile$.next(null);
    localStorage.removeItem('s-network-auth-token');
    sessionStorage.clear();
    // Hard redirect to home (not login — home is now public)
    window.location.href = '/';
  }

In EVERY sidebar/navbar component that has a logout button, use this SAME method:
  <button (click)="authService.logout()">Logout</button>
  or
  <li (click)="authService.logout()">Logout</li>

Make sure the method is called on the INJECTED service instance, not re-implemented.
Search for ALL logout button click handlers across:
  - user navbar dropdown
  - vendor sidebar
  - admin sidebar  
  - pending approval page
  - user profile page

Replace all with: this.authService.logout()

Flutter logout:
  Future<void> logout() async {
    await Supabase.instance.client.auth.signOut();
    ref.invalidate(profileProvider);
    ref.invalidate(authStateProvider);
    context.go('/');
  }
  All logout buttons call this same method.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 7 — NOTIFICATION SYSTEM (complete)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

7a. Web — Notification Bell Component (shared, in navbar):
    Shows unread count badge on bell icon.
    
    On init: subscribe to Supabase Realtime on notifications table:
      const channel = supabase.channel('user-notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`
        }, (payload) => {
          this.notifications.unshift(payload.new);
          this.unreadCount++;
          this.showToast(payload.new.title, payload.new.body);
        })
        .subscribe();
    
    Dropdown panel (click bell):
      Last 10 notifications, newest first
      Each item: icon + title + body + time ago + unread dot
      Click item: mark as read + navigate to ref page
      "Mark all as read" button
    
    On destroy: supabase.removeChannel(channel)

7b. Toast notification (bottom-right corner):
    When new notification arrives:
      Show toast: 3 seconds auto-dismiss
      Orange left border, notification icon, title + body truncated
      Click toast → navigate to relevant page

7c. Notification triggers — create these in the existing edge functions:

    When vendor updates lead status:
      In update-lead-status function, after DB update:
      If new status = 'contacted' → notify user:
        INSERT notification for lead.user_id:
          title: '✅ Vendor Responded to Your Enquiry'
          body: '[Vendor Name] has contacted you about your [project_type] request'
          type: 'lead_status_update', ref_id: lead_id
      If new status = 'converted' → notify user:
          title: '🎉 Quote Accepted!'
          body: '[Vendor Name] has marked your enquiry as converted'

    When admin approves vendor:
      Already implemented in approve-vendor-registration — confirm it inserts to notifications.

    When new lead comes in:
      Already implemented in create-lead — confirm it inserts to notifications.

7d. Flutter Push Notifications (for vendors):
    Use supabase_flutter Realtime subscription (not FCM — simpler, no extra config):
    
    In VendorDashboardScreen initState():
      _channel = Supabase.instance.client
        .channel('vendor-leads-${business.id}')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'notifications',
          filter: PostgresChangeFilter(
            type: FilterType.eq,
            column: 'user_id',
            value: currentUserId,
          ),
          callback: (payload) {
            final data = payload.newRecord;
            _showLocalNotification(data['title'], data['body']);
            setState(() { unreadCount++; });
          }
        )
        .subscribe();
    
    Local notification display:
      FlutterLocalNotificationsPlugin().show(
        0,
        payload.newRecord['title'],
        payload.newRecord['body'],
        NotificationDetails(
          android: AndroidNotificationDetails(
            'snetwork_channel', 'S-Network Notifications',
            importance: Importance.high, priority: Priority.high,
          ),
        ),
      );
    
    In dispose(): Supabase.instance.client.removeChannel(_channel);
    
    Request notification permission on app launch in main.dart.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 8 — EMAIL NOTIFICATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use Resend API (already configured). Send emails for these events:

8a. Update approve-vendor-registration edge function — already sends email.
    Verify the HTML template is correct and professional.

8b. Update update-lead-status edge function to send email when status changes:

    When vendor marks lead as 'contacted':
      Send to USER email (fetch from auth.users via service role):
      Subject: "✅ [Vendor Name] responded to your enquiry on S-Network"
      Body: "Hi [User Name], [Vendor Name] has reviewed your [project_type] request
             and will be reaching out to you shortly. 
             View your lead: [site_url]/profile/leads"
    
    When vendor marks lead as 'converted':
      Send to USER:
      Subject: "🎉 Your project enquiry has been accepted!"
      Body: "Great news! [Vendor Name] has accepted your [project_type] project enquiry."

8c. When user submits lead — send confirmation to user:
    In create-lead edge function, after inserting lead:
    If user has email (fetch from auth.users):
      Subject: "Your enquiry has been sent to [Business Name]"
      Body: "Hi, your [project_type] enquiry has been sent to [Business Name].
             They will contact you within 24 hours. Track status at [site_url]"

8d. Email template structure (reuse across all emails):
    const emailHtml = (title, body, ctaText, ctaUrl) => `
    <div style="font-family:DM Sans,sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <div style="background:#1A1A2E;padding:16px 24px;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;margin:0;font-size:20px">
          <span style="color:#E85D26">S</span>-<span style="color:#E85D26">N</span>etwork
        </h1>
      </div>
      <div style="background:#fff;padding:24px;border:1px solid #eee">
        <h2 style="color:#1A1A2E">${title}</h2>
        <p style="color:#555;line-height:1.6">${body}</p>
        ${ctaUrl ? `<a href="${ctaUrl}" style="display:inline-block;background:#E85D26;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin-top:16px">${ctaText}</a>` : ''}
      </div>
      <p style="color:#aaa;font-size:12px;text-align:center;margin-top:16px">
        S-Network — Find. Verify. Build. | <a href="${Deno.env.get('SITE_URL')}/privacy">Privacy</a>
      </p>
    </div>`;

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 9 — UI IMPROVEMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

9a. S-Network Logo — S and N in red (#E85D26) everywhere:

    In ALL navbar/header HTML:
      <span class="logo-text">
        <span style="color:#E85D26">S</span>-<span style="color:#E85D26">N</span>etwork
      </span>

    In Flutter (all AppBar/header widgets):
      RichText(text: TextSpan(children: [
        TextSpan(text: 'S', style: TextStyle(color: Color(0xFFE85D26), fontWeight: FontWeight.bold, fontSize: 22)),
        TextSpan(text: '-', style: TextStyle(color: Colors.white, fontSize: 22)),
        TextSpan(text: 'N', style: TextStyle(color: Color(0xFFE85D26), fontWeight: FontWeight.bold, fontSize: 22)),
        TextSpan(text: 'etwork', style: TextStyle(color: Colors.white, fontSize: 22)),
      ]))

9b. Silicone/Native Emoji icons — replace ALL text icons or SVG icons with emojis:
    Categories: 👷 🏠 🏢 🔑 📐 🎨 ⚡ 🔧 🧱
    Lead statuses: 🔵 New | 📞 Contacted | ✅ Converted | ❌ Lost
    Verified badge: ✅ Verified
    Notifications: 🔔 New Lead | 🎉 Approved | ⚠️ Rejected | 📋 Status Update
    Nav items: 🏠 Home | 🔍 Search | 📋 Leads | 📊 Analytics | ⚙️ Settings | 🚪 Logout

9c. Overall UI polish — apply to ALL pages:

    ANGULAR:
    Cards: rounded-2xl shadow-md hover:shadow-lg transition-all duration-200
    Buttons: rounded-xl font-semibold tracking-wide transition-colors duration-150
    Primary button: bg-[#E85D26] hover:bg-[#d44e1a] text-white
    Secondary button: border-2 border-[#E85D26] text-[#E85D26] hover:bg-orange-50
    Input fields: rounded-xl border-gray-200 focus:border-[#E85D26] focus:ring-2 focus:ring-orange-100
    Page backgrounds: bg-[#F8F5F0] (warm off-white)
    Section headings: font-[Syne] text-[#1A1A2E] font-bold
    
    FLUTTER:
    ThemeData: use Material 3, colorScheme.fromSeed(Color(0xFFE85D26))
    Card: elevation 2, borderRadius BorderRadius.circular(16)
    ElevatedButton: shape RoundedRectangleBorder(radius 12), no elevation
    InputDecoration: OutlineInputBorder(radius 12), focusedBorder orange

9d. Business cards — uniform design on both platforms:
    White card, 16px rounded corners, subtle shadow
    Cover image: 160px height, object-fit cover
    Verified badge: green pill bottom-left of image
    Premium badge: gold star top-right
    Content: business name (bold Syne), category chip, city, rating stars + count
    Action row: three equal buttons — 📞 Call | 💬 WhatsApp | 📋 Quote
    Bookmark: heart icon top-right of card

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 10 — FINAL MISSED FEATURES AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Check and implement each if missing:

WEB:
[ ] Search autocomplete — debounced 300ms, shows business names in dropdown
[ ] "Near Me" button — uses browser geolocation, calls get-nearby-businesses
[ ] Search results show "Open Now/Closed" chip per business (from working_hours)
[ ] Business profile: working hours table (Mon–Sun with open/close times)
[ ] Business profile: OpenStreetMap embed (free) for location — use iframe:
    <iframe src="https://maps.google.com/maps?q={lat},{lng}&output=embed"
            width="100%" height="300" frameborder="0" loading="lazy"></iframe>
[ ] Reviews — write review form (stars + text, min 20 chars)
[ ] Reviews — vendor reply button (vendors can reply to their reviews)
[ ] User profile — My Leads tab showing all submitted leads + status
[ ] Saved businesses — heart icon on every card, saved to saved_businesses table
[ ] Share business — "Share" button on profile, copies URL to clipboard
[ ] Vendor profile completeness bar — shows % in dashboard
[ ] Admin category management — add/edit/delete categories (/admin/categories)
[ ] 404 page — custom "Page not found" with CTA to go home
[ ] Privacy Policy page — /privacy (required for app stores)
[ ] Terms of Service — /terms

MOBILE (Flutter):
[ ] Search with recent searches (SharedPreferences)
[ ] Pull-to-refresh on all list screens
[ ] Empty state illustrations on all empty screens
[ ] Offline banner: uses connectivity_plus package
[ ] Vendor dashboard: realtime new lead count badge
[ ] Lead detail: WhatsApp deep link: wa.me/91{phone}
[ ] Settings screen: change name, phone, password
[ ] App version shown in settings

BACKEND:
[ ] update-lead-status function sends email + notification (Section 7c/8b)
[ ] get-vendor-analytics returns 0 values, never null (prevents NaN in charts)
[ ] All edge functions have CORS headers for OPTIONS preflight requests
[ ] Confirm supabase functions deploy for ALL 16 functions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 11 — FINAL BUILD + DEPLOY CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

11a. Run in Supabase SQL Editor (if not done yet):
     Run FINAL_FIX.sql — creates storage bucket, fixes all RLS, seeds categories

11b. Deploy all edge functions:
     supabase functions deploy create-lead
     supabase functions deploy update-lead-status
     supabase functions deploy approve-vendor-registration
     supabase functions deploy reject-vendor-registration
     supabase functions deploy get-homepage-data
     supabase functions deploy search-businesses
     supabase functions deploy get-vendor-analytics

11c. ng build --configuration production
     Fix ALL TypeScript errors. Zero tolerance.
     ng run s-network-web:server
     node dist/s-network-web/server/server.mjs
     Confirm: curl http://localhost:4000/ returns HTML

11d. flutter analyze — fix all warnings
     flutter build apk --release
     Install APK on Android device and test manually

11e. VPS deploy:
     ssh root@YOUR_VPS_IP
     cd /var/www/s-network && git pull origin main
     cd s-network-web && npm ci && npm run build:ssr
     pm2 reload ecosystem.config.js --update-env
     pm2 status  (must show 'online')
     curl https://yourdomain.com/health → { "status": "ok" }

11f. Supabase Dashboard final settings:
     Auth → URL Config:
       Site URL: https://yourdomain.com
       Redirect URLs: https://yourdomain.com/auth/callback
     Auth → Email: Confirm email OFF (for smooth registration)
     Auth → Providers: Google enabled (if configured)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL MANUAL TEST FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO ALL OF THESE. Fix anything that fails.

AS ANONYMOUS USER:
[ ] Visit site → home page loads (NOT login page)
[ ] Browse categories → search "contractor" → results appear
[ ] Open a business profile → all sections load
[ ] Click "Get Quote" → login prompt modal appears (not redirect)
[ ] Modal shows "Try mobile app" banner
[ ] Click Login in modal → goes to login with redirect back

AS LOGGED-IN USER:
[ ] Login → navbar visible → home page
[ ] Search → filter by category → filter by city → results update
[ ] Open vendor → click Get Quote → form appears (no login prompt)
[ ] Submit quote → success toast → lead appears in My Leads (profile page)
[ ] Notification bell shows new activity
[ ] Save a business → appears in Saved page
[ ] Logout button works → goes back to home (not login)

AS VENDOR (approved):
[ ] Login → vendor dashboard → stats show correctly (no NaN, no null)
[ ] Leads tab → see user's lead with full name + phone + project details
[ ] Update lead to "contacted" → user gets notification
[ ] Profile editor → upload image → no "bucket not found" error
[ ] Logout → goes to home

AS ADMIN:
[ ] Login → admin dashboard
[ ] /admin/vendors/pending → see pending vendor
[ ] Open vendor → documents VISIBLE (PDF or image rendered)
[ ] Approve vendor → vendor gets email notification
[ ] /admin/leads → see ALL leads with user names and details
[ ] /admin/rankings → add vendor to Featured → save works (no 403)
[ ] Logout → goes to home

EMAIL CHECKS (requires Resend configured):
[ ] New lead submitted → user receives confirmation email
[ ] Vendor status updated to contacted → user receives email
[ ] Admin approves vendor → vendor receives approval email
```
