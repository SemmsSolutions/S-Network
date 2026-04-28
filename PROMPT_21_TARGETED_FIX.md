# S-Network — PROMPT 21 (TARGETED FIX)
## Fix all broken features from UI upgrade
## Run with Gemini Pro — paste memory_v8.md first

---

```
Read memory_v8.md. Three specific bugs are breaking the app right now.
Fix all of them plus every other broken item. No stubs. Complete code.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 1 — BROKEN SVG ICONS (404 errors)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The icon files assets/icons/*.svg do not exist. Instead of file references,
embed all category icons as inline SVG strings in the category data.

In home.component.ts, replace the iconSvg path with inline SVG content:

```typescript
getCategoryIcon(slug: string): string {
  const icons: Record<string, string> = {
    'civil-contractor': `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#FEE2E2"/>
      <path d="M8 30h24M12 30V18l8-8 8 8v12" stroke="#CC0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="16" y="22" width="8" height="8" rx="1" stroke="#CC0000" stroke-width="2"/>
    </svg>`,
    'residential-builder': `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#DBEAFE"/>
      <path d="M7 30h26M11 30V19l9-8 9 8v11" stroke="#1D4ED8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="15" y="23" width="4" height="7" rx="1" stroke="#1D4ED8" stroke-width="1.5"/>
      <rect x="21" y="23" width="4" height="4" rx="1" stroke="#1D4ED8" stroke-width="1.5"/>
    </svg>`,
    'commercial-contractor': `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#EDE9FE"/>
      <rect x="10" y="12" width="20" height="18" rx="1" stroke="#7C3AED" stroke-width="2"/>
      <path d="M14 30v-6h4v6M22 22h4v2h-4zM14 16h4v2h-4zM22 16h4v2h-4z" stroke="#7C3AED" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
    'turnkey-contractor': `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#FEF3C7"/>
      <path d="M22 13a6 6 0 11-8.5 8.5L9 26l-1.5 4 4-1.5 4.5-4.5A6 6 0 0122 13z" stroke="#D97706" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="22" cy="14" r="2" fill="#D97706"/>
    </svg>`,
    'architect': `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#DCFCE7"/>
      <path d="M12 30l8-18 8 18" stroke="#16A34A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M15 24h10" stroke="#16A34A" stroke-width="2" stroke-linecap="round"/>
      <path d="M20 12v-3M12 30h16" stroke="#16A34A" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
    'interior-designer': `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#FCE7F3"/>
      <rect x="10" y="10" width="20" height="20" rx="2" stroke="#DB2777" stroke-width="2"/>
      <path d="M10 18h20M18 10v20" stroke="#DB2777" stroke-width="1.5"/>
      <circle cx="24" cy="14" r="2" fill="#DB2777"/>
    </svg>`,
    'electrician': `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#FEF9C3"/>
      <path d="M22 10l-6 12h8l-6 8" stroke="#CA8A04" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    'plumber': `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#E0F2FE"/>
      <path d="M13 20h8a4 4 0 010 8H13" stroke="#0284C7" stroke-width="2" stroke-linecap="round"/>
      <path d="M13 12v16" stroke="#0284C7" stroke-width="2" stroke-linecap="round"/>
      <circle cx="27" cy="14" r="4" stroke="#0284C7" stroke-width="2"/>
      <path d="M27 11v3l2 2" stroke="#0284C7" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
    'material-supplier': `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#F0FDF4"/>
      <rect x="10" y="22" width="20" height="8" rx="1" stroke="#15803D" stroke-width="2"/>
      <path d="M13 22v-4a3 3 0 013-3h8a3 3 0 013 3v4" stroke="#15803D" stroke-width="2"/>
      <path d="M14 26h12" stroke="#15803D" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
  };
  return icons[slug] ?? `<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="10" fill="#F3F4F6"/><text x="20" y="25" text-anchor="middle" font-size="18">🏗️</text></svg>`;
}
```

In home.component.html, replace `<img [src]="cat.iconSvg">` with:
```html
<div class="cat-icon-wrap" [innerHTML]="getCategoryIcon(cat.slug)"></div>
```

In home.component.ts ngOnInit, remove the iconSvg mapping line entirely.
The getCategoryIcon() method handles everything.

ALSO: In app.module.ts or the relevant module, import DomSanitizer and mark
the innerHTML as safe in the category icon rendering OR use a pipe:

Create src/app/shared/pipes/safe-html.pipe.ts:
```typescript
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'safeHtml' })
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
```

Then in home.component.html:
```html
<div class="cat-icon-wrap" [innerHTML]="getCategoryIcon(cat.slug) | safeHtml"></div>
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 2 — BUSINESS NOT FOUND (400 error on profile)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The error is:
  GET /businesses?select=*&id=eq.semms-gen-ded3f315  → 400

The query is using `id=eq.` with a slug string. id is a UUID.
The fix: query must use `slug=eq.` when the param is a slug, not a UUID.

In business-profile.component.ts, fix the loadBusiness() method:

```typescript
async loadBusiness(slugOrId: string): Promise<void> {
  this.loading = true;
  this.error = null;
  
  try {
    // Determine if param is UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    
    const query = this.supabase.client
      .from('businesses')
      .select(`
        *,
        categories(name, slug, icon),
        business_images(id, image_url, caption),
        business_services(service_name)
      `);
    
    // Use correct filter based on param type
    if (isUUID) {
      query.eq('id', slugOrId);
    } else {
      query.eq('slug', slugOrId);
    }
    
    const { data, error } = await query.maybeSingle();
    
    if (error) {
      console.error('Business load error:', error);
      this.error = 'Failed to load business details.';
      return;
    }
    
    if (!data) {
      this.notFound = true;
      return;
    }
    
    this.business = data;
    this.images = data.business_images ?? [];
    this.services = data.business_services ?? [];
    this.isOpenNow = this.checkIfOpen(data.working_hours);
    
    // Load reviews separately
    await this.loadReviews(data.id);
    await this.loadSimilarBusinesses(data.category_id, data.city, data.id);
    
    // Increment view count (non-blocking)
    this.supabase.client.functions.invoke('increment-view-count', {
      body: { business_id: data.id }
    }).catch(() => {}); // ignore errors
    
  } catch (err) {
    console.error('Business profile error:', err);
    this.error = 'Something went wrong. Please try again.';
  } finally {
    this.loading = false;
  }
}
```

ALSO: Fix the route parameter extraction.
In ngOnInit:
```typescript
ngOnInit(): void {
  // Re-run on every navigation to this route (fixes stale data)
  this.route.paramMap.subscribe(params => {
    const slug = params.get('slug');
    if (slug) {
      this.resetState();
      this.loadBusiness(slug);
    }
  });
}

resetState(): void {
  this.business = null;
  this.images = [];
  this.services = [];
  this.reviews = [];
  this.similarBusinesses = [];
  this.notFound = false;
  this.error = null;
  this.loading = true;
}
```

ALSO: Fix the navigation links in business cards and search results.
BusinessCard must navigate using slug, not id:
```typescript
openProfile(): void {
  const identifier = this.business.slug ?? this.business.id;
  this.router.navigate(['/business', identifier]);
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 3 — HOME PAGE BLANK ON RETURN (critical)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The home page only shows on first visit. On return it's blank.
Root cause: Angular route reuse. When navigating away and back,
Angular may reuse the component instance. If ngOnInit already ran,
data loads again but async race condition causes blank render.
OR: the home component uses OnPush change detection and data
isn't triggering a re-render.

Fix ALL of these:

3a. In AppRoutingModule or app.routes.ts, disable route reuse for home:
```typescript
// In your Router config, add:
providers: [
  {
    provide: RouteReuseStrategy,
    useClass: NoReuseStrategy  // or DefaultUrlSerializer
  }
]

// Create this class:
export class NoReuseStrategy implements RouteReuseStrategy {
  shouldDetach(route: ActivatedRouteSnapshot): boolean { return false; }
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {}
  shouldAttach(route: ActivatedRouteSnapshot): boolean { return false; }
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null { return null; }
  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }
}
```

3b. In home.component.ts, use Router events to reload when returning:
```typescript
import { Router, NavigationEnd } from '@angular/router';

export class HomeComponent implements OnInit, OnDestroy {
  private routerSub?: Subscription;

  constructor(private router: Router, ...) {}

  ngOnInit(): void {
    // Load immediately
    this.loadHomeData();

    // Also reload whenever we navigate back to home
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      filter((event: NavigationEnd) => event.url === '/' || event.url === '/home')
    ).subscribe(() => {
      this.loadHomeData();
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }
}
```

3c. Fix the loadHomeData() to handle errors gracefully and ALWAYS
show something even if API calls fail:

```typescript
async loadHomeData(): Promise<void> {
  this.loading = true;

  try {
    // 1. Load categories (critical — page skeleton depends on this)
    const { data: cats, error: catError } = await this.supabase.client
      .from('categories')
      .select('id, name, slug, icon')
      .order('name');

    if (catError) {
      console.warn('Categories error:', catError);
      this.categories = this.getFallbackCategories(); // use hardcoded fallback
    } else {
      this.categories = cats ?? [];
    }

    // Set initial popular category
    if (this.categories.length && !this.selectedPopCat) {
      this.selectedPopCat = this.categories[0].slug;
    }

    // 2. Load vendors (non-critical — show empty state if fails)
    const { data: topVendors } = await this.supabase.client
      .from('businesses')
      .select('id, name, slug, city, rating, total_reviews, is_verified, is_premium, cover_image_url, categories(name)')
      .eq('is_active', true)
      .eq('is_verified', true)
      .order('rating', { ascending: false })
      .limit(8);

    this.topRatedVendors = topVendors ?? [];

    // 3. Try homepage edge function for featured vendors
    try {
      const { data: homepage } = await this.supabase.client.functions.invoke(
        'get-homepage-data',
        { body: { city: this.selectedCity || '' } }
      );
      if (homepage?.featured?.length) {
        this.featuredVendors = homepage.featured;
      } else {
        this.featuredVendors = this.topRatedVendors.slice(0, 4);
      }
    } catch {
      this.featuredVendors = this.topRatedVendors.slice(0, 4);
    }

  } catch (err) {
    console.error('Home load error:', err);
    this.categories = this.getFallbackCategories();
    this.featuredVendors = [];
    this.topRatedVendors = [];
  } finally {
    this.loading = false;
    // Force change detection
    this.cdr.detectChanges();
  }
}

// Fallback categories if DB fails
getFallbackCategories() {
  return [
    { id: '1', name: 'Architect', slug: 'architect' },
    { id: '2', name: 'Civil Contractor', slug: 'civil-contractor' },
    { id: '3', name: 'Commercial Contractor', slug: 'commercial-contractor' },
    { id: '4', name: 'Electrician', slug: 'electrician' },
    { id: '5', name: 'Interior Designer', slug: 'interior-designer' },
    { id: '6', name: 'Material Supplier', slug: 'material-supplier' },
    { id: '7', name: 'Plumber', slug: 'plumber' },
    { id: '8', name: 'Residential Builder', slug: 'residential-builder' },
    { id: '9', name: 'Turnkey Contractor', slug: 'turnkey-contractor' },
  ];
}
```

3d. Add ChangeDetectorRef injection and call detectChanges() after async loads:
```typescript
constructor(
  private supabase: SupabaseService,
  private router: Router,
  private cdr: ChangeDetectorRef
) {}
```

3e. In home.component.html, add loading and empty states:
```html
<!-- Loading state -->
<div *ngIf="loading" class="home-loading">
  <div class="container">
    <div class="skeleton-banner"></div>
    <div class="skeleton-categories-row"></div>
  </div>
</div>

<!-- Main content (show even if some data is missing) -->
<ng-container *ngIf="!loading">
  <!-- Hero section always shows (uses static bannerSlides) -->
  <!-- Categories shows fallback if empty -->
  <!-- Vendors shows empty state if no results -->
</ng-container>
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 4 — LOCATION/CITY SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The city selector needs to be a proper searchable dropdown.

4a. Create CityDropdownComponent:
    src/app/shared/components/city-dropdown/city-dropdown.component.ts

```typescript
@Component({
  selector: 'app-city-dropdown',
  template: `
    <div class="city-dropdown-wrapper" (clickOutside)="isOpen = false">
      <button class="city-btn" (click)="isOpen = !isOpen">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          <circle cx="12" cy="9" r="2.5"/>
        </svg>
        {{ selectedCity || 'Select City' }}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      <div class="city-panel" *ngIf="isOpen">
        <div class="city-search-wrap">
          <input
            type="text"
            [(ngModel)]="citySearch"
            placeholder="Search city..."
            class="city-search-input"
            (input)="filterCities()"
            #cityInput
          >
        </div>

        <div class="city-detect" (click)="detectCity()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          </svg>
          Detect my location
        </div>

        <div class="city-section-title">Popular Cities</div>
        <div class="city-list">
          <button
            *ngFor="let city of filteredCities"
            class="city-option"
            [class.selected]="city === selectedCity"
            (click)="selectCity(city)"
          >
            {{ city }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class CityDropdownComponent implements OnInit {
  @Input() selectedCity = '';
  @Output() cityChanged = new EventEmitter<string>();

  isOpen = false;
  citySearch = '';

  allCities = [
    'Chennai', 'Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Pune',
    'Kolkata', 'Ahmedabad', 'Coimbatore', 'Surat', 'Jaipur', 'Lucknow',
    'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam',
    'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana',
    'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali',
    'Vasai-Virar', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad'
  ];

  filteredCities = [...this.allCities];

  filterCities(): void {
    const q = this.citySearch.toLowerCase();
    this.filteredCities = this.allCities.filter(c => c.toLowerCase().includes(q));
  }

  selectCity(city: string): void {
    this.selectedCity = city;
    this.cityChanged.emit(city);
    this.isOpen = false;
    this.citySearch = '';
    this.filteredCities = [...this.allCities];
    // Persist city selection
    localStorage.setItem('snetwork-selected-city', city);
  }

  detectCity(): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        // Reverse geocode using free API
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          );
          const data = await resp.json();
          const city = data.address?.city ?? data.address?.town ?? data.address?.county ?? '';
          if (city) this.selectCity(city);
        } catch {
          console.warn('Reverse geocode failed');
        }
      },
      () => console.warn('Location permission denied')
    );
  }

  ngOnInit(): void {
    const saved = localStorage.getItem('snetwork-selected-city');
    if (saved && !this.selectedCity) {
      this.selectedCity = saved;
      this.cityChanged.emit(saved);
    }
  }
}
```

CSS for city dropdown:
```scss
.city-dropdown-wrapper { position: relative; }
.city-btn {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.25);
  color: white; padding: 8px 14px;
  border-radius: 6px; cursor: pointer;
  font-size: 13px; white-space: nowrap;
  &:hover { background: rgba(255,255,255,0.2); }
}
.city-panel {
  position: absolute; top: calc(100% + 6px); left: 0;
  width: 280px; background: white;
  border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  border: 1px solid #E2E6F0; z-index: 3000; overflow: hidden;
}
.city-search-wrap { padding: 12px; border-bottom: 1px solid #E2E6F0; }
.city-search-input {
  width: 100%; padding: 8px 12px; border: 1.5px solid #E2E6F0;
  border-radius: 6px; font-size: 13px;
  &:focus { outline: none; border-color: #CC0000; }
}
.city-detect {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; cursor: pointer; color: #CC0000;
  font-size: 13px; font-weight: 500;
  border-bottom: 1px solid #E2E6F0;
  &:hover { background: #FFF5F5; }
}
.city-section-title {
  padding: 8px 16px 4px;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; color: #7B8299; letter-spacing: 0.5px;
}
.city-list {
  display: flex; flex-wrap: wrap; gap: 6px;
  padding: 8px 12px 12px; max-height: 240px; overflow-y: auto;
}
.city-option {
  background: #F7F8FC; border: 1px solid #E2E6F0;
  border-radius: 6px; padding: 5px 12px;
  font-size: 12px; cursor: pointer; color: #444B5D;
  transition: all 0.15s;
  &:hover { background: #FEE2E2; border-color: #CC0000; color: #CC0000; }
  &.selected { background: #CC0000; border-color: #CC0000; color: white; }
}
```

4b. Use CityDropdownComponent in the navbar:
Replace `<div class="city-selector">` with:
```html
<app-city-dropdown
  [selectedCity]="selectedCity"
  (cityChanged)="onCityChange($event)">
</app-city-dropdown>
```

4c. In navbar.component.ts:
```typescript
selectedCity = '';
onCityChange(city: string): void {
  this.selectedCity = city;
  // Emit to home page if on home route
  this.cityService.setCity(city);
}
```

4d. Create CityService to share city across components:
```typescript
// city.service.ts
@Injectable({ providedIn: 'root' })
export class CityService {
  private city$ = new BehaviorSubject<string>(
    localStorage.getItem('snetwork-selected-city') ?? ''
  );
  currentCity$ = this.city$.asObservable();
  setCity(city: string): void {
    this.city$.next(city);
    localStorage.setItem('snetwork-selected-city', city);
  }
  getCity(): string { return this.city$.getValue(); }
}
```

4e. In home.component.ts, subscribe to city changes:
```typescript
ngOnInit(): void {
  this.cityService.currentCity$.subscribe(city => {
    this.selectedCity = city;
    this.loadHomeData(); // reload when city changes
  });
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 5 — BROKEN LINKS AND BUTTONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5a. Category cards clicking through to search:
Every category icon card must navigate to /search with the category param:
```typescript
onCategoryClick(cat: any): void {
  this.router.navigate(['/search'], {
    queryParams: { category: cat.slug, city: this.selectedCity || undefined }
  });
}
```
In HTML: `(click)="onCategoryClick(cat)"`  OR use `routerLink` with queryParams.
Do NOT use empty href="#" anywhere.

5b. Search bar — search button and Enter key:
```typescript
doSearch(): void {
  const q = this.searchQuery?.trim();
  const city = this.selectedCity?.trim();
  if (!q && !city) return; // Don't navigate with empty search
  this.router.navigate(['/search'], {
    queryParams: {
      ...(q && { q }),
      ...(city && { city })
    }
  });
}

onSearchKeyup(event: KeyboardEvent): void {
  if (event.key === 'Enter') this.doSearch();
}
```

5c. Search results page — load data from query params:
In search-results.component.ts:
```typescript
ngOnInit(): void {
  this.route.queryParamMap.subscribe(params => {
    this.searchQuery = params.get('q') ?? '';
    this.cityFilter = params.get('city') ?? '';
    this.categoryFilter = params.get('category') ?? '';
    this.loadResults(); // reload on every param change
  });
}

async loadResults(): Promise<void> {
  this.loading = true;
  this.results = [];

  try {
    let query = this.supabase.client
      .from('businesses')
      .select('id, name, slug, city, rating, total_reviews, is_verified, is_premium, cover_image_url, phone, whatsapp, year_established, categories(name, slug)')
      .eq('is_active', true)
      .order('is_premium', { ascending: false })
      .order('is_verified', { ascending: false })
      .order('rating', { ascending: false })
      .limit(20);

    if (this.categoryFilter) {
      // Filter by category slug
      const { data: cat } = await this.supabase.client
        .from('categories').select('id').eq('slug', this.categoryFilter).maybeSingle();
      if (cat) query = query.eq('category_id', cat.id);
    }

    if (this.cityFilter) {
      query = query.ilike('city', `%${this.cityFilter}%`);
    }

    if (this.searchQuery) {
      query = query.or(`name.ilike.%${this.searchQuery}%,description.ilike.%${this.searchQuery}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    this.results = data ?? [];

  } catch (err) {
    console.error('Search error:', err);
    this.results = [];
  } finally {
    this.loading = false;
    this.cdr.detectChanges();
  }
}
```

5d. Call/WhatsApp buttons on business cards:
```typescript
callBusiness(event: Event, phone: string): void {
  event.stopPropagation();
  if (!phone) return;
  window.open(`tel:${phone}`, '_self');
}

openWhatsApp(event: Event, phone: string): void {
  event.stopPropagation();
  if (!phone) return;
  const clean = phone.replace(/\D/g, '');
  const num = clean.startsWith('91') ? clean : `91${clean}`;
  window.open(`https://wa.me/${num}?text=Hi, I found your business on S-Network`, '_blank');
}
```

5e. Notification bell — link must navigate:
```typescript
onNotificationClick(notification: any): void {
  // Mark as read
  this.supabase.client.from('notifications')
    .update({ is_read: true })
    .eq('id', notification.id)
    .then(() => {});

  // Navigate based on type
  const routes: Record<string, string> = {
    'new_lead': '/vendor/leads',
    'verification_approved': '/vendor/dashboard',
    'verification_rejected': '/vendor/profile',
    'lead_status_update': '/profile',
  };
  const route = routes[notification.type] ?? '/notifications';
  this.router.navigate([route]);
  this.showNotifications = false;
}
```

5f. Footer links — add actual pages:
  /about → AboutComponent (simple text page)
  /contact → ContactComponent (form + details)
  /privacy → PrivacyComponent (privacy policy text)
  /terms → TermsComponent (terms of service text)

Create these as simple static components with appropriate content.
Register routes for each.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 6 — PUBLIC HOME PAGE (not logged in)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The home page is blank for public (non-logged-in) users.
This is because the AuthGuard is blocking the route OR
the home component relies on auth state before rendering.

6a. Confirm the root route has NO AuthGuard:
In app.routes.ts:
```typescript
{ path: '', component: HomeComponent },  // NO canActivate guard
{ path: 'home', redirectTo: '', pathMatch: 'full' },
```

6b. The home component must NOT depend on auth state to render:
```typescript
// WRONG:
ngOnInit() {
  this.authService.currentUser$.subscribe(user => {
    if (user) this.loadHomeData(); // blocks unauthenticated users
  });
}

// RIGHT:
ngOnInit() {
  this.loadHomeData(); // always load, regardless of auth state
  this.loadCurrentUser(); // separately, for personalization
}
```

6c. The navbar must render correctly for both states:
When no user: show Login / Register buttons
When user exists: show avatar + dropdown
This is already in the navbar template — ensure currentUser is properly set.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 7 — MISSING ASSET IMAGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The banner slides, grouped category sections, and popular searches
reference image files in assets/ that don't exist.

Fix: use reliable free image URLs instead of local assets.
Replace ALL assets/images/ references with Unsplash source URLs:

In home.component.ts:
```typescript
bannerSlides = [
  {
    title: 'Build Your Dream Home',
    subtitle: 'Connect with verified contractors across India',
    cta: 'Find Contractors',
    link: '/search',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80'
  },
  {
    title: 'Trusted Architects Near You',
    subtitle: 'Licensed professionals with proven portfolios',
    cta: 'Browse Architects',
    link: '/search?category=architect',
    image: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&q=80'
  },
  {
    title: 'Transform Your Interior',
    subtitle: 'Expert designers ready for your project',
    cta: 'Explore Designs',
    link: '/search?category=interior-designer',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80'
  },
];

featuredCards = [
  { title: 'Civil Contractors', badge: 'VERIFIED', desc: 'Get instant quotes', link: '/search?category=civil-contractor', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80' },
  { title: 'Architects', badge: 'PREMIUM', desc: 'Licensed professionals', link: '/search?category=architect', image: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=400&q=80' },
  { title: 'Interior Designers', badge: 'TOP RATED', desc: 'Award-winning designs', link: '/search?category=interior-designer', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&q=80' },
  { title: 'Material Suppliers', badge: 'BEST PRICE', desc: 'Bulk pricing available', link: '/search?category=material-supplier', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' },
];

categoryGroups = [
  {
    title: 'Construction & Building',
    items: [
      { name: 'House Construction', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=300&q=80' },
      { name: 'Commercial Buildings', image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=300&q=80' },
      { name: 'Renovation Work', image: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=300&q=80' },
    ]
  },
  {
    title: 'Interior & Design',
    items: [
      { name: 'Modular Kitchen', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&q=80' },
      { name: 'Living Room Design', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&q=80' },
      { name: 'Bedroom Interior', image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=300&q=80' },
    ]
  },
  {
    title: 'Electrical & Plumbing',
    items: [
      { name: 'Home Wiring', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&q=80' },
      { name: 'Waterproofing', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80' },
      { name: 'Sanitary Fitting', image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=300&q=80' },
    ]
  },
  {
    title: 'Windows & Finishing',
    items: [
      { name: 'UPVC Windows', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80' },
      { name: 'False Ceiling', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=300&q=80' },
      { name: 'Flooring Work', image: 'https://images.unsplash.com/photo-1495548054858-0e78bb72869f?w=300&q=80' },
    ]
  },
];

popularSearches = [
  { term: 'Civil Contractors', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&q=80' },
  { term: 'Interior Designers', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=500&q=80' },
  { term: 'House Construction', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500&q=80' },
  { term: 'Commercial Contractors', image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=500&q=80' },
  { term: 'Modular Kitchen', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&q=80' },
];
```

Also: Add a fallback placeholder for business cards with no cover image:
```typescript
getBusinessImage(business: any): string {
  return business.cover_image_url 
    || `https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80`;
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 8 — DEPLOY AND VERIFY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After all fixes:

1. ng build --configuration production
   Fix any TypeScript errors.

2. Deploy to VPS:
   cd /var/www/s-network && git pull
   cd s-network-web && npm ci && npm run build:ssr
   pm2 reload ecosystem.config.js --update-env

3. Verify these flows:
   [ ] Open home as anonymous → carousel + categories + sections all visible
   [ ] Refresh home → still visible (not blank)
   [ ] Navigate to /search → back to home → still visible
   [ ] Click category card → navigates to /search?category=civil-contractor
   [ ] Search "contractor" → results appear
   [ ] Click a business card → profile opens (no "Business Not Found")
   [ ] City dropdown → searchable, "Detect my location" works
   [ ] All footer links navigate to valid pages
   [ ] Call/WhatsApp buttons functional
   [ ] Login → home page reloads with user navbar
```
