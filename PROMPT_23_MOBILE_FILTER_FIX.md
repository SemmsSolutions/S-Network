# S-Network — PROMPT 23
## Mobile Responsive + Filter Fix + Subcategories + Admin Delete Vendor
## Run with Gemini Pro — paste memory_v8.md first

---

```
Read memory_v8.md. Fix every issue below completely.
No stubs. No partial code. Production-ready only.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 1 — FULL MOBILE RESPONSIVENESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The web app layout is broken on mobile. Apply these fixes to EVERY component.

1a. Global responsive breakpoints in styles.scss:

```scss
// Breakpoints
$mobile:  480px;
$tablet:  768px;
$desktop: 1024px;
$wide:    1280px;

// Responsive mixins
@mixin mobile  { @media (max-width: #{$mobile})  { @content; } }
@mixin tablet  { @media (max-width: #{$tablet})  { @content; } }
@mixin desktop { @media (min-width: #{$desktop}) { @content; } }
```

1b. Navbar — mobile layout:

Desktop: logo + city + searchbar + actions all in one row
Mobile (≤768px): 
  Row 1: logo (left) + notification bell + avatar (right)
  Row 2: full-width search bar

```scss
.navbar-inner {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  
  @include tablet {
    .city-selector { display: none; } // hide city on mobile (in search bar)
    .navbar-search { order: 10; width: 100%; flex-basis: 100%; }
    .navbar-actions .nav-action-btn { display: none; } // hide text links
    .login-btn { padding: 6px 12px !important; font-size: 12px !important; }
  }
  
  @include mobile {
    padding: 8px 12px;
    .sn-logo { font-size: 1.3rem; }
  }
}
```

1c. Hero section — mobile layout:

Desktop: 65% banner + 35% featured cards side by side
Mobile: banner full width, featured cards hidden (show below as horizontal scroll)

```scss
.hero-inner {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 16px;
  
  @include tablet {
    grid-template-columns: 1fr;
    .hero-featured-cards { display: none; }
  }
}

.hero-banner {
  height: 400px;
  @include tablet { height: 280px; }
  @include mobile { height: 220px; }
}

.banner-overlay h2 {
  font-size: 2rem;
  @include tablet { font-size: 1.4rem; }
  @include mobile { font-size: 1.1rem; }
}
```

1d. Category icon grid — responsive:

```scss
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  
  @include mobile {
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
}

.category-icon-card {
  padding: 12px 8px;
  text-align: center;
  
  .cat-icon-wrap { width: 56px; height: 56px; margin: 0 auto 8px; }
  .cat-name { font-size: 12px; line-height: 1.3; }
  
  @include mobile {
    padding: 10px 4px;
    .cat-icon-wrap { width: 44px; height: 44px; }
    .cat-name { font-size: 10px; }
  }
}
```

1e. Grouped category sections — responsive:

```scss
.grouped-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  
  @include tablet { grid-template-columns: 1fr; }
}

.group-items {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  
  .group-item img {
    width: 100%; height: 120px; object-fit: cover; border-radius: 8px;
    @include mobile { height: 90px; }
  }
}
```

1f. Popular searches — responsive:

```scss
.popular-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  
  @include tablet { grid-template-columns: repeat(3, 1fr); }
  @include mobile { grid-template-columns: repeat(2, 1fr); }
}

.popular-card {
  position: relative; border-radius: 12px; overflow: hidden;
  aspect-ratio: 4/3;
  
  img { width: 100%; height: 100%; object-fit: cover; }
  
  .popular-overlay {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: linear-gradient(transparent, rgba(0,0,0,0.75));
    padding: 20px 12px 12px;
    
    h4 { color: white; font-size: 14px; font-weight: 700; margin-bottom: 6px; }
    .btn-outline-white {
      display: inline-block; border: 1.5px solid white; color: white;
      padding: 4px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;
    }
    
    @include mobile {
      padding: 12px 8px 8px;
      h4 { font-size: 11px; }
    }
  }
}
```

1g. Business cards grid — responsive:

```scss
.vendors-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  
  @include tablet { grid-template-columns: repeat(2, 1fr); }
  @include mobile { grid-template-columns: 1fr; }
}

.biz-card {
  .biz-img-wrap { height: 180px; @include mobile { height: 160px; } }
  
  .biz-actions {
    display: flex; gap: 8px;
    
    @include mobile {
      .biz-action-btn { padding: 7px 10px; font-size: 12px; }
    }
  }
}
```

1h. Search results page — responsive filter:

Desktop: filter sidebar (280px) + results grid side by side
Mobile: filter in a bottom sheet (hidden by default, toggle with Filter button)

```html
<!-- Search results layout -->
<div class="search-layout">
  <!-- Filter sidebar (desktop) -->
  <aside class="filter-sidebar" [class.open]="filterOpen">
    <div class="filter-header">
      <h3>Filters</h3>
      <button class="close-filter d-tablet-none" (click)="filterOpen = false">✕</button>
    </div>
    <!-- filter content -->
  </aside>
  
  <!-- Results -->
  <div class="results-area">
    <!-- Mobile filter toggle bar -->
    <div class="mobile-filter-bar d-desktop-none">
      <button class="btn-outline btn-sm" (click)="filterOpen = true">
        ⚙️ Filters {{ activeFilterCount > 0 ? '(' + activeFilterCount + ')' : '' }}
      </button>
      <span class="results-count">{{ results.length }} results</span>
    </div>
    <!-- results grid -->
  </div>
</div>
```

```scss
.search-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  
  @include tablet {
    grid-template-columns: 1fr;
    
    .filter-sidebar {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: white; border-radius: 20px 20px 0 0;
      box-shadow: 0 -4px 24px rgba(0,0,0,0.15);
      z-index: 500; max-height: 80vh; overflow-y: auto;
      transform: translateY(100%); transition: transform 0.3s;
      padding: 20px;
      
      &.open { transform: translateY(0); }
    }
    
    // Overlay when filter open
    &::before {
      content: ''; position: fixed; inset: 0;
      background: rgba(0,0,0,0.4); z-index: 499;
      opacity: 0; pointer-events: none; transition: opacity 0.3s;
    }
    &.filter-open::before { opacity: 1; pointer-events: all; }
  }
}
```

1i. Business profile page — responsive:

```scss
.profile-content-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  
  @include tablet {
    grid-template-columns: 1fr;
    .profile-sidebar { order: -1; } // sidebar goes to top on mobile
  }
}

.profile-actions-bar {
  display: flex; gap: 10px; flex-wrap: wrap;
  
  @include mobile {
    // Sticky bottom bar on mobile
    position: fixed; bottom: 0; left: 0; right: 0;
    background: white; padding: 12px 16px;
    box-shadow: 0 -2px 12px rgba(0,0,0,0.1);
    z-index: 100;
    
    .call-btn { flex: 1; }
    .enquire-btn { flex: 1; }
    .whatsapp-btn, .action-btn-icon { flex-shrink: 0; }
  }
}

.gallery-mosaic {
  display: grid;
  grid-template-columns: 60% 40%;
  gap: 4px; height: 320px;
  
  .gallery-main { height: 100%; }
  .gallery-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
  
  @include mobile {
    grid-template-columns: 1fr;
    height: 220px;
    .gallery-grid { display: none; } // only main image on mobile
  }
}
```

1j. Vendor dashboard — responsive:

```scss
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  
  @include tablet { grid-template-columns: repeat(2, 1fr); }
  @include mobile { grid-template-columns: 1fr 1fr; gap: 10px; }
}

