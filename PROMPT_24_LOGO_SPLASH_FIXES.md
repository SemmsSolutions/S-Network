# S-Network — PROMPT 24
## Realtime Fix + Logo + Splash Screen + Registration Flow + Subtypes + Image Names
## Run with Gemini Pro — paste memory_v8.md first

---

```
Read memory_v8.md. Fix every issue below completely. No stubs. No partial code.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 1 — REALTIME SUBSCRIPTION ERROR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Error: "cannot add postgres_changes callbacks for realtime:public:notifications
after subscribe()"

Root cause: The notification service is calling .on() AFTER .subscribe() has
already been called. Supabase Realtime requires all .on() handlers to be
registered BEFORE calling .subscribe().

The second cause: the notification setup is being called multiple times
(on every navigation), creating duplicate subscriptions on the same channel.

Fix in src/app/shared/services/notification.service.ts:

```typescript
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  unreadCount$ = new BehaviorSubject<number>(0);
  notifications$ = new BehaviorSubject<any[]>([]);

  private channel: RealtimeChannel | null = null;
  private currentUserId: string | null = null;
  private initialized = false;  // prevent duplicate setup

  constructor(private supabase: SupabaseService) {}

  // Call this ONCE after user logs in
  async setup(userId: string): Promise<void> {
    // If already set up for this user, do nothing
    if (this.initialized && this.currentUserId === userId) return;

    // Tear down any existing subscription first
    await this.teardown();

    this.currentUserId = userId;
    this.initialized = true;

    // Load initial notifications
    await this.loadNotifications(userId);

    // Create channel with ALL handlers BEFORE subscribe()
    this.channel = this.supabase.client
      .channel(`user-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const current = this.notifications$.getValue();
          this.notifications$.next([payload.new, ...current]);
          this.unreadCount$.next(this.unreadCount$.getValue() + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        () => {
          // Reload when notifications are marked read
          this.loadNotifications(userId);
        }
      );

    // Subscribe AFTER registering ALL handlers
    this.channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Notification channel subscribed');
      }
    });
  }

  async teardown(): Promise<void> {
    if (this.channel) {
      await this.supabase.client.removeChannel(this.channel);
      this.channel = null;
    }
    this.initialized = false;
    this.currentUserId = null;
  }

  async loadNotifications(userId: string): Promise<void> {
    const { data } = await this.supabase.client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    const all = data ?? [];
    this.notifications$.next(all);
    this.unreadCount$.next(all.filter(n => !n.is_read).length);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.supabase.client
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    this.unreadCount$.next(0);
    const current = this.notifications$.getValue();
    this.notifications$.next(current.map(n => ({ ...n, is_read: true })));
  }

  async markRead(notificationId: string): Promise<void> {
    await this.supabase.client
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    const current = this.notifications$.getValue();
    this.notifications$.next(current.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    const newCount = Math.max(0, this.unreadCount$.getValue() - 1);
    this.unreadCount$.next(newCount);
  }

  ngOnDestroy(): void {
    this.teardown();
  }
}
```

In auth.service.ts, call notificationService.setup() ONCE after login:
```typescript
// After successful login/session restore:
if (session?.user) {
  this.notificationService.setup(session.user.id);
}

// On logout:
this.notificationService.teardown();
```

Remove all other places that call setupRealtime() or create notification channels.
There must be exactly ONE channel per user session.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 2 — approve-vendor 400 ERROR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The approve-vendor edge function returns 400. This is usually because it
is being called with wrong or missing parameters.

In admin-vendors.component.ts, when approving a vendor:

```typescript
async approveVendor(vendor: any): Promise<void> {
  // vendor object structure: has profiles join and businesses data
  // Extract the correct IDs
  const vendorUserId = vendor.owner_id ?? vendor.profiles?.id ?? vendor.id;
  const businessId = vendor.businesses?.id ?? vendor.id;

  console.log('Approving vendor:', { vendorUserId, businessId }); // debug

  const { data, error } = await this.supabase.client.functions.invoke(
    'approve-vendor-registration',
    {
      body: {
        vendor_user_id: vendorUserId,
        business_id: businessId
      }
    }
  );

  if (error) {
    console.error('Approve vendor error:', error);
    alert('Failed to approve: ' + error.message);
    return;
  }

  await this.loadVendors();
  alert('Vendor approved successfully!');
}
```

Also check the edge function supabase/functions/approve-vendor-registration/index.ts
— confirm it extracts vendor_user_id and business_id from the body correctly.
If the body extraction is wrong, fix it to match the above call.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 3 — SUBTYPES NOT APPEARING IN VENDOR REGISTRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The specializations are visible in the admin panel (Image 1 confirms they exist
in the DB) but are not loading in the vendor registration form.

Root cause: Most likely one of these:
A) onCategoryChange() is not connected to the (change) event
B) The method is async but no await/then handling
C) Change detection not triggered after async load
D) Wrong category ID being passed (slug vs UUID)

