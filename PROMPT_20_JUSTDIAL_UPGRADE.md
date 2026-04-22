# S-Network — PROMPT 20
## Justdial-Level UI Upgrade + Mobile App Complete Fix
## FOR GEMINI PRO (2.5) — paste memory_v7.md first

> Read memory_v7.md before starting.
> This covers: full web UI rebuild to Justdial standard, complete mobile fix,
> custom SVG icon system, all broken features.
> No stubs. No placeholders. Production-ready complete code.

---

## CONTEXT: What Justdial looks like (from screenshots analyzed)

Justdial's layout pattern (which S-Network must match):
1. Sticky top navbar: logo + city dropdown + search bar + mic icon + search button + action links + Login button
2. Full-width banner carousel (auto-playing with dots) + 4 vertical featured category cards beside it
3. Horizontal icon grid: 10+ category icons with rounded-square cards
4. Grouped category sections (2-column grid, each group has 3 sub-items with real photos)
5. "Popular Searches" large cards with background images + title overlay + "Enquire Now" button
6. About/SEO text section
7. Popular Categories with horizontal tab bar + subcategory link grid
8. Footer: 4-column layout with quick links, categories, copyright

Business profile layout:
1. Breadcrumb navigation
2. 5-panel image mosaic (1 large + 4 small, with "+N More" overlay)
3. Business name + rating + "Claimed" badge + years in business
4. Action bar: Phone | Enquire Now | WhatsApp | Share | Edit
5. Tab row: Overview | Catalogue | Quick Info | Services | Photos | Reviews
6. Content sections below tabs

---

## PART 1 — ANGULAR WEB: COMPLETE UI REBUILD

### 1.1 Global Styles (src/styles.scss) — complete replacement:

```scss
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

:root {
  /* S-Network Design Tokens */
  --red:         #CC0000;
  --red-dark:    #990000;
  --red-light:   #FFEBEB;
  --navy:        #0A1628;
  --navy-2:      #0D1F3C;
  --navy-light:  #1B3A5C;
  --white:       #FFFFFF;
  --surface:     #F7F8FC;
  --surface-2:   #ECEEF5;
  --text-1:      #1A1A2E;
  --text-2:      #444B5D;
  --text-3:      #7B8299;
  --border:      #E2E6F0;
  --shadow-sm:   0 1px 4px rgba(0,0,0,0.08);
  --shadow-md:   0 4px 16px rgba(0,0,0,0.10);
  --shadow-lg:   0 8px 32px rgba(0,0,0,0.12);
  --radius-sm:   6px;
  --radius-md:   12px;
  --radius-lg:   20px;
  --radius-xl:   28px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--surface);
  color: var(--text-1);
  font-size: 14px;
  line-height: 1.5;
}

/* Typography */
h1 { font-size: 2rem; font-weight: 800; }
h2 { font-size: 1.5rem; font-weight: 700; }
h3 { font-size: 1.125rem; font-weight: 600; }

/* Buttons */
.btn-red {
  background: var(--red);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  &:hover { background: var(--red-dark); }
  &:active { transform: scale(0.98); }
}
.btn-navy {
  background: var(--navy);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  &:hover { background: var(--navy-2); }
}
.btn-outline {
  background: transparent;
  color: var(--red);
  border: 1.5px solid var(--red);
  padding: 9px 20px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  &:hover { background: var(--red-light); }
}
.btn-green {
  background: #16A34A;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
}

/* Cards */
.card {
  background: var(--white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
  overflow: hidden;
}
.card-hover {
  transition: box-shadow 0.2s, transform 0.2s;
  &:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
}

/* Section */
.section { padding: 32px 0; }
.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-1);
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 3px solid var(--red);
  display: inline-block;
}
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Chips/Badges */
.badge-verified { background: #DCFCE7; color: #16A34A; font-size: 11px; padding: 3px 8px; border-radius: 999px; font-weight: 600; }
.badge-new { background: #DBEAFE; color: #1D4ED8; font-size: 11px; padding: 3px 8px; border-radius: 999px; }
.badge-premium { background: #FEF3C7; color: #92400E; font-size: 11px; padding: 3px 8px; border-radius: 999px; }
.badge-red { background: var(--red-light); color: var(--red); font-size: 11px; padding: 3px 8px; border-radius: 999px; font-weight: 600; }

/* Stars */
.stars-green { color: #16A34A; font-weight: 700; background: #DCFCE7; padding: 2px 8px; border-radius: 4px; font-size: 13px; }

/* Input */
.form-input {
  width: 100%; padding: 10px 14px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  transition: border-color 0.15s;
  &:focus { outline: none; border-color: var(--red); box-shadow: 0 0 0 3px rgba(204,0,0,0.08); }
}

/* Logo */
.sn-logo { font-family: 'Inter', sans-serif; font-weight: 900; font-size: 1.5rem; letter-spacing: -0.5px; }
.sn-logo .red { color: var(--red); }

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-thumb { background: var(--surface-2); border-radius: 3px; }
```

---

### 1.2 Top Navbar Component — Justdial-style (sticky, full-featured):

File: `src/app/shared/components/navbar/navbar.component.html`