.stat-card {
  padding: 20px;
  @include mobile { padding: 14px; .stat-num { font-size: 1.5rem; } }
}
```

1k. Admin panel — responsive sidebar:

```scss
.admin-layout {
  display: flex; min-height: 100vh;
  
  .admin-sidebar {
    width: 240px; flex-shrink: 0;
    
    @include tablet {
      position: fixed; left: -240px; top: 0; bottom: 0; z-index: 500;
      transition: left 0.3s;
      &.open { left: 0; }
    }
  }
  
  .admin-content { flex: 1; overflow: hidden; padding: 24px; }
}

// Mobile admin toggle button
.admin-menu-toggle {
  display: none;
  @include tablet { display: block; }
}
```

1l. How it works section — responsive:

```scss
.how-steps {
  display: flex; align-items: center; gap: 20px;
  
  @include tablet {
    flex-direction: column;
    .how-arrow { transform: rotate(90deg); }
  }
}
```

1m. Footer — responsive:

```scss
.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 32px;
  
  @include tablet { grid-template-columns: 1fr 1fr; }
  @include mobile { grid-template-columns: 1fr; }
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 2 — FIX SUBCATEGORIES IN REGISTRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The specialization checkboxes are not appearing after category selection.

2a. Root cause: the onCategoryChange() method is either not called or
the availableSpecializations array isn't triggering Angular change detection.