Fix completely:

In the vendor registration/onboarding component:

```typescript
// Ensure these are declared at class level
availableSpecializations: any[] = [];
selectedSpecializations: string[] = [];
categorySelectedButNoSpecs = false;

// This MUST be called on category dropdown change
async onCategoryChange(event?: Event): Promise<void> {
  // Handle both reactive forms and template-driven forms
  let categoryId: string;
  
  if (this.vendorForm) {
    // Reactive form
    categoryId = this.vendorForm.get('categoryId')?.value
              || this.vendorForm.get('category_id')?.value
              || '';
  } else {
    // Template-driven
    categoryId = this.businessDetails?.categoryId || '';
  }

  console.log('Category changed to:', categoryId); // debug

  if (!categoryId) {
    this.availableSpecializations = [];
    this.categorySelectedButNoSpecs = false;
    return;
  }

  // Query by category ID (UUID)
  const { data, error } = await this.supabase.client
    .from('category_specializations')
    .select('id, name, sort_order')
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error loading specializations:', error);
    this.availableSpecializations = [];
    return;
  }

  console.log('Loaded specializations:', data); // debug

  this.availableSpecializations = data ?? [];
  this.categorySelectedButNoSpecs = this.availableSpecializations.length === 0;
  this.selectedSpecializations = [];

  // Force change detection
  if (this.cdr) this.cdr.detectChanges();
}

toggleSpec(specId: string): void {
  const idx = this.selectedSpecializations.indexOf(specId);
  if (idx >= 0) {
    this.selectedSpecializations.splice(idx, 1);
  } else {
    this.selectedSpecializations.push(specId);
  }
}
```

In the HTML template, connect the event handler correctly.
For REACTIVE FORMS:
```html
<select formControlName="categoryId" (change)="onCategoryChange($event)" class="form-input">
  <option value="">Select category *</option>
  <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.name }}</option>
</select>
```

For TEMPLATE-DRIVEN FORMS:
```html
<select [(ngModel)]="businessDetails.categoryId" name="categoryId"
        (ngModelChange)="onCategoryChange()" class="form-input" required>
  <option value="">Select category *</option>
  <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.name }}</option>
</select>
```

The specializations section:
```html
<div class="specializations-block" *ngIf="availableSpecializations.length > 0">
  <div class="spec-block-header">
    <label class="spec-heading">What do you specialize in?</label>
    <small class="spec-hint">Select all that apply</small>
  </div>
  <div class="spec-checkboxes-grid">
    <label *ngFor="let spec of availableSpecializations" class="spec-check-item">
      <input
        type="checkbox"
        [value]="spec.id"
        [checked]="selectedSpecializations.includes(spec.id)"
        (change)="toggleSpec(spec.id)"
      >
      <span class="spec-label-text">{{ spec.name }}</span>
    </label>
  </div>
</div>

<div class="no-spec-note" *ngIf="categorySelectedButNoSpecs">
  <small>This category has no sub-types. You can add custom services later.</small>
</div>
```