```html
<header class="navbar-wrapper">
  <nav class="navbar-main">
    <div class="navbar-inner">

      <!-- Logo -->
      <a routerLink="/" class="sn-logo navbar-logo">
        <span class="red">S</span>-<span class="red">N</span>etwork
      </a>

      <!-- City Selector -->
      <div class="city-selector" (click)="toggleCityDropdown()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          <circle cx="12" cy="9" r="2.5"/>
        </svg>
        <span>{{ selectedCity || 'Select City' }}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
      </div>

      <!-- Search Bar -->
      <div class="navbar-search">
        <input
          type="text"
          [(ngModel)]="searchQuery"
          (keyup)="onSearchKeyup($event)"
          (input)="onSearchInput()"
          placeholder="Search for contractors, architects, interior designers..."
          class="search-input"
        />
        <button class="search-mic-btn" (click)="startVoiceSearch()" title="Voice Search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
          </svg>
        </button>
        <button class="search-btn btn-red" (click)="doSearch()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </button>
        <!-- Autocomplete dropdown -->
        <div class="autocomplete-panel" *ngIf="autocompleteResults.length && searchQuery">
          <div class="autocomplete-item" *ngFor="let r of autocompleteResults" (click)="selectSuggestion(r)">
            <span class="ac-icon">🔍</span>
            <div>
              <div class="ac-name">{{ r.name }}</div>
              <div class="ac-sub">{{ r.category }} • {{ r.city }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Actions -->
      <div class="navbar-actions">
        <!-- Leads (for vendors) -->
        <a routerLink="/vendor/leads" *ngIf="currentUser?.role === 'vendor'" class="nav-action-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.95 8.81 19.79 19.79 0 01.88 2.18 2 2 0 012.88 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L7.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/></svg>
          Leads
        </a>

        <!-- List Your Business -->
        <a routerLink="/auth/register" *ngIf="!currentUser" class="nav-action-btn nav-free-listing">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          Free Listing
        </a>

        <!-- Notifications bell -->
        <div class="nav-bell" *ngIf="currentUser" (click)="toggleNotifications()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          <span class="bell-badge" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
        </div>

        <!-- Login/User -->
        <ng-container *ngIf="!currentUser; else userMenu">
          <button class="btn-navy login-btn" (click)="goToLogin()">Login / Sign Up</button>
        </ng-container>
        <ng-template #userMenu>
          <div class="user-avatar-menu" (click)="toggleUserMenu()">
            <div class="avatar-circle">{{ currentUser.name?.charAt(0) | uppercase }}</div>
            <span class="user-name-sm">{{ currentUser.name?.split(' ')[0] }}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
            <div class="user-dropdown" *ngIf="showUserMenu">
              <a routerLink="/vendor/dashboard" *ngIf="currentUser.role === 'vendor'" class="dd-item">📊 Dashboard</a>
              <a routerLink="/vendor/leads" *ngIf="currentUser.role === 'vendor'" class="dd-item">📋 My Leads</a>
              <a routerLink="/admin" *ngIf="currentUser.role === 'admin'" class="dd-item">⚙️ Admin Panel</a>
              <a routerLink="/profile" *ngIf="currentUser.role === 'user'" class="dd-item">👤 My Profile</a>
              <a routerLink="/saved" *ngIf="currentUser.role === 'user'" class="dd-item">❤️ Saved</a>
              <a routerLink="/notifications" class="dd-item">🔔 Notifications</a>
              <hr>
              <button (click)="authService.logout()" class="dd-item logout">🚪 Logout</button>
            </div>
          </div>
        </ng-template>
      </div>
    </div>
  </nav>
</header>
```

Navbar CSS (add to navbar.component.scss):
```scss
.navbar-wrapper {
  position: sticky; top: 0; z-index: 1000;
  background: var(--navy);
  box-shadow: 0 2px 12px rgba(0,0,0,0.25);
}
.navbar-inner {
  max-width: 1440px; margin: 0 auto;
  padding: 10px 24px;
  display: flex; align-items: center; gap: 12px;
}
.navbar-logo {
  color: white; text-decoration: none;
  font-size: 1.6rem; font-weight: 900;
  white-space: nowrap; flex-shrink: 0;
}
.city-selector {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.12);
  color: white; padding: 8px 14px;
  border-radius: var(--radius-sm);
  cursor: pointer; white-space: nowrap;
  font-size: 13px; flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.2);
  &:hover { background: rgba(255,255,255,0.18); }
}
.navbar-search {
  flex: 1; position: relative;
  display: flex; align-items: center;
  background: white; border-radius: var(--radius-sm);
  overflow: visible;
}
.search-input {
  flex: 1; border: none; padding: 10px 14px;
  font-size: 14px; background: transparent;
  &:focus { outline: none; }
}
.search-mic-btn {
  background: none; border: none;
  padding: 8px; color: var(--text-3);
  cursor: pointer; display: flex;
  &:hover { color: var(--red); }
}
.search-btn {
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0 !important;
  padding: 10px 18px !important;
}
.autocomplete-panel {
  position: absolute; top: calc(100% + 4px);
  left: 0; right: 0;
  background: white; border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border);
  z-index: 2000; max-height: 320px; overflow-y: auto;
}
.autocomplete-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 16px; cursor: pointer;
  &:hover { background: var(--surface); }
}
.ac-name { font-weight: 500; font-size: 14px; }
.ac-sub { font-size: 12px; color: var(--text-3); }
.navbar-actions {
  display: flex; align-items: center; gap: 8px;
  flex-shrink: 0;
}
.nav-action-btn {
  display: flex; align-items: center; gap: 6px;
  color: rgba(255,255,255,0.85); padding: 7px 12px;
  border-radius: var(--radius-sm); font-size: 13px;
  text-decoration: none; cursor: pointer;
  border: 1px solid rgba(255,255,255,0.25);
  &:hover { background: rgba(255,255,255,0.12); color: white; }
}
.nav-free-listing { border-color: #FFD700; color: #FFD700; }
.nav-bell {
  position: relative; cursor: pointer; color: white;
  padding: 8px; border-radius: 50%;
  &:hover { background: rgba(255,255,255,0.12); }
}
.bell-badge {
  position: absolute; top: 2px; right: 2px;
  background: var(--red); color: white;
  font-size: 10px; font-weight: 700;
  min-width: 16px; height: 16px;
  border-radius: 8px; display: flex;
  align-items: center; justify-content: center;
  padding: 0 3px;
}
.login-btn { padding: 8px 20px !important; font-size: 14px !important; }
.user-avatar-menu {
  position: relative; display: flex; align-items: center;
  gap: 8px; cursor: pointer; color: white;
  padding: 6px 10px; border-radius: var(--radius-sm);
  &:hover { background: rgba(255,255,255,0.12); }
}
.avatar-circle {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--red); color: white;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px;
}
.user-name-sm { font-size: 13px; }
.user-dropdown {
  position: absolute; top: calc(100% + 8px); right: 0;
  background: white; border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg); border: 1px solid var(--border);
  min-width: 200px; z-index: 2000; overflow: hidden;
}
.dd-item {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 16px; font-size: 14px; color: var(--text-2);
  text-decoration: none; cursor: pointer;
  &:hover { background: var(--surface); color: var(--red); }
}
.dd-item.logout { color: var(--red); border: none; background: none; width: 100%; text-align: left; }
hr { border: none; border-top: 1px solid var(--border); margin: 4px 0; }
```