Fix in vendor-onboarding.component.ts (or register.component.ts):

```typescript
// Inject ChangeDetectorRef
constructor(
  private supabase: SupabaseService,
  private cdr: ChangeDetectorRef
) {}

// ENSURE this is called on category change
async onCategoryChange(): Promise<void> {
  const categoryId = this.businessForm.get('categoryId')?.value 
                     || this.businessForm.categoryId;
  
  if (!categoryId) {
    this.availableSpecializations = [];
    this.selectedSpecializations = [];
    this.cdr.detectChanges();
    return;
  }

  const { data, error } = await this.supabase.client
    .from('category_specializations')
    .select('id, name, description, sort_order')
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Specializations load error:', error);
    this.availableSpecializations = [];
  } else {
    this.availableSpecializations = data ?? [];
  }
  
  this.selectedSpecializations = []; // reset on category change
  this.cdr.detectChanges(); // FORCE update
}
```

2b. In the registration HTML (Step 2), ensure the category select
triggers the method correctly:

```html
<select formControlName="categoryId" 
        (change)="onCategoryChange()"
        class="form-input" required>
  <option value="">Select category *</option>
  <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.name }}</option>
</select>

<!-- Specializations section — appears after category selected -->
<div class="specializations-block" *ngIf="availableSpecializations.length > 0">
  <label class="spec-heading">
    What do you specialize in?
    <span class="spec-hint">(Select all that apply)</span>
  </label>
  
  <div class="spec-grid">
    <label *ngFor="let spec of availableSpecializations" class="spec-checkbox">
      <input
        type="checkbox"
        [value]="spec.id"
        [checked]="selectedSpecializations.includes(spec.id)"
        (change)="toggleSpec(spec.id)"
      >
      <span class="spec-label">{{ spec.name }}</span>
    </label>
  </div>

  <div class="spec-validation" *ngIf="availableSpecializations.length > 0 && selectedSpecializations.length === 0">
    <small>Please select at least one specialization</small>
  </div>
</div>

<!-- If no specializations defined for this category -->
<div class="no-specs-hint" *ngIf="categorySelectedButNoSpecs">
  <small>No specific sub-types for this category. You can add custom services in the next step.</small>
</div>
```

2c. Also ensure specializations are saved after business creation:

After the business INSERT succeeds and you have the businessId:

```typescript
async saveVendorSpecializations(businessId: string): Promise<void> {
  if (!this.selectedSpecializations.length) return;
  
  const rows = this.selectedSpecializations.map(sid => ({
    business_id: businessId,
    specialization_id: sid,
    custom_description: null
  }));

  const { error } = await this.supabase.client
    .from('vendor_specializations')
    .upsert(rows, { onConflict: 'business_id,specialization_id' });

  if (error) console.error('Save specializations error:', error);
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 3 — SHOW SPECIALIZATIONS ON VENDOR PROFILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3a. In business-profile.component.ts, load specializations:

```typescript
async loadVendorSpecializations(businessId: string): Promise<void> {
  const { data, error } = await this.supabase.client
    .from('vendor_specializations')
    .select('id, custom_description, category_specializations(id, name)')
    .eq('business_id', businessId);

  if (!error) this.vendorSpecializations = data ?? [];
}