CSS:
```scss
.specializations-block {
  margin-top: 16px; padding: 16px; background: #F7F8FC;
  border: 1.5px solid #E2E6F0; border-radius: 10px;
}
.spec-block-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 12px;
  .spec-heading { font-weight: 600; font-size: 14px; }
  .spec-hint { font-size: 12px; color: var(--text-3); }
}
.spec-checkboxes-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  @include mobile { grid-template-columns: 1fr; }
}
.spec-check-item {
  display: flex; align-items: center; gap: 10px;
  cursor: pointer; padding: 8px 12px;
  background: white; border: 1.5px solid #E2E6F0;
  border-radius: 8px; transition: border-color 0.15s;

  input[type="checkbox"] {
    width: 16px; height: 16px; accent-color: var(--red);
    flex-shrink: 0; cursor: pointer;
  }
  .spec-label-text { font-size: 13px; }

  &:has(input:checked) {
    border-color: var(--red);
    background: #FEF2F2;
    .spec-label-text { color: var(--red); font-weight: 500; }
  }
  &:hover { border-color: var(--red); }
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 4 — APP LOGO (favicon + brand)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The user uploaded the S-Network logo (red/blue circular icon with S-N letters).
Replace the default Angular favicon and set it as the app icon.

4a. Save the uploaded logo as src/assets/images/snetwork-logo.png

4b. Generate favicon sizes using the logo.
    Create these files in src/:
    - favicon.ico  (convert logo to .ico)
    - favicon-16x16.png
    - favicon-32x32.png
    - apple-touch-icon.png (180x180)

    Since we can't auto-generate, create an SVG favicon that matches the logo:

    Create src/favicon.svg:
    ```svg
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#0A1628" stroke="#CC0000" stroke-width="4"/>
      <circle cx="50" cy="50" r="38" fill="#0A1628"/>
      <!-- S letter -->
      <text x="20" y="65" font-family="Arial Black, sans-serif"
            font-size="42" font-weight="900" fill="#CC0000">S</text>
      <!-- N letter with navy fill + chrome outline to match logo -->
      <text x="54" y="65" font-family="Arial Black, sans-serif"
            font-size="42" font-weight="900" fill="#CC0000"
            stroke="#0A1628" stroke-width="1">N</text>
    </svg>
    ```

4c. Update src/index.html — replace default favicon lines:

```html
<head>
  <meta charset="utf-8">
  <title>S-Network — Find. Verify. Build.</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="favicon.svg">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="assets/images/snetwork-logo.png">

  <!-- SEO Meta -->
  <meta name="description" content="S-Network — India's trusted platform for finding verified construction professionals. Find contractors, architects, interior designers and more.">
  <meta name="theme-color" content="#0A1628">

  <!-- Open Graph -->
  <meta property="og:title" content="S-Network — Find. Verify. Build.">
  <meta property="og:description" content="Find verified construction professionals near you.">
  <meta property="og:image" content="assets/images/snetwork-logo.png">
  <meta property="og:type" content="website">

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
</head>
```

4d. Copy the uploaded logo file to src/assets/images/snetwork-logo.png
    (the user's uploaded logo — the red/blue circular S-N icon)

4e. In angular.json assets array, ensure these are included:
```json
"assets": [
  "src/favicon.ico",
  "src/favicon.svg",
  "src/assets"
]
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 5 — WELCOME SPLASH SCREEN (first visit only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Show an animated splash screen when a user FIRST visits the site.
After the animation, never show it again (use sessionStorage).
The animation plays BEFORE the home page content appears.

5a. Create src/app/shared/components/splash-screen/splash-screen.component.ts:

```typescript
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="splash-overlay" [class.fade-out]="fading">
      <div class="splash-content">
        <!-- Logo Animation -->
        <div class="splash-logo" [class.logo-appear]="logoVisible">
          <div class="logo-circle">
            <div class="logo-inner">
              <span class="logo-s">S</span>
              <span class="logo-dash">-</span>
              <span class="logo-n">N</span>
            </div>
          </div>
          <div class="logo-rings">
            <div class="ring ring-1"></div>
            <div class="ring ring-2"></div>
            <div class="ring ring-3"></div>
          </div>
        </div>

        <!-- Brand Name -->
        <div class="splash-brand" [class.brand-appear]="brandVisible">
          <span class="brand-s">S</span><span class="brand-dash">-</span><span class="brand-n">N</span><span class="brand-rest">etwork</span>
        </div>

        <!-- Tagline -->
        <div class="splash-tagline" [class.tagline-appear]="taglineVisible">
          Find. Verify. Build.
        </div>

        <!-- Loading bar -->
        <div class="splash-progress" [class.progress-appear]="progressVisible">
          <div class="progress-bar" [style.width]="progress + '%'"></div>
        </div>

        <!-- Animated particles -->
        <div class="particles">
          <div *ngFor="let p of particles" class="particle"
               [style.left]="p.x + '%'"
               [style.top]="p.y + '%'"
               [style.width]="p.size + 'px'"
               [style.height]="p.size + 'px'"
               [style.animation-delay]="p.delay + 's'"
               [style.animation-duration]="p.duration + 's'">
          </div>
        </div>

        <!-- Construction icons floating -->
        <div class="floating-icons">
          <span class="float-icon fi-1">🏗️</span>
          <span class="float-icon fi-2">📐</span>
          <span class="float-icon fi-3">🔧</span>
          <span class="float-icon fi-4">⚡</span>
          <span class="float-icon fi-5">🏠</span>
          <span class="float-icon fi-6">🎨</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./splash-screen.component.scss']
})
export class SplashScreenComponent implements OnInit {
  @Output() splashDone = new EventEmitter<void>();

  logoVisible = false;
  brandVisible = false;
  taglineVisible = false;
  progressVisible = false;
  fading = false;
  progress = 0;

  particles = Array.from({ length: 20 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 3
  }));

  ngOnInit(): void {
    // Sequence the animations
    setTimeout(() => this.logoVisible = true, 200);
    setTimeout(() => this.brandVisible = true, 800);
    setTimeout(() => this.taglineVisible = true, 1300);
    setTimeout(() => this.progressVisible = true, 1600);

    // Animate progress bar
    let prog = 0;
    const interval = setInterval(() => {
      prog += 2;
      this.progress = prog;
      if (prog >= 100) {
        clearInterval(interval);
        // Start fade out
        setTimeout(() => {
          this.fading = true;
          setTimeout(() => this.splashDone.emit(), 600);
        }, 200);
      }
    }, 30); // 100 steps × 30ms = 3 seconds total
  }
}
```

5b. Create splash-screen.component.scss:

```scss
.splash-overlay {
  position: fixed; inset: 0; z-index: 99999;
  background: linear-gradient(135deg, #0A1628 0%, #0D1F3C 50%, #1B3A5C 100%);
  display: flex; align-items: center; justify-content: center;
  transition: opacity 0.6s ease, transform 0.6s ease;

  &.fade-out {
    opacity: 0; transform: scale(1.05); pointer-events: none;
  }
}

.splash-content {
  text-align: center; position: relative; z-index: 2;
}

// Logo circle with rings
.splash-logo {
  position: relative; display: inline-block;
  margin-bottom: 24px;
  opacity: 0; transform: scale(0.5);
  transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);

  &.logo-appear { opacity: 1; transform: scale(1); }
}

.logo-circle {
  width: 100px; height: 100px;
  background: linear-gradient(135deg, #CC0000, #990000);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 40px rgba(204,0,0,0.5), 0 0 80px rgba(204,0,0,0.2);
  position: relative; z-index: 2;
}

.logo-inner {
  font-size: 36px; font-weight: 900; color: white;
  font-family: 'Inter', sans-serif; letter-spacing: -2px;
  .logo-s, .logo-n { color: white; }
  .logo-dash { color: rgba(255,255,255,0.7); }
}

// Animated rings
.ring {
  position: absolute; border-radius: 50%;
  border: 2px solid rgba(204,0,0,0.3);
  top: 50%; left: 50%; transform: translate(-50%, -50%);
  animation: ring-pulse 2s ease-out infinite;
}
.ring-1 { width: 130px; height: 130px; animation-delay: 0s; }
.ring-2 { width: 170px; height: 170px; animation-delay: 0.4s; }
.ring-3 { width: 210px; height: 210px; animation-delay: 0.8s; }

@keyframes ring-pulse {
  0%   { opacity: 0.8; transform: translate(-50%, -50%) scale(0.8); }
  100% { opacity: 0;   transform: translate(-50%, -50%) scale(1.2); }
}

// Brand name
.splash-brand {
  font-size: 3rem; font-weight: 900; letter-spacing: -1px;
  margin-bottom: 8px;
  opacity: 0; transform: translateY(20px);
  transition: opacity 0.5s, transform 0.5s;
  &.brand-appear { opacity: 1; transform: translateY(0); }

  .brand-s, .brand-n { color: #CC0000; }
  .brand-dash { color: rgba(255,255,255,0.5); }
  .brand-rest { color: white; }
}

// Tagline
.splash-tagline {
  font-size: 1rem; color: rgba(255,255,255,0.6);
  letter-spacing: 4px; text-transform: uppercase;
  font-weight: 400; margin-bottom: 40px;
  opacity: 0; transition: opacity 0.5s;
  &.tagline-appear { opacity: 1; }
}

// Progress bar
.splash-progress {
  width: 200px; height: 3px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px; margin: 0 auto;
  overflow: hidden;
  opacity: 0; transition: opacity 0.3s;
  &.progress-appear { opacity: 1; }
}
.progress-bar {
  height: 100%; background: linear-gradient(90deg, #CC0000, #FF4444);
  border-radius: 3px; transition: width 0.03s linear;
  box-shadow: 0 0 10px rgba(204,0,0,0.5);
}

// Particles
.particles { position: absolute; inset: -200px; pointer-events: none; z-index: 1; }
.particle {
  position: absolute; border-radius: 50%;
  background: rgba(204,0,0,0.4);
  animation: float-particle linear infinite;
}
@keyframes float-particle {
  0%   { opacity: 0; transform: translateY(0) scale(0); }
  20%  { opacity: 1; }
  80%  { opacity: 1; }
  100% { opacity: 0; transform: translateY(-100px) scale(1); }
}

// Floating icons
.floating-icons { position: absolute; inset: -300px; pointer-events: none; z-index: 1; }
.float-icon {
  position: absolute; font-size: 24px; opacity: 0.15;
  animation: float-icon 4s ease-in-out infinite;
}
.fi-1 { left: 10%; top: 20%; animation-delay: 0s; }
.fi-2 { left: 80%; top: 15%; animation-delay: 0.5s; }
.fi-3 { left: 15%; top: 70%; animation-delay: 1s; }
.fi-4 { left: 85%; top: 65%; animation-delay: 1.5s; }
.fi-5 { left: 50%; top: 10%; animation-delay: 0.3s; }
.fi-6 { left: 40%; top: 85%; animation-delay: 0.8s; }

@keyframes float-icon {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%       { transform: translateY(-20px) rotate(10deg); }
}
```

5c. In app.component.ts, show splash only on FIRST visit per session:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SplashScreenComponent } from './shared/components/splash-screen/splash-screen.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SplashScreenComponent],
  template: `
    <app-splash-screen
      *ngIf="showSplash"
      (splashDone)="onSplashDone()">
    </app-splash-screen>

    <div [class.hidden-until-splash]="showSplash">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .hidden-until-splash {
      visibility: hidden;
      opacity: 0;
      transition: opacity 0.5s ease 0.3s, visibility 0s 0s;
    }
    .hidden-until-splash.visible {
      visibility: visible;
      opacity: 1;
    }
  `]
})
export class AppComponent implements OnInit {
  showSplash = false;