---

### 1.3 Home Page — Complete Justdial-Level Layout

File: `src/app/modules/user/home/home.component.html`

```html
<!-- HERO SECTION -->
<section class="hero-section">
  <div class="hero-inner container">

    <!-- Left: Banner Carousel -->
    <div class="hero-banner">
      <div class="banner-slides">
        <div class="banner-slide" *ngFor="let slide of bannerSlides; let i = index"
             [class.active]="i === activeBannerIndex">
          <img [src]="slide.image" [alt]="slide.title" loading="lazy">
          <div class="banner-overlay">
            <h2>{{ slide.title }}</h2>
            <p>{{ slide.subtitle }}</p>
            <a [routerLink]="slide.link" class="btn-red">{{ slide.cta }}</a>
          </div>
        </div>
      </div>
      <button class="banner-prev" (click)="prevSlide()">‹</button>
      <button class="banner-next" (click)="nextSlide()">›</button>
      <div class="banner-dots">
        <span *ngFor="let s of bannerSlides; let i = index"
              [class.active]="i === activeBannerIndex"
              (click)="activeBannerIndex = i"></span>
      </div>
    </div>

    <!-- Right: Featured Category Cards -->
    <div class="hero-featured-cards">
      <a *ngFor="let fc of featuredCards" [routerLink]="fc.link" class="featured-card">
        <img [src]="fc.image" [alt]="fc.title" loading="lazy">
        <div class="featured-card-content">
          <div class="fc-badge">{{ fc.badge }}</div>
          <h3>{{ fc.title }}</h3>
          <p>{{ fc.desc }}</p>
        </div>
        <span class="fc-arrow">›</span>
      </a>
    </div>
  </div>
</section>

<!-- SEARCH BAR (mobile only — desktop in navbar) -->
<section class="mobile-search-bar d-md-none">
  <div class="container">
    <div class="mobile-search-inner">
      <input type="text" [(ngModel)]="searchQuery" placeholder="What are you looking for?" class="form-input">
      <select [(ngModel)]="selectedCity" class="city-select">
        <option value="">All Cities</option>
        <option *ngFor="let city of cities" [value]="city">{{ city }}</option>
      </select>
      <button class="btn-red" (click)="doSearch()">Search</button>
    </div>
  </div>
</section>

<!-- CATEGORY ICON GRID -->
<section class="section category-section">
  <div class="container">
    <div class="categories-grid">
      <a *ngFor="let cat of categories"
         [routerLink]="['/search']"
         [queryParams]="{category: cat.slug}"
         class="category-icon-card card-hover">
        <div class="cat-icon-wrap" [style.background]="cat.bgColor">
          <img [src]="cat.iconSvg" [alt]="cat.name" class="cat-icon-img" loading="lazy">
        </div>
        <span class="cat-name">{{ cat.name }}</span>
      </a>
    </div>
  </div>
</section>

<!-- GROUPED CATEGORY SECTIONS -->
<section class="section grouped-categories">
  <div class="container">
    <div class="grouped-grid">
      <div *ngFor="let group of categoryGroups" class="group-card card">
        <h3 class="group-title">{{ group.title }}</h3>
        <div class="group-items">
          <a *ngFor="let item of group.items"
             [routerLink]="['/search']"
             [queryParams]="{q: item.name}"
             class="group-item">
            <img [src]="item.image" [alt]="item.name" loading="lazy">
            <span>{{ item.name }}</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- POPULAR SEARCHES -->
<section class="section popular-section" *ngIf="popularSearches.length">
  <div class="container">
    <h2 class="section-title">Popular Searches</h2>
    <div class="popular-grid">
      <a *ngFor="let ps of popularSearches"
         [routerLink]="['/search']"
         [queryParams]="{q: ps.term}"
         class="popular-card card-hover">
        <img [src]="ps.image" [alt]="ps.term" loading="lazy">
        <div class="popular-overlay">
          <h4>{{ ps.term }}</h4>
          <span class="btn-outline-white">Enquire Now</span>
        </div>
      </a>
    </div>
  </div>
</section>

<!-- FEATURED VENDORS -->
<section class="section" *ngIf="featuredVendors.length">
  <div class="container">
    <div class="section-header">
      <h2 class="section-title">Featured Professionals</h2>
      <a routerLink="/search" class="see-all">See All →</a>
    </div>
    <div class="vendors-horizontal-scroll">
      <app-business-card *ngFor="let v of featuredVendors" [business]="v"></app-business-card>
    </div>
  </div>
</section>

<!-- TOP RATED THIS WEEK -->
<section class="section bg-navy-section">
  <div class="container">
    <h2 class="section-title light">Top Rated in {{ selectedCity || 'Your City' }}</h2>
    <div class="top-rated-grid">
      <app-business-card *ngFor="let v of topRatedVendors" [business]="v" [compact]="true"></app-business-card>
    </div>
  </div>
</section>

<!-- HOW IT WORKS -->
<section class="section how-section">
  <div class="container">
    <h2 class="section-title">How S-Network Works</h2>
    <div class="how-steps">
      <div class="how-step">
        <div class="step-icon">🔍</div>
        <h3>Search</h3>
        <p>Find verified construction professionals in your area by category or keyword</p>
      </div>
      <div class="how-arrow">→</div>
      <div class="how-step">
        <div class="step-icon">📋</div>
        <h3>Compare</h3>
        <p>View portfolios, read reviews, check verification status and ratings</p>
      </div>
      <div class="how-arrow">→</div>
      <div class="how-step">
        <div class="step-icon">💬</div>
        <h3>Connect</h3>
        <p>Send a quote request and get connected with the right professional</p>
      </div>
      <div class="how-arrow">→</div>
      <div class="how-step">
        <div class="step-icon">🏗️</div>
        <h3>Build</h3>
        <p>Work with trusted verified vendors and track your project progress</p>
      </div>
    </div>
  </div>
</section>

<!-- ABOUT SECTION -->
<section class="section about-section">
  <div class="container">
    <h2>India's Construction Professional Network</h2>
    <p>S-Network connects homeowners, real estate investors, and businesses with verified construction professionals across India. Find civil contractors, architects, interior designers, electricians, plumbers, and material suppliers — all verified with GST/MSME documents.</p>
    <div class="about-stats">
      <div class="stat"><span class="stat-num">500+</span><span class="stat-label">Verified Vendors</span></div>
      <div class="stat"><span class="stat-num">10K+</span><span class="stat-label">Leads Generated</span></div>
      <div class="stat"><span class="stat-num">50+</span><span class="stat-label">Cities Covered</span></div>
      <div class="stat"><span class="stat-num">4.8★</span><span class="stat-label">Average Rating</span></div>
    </div>
  </div>
</section>

<!-- POPULAR CATEGORIES (tab + links) -->
<section class="section pop-categories-section">
  <div class="container">
    <h2 class="section-title">Popular Categories</h2>
    <div class="pop-cat-tabs">
      <button *ngFor="let cat of categories" (click)="selectedPopCat = cat.slug"
              [class.active]="selectedPopCat === cat.slug"
              class="pop-cat-tab">{{ cat.name }}</button>
    </div>
    <div class="pop-cat-links">
      <a *ngFor="let link of getPopCatLinks(selectedPopCat)"
         [routerLink]="['/search']" [queryParams]="{q: link}"
         class="pop-cat-link">{{ link }}</a>
    </div>
  </div>
</section>

<!-- MOBILE APP BANNER -->
<section class="app-banner-section">
  <div class="container">
    <div class="app-banner">
      <div class="app-banner-text">
        <h3>📱 Get Instant Lead Notifications</h3>
        <p>Download the S-Network app and receive real-time alerts for every new enquiry</p>
        <a href="#" class="btn-red">Download App</a>
      </div>
      <img src="assets/images/app-mockup.png" alt="S-Network App" class="app-mockup" loading="lazy">
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer class="site-footer">
  <div class="footer-top">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col">
          <div class="sn-logo footer-logo"><span class="red">S</span>-<span class="red">N</span>etwork</div>
          <p>India's trusted platform for finding verified construction professionals.</p>
          <div class="footer-social">
            <a href="#" aria-label="Facebook">📘</a>
            <a href="#" aria-label="Instagram">📸</a>
            <a href="#" aria-label="LinkedIn">💼</a>
            <a href="#" aria-label="Twitter">🐦</a>
          </div>
        </div>
        <div class="footer-col">
          <h4>Quick Links</h4>
          <a routerLink="/">Home</a>
          <a routerLink="/search">Browse Vendors</a>
          <a routerLink="/auth/register">List Your Business</a>
          <a routerLink="/auth/login">Login</a>
          <a routerLink="/about">About Us</a>
          <a routerLink="/contact">Contact</a>
        </div>
        <div class="footer-col">
          <h4>Categories</h4>
          <a *ngFor="let cat of categories" [routerLink]="['/search']" [queryParams]="{category: cat.slug}">
            {{ cat.name }}
          </a>
        </div>
        <div class="footer-col">
          <h4>For Vendors</h4>
          <a routerLink="/auth/register">Free Listing</a>
          <a routerLink="/vendor/dashboard">Vendor Dashboard</a>
          <a routerLink="/vendor/leads">Manage Leads</a>
          <a routerLink="/pricing">Pricing Plans</a>
          <h4 style="margin-top:20px">Legal</h4>
          <a routerLink="/privacy">Privacy Policy</a>
          <a routerLink="/terms">Terms of Service</a>
        </div>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="container">
      <p>© 2025 S-Network. All rights reserved. | <a routerLink="/privacy">Privacy</a> | <a routerLink="/terms">Terms</a></p>
    </div>
  </div>
</footer>
```