// Call this in loadBusiness() after data loads:
// await this.loadVendorSpecializations(data.id);
```

3b. In business-profile.component.html, add this section in the Overview tab:

```html
<!-- Specializations section -->
<div class="profile-section spec-section" *ngIf="vendorSpecializations.length > 0">
  <h3 class="section-heading">
    <span class="section-icon">🎯</span> Specializations
  </h3>
  <div class="spec-tags-display">
    <div *ngFor="let vs of vendorSpecializations" class="spec-tag-item">
      <div class="spec-tag-name">
        {{ vs.category_specializations?.name }}
      </div>
      <div class="spec-tag-detail" *ngIf="vs.custom_description">
        {{ vs.custom_description }}
      </div>
    </div>
  </div>
</div>
```

CSS for spec tags:
```scss
.spec-tags-display {
  display: flex; flex-wrap: wrap; gap: 10px;
  
  @include mobile { gap: 8px; }
}

.spec-tag-item {
  background: #FEE2E2; border: 1px solid rgba(204,0,0,0.2);
  border-radius: 8px; padding: 8px 14px;
  
  .spec-tag-name { 
    font-weight: 600; font-size: 13px; color: #CC0000;
    @include mobile { font-size: 12px; }
  }
  .spec-tag-detail { 
    font-size: 11px; color: var(--text-2); margin-top: 2px;
  }
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 4 — FIX SEARCH FILTERS (Materials filter working)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The Materials dropdown shows only "Any Material". It must load the actual
specializations for the selected category.

4a. In search-results.component.ts, update the filter system completely:

```typescript
export class SearchResultsComponent implements OnInit {
  // Filter state
  categoryFilter = '';
  cityFilter = '';
  ratingFilter = 0;
  verifiedOnly = false;
  selectedSpecId = '';
  radiusKm = 20;
  
  // Available options
  categories: any[] = [];
  availableSpecs: any[] = [];
  
  ngOnInit(): void {
    this.loadCategories();
    
    // React to URL param changes
    this.route.queryParamMap.subscribe(params => {
      this.categoryFilter = params.get('category') ?? '';
      this.cityFilter = params.get('city') ?? '';
      this.searchQuery = params.get('q') ?? '';
      
      // Load specs for selected category
      if (this.categoryFilter) {
        this.loadSpecsForCategory(this.categoryFilter);
      }
      
      this.loadResults();
    });
  }

  async loadCategories(): Promise<void> {
    const { data } = await this.supabase.client
      .from('categories').select('id, name, slug').order('name');
    this.categories = data ?? [];
  }

  async onCategoryFilterChange(): Promise<void> {
    this.selectedSpecId = ''; // reset spec when category changes
    this.availableSpecs = [];
    
    if (this.categoryFilter) {
      await this.loadSpecsForCategory(this.categoryFilter);
    }
    this.applyFilters();
  }

  async loadSpecsForCategory(slug: string): Promise<void> {
    // Get category ID from slug
    const { data: cat } = await this.supabase.client
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    
    if (!cat) { this.availableSpecs = []; return; }

    const { data: specs } = await this.supabase.client
      .from('category_specializations')
      .select('id, name')
      .eq('category_id', cat.id)
      .order('sort_order');

    this.availableSpecs = specs ?? [];
  }

  async loadResults(): Promise<void> {
    this.loading = true;
    this.results = [];

    try {
      // Get category ID if filtering by category
      let categoryId: string | null = null;
      if (this.categoryFilter) {
        const { data: cat } = await this.supabase.client
          .from('categories').select('id').eq('slug', this.categoryFilter).maybeSingle();
        categoryId = cat?.id ?? null;
      }

      // Build business IDs from specialization filter
      let specBusinessIds: string[] | null = null;
      if (this.selectedSpecId) {
        const { data: vsRows } = await this.supabase.client
          .from('vendor_specializations')
          .select('business_id')
          .eq('specialization_id', this.selectedSpecId);
        specBusinessIds = (vsRows ?? []).map(r => r.business_id);
        if (specBusinessIds.length === 0) {
          // No businesses have this specialization
          this.results = [];
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }
      }

      // Main query
      let query = this.supabase.client
        .from('businesses')
        .select(`
          id, name, slug, city, rating, total_reviews,
          is_verified, is_premium, cover_image_url,
          phone, whatsapp, year_established, working_hours,
          categories(name, slug)
        `)
        .eq('is_active', true)
        .order('is_premium', { ascending: false })
        .order('is_verified', { ascending: false })
        .order('rating', { ascending: false })
        .limit(40);

      // Apply filters
      if (categoryId) query = query.eq('category_id', categoryId);
      if (this.cityFilter) query = query.ilike('city', `%${this.cityFilter}%`);
      if (this.verifiedOnly) query = query.eq('is_verified', true);
      if (this.ratingFilter > 0) query = query.gte('rating', this.ratingFilter);
      if (this.searchQuery) {
        query = query.or(`name.ilike.%${this.searchQuery}%,description.ilike.%${this.searchQuery}%`);
      }
      if (specBusinessIds) query = query.in('id', specBusinessIds);

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

  applyFilters(): void {
    // Update URL params (makes filters bookmarkable)
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.searchQuery || null,
        city: this.cityFilter || null,
        category: this.categoryFilter || null,
        verified: this.verifiedOnly || null,
        rating: this.ratingFilter || null,
        spec: this.selectedSpecId || null,
      },
      queryParamsHandling: 'merge'
    });
    this.loadResults();
  }
}
```

4b. Search filter HTML — complete filter panel:

```html
<div class="filter-panel card">
  <div class="filter-section">
    <label class="filter-label">Category</label>
    <select [(ngModel)]="categoryFilter" (change)="onCategoryFilterChange()" class="filter-select">
      <option value="">All Categories</option>
      <option *ngFor="let cat of categories" [value]="cat.slug">{{ cat.name }}</option>
    </select>
  </div>

  <!-- Specializations — shown only when category has specs -->
  <div class="filter-section" *ngIf="availableSpecs.length > 0">
    <label class="filter-label">
      {{ categoryFilter === 'material-supplier' ? 'Material Type' : 'Specialization' }}
    </label>
    <select [(ngModel)]="selectedSpecId" class="filter-select" (change)="applyFilters()">
      <option value="">
        {{ categoryFilter === 'material-supplier' ? 'Any Material' : 'Any Type' }}
      </option>
      <option *ngFor="let spec of availableSpecs" [value]="spec.id">{{ spec.name }}</option>
    </select>
  </div>

  <div class="filter-section">
    <label class="filter-label">City</label>
    <input type="text" [(ngModel)]="cityFilter" placeholder="e.g. Chennai" class="filter-input">
  </div>

  <div class="filter-section">
    <label class="filter-label">Minimum Rating</label>
    <div class="rating-filter-stars">
      <button *ngFor="let s of [1,2,3,4,5]"
              (click)="ratingFilter = ratingFilter === s ? 0 : s"
              [class.active]="s <= ratingFilter"
              class="star-filter-btn">★</button>
      <span class="rating-label" *ngIf="ratingFilter > 0">{{ ratingFilter }}+ Stars</span>
      <span class="rating-label" *ngIf="ratingFilter === 0">Any Rating</span>
    </div>
  </div>

  <div class="filter-section">
    <label class="filter-label">Radius (km)</label>
    <input type="range" [(ngModel)]="radiusKm" min="5" max="100" step="5" class="radius-slider">
    <span>{{ radiusKm }} km</span>
    <small class="filter-hint">Only works if location was auto-detected</small>
  </div>

  <div class="filter-section">
    <label class="verified-toggle">
      <input type="checkbox" [(ngModel)]="verifiedOnly" (change)="applyFilters()">
      <span>Verified Only</span>
    </label>
  </div>

  <button class="btn-red filter-apply-btn" (click)="applyFilters()">Apply Filters</button>
  <button class="btn-outline filter-clear-btn" (click)="clearFilters()" *ngIf="hasActiveFilters()">Clear All</button>
</div>
```

CSS for filter panel:
```scss
.filter-panel {
  padding: 20px;
  
  @include mobile { padding: 16px; }
}

.filter-section {
  margin-bottom: 20px;
  
  @include mobile { margin-bottom: 16px; }
}

.filter-label {
  display: block; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px;
  color: var(--text-3); margin-bottom: 8px;
}

.filter-select, .filter-input {
  width: 100%; padding: 9px 12px;
  border: 1.5px solid var(--border); border-radius: 8px;
  font-size: 13px; background: white;
  &:focus { outline: none; border-color: var(--red); }
}

.rating-filter-stars {
  display: flex; align-items: center; gap: 4px;
  
  .star-filter-btn {
    background: none; border: none; font-size: 22px;
    color: #D1D5DB; cursor: pointer; transition: color 0.1s;
    &.active { color: #F59E0B; }
    &:hover { color: #F59E0B; }
  }
  .rating-label { font-size: 12px; color: var(--text-3); margin-left: 4px; }
}

.radius-slider { width: 100%; accent-color: var(--red); }
.filter-hint { color: var(--text-3); font-size: 11px; display: block; margin-top: 2px; }

.filter-apply-btn { width: 100%; margin-top: 8px; }
.filter-clear-btn { width: 100%; margin-top: 8px; }

.verified-toggle {
  display: flex; align-items: center; gap: 10px;
  cursor: pointer; font-size: 14px; font-weight: 500;
  input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--red); }
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 5 — FIX VENDOR VERIFICATION DISPLAY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5a. In vendor-dashboard.component.ts, load verification status:

```typescript
async loadVerificationStatus(): Promise<void> {
  if (!this.business?.id) return;
  
  const { data } = await this.supabase.client
    .from('vendor_verifications')
    .select('status, gst_number, msme_number, submitted_at, rejection_reason')
    .eq('business_id', this.business.id)
    .maybeSingle();

  this.verificationRecord = data;
  // Also check businesses.verification_status
  this.verificationStatus = this.business.verification_status ?? 'unverified';
}
```

5b. In vendor-dashboard.component.html, show correct banner:

```html
<div class="verification-banner"
     [class.unverified]="verificationStatus === 'unverified'"
     [class.pending]="verificationStatus === 'pending'"
     [class.verified]="verificationStatus === 'verified'"
     [class.rejected]="verificationStatus === 'rejected'">
  
  <ng-container [ngSwitch]="verificationStatus">
    <ng-container *ngSwitchCase="'unverified'">
      <span class="banner-icon">⚠️</span>
      <div class="banner-text">
        <strong>Get Verified!</strong>
        <span>Submit GST/MSME documents to rank higher in search results</span>
      </div>
      <a routerLink="/vendor/profile" [queryParams]="{tab: 'verification'}" class="banner-cta">
        Verify Now →
      </a>
    </ng-container>

    <ng-container *ngSwitchCase="'pending'">
      <span class="banner-icon">🕐</span>
      <div class="banner-text">
        <strong>Verification Under Review</strong>
        <span>Submitted on {{ verificationRecord?.submitted_at | date:'mediumDate' }}</span>
      </div>
    </ng-container>

    <ng-container *ngSwitchCase="'verified'">
      <span class="banner-icon">✅</span>
      <div class="banner-text">
        <strong>Your business is Verified!</strong>
        <span>GST/MSME verified by S-Network</span>
      </div>
    </ng-container>

    <ng-container *ngSwitchCase="'rejected'">
      <span class="banner-icon">❌</span>
      <div class="banner-text">
        <strong>Verification Not Approved</strong>
        <span>Reason: {{ verificationRecord?.rejection_reason }}</span>
      </div>
      <a routerLink="/vendor/profile" [queryParams]="{tab: 'verification'}" class="banner-cta">
        Resubmit →
      </a>
    </ng-container>
  </ng-container>
</div>
```

CSS:
```scss
.verification-banner {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 20px; border-radius: 10px;
  margin-bottom: 20px;
  
  &.unverified { background: #FEF3C7; border: 1px solid #FCD34D; }
  &.pending    { background: #EFF6FF; border: 1px solid #93C5FD; }
  &.verified   { background: #F0FDF4; border: 1px solid #86EFAC; }
  &.rejected   { background: #FEF2F2; border: 1px solid #FCA5A5; }
  
  .banner-icon { font-size: 20px; flex-shrink: 0; }
  .banner-text { flex: 1; font-size: 13px; line-height: 1.4; }
  .banner-cta {
    background: var(--red); color: white; padding: 6px 14px;
    border-radius: 6px; font-size: 13px; font-weight: 600;
    text-decoration: none; white-space: nowrap;
    flex-shrink: 0;
  }
  
  @include mobile {
    flex-wrap: wrap;
    .banner-cta { width: 100%; text-align: center; }
  }
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 6 — ADMIN: DELETE VENDOR FEATURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6a. Add delete button to admin vendor list (admin-vendors.component.html):

In each vendor table row, add a Delete button:

```html
<!-- In the actions column of the vendor table -->
<td class="actions-cell">
  <button class="btn-sm btn-outline" (click)="openVendorDetail(vendor)">View</button>
  
  <button class="btn-sm btn-outline approve-btn"
          *ngIf="vendor.role === 'pending_vendor'"
          (click)="approveVendor(vendor)">
    ✅ Approve
  </button>
  
  <button class="btn-sm btn-outline reject-btn"
          *ngIf="vendor.role === 'pending_vendor'"
          (click)="rejectVendor(vendor)">
    Reject
  </button>

  <button class="btn-sm btn-danger"
          (click)="confirmDeleteVendor(vendor)"
          title="Permanently delete this vendor">
    🗑️ Delete
  </button>
</td>
```

6b. In admin-vendors.component.ts, add the delete logic:

```typescript
selectedVendorToDelete: any = null;
showDeleteConfirm = false;

confirmDeleteVendor(vendor: any): void {
  this.selectedVendorToDelete = vendor;
  this.showDeleteConfirm = true;
}

async deleteVendor(): Promise<void> {
  if (!this.selectedVendorToDelete) return;
  
  const vendor = this.selectedVendorToDelete;
  this.deleting = true;

  try {
    const userId = vendor.profiles?.id ?? vendor.owner_id;
    const businessId = vendor.id;

    // 1. Delete related data first (cascade order)
    await this.supabase.client.from('vendor_specializations').delete().eq('business_id', businessId);
    await this.supabase.client.from('vendor_verifications').delete().eq('business_id', businessId);
    await this.supabase.client.from('leads').delete().eq('business_id', businessId);
    await this.supabase.client.from('reviews').delete().eq('business_id', businessId);
    await this.supabase.client.from('business_images').delete().eq('business_id', businessId);
    await this.supabase.client.from('business_services').delete().eq('business_id', businessId);
    await this.supabase.client.from('business_materials').delete().eq('business_id', businessId);
    await this.supabase.client.from('notifications').delete().eq('user_id', userId);
    await this.supabase.client.from('admin_overrides').delete().eq('business_id', businessId);
    
    // 2. Delete the business
    const { error: bizError } = await this.supabase.client
      .from('businesses').delete().eq('id', businessId);
    if (bizError) throw bizError;

    // 3. Delete the profile
    const { error: profileError } = await this.supabase.client
      .from('profiles').delete().eq('id', userId);
    if (profileError) throw profileError;

    // 4. Delete auth user (requires admin Edge Function)
    // Call the delete-vendor edge function which uses service role
    await this.supabase.client.functions.invoke('delete-vendor', {
      body: { user_id: userId }
    });

    // Success
    this.showDeleteConfirm = false;
    this.selectedVendorToDelete = null;
    await this.loadVendors(); // refresh list
    this.showToast('Vendor deleted successfully', 'success');

  } catch (err: any) {
    console.error('Delete vendor error:', err);
    this.showToast('Failed to delete vendor: ' + err.message, 'error');
  } finally {
    this.deleting = false;
  }
}
```

6c. Delete confirmation modal:

```html
<!-- Delete confirmation modal -->
<div class="modal-backdrop" *ngIf="showDeleteConfirm" (click)="showDeleteConfirm = false">
  <div class="modal-box danger-modal" (click)="$event.stopPropagation()">
    <div class="modal-icon">⚠️</div>
    <h3>Delete Vendor</h3>
    <p>
      You are about to permanently delete 
      <strong>{{ selectedVendorToDelete?.businesses?.name || selectedVendorToDelete?.name }}</strong>.
    </p>
    <p class="danger-text">
      This will delete: business profile, all leads, reviews, images, 
      verification documents, and the user account. 
      <strong>This action cannot be undone.</strong>
    </p>

    <div class="confirm-input-row">
      <label>Type <strong>DELETE</strong> to confirm:</label>
      <input type="text" [(ngModel)]="deleteConfirmText" placeholder="Type DELETE" class="form-input">
    </div>

    <div class="modal-actions">
      <button class="btn-outline" (click)="showDeleteConfirm = false">Cancel</button>
      <button class="btn-danger"
              [disabled]="deleteConfirmText !== 'DELETE' || deleting"
              (click)="deleteVendor()">
        {{ deleting ? 'Deleting...' : '🗑️ Permanently Delete' }}
      </button>
    </div>
  </div>
</div>
```

6d. Create supabase/functions/delete-vendor/index.ts:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Unauthorized', { status: 401, headers: cors });

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) return new Response('Unauthorized', { status: 401, headers: cors });

    const { data: profile } = await adminClient
      .from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403, headers: cors });

    // Delete the target user from auth
    const { user_id } = await req.json();
    if (!user_id) return new Response('user_id required', { status: 400, headers: cors });

    const { error } = await adminClient.auth.admin.deleteUser(user_id);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...cors, 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
});
```

Deploy: `supabase functions deploy delete-vendor`

6e. CSS for delete UI:

```scss
.btn-danger {
  background: #DC2626; color: white; border: none;
  padding: 8px 16px; border-radius: 6px; font-weight: 600;
  cursor: pointer;
  &:hover { background: #B91C1C; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.btn-sm.btn-danger { padding: 5px 10px; font-size: 12px; }

.danger-modal {
  max-width: 440px;
  .modal-icon { font-size: 40px; text-align: center; margin-bottom: 12px; }
  h3 { text-align: center; color: #DC2626; }
  p { color: var(--text-2); font-size: 14px; margin: 10px 0; }
  .danger-text { background: #FEF2F2; padding: 12px; border-radius: 8px;
                  border: 1px solid #FECACA; font-size: 13px; }
  .confirm-input-row { margin: 16px 0; }
  .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 7 — BUILD AND DEPLOY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

7a. Deploy new edge function:
```bash
supabase functions deploy delete-vendor
```

7b. Angular build:
```bash
ng build --configuration production
# Fix ALL errors. Zero tolerance.
```

7c. Deploy to VPS:
```bash
cd /var/www/S-Network/build-connect-web
git pull origin main
npm ci
npm run build
rm -rf /var/www/snetwork/*
cp -r dist/build-connect-web/browser/* /var/www/snetwork/
systemctl reload nginx
```

7d. Final verification:
[ ] Home page loads on mobile (375px width) — no horizontal scroll
[ ] Navbar collapses correctly on mobile
[ ] Category grid shows 4 columns on mobile
[ ] Search filter panel slides up from bottom on mobile
[ ] Vendor registration: category change → specializations appear
[ ] Material Supplier selected → shows material type checkboxes
[ ] Vendor profile shows Specializations section
[ ] Search filter Materials dropdown shows actual materials
[ ] Filter by material → results filtered correctly
[ ] Admin vendor list has Delete button
[ ] Delete confirmation requires typing "DELETE"
[ ] Delete removes vendor from DB + auth
[ ] Verification banner shows correct state in vendor dashboard
```