  ngOnInit(): void {
    // Only show splash on first visit per browser session
    const seen = sessionStorage.getItem('snetwork-splash-seen');
    if (!seen) {
      this.showSplash = true;
    }
  }

  onSplashDone(): void {
    this.showSplash = false;
    sessionStorage.setItem('snetwork-splash-seen', '1');
    // Make app content visible
    document.querySelector('.hidden-until-splash')?.classList.add('visible');
  }
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 6 — REGISTRATION ROLE SELECTION FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current flow: Register → confusing form with hidden role toggle
New flow: Register → Role Selection page → User form OR Vendor form

6a. Create src/app/modules/auth/role-select/role-select.component.ts:

```typescript
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-role-select',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="role-select-page">
      <div class="role-select-container">
        <!-- Header -->
        <div class="role-header">
          <a routerLink="/" class="back-link">← Back</a>
          <div class="sn-logo">
            <span class="red">S</span>-<span class="red">N</span>etwork
          </div>
          <h1>Join S-Network</h1>
          <p>Choose how you want to use S-Network</p>
        </div>

        <!-- Role Cards -->
        <div class="role-cards">

          <button class="role-card user-card" (click)="selectRole('user')">
            <div class="role-card-icon">👤</div>
            <h2>I'm Looking for Services</h2>
            <p>Find and hire verified construction professionals near you</p>
            <ul class="role-benefits">
              <li>✓ Search thousands of professionals</li>
              <li>✓ Send quote requests instantly</li>
              <li>✓ Read reviews and compare</li>
              <li>✓ Track your enquiries</li>
            </ul>
            <div class="role-cta">Register as User →</div>
          </button>

          <div class="role-divider">
            <span>OR</span>
          </div>

          <button class="role-card vendor-card" (click)="selectRole('vendor')">
            <div class="role-card-icon">🏗️</div>
            <h2>I'm a Construction Professional</h2>
            <p>List your business and start receiving leads from customers</p>
            <ul class="role-benefits">
              <li>✓ Free business listing</li>
              <li>✓ Receive project enquiries</li>
              <li>✓ Get Verified badge</li>
              <li>✓ Build your portfolio</li>
            </ul>
            <div class="role-cta vendor-cta">Register as Vendor →</div>
          </button>
        </div>

        <p class="login-link">
          Already have an account? <a routerLink="/auth/login">Login here</a>
        </p>
      </div>
    </div>
  `,
  styleUrls: ['./role-select.component.scss']
})
export class RoleSelectComponent {
  constructor(private router: Router) {}