### 1.4 Home Component TypeScript:

```typescript
// home.component.ts
export class HomeComponent implements OnInit, OnDestroy {
  categories: any[] = [];
  featuredVendors: any[] = [];
  topRatedVendors: any[] = [];
  popularSearches: any[] = [];
  currentUser: any = null;
  selectedCity = '';
  searchQuery = '';
  activeBannerIndex = 0;
  selectedPopCat = '';
  autocompleteResults: any[] = [];
  cities = ['Chennai', 'Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad'];
  private bannerInterval: any;

  // Construction-specific banner slides
  bannerSlides = [
    { title: 'Build Your Dream Home', subtitle: 'Connect with verified contractors across India', cta: 'Find Contractors', link: '/search', image: 'assets/images/banner-construction.jpg' },
    { title: 'Trusted Architects Near You', subtitle: 'Licensed professionals with proven portfolios', cta: 'Browse Architects', link: '/search?category=architect', image: 'assets/images/banner-architect.jpg' },
    { title: 'Interior Design Services', subtitle: 'Transform your space with expert designers', cta: 'Explore Designs', link: '/search?category=interior-designer', image: 'assets/images/banner-interior.jpg' },
  ];

  // Featured category cards beside banner
  featuredCards = [
    { title: 'Civil Contractors', badge: 'VERIFIED', desc: 'Get instant quotes', link: '/search?category=civil-contractor', image: 'assets/images/fc-contractor.jpg' },
    { title: 'Architects', badge: 'PREMIUM', desc: 'Licensed professionals', link: '/search?category=architect', image: 'assets/images/fc-architect.jpg' },
    { title: 'Interior Designers', badge: 'TOP RATED', desc: 'Award-winning designs', link: '/search?category=interior-designer', image: 'assets/images/fc-interior.jpg' },
    { title: 'Material Suppliers', badge: 'BEST PRICE', desc: 'Bulk pricing available', link: '/search?category=material-supplier', image: 'assets/images/fc-material.jpg' },
  ];

  // Grouped category sections
  categoryGroups = [
    {
      title: 'Construction & Building',
      items: [
        { name: 'House Construction', image: 'assets/images/house-construction.jpg' },
        { name: 'Commercial Buildings', image: 'assets/images/commercial-building.jpg' },
        { name: 'Renovation Work', image: 'assets/images/renovation.jpg' },
      ]
    },
    {
      title: 'Interior & Design',
      items: [
        { name: 'Modular Kitchen', image: 'assets/images/kitchen.jpg' },
        { name: 'Living Room Design', image: 'assets/images/living-room.jpg' },
        { name: 'Bedroom Interior', image: 'assets/images/bedroom.jpg' },
      ]
    },
    {
      title: 'Electrical & Plumbing',
      items: [
        { name: 'Home Wiring', image: 'assets/images/wiring.jpg' },
        { name: 'Waterproofing', image: 'assets/images/waterproofing.jpg' },
        { name: 'Sanitary Fitting', image: 'assets/images/sanitary.jpg' },
      ]
    },
    {
      title: 'Windows & Finishing',
      items: [
        { name: 'UPVC Windows', image: 'assets/images/windows.jpg' },
        { name: 'False Ceiling', image: 'assets/images/false-ceiling.jpg' },
        { name: 'Flooring Work', image: 'assets/images/flooring.jpg' },
      ]
    },
  ];

  popularSearches = [
    { term: 'Civil Contractors in Chennai', image: 'assets/images/ps-civil.jpg' },
    { term: 'Interior Designers in Mumbai', image: 'assets/images/ps-interior.jpg' },
    { term: 'House Construction Cost', image: 'assets/images/ps-house.jpg' },
    { term: 'Commercial Contractors', image: 'assets/images/ps-commercial.jpg' },
    { term: 'Modular Kitchen Designers', image: 'assets/images/ps-kitchen.jpg' },
  ];

  // Popular category subcategory links
  popCatLinks: Record<string, string[]> = {
    'civil-contractor': ['Residential Construction', 'Commercial Building', 'Foundation Work', 'Waterproofing', 'Renovation', 'RCC Work', 'Brick Work', 'Plastering', 'Tiling Work', 'Painting'],
    'architect': ['Residential Architect', 'Commercial Architect', '3D Elevation', 'Building Plan', 'Vastu Consultant', 'Landscape Design', 'Green Building'],
    'interior-designer': ['Modular Kitchen', 'Living Room', 'Bedroom Design', 'Office Interior', 'Hotel Interior', 'Retail Store', 'False Ceiling'],
    'electrician': ['Home Wiring', 'Industrial Wiring', 'Switchboard Installation', 'CCTV Installation', 'Solar Panel', 'Generator Installation'],
    'plumber': ['Pipe Fitting', 'Drainage', 'Waterproofing', 'Bathroom Fitting', 'Water Tank', 'Hot Water Heater'],
    'material-supplier': ['Cement Supplier', 'Steel Supplier', 'Bricks Supplier', 'Sand Supplier', 'Tiles Supplier', 'Paint Supplier'],
  };

  getPopCatLinks(slug: string): string[] {
    return this.popCatLinks[slug] ?? [];
  }

  ngOnInit() {
    this.loadHomeData();
    this.startBannerAutoplay();
    this.loadCurrentUser();
  }

  async loadHomeData() {
    // Load categories
    const { data: cats } = await this.supabase.client.from('categories').select('*').order('name');
    this.categories = (cats ?? []).map((c, i) => ({
      ...c,
      bgColor: ['#FEE2E2','#DBEAFE','#DCF5E7','#FEF3C7','#EDE9FE','#FCE7F3','#E0F2FE','#F0FDF4','#FFF7ED'][i % 9],
      iconSvg: `assets/icons/${c.slug}.svg`
    }));
    this.selectedPopCat = this.categories[0]?.slug ?? '';

    // Load featured vendors via edge function
    const { data: homepage } = await this.supabase.client.functions.invoke('get-homepage-data', {
      body: { city: this.selectedCity }
    });
    if (homepage) {
      this.featuredVendors = homepage.featured ?? homepage.top_rated?.slice(0, 6) ?? [];
      this.topRatedVendors = homepage.top_rated ?? [];
    }
  }

  async loadCurrentUser() {
    const { data: { session } } = await this.supabase.client.auth.getSession();
    if (session) {
      const { data } = await this.supabase.client.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      this.currentUser = data;
    }
  }

  startBannerAutoplay() {
    this.bannerInterval = setInterval(() => {
      this.activeBannerIndex = (this.activeBannerIndex + 1) % this.bannerSlides.length;
    }, 5000);
  }

  nextSlide() { this.activeBannerIndex = (this.activeBannerIndex + 1) % this.bannerSlides.length; }
  prevSlide() { this.activeBannerIndex = (this.activeBannerIndex - 1 + this.bannerSlides.length) % this.bannerSlides.length; }

  doSearch() {
    if (!this.searchQuery.trim() && !this.selectedCity) return;
    this.router.navigate(['/search'], { queryParams: { q: this.searchQuery, city: this.selectedCity } });
  }

  ngOnDestroy() { clearInterval(this.bannerInterval); }
}
```

