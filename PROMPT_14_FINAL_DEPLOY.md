# S-Network — PROMPT 14
## Final Production Readiness + Deployment
## (Run AFTER Prompt 13 is verified working)

> Paste memory.md into Antigravity before running this.
> This is the absolute final prompt before going live.

---

```
Read memory.md and VPS_DEPLOYMENT.md.

The S-Network app has unified auth, material categories, and all features built.
This prompt finalizes everything for production deployment on Hostinger VPS (web)
and Codemagic (iOS) and Play Store (Android).

---

PART A — WEB: Final Production Build Check

A1. Run: ng build --configuration production
    MUST complete with zero errors.
    If TypeScript errors appear, fix them all before proceeding.
    Common issues to fix proactively:
    - Optional chaining on all Supabase query results: data?.field ?? ''
    - Typed reactive forms (FormControl<string> not FormControl<any>)
    - All route parameters typed in ActivatedRoute

A2. Run: ng run s-network-web:server
    Then: node dist/s-network-web/server/server.mjs
    Visit http://localhost:4000 — must load correctly
    Visit http://localhost:4000/health — must return { status: 'ok', timestamp: number }
    Visit http://localhost:4000/business/any-slug — must return HTML (not crash)
    Visit http://localhost:4000/unknown-route — must show 404 page (not crash)

A3. Check bundle sizes:
    Run: ng build --configuration production --stats-json
    Run: npx webpack-bundle-analyzer dist/s-network-web/browser/stats.json
    If any chunk exceeds 800kb: identify the module and apply lazy loading

A4. Confirm environment.prod.ts has NO placeholder values:
    supabaseUrl: must be real Supabase project URL
    supabaseAnonKey: must be real anon key
    Both also set in VPS .env file

A5. Add Content Security Policy headers to Nginx config:
    add_header Content-Security-Policy "default-src 'self'; 
      script-src 'self' 'unsafe-inline' https://accounts.google.com; 
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
      font-src 'self' https://fonts.gstatic.com; 
      img-src 'self' data: blob: https://*.supabase.co; 
      connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com;";

---

PART B — VPS: Deployment Steps

B1. SSH into Hostinger VPS and run initial setup (if not done yet):
    apt update && apt upgrade -y
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs nginx certbot python3-certbot-nginx git
    npm install -g pm2
    mkdir -p /var/www/s-network
    cd /var/www/s-network
    git clone YOUR_GITHUB_REPO_URL .

B2. Set up environment on VPS:
    cat > /var/www/s-network/s-network-web/.env.production << 'EOF'
    SUPABASE_URL=https://YOUR_PROJECT.supabase.co
    SUPABASE_ANON_KEY=YOUR_ANON_KEY
    NODE_ENV=production
    PORT=4000
    EOF

B3. First deploy on VPS:
    cd /var/www/s-network/s-network-web
    npm ci
    npm run build:ssr
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup  # follow the printed command to auto-start on reboot

B4. Nginx setup:
    cp nginx/s-network.conf /etc/nginx/sites-available/s-network
    ln -sf /etc/nginx/sites-available/s-network /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t
    systemctl reload nginx

B5. SSL certificate:
    certbot --nginx -d yourdomain.com -d www.yourdomain.com --non-interactive --agree-tos -m youremail@domain.com
    After SSL: revisit https://yourdomain.com — must load with padlock

B6. Verify deployment:
    curl https://yourdomain.com/health → { status: 'ok' }
    pm2 status → s-network-web shows 'online'
    pm2 logs s-network-web --lines 20 → no error lines

B7. Set up GitHub Actions secrets (in GitHub repo → Settings → Secrets):
    VPS_HOST = YOUR_VPS_IP
    VPS_USER = root
    VPS_SSH_KEY = (contents of ~/.ssh/id_rsa on your LOCAL machine)
    SUPABASE_URL = your supabase URL
    SUPABASE_ANON_KEY = your anon key
    After setting: push a commit to main → verify Actions workflow runs and deploys

---

PART C — ANDROID: Play Store Release Build

C1. Generate release keystore (run once, keep this file safe — NEVER commit to git):
    keytool -genkey -v -keystore s-network-release.jks \
      -keyalg RSA -keysize 2048 -validity 10000 \
      -alias s-network

C2. Add to s-network-mobile/android/key.properties (DO NOT commit — add to .gitignore):
    storePassword=YOUR_STORE_PASSWORD
    keyPassword=YOUR_KEY_PASSWORD
    keyAlias=s-network
    storeFile=../s-network-release.jks

C3. Update android/app/build.gradle to use key.properties for release signing.

C4. Update pubspec.yaml:
    name: s_network
    version: 1.0.0+1

C5. Update android/app/src/main/AndroidManifest.xml:
    android:label="S-Network"
    Confirm package name: com.snetwork.app

C6. Build release APK:
    flutter build apk --release
    Output: build/app/outputs/flutter-apk/app-release.apk

C7. Build release App Bundle (preferred for Play Store):
    flutter build appbundle --release
    Output: build/app/outputs/bundle/release/app-release.aab

C8. Play Store setup (developer must do manually):
    1. Create Google Play Console account ($25 one-time fee)
    2. Create new app: S-Network, com.snetwork.app
    3. Upload app-release.aab to Internal Testing track
    4. Complete store listing: description, screenshots, icon (512x512), feature graphic (1024x500)
    5. Privacy policy URL (required — host a simple page on your domain: yourdomain.com/privacy)
    6. Promote to Production when ready

---

PART D — iOS: Codemagic Build (No Mac Required)

D1. Confirm codemagic.yaml exists in Flutter project root (from Prompt 13 Part E).

D2. Update ios/Runner/Info.plist:
    <key>CFBundleDisplayName</key><string>S-Network</string>
    <key>CFBundleIdentifier</key><string>com.snetwork.app</string>
    <key>CFBundleShortVersionString</key><string>1.0.0</string>
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>S-Network uses your location to show nearby construction professionals.</string>
    <key>NSMicrophoneUsageDescription</key>
    <string>S-Network uses the microphone for voice search.</string>
    <key>NSPhotoLibraryUsageDescription</key>
    <string>S-Network needs photo access to upload portfolio images.</string>
    <key>NSCameraUsageDescription</key>
    <string>S-Network needs camera access to capture project photos.</string>

D3. Codemagic setup (developer does manually):
    1. Sign up at codemagic.io
    2. Connect GitHub repo
    3. Add Apple Developer account (requires $99/year Apple Developer Program)
    4. Add Code Signing certificates and provisioning profiles in Codemagic settings
    5. Set environment variables: SUPABASE_URL, SUPABASE_ANON_KEY
    6. Trigger build → download IPA
    7. Upload to App Store Connect → TestFlight for testing
    8. Submit for App Review when ready

D4. App Store listing requirements (prepare these):
    App name: S-Network
    Subtitle: Find Construction Professionals
    Description: (write 3-4 paragraphs about the app)
    Keywords: construction, contractor, architect, interior design, plumber, electrician
    Screenshots: required for 6.5" and 5.5" iPhone
    App icon: 1024x1024 PNG, no transparency, no rounded corners (Apple adds them)
    Privacy policy URL: yourdomain.com/privacy

---

PART E — SUPABASE: Production Settings

E1. In Supabase Dashboard → Auth → URL Configuration:
    Site URL: https://yourdomain.com
    Redirect URLs (add all):
      https://yourdomain.com/auth/callback
      https://yourdomain.com
      io.snetwork.app://login-callback  (for Flutter mobile deep link)

E2. In Supabase Dashboard → Auth → Providers:
    Email: Enabled ✓, Confirm email: Optional for MVP (disable to reduce friction)
    Phone: Enabled ✓ (requires Twilio or other SMS provider — set up Twilio account)
    Google: Enabled ✓ (requires Google Cloud Console OAuth credentials)

E3. Twilio setup for Phone OTP (developer does manually):
    1. Create free Twilio account at twilio.com
    2. Get Account SID, Auth Token, and phone number
    3. In Supabase Dashboard → Auth → Providers → Phone → add Twilio credentials
    4. Test OTP send to a real phone number before going live

E4. In Supabase Dashboard → Settings → API:
    Confirm JWT expiry: 3600 seconds (1 hour) — acceptable for MVP
    Enable refresh token rotation: YES

E5. In Supabase Dashboard → Database → Backups:
    Enable Point-in-Time Recovery (Pro plan) OR manually export DB weekly for MVP free plan

---

PART F — FINAL MANUAL VERIFICATION (Do Each Item)

PRODUCTION WEB:
[ ] https://yourdomain.com loads with SSL padlock
[ ] Home page renders with category grid and featured vendors
[ ] Search "contractor" → results appear
[ ] Open a business profile → portfolio gallery loads
[ ] Click "Request Quote" → form submits → success message
[ ] Register as new user → no errors → redirected to home
[ ] Register as vendor → no errors → redirected to onboarding
[ ] Login with Email → works
[ ] Login with Phone OTP → SMS received → verify works
[ ] Login with Google → OAuth flow completes → redirected correctly
[ ] Vendor dashboard → leads tab → analytics tab → all load without error
[ ] No console errors on any page (open DevTools → Console tab)
[ ] No 400/404 network errors (open DevTools → Network tab)

ANDROID APK:
[ ] App installs on Android device
[ ] App name shows "S-Network"
[ ] Login with email → works
[ ] Login with phone OTP → works
[ ] Search screen → results load
[ ] Business profile → gallery swipe works
[ ] Request quote → submits successfully
[ ] Vendor receives lead notification

IOS (via TestFlight):
[ ] App installs via TestFlight
[ ] App name shows "S-Network"
[ ] All auth methods work
[ ] Location permission request appears and works
[ ] Camera/photo permission works for portfolio upload
[ ] All core user flows work same as Android

SUPABASE:
[ ] auth.users table has test accounts
[ ] profiles table has corresponding rows (trigger working)
[ ] businesses table has test vendors
[ ] leads table populates on quote submission
[ ] material_category_groups has 7 rows
[ ] material_items has all seeded items
[ ] No failed requests in Supabase Dashboard → Logs → API logs

---

PART G — POST-LAUNCH CHECKLIST

Things to do within 1 week of launch:

[ ] Set up custom SMTP in Supabase (for transactional emails — registration, OTP fallback)
[ ] Add Google Analytics to Angular (paste GA4 snippet in index.html)
[ ] Add PostHog in Flutter (flutter pub add posthog_flutter)
[ ] Set up error monitoring: Sentry for both Angular and Flutter
[ ] Write Privacy Policy page (yourdomain.com/privacy) — required for both app stores
[ ] Write Terms of Service page (yourdomain.com/terms)
[ ] Test PM2 auto-restart: sudo systemctl reboot VPS → verify app comes back up automatically
[ ] Test GitHub Actions deploy: make a small change → push to main → verify auto-deploy works
[ ] Create at least 5 test vendor accounts with real-looking data and portfolio images
      (makes the app look active during early user acquisition)
[ ] Set up Hostinger domain email: info@yourdomain.com (for vendor support)
```