  selectRole(role: 'user' | 'vendor'): void {
    this.router.navigate(['/auth/register'], { queryParams: { role } });
  }
}
```

6b. role-select.component.scss:

```scss
.role-select-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0A1628 0%, #0D1F3C 100%);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}

.role-select-container {
  width: 100%; max-width: 900px;
}

.role-header {
  text-align: center; margin-bottom: 40px; color: white;

  .back-link {
    color: rgba(255,255,255,0.6); text-decoration: none;
    font-size: 14px; display: block; margin-bottom: 16px;
    &:hover { color: white; }
  }

  .sn-logo {
    font-size: 2rem; font-weight: 900; margin-bottom: 16px;
    .red { color: #CC0000; }
  }

  h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 8px; }
  p  { font-size: 1.1rem; color: rgba(255,255,255,0.7); }
}

.role-cards {
  display: flex; gap: 24px; align-items: stretch;

  @media (max-width: 640px) {
    flex-direction: column;
  }
}

.role-card {
  flex: 1; background: white; border-radius: 20px;
  padding: 36px 28px; text-align: left; cursor: pointer;
  border: 3px solid transparent; transition: all 0.2s;
  display: flex; flex-direction: column; gap: 12px;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  }

  .role-card-icon { font-size: 48px; display: block; }

  h2 { font-size: 1.3rem; font-weight: 800; color: #0A1628; }
  p  { font-size: 14px; color: #6B7299; line-height: 1.5; }

  .role-benefits {
    list-style: none; padding: 0; margin: 8px 0;
    li { font-size: 13px; color: #444; padding: 4px 0; }
  }

  .role-cta {
    margin-top: auto; padding: 14px 24px;
    background: #0A1628; color: white;
    border-radius: 10px; font-weight: 700; font-size: 15px;
    text-align: center;
  }
}

.user-card {
  &:hover { border-color: #0A1628; }
  &:hover .role-cta { background: #0D1F3C; }
}

.vendor-card {
  border-color: #CC0000;
  background: linear-gradient(135deg, #fff 0%, #FFF5F5 100%);

  &:hover { border-color: #990000; box-shadow: 0 20px 60px rgba(204,0,0,0.2); }

  .vendor-cta {
    background: #CC0000 !important;
    &:hover { background: #990000 !important; }
  }
}

.role-divider {
  display: flex; align-items: center; color: rgba(255,255,255,0.5);
  font-weight: 600; font-size: 14px;

  @media (min-width: 641px) {
    flex-direction: column;
    &::before, &::after {
      content: ''; flex: 1; width: 1px;
      background: rgba(255,255,255,0.2); margin: 8px 0;
    }
  }
  @media (max-width: 640px) {
    &::before, &::after {
      content: ''; flex: 1; height: 1px;
      background: rgba(255,255,255,0.2); margin: 0 8px;
    }
  }
}

.login-link {
  text-align: center; margin-top: 24px;
  color: rgba(255,255,255,0.6); font-size: 14px;
  a { color: #CC0000; font-weight: 600; text-decoration: none;
      &:hover { text-decoration: underline; } }
}
```

6c. Update the register route to go through role-select first:

In app.routes.ts:
```typescript
{ path: 'auth/register', component: RoleSelectComponent },
{ path: 'auth/register/user', component: UserRegisterComponent },
{ path: 'auth/register/vendor', component: VendorRegisterComponent },
```

OR keep the single register component but update RoleSelectComponent to navigate:
```typescript
selectRole('user')   → router.navigate(['/auth/register/user'])
selectRole('vendor') → router.navigate(['/auth/register/vendor'])
```

6d. Update the existing register component to read the `role` query param:

```typescript
ngOnInit(): void {
  const role = this.route.snapshot.queryParams['role'];
  if (role) {
    this.selectedRole = role; // pre-select the role
    if (role === 'vendor') {
      this.currentStep = 1; // start at business details for vendors
    }
  }
  this.loadCategories();
}
```

6e. All "Register" buttons/links throughout the app now point to:
```typescript
this.router.navigate(['/auth/register']); // goes to role select
```
Replace any direct links to /auth/register with this route.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 7 — CATEGORY GROUP IMAGE NAMES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The grouped category section images don't show their names.
The names must appear below each image, visible on both desktop and mobile.
Clicking an image must search for that term.

Fix home.component.html grouped category section:

```html
<section class="section grouped-categories">
  <div class="container">
    <div class="grouped-grid">
      <div *ngFor="let group of categoryGroups" class="group-card card">
        <h3 class="group-title">{{ group.title }}</h3>
        <div class="group-items">
          <a *ngFor="let item of group.items"
             [routerLink]="['/search']"
             [queryParams]="{q: item.name}"
             class="group-item-link">
            <div class="group-item-img-wrap">
              <img [src]="item.image" [alt]="item.name" loading="lazy"
                   (error)="onImgError($event)">
            </div>
            <span class="group-item-name">{{ item.name }}</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</section>
```

CSS for group items WITH NAMES:
```scss
.group-card {
  padding: 20px;
  .group-title {
    font-size: 1rem; font-weight: 700; color: var(--text-1);
    margin-bottom: 16px; padding-bottom: 10px;
    border-bottom: 2px solid var(--surface-2);
  }
}

.group-items {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
}

.group-item-link {
  text-decoration: none; display: flex; flex-direction: column;
  align-items: center; gap: 8px; cursor: pointer;
  transition: transform 0.2s;
  &:hover { transform: translateY(-3px); }
  &:hover .group-item-name { color: var(--red); }
}

.group-item-img-wrap {
  width: 100%; border-radius: 10px; overflow: hidden;
  aspect-ratio: 4/3;

  img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 0.3s;
  }
  &:hover img { transform: scale(1.05); }
}

.group-item-name {
  font-size: 12px; font-weight: 600; color: var(--text-2);
  text-align: center; line-height: 1.3;
  width: 100%; // ensure text wraps within card

  @include mobile { font-size: 11px; }
}
```

ALSO fix the mobile layout for grouped categories:
```scss
.grouped-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @include tablet { grid-template-columns: 1fr 1fr; }
  @include mobile {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

// On mobile, show items in a horizontal scroll row
@include mobile {
  .group-items {
    display: flex; overflow-x: auto; gap: 10px;
    padding-bottom: 8px;
    scrollbar-width: none; // hide scrollbar Firefox
    &::-webkit-scrollbar { display: none; }

    .group-item-link {
      flex-shrink: 0; width: 120px;
    }

    .group-item-img-wrap {
      width: 120px; height: 90px;
      aspect-ratio: unset;
    }

    .group-item-name { font-size: 11px; max-width: 120px; }
  }
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL BUILD + DEPLOY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```bash
ng build --configuration production
# Fix all errors
npm run build:ssr   # if using SSR

# Deploy to VPS
cd /var/www/S-Network/build-connect-web && git pull
npm ci && npm run build
rm -rf /var/www/snetwork/*
cp -r dist/build-connect-web/browser/* /var/www/snetwork/
systemctl reload nginx
```

VERIFY:
[ ] Browser tab shows S-Network favicon (not Angular 'A')
[ ] Browser tab title shows "S-Network — Find. Verify. Build."
[ ] First visit: splash animation plays (~3 seconds) then home appears
[ ] Second visit (same session): no splash, home loads immediately
[ ] /auth/register shows role selection page (two big cards: User + Vendor)
[ ] Clicking "Register as User" → user registration form
[ ] Clicking "Register as Vendor" → vendor registration form
[ ] Vendor registration: select category → specializations appear immediately
[ ] Category group images all have names below them
[ ] Clicking group image → searches for that term
[ ] Names visible on mobile (horizontal scroll)
[ ] No realtime subscription error in browser console
[ ] Notification bell works without errors
[ ] approve-vendor works from admin panel
```