---

### 1.5 Business Card Component (reusable):

```typescript
// business-card.component.ts + .html
// Used on home, search results, similar businesses everywhere
```

```html
<div class="biz-card card card-hover" (click)="openProfile()">
  <!-- Cover Image -->
  <div class="biz-img-wrap">
    <img [src]="business.cover_image_url || 'assets/images/placeholder-business.jpg'"
         [alt]="business.name" loading="lazy" class="biz-img">
    <div class="biz-badges">
      <span class="badge-verified" *ngIf="business.is_verified">✓ Verified</span>
      <span class="badge-premium" *ngIf="business.is_premium">★ Premium</span>
    </div>
    <button class="biz-save-btn" (click)="toggleSave($event)"
            [class.saved]="isSaved" title="Save">
      <svg width="16" height="16" viewBox="0 0 24 24" [attr.fill]="isSaved ? '#CC0000' : 'none'" stroke="#CC0000" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </button>
  </div>

  <!-- Content -->
  <div class="biz-content">
    <div class="biz-header">
      <h3 class="biz-name">{{ business.name }}</h3>
      <div class="biz-rating" *ngIf="business.rating > 0">
        <span class="stars-green">{{ business.rating | number:'1.1-1' }} ★</span>
        <span class="review-count">({{ business.total_reviews || 0 }})</span>
      </div>
    </div>

    <div class="biz-meta">
      <span class="biz-category">{{ business.categories?.name }}</span>
      <span class="sep">•</span>
      <span class="biz-city">📍 {{ business.city }}</span>
    </div>

    <div class="biz-open-status">
      <span class="status-open" *ngIf="isOpen">● Open Now</span>
      <span class="status-closed" *ngIf="!isOpen && business.working_hours">● Closed</span>
      <span class="biz-years" *ngIf="business.year_established">
        {{ currentYear - business.year_established }}+ Yrs Exp
      </span>
    </div>

    <!-- Actions -->
    <div class="biz-actions">
      <button class="biz-action-btn call" (click)="callBusiness($event)" title="Call">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>
        Call
      </button>
      <button class="biz-action-btn enquire" (click)="enquireNow($event)">
        📋 Enquire Now
      </button>
      <button class="biz-action-btn whatsapp" (click)="openWhatsApp($event)" *ngIf="business.whatsapp" title="WhatsApp">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/></svg>
      </button>
    </div>
  </div>
</div>
```

---

### 1.6 Business Profile Page — Justdial-Level:

```html
<!-- Breadcrumb -->
<div class="breadcrumb-bar">
  <div class="container">
    <nav>
      <a routerLink="/">Home</a> ›
      <a [routerLink]="['/search']" [queryParams]="{category: business?.category_id}">{{ business?.categories?.name }}</a> ›
      <a [routerLink]="['/search']" [queryParams]="{city: business?.city}">{{ business?.city }}</a> ›
      <span>{{ business?.name }}</span>
    </nav>
  </div>
</div>

<!-- Image Mosaic (Justdial style: 1 large + 4 small) -->
<section class="profile-gallery">
  <div class="container">
    <div class="gallery-mosaic">
      <div class="gallery-main">
        <img [src]="images[0]?.image_url || 'assets/images/placeholder-business.jpg'"
             [alt]="business?.name" loading="lazy" (click)="openLightbox(0)">
      </div>
      <div class="gallery-grid">
        <div *ngFor="let img of images.slice(1, 5); let i = index" class="gallery-thumb">
          <img [src]="img.image_url" [alt]="business?.name + ' photo ' + (i+2)" loading="lazy" (click)="openLightbox(i+1)">
          <div class="more-overlay" *ngIf="i === 3 && images.length > 5" (click)="openLightbox(4)">
            <span>+{{ images.length - 4 }} More</span>
          </div>
        </div>
        <div class="gallery-add" *ngIf="isOwner" (click)="openPortfolioEditor()">
          <span>📷 Add Photo</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Business Header -->
<section class="profile-header-section">
  <div class="container">
    <div class="profile-header">
      <div class="profile-header-left">
        <div class="biz-logo-circle" *ngIf="!business?.logo_url">
          {{ business?.name?.charAt(0) | uppercase }}
        </div>
        <div class="profile-title-group">
          <h1 class="biz-title">{{ business?.name }}</h1>
          <div class="profile-meta-row">
            <span class="stars-green" *ngIf="business?.rating > 0">{{ business?.rating | number:'1.1-1' }} ★</span>
            <span class="review-count" *ngIf="business?.total_reviews">({{ business?.total_reviews }} Ratings)</span>
            <span class="badge-verified" *ngIf="business?.is_verified">✓ Verified</span>
            <span class="years-badge" *ngIf="business?.year_established">{{ currentYear - business?.year_established }} Years in Business</span>
          </div>
          <div class="profile-location-row">
            <span>📍 {{ business?.address }}, {{ business?.city }}</span>
            <span class="open-status" [class.open]="isOpenNow" [class.closed]="!isOpenNow">
              {{ isOpenNow ? '● Opens Now' : '● Closed' }}
              <span *ngIf="nextOpenTime">· Opens {{ nextOpenTime }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Rating input for user -->
      <div class="click-to-rate" *ngIf="currentUser && !hasReviewed">
        <span class="rate-label">Click to Rate:</span>
        <div class="star-rater">
          <span *ngFor="let s of [1,2,3,4,5]" (click)="openRateModal(s)"
                [class.filled]="s <= hoverRating" (mouseenter)="hoverRating = s" (mouseleave)="hoverRating = 0">
            ★
          </span>
        </div>
      </div>
    </div>

    <!-- Action Bar -->
    <div class="profile-actions-bar">
      <button class="action-btn-primary call-btn" (click)="callBusiness()">
        📞 {{ business?.phone }}
      </button>
      <button class="action-btn-primary enquire-btn" (click)="openEnquireForm()">
        💬 Enquire Now
      </button>
      <button class="action-btn-secondary whatsapp-btn" (click)="openWhatsApp()" *ngIf="business?.whatsapp">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><!-- WhatsApp SVG --></svg>
        WhatsApp
      </button>
      <button class="action-btn-icon" (click)="shareProfile()">📤</button>
      <button class="action-btn-icon" (click)="toggleSave()">{{ isSaved ? '❤️' : '🤍' }}</button>
      <a [routerLink]="['/vendor/profile']" *ngIf="isOwner" class="action-btn-secondary">✏️ Edit</a>
    </div>

    <!-- Tab Navigation -->
    <div class="profile-tabs">
      <button *ngFor="let tab of profileTabs" (click)="activeTab = tab.id"
              [class.active]="activeTab === tab.id" class="profile-tab">
        {{ tab.label }}
        <span class="tab-dot" *ngIf="tab.hasData">●</span>
      </button>
    </div>
  </div>
</section>

<!-- Tab Content -->
<section class="profile-tab-content">
  <div class="container profile-content-grid">
    <!-- Main content -->
    <div class="profile-main">
      <!-- Overview Tab -->
      <div *ngIf="activeTab === 'overview'">
        <div class="content-section">
          <h3>About {{ business?.name }}</h3>
          <p>{{ business?.description }}</p>
        </div>
        <div class="content-section" *ngIf="services.length">
          <h3>Services Offered</h3>
          <div class="services-chips">
            <span *ngFor="let s of services" class="service-chip">{{ s.service_name }}</span>
          </div>
        </div>
        <div class="content-section" *ngIf="business?.service_areas?.length">
          <h3>Areas Served</h3>
          <div class="services-chips">
            <span *ngFor="let a of business?.service_areas" class="service-chip area">📍 {{ a }}</span>
          </div>
        </div>
      </div>

      <!-- Photos Tab -->
      <div *ngIf="activeTab === 'photos'" class="photos-grid">
        <img *ngFor="let img of images; let i = index"
             [src]="img.image_url" [alt]="'Photo ' + (i+1)"
             loading="lazy" (click)="openLightbox(i)" class="photo-thumb">
      </div>

      <!-- Reviews Tab -->
      <div *ngIf="activeTab === 'reviews'">
        <div class="rating-summary" *ngIf="business?.total_reviews > 0">
          <div class="overall-rating">
            <span class="big-rating">{{ business?.rating | number:'1.1-1' }}</span>
            <span class="stars-green big-stars">{{ getStarString(business?.rating) }}</span>
            <span class="total-reviews">{{ business?.total_reviews }} Ratings</span>
          </div>
          <div class="rating-bars">
            <div *ngFor="let bar of ratingBars" class="rating-bar-row">
              <span>{{ bar.stars }}★</span>
              <div class="bar-track"><div class="bar-fill" [style.width]="bar.percent + '%'"></div></div>
              <span>{{ bar.count }}</span>
            </div>
          </div>
        </div>
        <button class="btn-red write-review-btn" *ngIf="currentUser" (click)="openReviewModal()">Write a Review</button>
        <div class="reviews-list">
          <div *ngFor="let review of reviews" class="review-card">
            <div class="review-header">
              <div class="reviewer-avatar">{{ review.profiles?.name?.charAt(0) | uppercase }}</div>
              <div>
                <div class="reviewer-name">{{ review.profiles?.name }}</div>
                <div class="review-date">{{ review.created_at | date:'mediumDate' }}</div>
              </div>
              <span class="stars-green">{{ review.rating }} ★</span>
            </div>
            <p class="review-text">{{ review.comment }}</p>
            <div class="vendor-reply" *ngIf="review.vendor_reply">
              <strong>Owner replied:</strong> {{ review.vendor_reply }}
            </div>
            <button class="helpful-btn" (click)="markHelpful(review.id)">
              👍 Helpful ({{ review.helpful_count || 0 }})
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Info Tab -->
      <div *ngIf="activeTab === 'info'" class="quick-info-grid">
        <div class="info-row" *ngIf="business?.phone"><span>📞 Phone</span><span>{{ business.phone }}</span></div>
        <div class="info-row" *ngIf="business?.whatsapp"><span>💬 WhatsApp</span><span>{{ business.whatsapp }}</span></div>
        <div class="info-row" *ngIf="business?.website_url"><span>🌐 Website</span><a [href]="business.website_url" target="_blank">{{ business.website_url }}</a></div>
        <div class="info-row" *ngIf="business?.year_established"><span>📅 Year Est.</span><span>{{ business.year_established }}</span></div>
        <div class="info-row" *ngIf="business?.employee_count"><span>👥 Team Size</span><span>{{ business.employee_count }}</span></div>
        <div class="working-hours" *ngIf="business?.working_hours">
          <h4>Working Hours</h4>
          <div *ngFor="let day of workingHoursList" class="hour-row">
            <span>{{ day.name }}</span>
            <span [class.closed-day]="!day.isOpen">{{ day.isOpen ? day.hours : 'Closed' }}</span>
          </div>
        </div>
        <!-- Map -->
        <div class="map-embed" *ngIf="business?.location">
          <iframe [src]="getMapUrl()" width="100%" height="250" frameborder="0" loading="lazy" allowfullscreen></iframe>
          <a [href]="getDirectionsUrl()" target="_blank" class="btn-outline" style="margin-top:8px">Get Directions →</a>
        </div>
      </div>
    </div>

    <!-- Sidebar -->
    <div class="profile-sidebar">
      <!-- Quick Enquiry Form -->
      <div class="card enquiry-card">
        <h3>📋 Send Enquiry</h3>
        <form (ngSubmit)="submitEnquiry()">
          <select [(ngModel)]="enquiryForm.project_type" name="project_type" class="form-input" required>
            <option value="">Select Project Type</option>
            <option value="New Construction">New Construction</option>
            <option value="Renovation">Renovation</option>
            <option value="Interior Design">Interior Design</option>
            <option value="Electrical Work">Electrical Work</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Other">Other</option>
          </select>
          <div class="budget-row">
            <input type="number" [(ngModel)]="enquiryForm.budget_min" name="bmin" placeholder="Min Budget ₹" class="form-input">
            <input type="number" [(ngModel)]="enquiryForm.budget_max" name="bmax" placeholder="Max Budget ₹" class="form-input">
          </div>
          <textarea [(ngModel)]="enquiryForm.message" name="message" placeholder="Describe your requirement..." rows="3" class="form-input"></textarea>
          <input type="text" [(ngModel)]="enquiryForm.user_name" name="uname" placeholder="Your Name" class="form-input">
          <input type="tel" [(ngModel)]="enquiryForm.user_phone" name="uphone" placeholder="Your Phone" class="form-input">
          <button type="submit" class="btn-red" style="width:100%" [disabled]="submitting">
            {{ submitting ? 'Sending...' : 'Send Enquiry' }}
          </button>
        </form>
        <p class="privacy-note">Your details are shared only with this business.</p>
      </div>

      <!-- Similar Businesses -->
      <div class="similar-businesses" *ngIf="similarBusinesses.length">
        <h3>Similar Businesses</h3>
        <div *ngFor="let sim of similarBusinesses" class="similar-item" (click)="goTo(sim.slug)">
          <img [src]="sim.cover_image_url || 'assets/images/placeholder-business.jpg'" [alt]="sim.name" loading="lazy">
          <div>
            <div class="sim-name">{{ sim.name }}</div>
            <div class="sim-rating" *ngIf="sim.rating > 0">{{ sim.rating }} ★ · {{ sim.city }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

---

## PART 2 — FLUTTER: COMPLETE WORKING APP

### 2.1 main.dart — Final (hardcoded, crash-proof):

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
    anonKey: 'YOUR_ACTUAL_ANON_KEY_HERE',
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

### 2.2 AppTheme — New colors:

```dart
import 'package:flutter/material.dart';

class AppColors {
  static const red         = Color(0xFFCC0000);
  static const redDark     = Color(0xFF990000);
  static const redLight    = Color(0xFFFFEBEB);
  static const navy        = Color(0xFF0A1628);
  static const navy2       = Color(0xFF0D1F3C);
  static const surface     = Color(0xFFF7F8FC);
  static const white       = Colors.white;
  static const textMain    = Color(0xFF1A1A2E);
  static const textMuted   = Color(0xFF7B8299);
  static const border      = Color(0xFFE2E6F0);
  static const success     = Color(0xFF16A34A);
  static const green       = Color(0xFF25D366); // WhatsApp
}

class AppTheme {
  static ThemeData get theme => ThemeData(
    useMaterial3: true,
    colorScheme: const ColorScheme(
      brightness: Brightness.light,
      primary: AppColors.red,
      onPrimary: Colors.white,
      secondary: AppColors.navy,
      onSecondary: Colors.white,
      surface: AppColors.surface,
      onSurface: AppColors.textMain,
      error: Colors.red,
      onError: Colors.white,
    ),
    scaffoldBackgroundColor: AppColors.surface,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.navy,
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: Colors.white,
        fontSize: 18,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.red,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.red,
        side: const BorderSide(color: AppColors.red, width: 1.5),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.border)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.border)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.red, width: 2)),
      errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Colors.red)),
      hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 14),
    ),
    cardTheme: CardTheme(
      elevation: 1,
      shadowColor: Colors.black12,
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: AppColors.border, width: 1)),
      margin: const EdgeInsets.symmetric(horizontal: 0, vertical: 4),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: AppColors.navy,
      selectedItemColor: AppColors.red,
      unselectedItemColor: Colors.white54,
      showUnselectedLabels: true,
      type: BottomNavigationBarType.fixed,
      elevation: 8,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: AppColors.surface,
      selectedColor: AppColors.redLight,
      labelStyle: const TextStyle(fontSize: 12),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
    ),
  );
}
```

### 2.3 Complete router.dart:

[Use the complete router from PROMPT 19 Part B2 — with ShellRoute for vendor bottom nav]
Add these additional routes:
- GoRoute(path: '/business/:slug', builder: ...) 
- GoRoute(path: '/search/results', builder: ...)
- GoRoute(path: '/notifications', builder: ...)
- GoRoute(path: '/profile', builder: ...)
- GoRoute(path: '/saved', builder: ...)

### 2.4 HomeScreen — Complete Flutter:

Build with these sections (ScrollView → Column):
1. SliverAppBar with search bar pinned
2. Category grid (GridView, 3 cols, 3 rows, 9 categories)
3. "Near Me" button row
4. Featured vendors horizontal scroll
5. Top rated section title + listview
6. Login/register banner if not logged in

Each section uses real Supabase data. Show shimmer loading state.
Handle errors with retry button. Never show blank screen.

### 2.5 Fix all broken mobile features:

SEARCH:
- SearchScreen: text field + city dropdown + search button
- On submit: navigate to SearchResultsScreen with params
- SearchResultsScreen: fetches from businesses table with filters
- Filter bottom sheet: category, city, rating, verified toggle
- Sort options: Relevance, Rating, Distance, Newest
- Pagination: 20 per page, load more on scroll

BUSINESS PROFILE:
- PageView for images with dots indicator
- All sections: about, services, working hours, reviews
- Sticky bottom action bar: Call | WhatsApp | Get Quote
- LeadFormBottomSheet: all fields, calls create-lead
- Review modal: star selector + text
- Similar businesses section

AUTH:
- LoginScreen: email+password + Google OAuth tab
- RegisterScreen: 3-step for vendors, 1-step for users
- Fix: after register → session immediately checked → route by role

VENDOR DASHBOARD (fix all broken):
- Stats cards showing real numbers (never NaN)
- Recent leads list
- Verification status banner
- Quick actions

VENDOR LEADS:
- TabBar with badge counts
- LeadCard with all user details
- Status update via dropdown
- Vendor notes auto-save
- WhatsApp/call buttons functional

NOTIFICATIONS:
- Real-time subscription working
- Badge count on app bar
- Tap to navigate

---

## PART 3 — BACKEND FIXES

### 3.1 Deploy all edge functions with CORS + error handling:

Every function needs at top:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, PATCH, DELETE',
};
if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
```

All responses wrap with: `headers: { ...corsHeaders, 'Content-Type': 'application/json' }`

### 3.2 Run this SQL in Supabase:

```sql
-- Add cover_image_url to businesses (computed from first business_image)
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS cover_image_url text;

-- Update existing businesses
UPDATE businesses b
SET cover_image_url = (
  SELECT image_url FROM business_images bi
  WHERE bi.business_id = b.id
  ORDER BY created_at LIMIT 1
)
WHERE cover_image_url IS NULL;

-- Create function to auto-update cover on image insert
CREATE OR REPLACE FUNCTION update_business_cover()
RETURNS trigger AS $$
BEGIN
  UPDATE businesses 
  SET cover_image_url = NEW.image_url
  WHERE id = NEW.business_id AND cover_image_url IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_business_image_insert ON business_images;
CREATE TRIGGER on_business_image_insert
  AFTER INSERT ON business_images
  FOR EACH ROW EXECUTE FUNCTION update_business_cover();
```

---

## PART 4 — FINAL VALIDATION

Build and test:
1. `ng build --configuration production` → zero errors
2. `flutter clean && flutter build apk --release --no-shrink` → zero errors
3. Install APK → app opens, does NOT crash
4. Web home page matches Justdial layout (carousel + categories + groups)
5. Search returns results
6. Business profile shows all sections
7. Lead form submits without error
8. Vendor dashboard loads with real data
9. Admin panel fully functional
10. All navigation works on both platforms
```
