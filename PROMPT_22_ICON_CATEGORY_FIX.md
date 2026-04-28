# S-Network — PROMPT 22 (ICON FIX + CATEGORY SUBCATEGORIES + HOME PAGE FIX)
## Fix all remaining broken items from screenshots
## Run with Gemini Pro — paste memory_v8.md first

---

```
Read memory_v8.md. Fix every issue shown in the screenshots. 
Complete code only. No stubs. Apply all changes to both Angular web AND Flutter mobile.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 1 — NG5002 ERROR (home page blank on return)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Error: "NG5002: Incomplete block 's'. If you meant to write the @ character,
use the &#64; HTML entity instead."

Location: src/app/modules/legal/contact.component.ts:15:142

Open contact.component.ts and find the inline template.
There is a raw @ symbol (email address like name@domain.com) inside the template string.
Angular 17+ with block syntax treats @ as a control flow keyword.

Fix: Replace ALL @ symbols in inline templates with &#64;
Example:
  WRONG:  'Email us at info@snetwork.app'
  RIGHT:  'Email us at info&#64;snetwork.app'

Search the ENTIRE codebase for raw @ symbols inside Angular template strings
(both inline template: `` and .html files) and replace them all.
Common locations: contact page, footer, about page, email display anywhere in templates.

This compile error is what prevents the Angular build from completing,
which is why the home page is blank after navigation — the app bundle is broken.

After fixing: ng build --configuration production must complete with ZERO errors.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 2 — REPLACE ALL CATEGORY ICONS WITH PROPER INLINE SVGs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Remove the broken <img> tags and file references entirely.
Use pure inline SVG with proper construction-relevant visuals.
Every icon must render correctly with NO external file dependencies.

In home.component.ts, replace getCategoryIcon() completely:

```typescript
getCategoryIcon(slug: string): string {
  const icons: Record<string, string> = {

    'architect': `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="#DCFCE7"/>
      <!-- Drawing compass/triangle ruler -->
      <path d="M24 10L12 34h24L24 10z" fill="none" stroke="#16A34A" stroke-width="2.5" stroke-linejoin="round"/>
      <line x1="17" y1="26" x2="31" y2="26" stroke="#16A34A" stroke-width="2" stroke-linecap="round"/>
      <line x1="24" y1="10" x2="24" y2="7" stroke="#16A34A" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="24" cy="10" r="2" fill="#16A34A"/>
    </svg>`,

    'civil-contractor': `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="#FEE2E2"/>
      <!-- House/building under construction -->
      <path d="M10 36h28M14 36V22l10-10 10 10v14" fill="none" stroke="#CC0000" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      <rect x="19" y="26" width="10" height="10" rx="1" fill="none" stroke="#CC0000" stroke-width="2"/>
      <line x1="24" y1="12" x2="24" y2="8" stroke="#CC0000" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="21" y1="10" x2="27" y2="10" stroke="#CC0000" stroke-width="2" stroke-linecap="round"/>
    </svg>`,

    'commercial-contractor': `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="#EDE9FE"/>
      <!-- Office building -->
      <rect x="12" y="14" width="24" height="22" rx="2" fill="none" stroke="#7C3AED" stroke-width="2.5"/>
      <rect x="16" y="18" width="5" height="5" rx="1" fill="#7C3AED" opacity="0.4"/>
      <rect x="23" y="18" width="5" height="5" rx="1" fill="#7C3AED" opacity="0.4"/>
      <rect x="16" y="25" width="5" height="5" rx="1" fill="#7C3AED" opacity="0.4"/>
      <rect x="23" y="25" width="5" height="5" rx="1" fill="#7C3AED" opacity="0.4"/>
      <rect x="19" y="32" width="10" height="4" rx="1" fill="#7C3AED" opacity="0.5"/>
      <line x1="12" y1="36" x2="36" y2="36" stroke="#7C3AED" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,

    'turnkey-contractor': `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="#FEF3C7"/>
      <!-- Key icon -->
      <circle cx="18" cy="22" r="8" fill="none" stroke="#D97706" stroke-width="2.5"/>
      <circle cx="18" cy="22" r="3.5" fill="#D97706" opacity="0.3"/>
      <line x1="24" y1="22" x2="38" y2="22" stroke="#D97706" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="35" y1="22" x2="35" y2="27" stroke="#D97706" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="30" y1="22" x2="30" y2="26" stroke="#D97706" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,

    'interior-designer': `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="#FCE7F3"/>
      <!-- Paintbrush + palette -->
      <circle cx="32" cy="16" r="6" fill="none" stroke="#DB2777" stroke-width="2"/>
      <circle cx="30" cy="14" r="1.5" fill="#DB2777"/>
      <circle cx="34" cy="14" r="1.5" fill="#DB2777" opacity="0.5"/>
      <circle cx="32" cy="18" r="1.5" fill="#DB2777" opacity="0.7"/>
      <!-- Brush -->
      <path d="M16 36l12-12-4-4L12 32c-2 2-2 4 0 4 1 0 2.5-1 4 0z" fill="none" stroke="#DB2777" stroke-width="2" stroke-linejoin="round"/>
      <path d="M24 24l4-4" stroke="#DB2777" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="14" cy="34" rx="3" ry="2" fill="#DB2777" opacity="0.4"/>
    </svg>`,

    'electrician': `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="#FEF9C3"/>
      <!-- Lightning bolt -->
      <path d="M27 8L16 26h12L13 42l22-20H23L27 8z" fill="#CA8A04" stroke="#CA8A04" stroke-width="1" stroke-linejoin="round"/>
    </svg>`,

    'plumber': `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="#E0F2FE"/>
      <!-- Pipe with water drop -->
      <!-- Horizontal pipe -->
      <rect x="8" y="20" width="22" height="8" rx="4" fill="none" stroke="#0284C7" stroke-width="2.5"/>
      <!-- Elbow -->
      <path d="M30 24h2a4 4 0 014 4v6" fill="none" stroke="#0284C7" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Water tap/faucet head -->
      <rect x="34" y="30" width="5" height="7" rx="2" fill="none" stroke="#0284C7" stroke-width="2.5"/>
      <!-- Water drop -->
      <path d="M36.5 40 c0 0 -3 -3 -3 -5 a3 3 0 006 0 c0 2 -3 5 -3 5z" fill="#0284C7" opacity="0.5"/>
      <!-- Wrench handle -->
      <path d="M8 20L8 15" stroke="#0284C7" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="5" y="12" width="6" height="5" rx="2" fill="none" stroke="#0284C7" stroke-width="2"/>
    </svg>`,

    'residential-builder': `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="#DBEAFE"/>
      <!-- Detailed house -->
      <path d="M9 36h30M13 36V22l11-11 11 11v14" fill="none" stroke="#1D4ED8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      <!-- Door -->
      <rect x="20" y="27" width="8" height="9" rx="1" fill="none" stroke="#1D4ED8" stroke-width="2"/>
      <!-- Window -->
      <rect x="13" y="24" width="5" height="5" rx="1" fill="none" stroke="#1D4ED8" stroke-width="1.5"/>
      <rect x="30" y="24" width="5" height="5" rx="1" fill="none" stroke="#1D4ED8" stroke-width="1.5"/>
      <!-- Chimney -->
      <rect x="29" y="13" width="4" height="6" rx="1" fill="none" stroke="#1D4ED8" stroke-width="2"/>
    </svg>`,

    'material-supplier': `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="#F0FDF4"/>
      <!-- Construction wheelbarrow -->
      <!-- Wheel -->
      <circle cx="16" cy="36" r="4.5" fill="none" stroke="#15803D" stroke-width="2.5"/>
      <circle cx="16" cy="36" r="1.5" fill="#15803D"/>
      <!-- Barrow body (bowl shape) -->
      <path d="M20 36 L24 22 L40 22 L38 36 Z" fill="none" stroke="#15803D" stroke-width="2.5" stroke-linejoin="round"/>
      <!-- Material in barrow (bricks stacked) -->
      <line x1="25" y1="28" x2="37" y2="28" stroke="#15803D" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
      <line x1="26" y1="25" x2="38" y2="25" stroke="#15803D" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
      <!-- Handle -->
      <line x1="20" y1="36" x2="10" y2="26" stroke="#15803D" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="24" y1="22" x2="10" y2="22" stroke="#15803D" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,

  };
  return icons[slug] ?? `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="12" fill="#F3F4F6"/>
    <text x="24" y="32" text-anchor="middle" font-size="20" font-family="serif">🏗️</text>
  </svg>`;
}
```

Apply SafeHtmlPipe (from Prompt 21) to render these in the template.
CSS for the icon wrapper:
```scss
.cat-icon-wrap {
  width: 64px; height: 64px;
  display: flex; align-items: center; justify-content: center;
  svg { width: 48px; height: 48px; }
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 3 — FEATURED CARDS IMAGES (right side of hero)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The right-side featured cards show broken images.
Replace ALL featured card and category group images with working Unsplash URLs:

```typescript
featuredCards = [
  {
    title: 'Civil Contractors', badge: 'VERIFIED',
    desc: 'Get instant quotes',
    link: '/search?category=civil-contractor',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=160&fit=crop&q=80'
  },
  {
    title: 'Architects', badge: 'PREMIUM',
    desc: 'Licensed professionals',
    link: '/search?category=architect',
    image: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=400&h=160&fit=crop&q=80'
  },
  {
    title: 'Interior Designers', badge: 'TOP RATED',
    desc: 'Award-winning designs',
    link: '/search?category=interior-designer',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&h=160&fit=crop&q=80'
  },
  {
    title: 'Material Suppliers', badge: 'BEST PRICE',
    desc: 'Bulk pricing available',
    link: '/search?category=material-supplier',
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=160&fit=crop&q=80'
  },
];
```

In the featured cards template, add error fallback on every img:
```html
<img [src]="fc.image" [alt]="fc.title" loading="lazy"
     (error)="fc.image = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=160&fit=crop&q=80'">
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 4 — CATEGORY GROUPS + POPULAR SEARCHES IMAGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All grouped category and popular search images are broken.
Replace with working construction-specific Unsplash URLs:

```typescript
categoryGroups = [
  {
    title: 'Construction & Building',
    items: [
      { name: 'House Construction', image: 'https://images.unsplash.com/photo-1510284981270-513f29f4a8bd?w=300&h=180&fit=crop&q=80' },
      { name: 'Commercial Buildings', image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=300&h=180&fit=crop&q=80' },
      { name: 'Renovation Work', image: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=300&h=180&fit=crop&q=80' },
    ]
  },
  {
    title: 'Interior & Design',
    items: [
      { name: 'Modular Kitchen', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=180&fit=crop&q=80' },
      { name: 'Living Room Design', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=180&fit=crop&q=80' },
      { name: 'Bedroom Interior', image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=300&h=180&fit=crop&q=80' },
    ]
  },
  {
    title: 'Electrical & Plumbing',
    items: [
      { name: 'Home Wiring', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&h=180&fit=crop&q=80' },
      { name: 'Waterproofing', image: 'https://images.unsplash.com/photo-1607400201515-c2c41c07d307?w=300&h=180&fit=crop&q=80' },
      { name: 'Sanitary Fitting', image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=300&h=180&fit=crop&q=80' },
    ]
  },
  {
    title: 'Windows & Finishing',
    items: [
      { name: 'UPVC Windows', image: 'https://images.unsplash.com/photo-1503594384566-461fe158e797?w=300&h=180&fit=crop&q=80' },
      { name: 'False Ceiling', image: 'https://images.unsplash.com/photo-1613545325268-9265c8f79f2b?w=300&h=180&fit=crop&q=80' },
      { name: 'Flooring Work', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=180&fit=crop&q=80' },
    ]
  },
];

popularSearches = [
  { term: 'Civil Contractors', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&h=300&fit=crop&q=80' },
  { term: 'Interior Designers', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=500&h=300&fit=crop&q=80' },
  { term: 'House Construction', image: 'https://images.unsplash.com/photo-1510284981270-513f29f4a8bd?w=500&h=300&fit=crop&q=80' },
  { term: 'Commercial Contractors', image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=500&h=300&fit=crop&q=80' },
  { term: 'Modular Kitchen', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=300&fit=crop&q=80' },
];
```

Add (error) handler to ALL img tags in the home template:
```html
<img [src]="item.image" [alt]="item.name" loading="lazy"
     (error)="onImgError($event)">
```

```typescript
onImgError(event: Event): void {
  (event.target as HTMLImageElement).src =
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&h=180&fit=crop&q=80';
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 5 — ADMIN CATEGORY MANAGEMENT (SVG Upload + Edit + Subcategories)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The "New Category" modal shows broken emoji icon.
Upgrade the entire category management system.

5a. DB changes (run in Supabase SQL Editor):

```sql
-- Add icon_url column for uploaded SVG
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon_url text;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order int DEFAULT 0;

-- Category subcategories/specializations table
CREATE TABLE IF NOT EXISTS category_specializations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sort_order int DEFAULT 0,
  created_at timestamp DEFAULT now()
);

ALTER TABLE category_specializations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read specializations" 
  ON category_specializations FOR SELECT USING (true);
CREATE POLICY "Admin manages specializations"
  ON category_specializations FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Vendor specializations (what a vendor selects)
CREATE TABLE IF NOT EXISTS vendor_specializations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  specialization_id uuid REFERENCES category_specializations(id) ON DELETE CASCADE,
  custom_description text,
  UNIQUE(business_id, specialization_id)
);

ALTER TABLE vendor_specializations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read vendor specializations"
  ON vendor_specializations FOR SELECT USING (true);
CREATE POLICY "Owner manages vendor specializations"
  ON vendor_specializations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = vendor_specializations.business_id AND b.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM businesses b WHERE b.id = vendor_specializations.business_id AND b.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed default specializations for Material Supplier
INSERT INTO category_specializations (category_id, name, sort_order)
SELECT c.id, spec.name, spec.ord
FROM categories c
CROSS JOIN (VALUES
  ('Cement Supplier', 1), ('Steel/TMT Bars', 2), ('Bricks & Blocks', 3),
  ('Sand & Aggregates', 4), ('Tiles & Flooring', 5), ('Paint & Primer', 6),
  ('Electrical Materials', 7), ('Plumbing Materials', 8), ('Glass & Windows', 9),
  ('Waterproofing Chemicals', 10), ('Hardware & Fasteners', 11), ('Timber & Plywood', 12)
) AS spec(name, ord)
WHERE c.slug = 'material-supplier'
ON CONFLICT DO NOTHING;

-- Seed for Electrician
INSERT INTO category_specializations (category_id, name, sort_order)
SELECT c.id, spec.name, spec.ord
FROM categories c
CROSS JOIN (VALUES
  ('Residential Wiring', 1), ('Commercial Wiring', 2), ('Industrial Wiring', 3),
  ('CCTV Installation', 4), ('Solar Panel Installation', 5), ('Switchboard Work', 6),
  ('Generator Installation', 7), ('Earthing & Grounding', 8)
) AS spec(name, ord)
WHERE c.slug = 'electrician'
ON CONFLICT DO NOTHING;

-- Seed for Plumber
INSERT INTO category_specializations (category_id, name, sort_order)
SELECT c.id, spec.name, spec.ord
FROM categories c
CROSS JOIN (VALUES
  ('Pipe Fitting', 1), ('Drainage Work', 2), ('Waterproofing', 3),
  ('Bathroom Fitting', 4), ('Water Tank Installation', 5),
  ('Hot Water System', 6), ('Bore Well', 7)
) AS spec(name, ord)
WHERE c.slug = 'plumber'
ON CONFLICT DO NOTHING;

-- Seed for Civil Contractor
INSERT INTO category_specializations (category_id, name, sort_order)
SELECT c.id, spec.name, spec.ord
FROM categories c
CROSS JOIN (VALUES
  ('Residential Construction', 1), ('Commercial Construction', 2),
  ('Foundation Work', 3), ('RCC Work', 4), ('Brick & Block Work', 5),
  ('Plastering', 6), ('Renovation', 7), ('Demolition', 8)
) AS spec(name, ord)
WHERE c.slug = 'civil-contractor'
ON CONFLICT DO NOTHING;

-- Seed for Interior Designer
INSERT INTO category_specializations (category_id, name, sort_order)
SELECT c.id, spec.name, spec.ord
FROM categories c
CROSS JOIN (VALUES
  ('Modular Kitchen', 1), ('Living Room', 2), ('Bedroom Design', 3),
  ('Office Interior', 4), ('False Ceiling', 5), ('Flooring', 6),
  ('Wardrobe Design', 7), ('Hotel/Resort Interior', 8)
) AS spec(name, ord)
WHERE c.slug = 'interior-designer'
ON CONFLICT DO NOTHING;
```

5b. Admin Category Management page — COMPLETE rewrite:

In src/app/modules/admin/categories/admin-categories.component.ts + .html:

The page must have two panels:
LEFT PANEL: Category list
RIGHT PANEL: Edit selected category (or add new)

```html
<div class="admin-categories-layout">
  <!-- Left: Category List -->
  <div class="cat-list-panel">
    <div class="panel-header">
      <h3>Categories</h3>
      <button class="btn-red btn-sm" (click)="startNew()">+ Add New</button>
    </div>
    <div class="cat-list">
      <div *ngFor="let cat of categories"
           class="cat-list-item"
           [class.active]="selectedCat?.id === cat.id"
           (click)="selectCategory(cat)">
        <div class="cat-list-icon" [innerHTML]="getCategoryIconPreview(cat) | safeHtml"></div>
        <div class="cat-list-info">
          <div class="cat-list-name">{{ cat.name }}</div>
          <div class="cat-list-sub">{{ cat.slug }}</div>
        </div>
        <div class="cat-list-count">{{ getSpecCount(cat.id) }} specs</div>
      </div>
    </div>
  </div>

  <!-- Right: Edit Panel -->
  <div class="cat-edit-panel" *ngIf="editMode">
    <div class="panel-header">
      <h3>{{ isNew ? 'New Category' : 'Edit: ' + editForm.name }}</h3>
      <button class="btn-outline btn-sm" (click)="cancelEdit()">Cancel</button>
    </div>

    <!-- Basic Info -->
    <div class="edit-section">
      <h4>Basic Information</h4>
      <div class="form-group">
        <label>Category Name *</label>
        <input type="text" [(ngModel)]="editForm.name" (input)="autoSlug()" class="form-input">
      </div>
      <div class="form-group">
        <label>Slug (URL identifier)</label>
        <input type="text" [(ngModel)]="editForm.slug" class="form-input">
        <small>Auto-generated from name. Changing this breaks existing links.</small>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea [(ngModel)]="editForm.description" rows="2" class="form-input"></textarea>
      </div>
      <div class="form-group">
        <label>Sort Order (lower = first)</label>
        <input type="number" [(ngModel)]="editForm.sort_order" class="form-input" style="max-width:100px">
      </div>
    </div>

    <!-- Icon Upload -->
    <div class="edit-section">
      <h4>Category Icon (SVG)</h4>
      <div class="icon-upload-area">
        <div class="current-icon" *ngIf="editForm.icon_url || editForm.icon">
          <img *ngIf="editForm.icon_url" [src]="editForm.icon_url" alt="icon" class="icon-preview">
          <div *ngIf="!editForm.icon_url && editForm.icon" class="icon-emoji-preview">{{ editForm.icon }}</div>
        </div>
        <div class="upload-controls">
          <input type="file" #iconFileInput accept=".svg,image/svg+xml" (change)="onIconFileChange($event)" style="display:none">
          <button class="btn-outline btn-sm" (click)="iconFileInput.click()">
            📁 Upload SVG File
          </button>
          <span class="upload-hint">SVG only, max 200KB</span>
        </div>
        <div class="fallback-emoji">
          <label>Or use emoji fallback:</label>
          <input type="text" [(ngModel)]="editForm.icon" placeholder="e.g. 🏗️" class="form-input emoji-input" maxlength="4">
        </div>
      </div>
      <div class="upload-progress" *ngIf="iconUploading">Uploading SVG...</div>
    </div>

    <!-- Specializations -->
    <div class="edit-section">
      <div class="section-header-row">
        <h4>Specializations / Sub-types</h4>
        <small>Vendors select these during registration</small>
      </div>
      <div class="spec-list">
        <div *ngFor="let spec of editSpecializations; let i = index" class="spec-item">
          <input type="text" [(ngModel)]="spec.name" class="form-input spec-input" placeholder="Specialization name">
          <input type="number" [(ngModel)]="spec.sort_order" class="form-input sort-input" placeholder="Order" min="1">
          <button class="btn-icon-danger" (click)="removeSpec(i)" title="Remove">✕</button>
        </div>
        <div *ngIf="editSpecializations.length === 0" class="no-specs">
          No specializations yet. Add some below.
        </div>
      </div>
      <button class="btn-outline btn-sm" (click)="addSpec()" style="margin-top:8px">+ Add Specialization</button>
    </div>

    <!-- Actions -->
    <div class="edit-actions">
      <button class="btn-red" (click)="saveCategory()" [disabled]="saving">
        {{ saving ? 'Saving...' : 'Save Category' }}
      </button>
      <button class="btn-outline danger" (click)="deleteCategory()" *ngIf="!isNew" [disabled]="saving">
        Delete Category
      </button>
    </div>
  </div>
</div>
```

TypeScript for admin-categories.component.ts:
```typescript
async onIconFileChange(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (!file.name.endsWith('.svg')) { alert('Only SVG files allowed'); return; }
  if (file.size > 200 * 1024) { alert('SVG must be under 200KB'); return; }

  this.iconUploading = true;
  try {
    const path = `categories/${this.editForm.slug ?? 'temp'}-${Date.now()}.svg`;
    const { data, error } = await this.supabase.client.storage
      .from('s-network-media')
      .upload(path, file, { upsert: true, contentType: 'image/svg+xml' });
    if (error) throw error;
    const { data: { publicUrl } } = this.supabase.client.storage
      .from('s-network-media')
      .getPublicUrl(path);
    this.editForm.icon_url = publicUrl;
  } catch (err) {
    console.error('Icon upload error:', err);
    alert('Failed to upload icon. Please try again.');
  } finally {
    this.iconUploading = false;
  }
}

autoSlug(): void {
  this.editForm.slug = this.editForm.name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

async saveCategory(): Promise<void> {
  if (!this.editForm.name) { alert('Category name is required'); return; }
  this.saving = true;
  try {
    let categoryId = this.editForm.id;

    if (this.isNew) {
      const { data, error } = await this.supabase.client
        .from('categories')
        .insert({ name: this.editForm.name, slug: this.editForm.slug,
                  icon: this.editForm.icon, icon_url: this.editForm.icon_url,
                  description: this.editForm.description, sort_order: this.editForm.sort_order })
        .select().single();
      if (error) throw error;
      categoryId = data.id;
    } else {
      const { error } = await this.supabase.client
        .from('categories')
        .update({ name: this.editForm.name, slug: this.editForm.slug,
                  icon: this.editForm.icon, icon_url: this.editForm.icon_url,
                  description: this.editForm.description, sort_order: this.editForm.sort_order })
        .eq('id', categoryId);
      if (error) throw error;
    }

    // Save specializations
    // Delete removed ones
    const existingIds = this.editSpecializations.filter(s => s.id).map(s => s.id);
    if (!this.isNew) {
      await this.supabase.client
        .from('category_specializations')
        .delete()
        .eq('category_id', categoryId)
        .not('id', 'in', existingIds.length ? `(${existingIds.join(',')})` : '(00000000-0000-0000-0000-000000000000)');
    }

    // Upsert all specializations
    for (const spec of this.editSpecializations) {
      if (spec.id) {
        await this.supabase.client.from('category_specializations')
          .update({ name: spec.name, sort_order: spec.sort_order })
          .eq('id', spec.id);
      } else {
        await this.supabase.client.from('category_specializations')
          .insert({ category_id: categoryId, name: spec.name, sort_order: spec.sort_order });
      }
    }

    await this.loadCategories();
    this.editMode = false;
    alert('Category saved successfully!');
  } catch (err) {
    console.error('Save error:', err);
    alert('Failed to save. Please try again.');
  } finally {
    this.saving = false;
  }
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 6 — VENDOR SPECIALIZATIONS IN REGISTRATION + DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When a vendor selects a category during registration, show the
available specializations for that category as checkboxes.

6a. In vendor onboarding Step 2 (business details), after category selection:

```html
<!-- Category dropdown -->
<select [(ngModel)]="businessForm.categoryId" (change)="onCategoryChange()" required>
  <option value="">Select category</option>
  <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.name }}</option>
</select>

<!-- Specializations (shown after category selected) -->
<div class="specializations-section" *ngIf="availableSpecializations.length > 0">
  <label>What do you specialize in? <small>(Select all that apply)</small></label>
  <div class="spec-checkboxes">
    <label *ngFor="let spec of availableSpecializations" class="spec-checkbox-label">
      <input type="checkbox"
             [value]="spec.id"
             [checked]="selectedSpecializations.includes(spec.id)"
             (change)="toggleSpecialization(spec.id)">
      <span>{{ spec.name }}</span>
    </label>
  </div>
  <div class="spec-other">
    <label>Other (custom specialization):</label>
    <input type="text" [(ngModel)]="customSpecialization"
           placeholder="e.g. AAC Block Supplier"
           class="form-input">
  </div>
</div>
```

TypeScript for onboarding:
```typescript
availableSpecializations: any[] = [];
selectedSpecializations: string[] = [];
customSpecialization = '';

async onCategoryChange(): Promise<void> {
  if (!this.businessForm.categoryId) {
    this.availableSpecializations = [];
    return;
  }
  const { data } = await this.supabase.client
    .from('category_specializations')
    .select('id, name')
    .eq('category_id', this.businessForm.categoryId)
    .order('sort_order');
  this.availableSpecializations = data ?? [];
  this.selectedSpecializations = []; // reset on category change
}

toggleSpecialization(id: string): void {
  const idx = this.selectedSpecializations.indexOf(id);
  if (idx >= 0) this.selectedSpecializations.splice(idx, 1);
  else this.selectedSpecializations.push(id);
}

// After business is created, save specializations:
async saveSpecializations(businessId: string): Promise<void> {
  if (!this.selectedSpecializations.length && !this.customSpecialization) return;

  const inserts = this.selectedSpecializations.map(sid => ({
    business_id: businessId,
    specialization_id: sid,
    custom_description: null
  }));

  if (this.customSpecialization) {
    // First create a custom specialization entry if needed
    // For now save as custom_description on a generic entry
  }

  if (inserts.length) {
    await this.supabase.client.from('vendor_specializations').insert(inserts);
  }
}
```

6b. Vendor Profile Editor — Specializations Tab:

In vendor profile editor, add "Specializations" tab showing:
- Current specializations with checkboxes (pre-checked)
- Ability to add/remove
- Custom description field per specialization

```html
<!-- In vendor profile editor tabs -->
<div *ngIf="activeTab === 'specializations'" class="spec-editor">
  <h3>Your Specializations</h3>
  <p class="hint">Tell customers exactly what you offer within {{ business?.categories?.name }}</p>

  <div class="spec-checkboxes-edit">
    <label *ngFor="let spec of availableSpecializations" class="spec-check-item">
      <input type="checkbox"
             [checked]="isSpecSelected(spec.id)"
             (change)="toggleVendorSpec(spec.id)">
      <div class="spec-check-content">
        <span class="spec-name">{{ spec.name }}</span>
        <input *ngIf="isSpecSelected(spec.id)"
               type="text"
               [value]="getSpecDescription(spec.id)"
               (blur)="updateSpecDescription(spec.id, $event)"
               placeholder="Add details (brands, sizes, experience...)"
               class="spec-detail-input">
      </div>
    </label>
  </div>

  <button class="btn-red" (click)="saveSpecializations()" [disabled]="savingSpecs">
    {{ savingSpecs ? 'Saving...' : 'Save Specializations' }}
  </button>
</div>
```

6c. Specializations shown on Business Profile page (public):

```html
<!-- In business-profile.component.html, overview tab -->
<div class="spec-tags-section" *ngIf="vendorSpecializations.length">
  <h3>Specializations</h3>
  <div class="spec-tags">
    <div *ngFor="let vs of vendorSpecializations" class="spec-tag">
      <span class="spec-tag-name">{{ vs.category_specializations?.name }}</span>
      <span class="spec-tag-detail" *ngIf="vs.custom_description">{{ vs.custom_description }}</span>
    </div>
  </div>
</div>
```

Load vendor specializations in business-profile.component.ts:
```typescript
async loadVendorSpecializations(businessId: string): Promise<void> {
  const { data } = await this.supabase.client
    .from('vendor_specializations')
    .select('*, category_specializations(name)')
    .eq('business_id', businessId);
  this.vendorSpecializations = data ?? [];
}
```

6d. Search filter — add specialization filter:

In search-results.component.ts, the filter panel must include
specialization filter when a category is selected:

```typescript
async onCategoryFilterChange(): Promise<void> {
  if (!this.categoryFilter) {
    this.availableSpecs = [];
    return;
  }
  const { data: cat } = await this.supabase.client
    .from('categories').select('id').eq('slug', this.categoryFilter).maybeSingle();
  if (!cat) return;

  const { data } = await this.supabase.client
    .from('category_specializations')
    .select('id, name')
    .eq('category_id', cat.id)
    .order('sort_order');
  this.availableSpecs = data ?? [];
}
```

In search query:
```typescript
if (this.selectedSpecId) {
  // Join through vendor_specializations
  query = query.in('id', 
    // subquery: businesses that have this specialization
    (await this.supabase.client
      .from('vendor_specializations')
      .select('business_id')
      .eq('specialization_id', this.selectedSpecId)
      .then(r => r.data?.map(x => x.business_id) ?? [])
    )
  );
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 7 — MOBILE APP: APPLY ALL ABOVE CHANGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Apply every fix above to the Flutter app:

7a. Category Icons in Flutter — use CustomPaint or SvgPicture:

Since flutter_svg package is available, load SVGs from network (same Unsplash/SVG logic won't work).
Instead, use the same inline approach with a Flutter custom widget:

In lib/shared/widgets/category_icon_widget.dart:
```dart
import 'package:flutter/material.dart';

class CategoryIconWidget extends StatelessWidget {
  final String slug;
  final double size;
  const CategoryIconWidget({super.key, required this.slug, this.size = 56});

  @override
  Widget build(BuildContext context) {
    final data = _iconData[slug] ?? _iconData['default']!;
    return Container(
      width: size, height: size,
      decoration: BoxDecoration(
        color: Color(data['bg']!),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Center(
        child: Icon(data['icon']! as IconData, color: Color(data['color']!), size: size * 0.5),
      ),
    );
  }

  static final Map<String, Map<String, dynamic>> _iconData = {
    'architect':             {'bg': 0xFFDCFCE7, 'color': 0xFF16A34A, 'icon': Icons.architecture},
    'civil-contractor':      {'bg': 0xFFFEE2E2, 'color': 0xFFCC0000, 'icon': Icons.home_work},
    'commercial-contractor': {'bg': 0xFFEDE9FE, 'color': 0xFF7C3AED, 'icon': Icons.business},
    'turnkey-contractor':    {'bg': 0xFFFEF3C7, 'color': 0xFFD97706, 'icon': Icons.vpn_key},
    'interior-designer':     {'bg': 0xFFFCE7F3, 'color': 0xFFDB2777, 'icon': Icons.design_services},
    'electrician':           {'bg': 0xFFFEF9C3, 'color': 0xFFCA8A04, 'icon': Icons.electric_bolt},
    'plumber':               {'bg': 0xFFE0F2FE, 'color': 0xFF0284C7, 'icon': Icons.plumbing},
    'residential-builder':   {'bg': 0xFFDBEAFE, 'color': 0xFF1D4ED8, 'icon': Icons.house},
    'material-supplier':     {'bg': 0xFFF0FDF4, 'color': 0xFF15803D, 'icon': Icons.inventory_2},
    'default':               {'bg': 0xFFF3F4F6, 'color': 0xFF6B7280, 'icon': Icons.construction},
  };
}
```

Use this widget in HomeScreen category grid:
```dart
GridView.builder(
  itemCount: categories.length,
  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 3, childAspectRatio: 0.85,
    crossAxisSpacing: 12, mainAxisSpacing: 12,
  ),
  itemBuilder: (context, i) {
    final cat = categories[i];
    return GestureDetector(
      onTap: () => context.push('/search/results?category=${cat['slug']}'),
      child: Column(children: [
        CategoryIconWidget(slug: cat['slug'] ?? '', size: 60),
        const SizedBox(height: 8),
        Text(cat['name'] ?? '', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
             textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis),
      ]),
    );
  },
)
```

7b. All images in Flutter — use CachedNetworkImage with fallback:

```dart
CachedNetworkImage(
  imageUrl: item['image'] ?? '',
  fit: BoxFit.cover,
  placeholder: (ctx, url) => Container(
    color: const Color(0xFFF3F4F6),
    child: const Center(child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFFCC0000))),
  ),
  errorWidget: (ctx, url, err) => Container(
    color: const Color(0xFFE5E7EB),
    child: const Icon(Icons.business, color: Color(0xFF9CA3AF), size: 40),
  ),
)
```

7c. Flutter: Vendor registration — add specializations step:

After category selection in RegisterScreen Step 2:
- Load specializations from category_specializations table
- Show CheckboxListTile for each
- Save selected IDs to pass to saveSpecializations() after business created

7d. Flutter: Vendor dashboard — add Specializations tab in profile editor:
Same checkbox UI as web, loads from vendor_specializations table.

7e. Flutter: Business profile screen — show specializations:
Show spec chips in the "Services" section.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIX 8 — HOME PAGE BLANK (FINAL FIX)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The NG5002 compile error (@ symbol) is causing the build to partially fail.
Once that is fixed (Fix 1), the home page will work consistently.

Additionally apply these defensive fixes:

8a. In app.config.ts or AppModule, add RouteReuseStrategy:
```typescript
import { RouteReuseStrategy } from '@angular/router';
// In providers array:
{ provide: RouteReuseStrategy, useClass: DefaultRouteReuseStrategy }
```

8b. In home.component.ts, use takeUntilDestroyed for subscriptions:
```typescript
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

constructor(private destroyRef: DestroyRef) {
  this.router.events.pipe(
    filter(e => e instanceof NavigationEnd),
    filter((e: NavigationEnd) => e.url === '/' || e.urlAfterRedirects === '/'),
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(() => this.loadHomeData());
}
```

8c. Home component MUST use ChangeDetectionStrategy.Default (not OnPush)
    since it does multiple async loads. Remove OnPush if present.

8d. Add a loading skeleton that shows immediately before data loads:

```html
<!-- Always visible structure -->
<div class="page-container">
  <!-- Skeleton shows while loading -->
  <div *ngIf="loading" class="loading-skeletons">
    <div class="skeleton-hero"></div>
    <div class="skeleton-categories"></div>
  </div>

  <!-- Content visible once loaded, preserves space even if arrays are empty -->
  <div [class.hidden]="loading">
    <!-- All sections here -->
  </div>
</div>
```

```scss
.hidden { visibility: hidden; }  // keeps layout space, just hides content
.skeleton-hero { height: 400px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 12px; }
.skeleton-categories { height: 120px; margin-top: 24px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 8px; }
@keyframes shimmer { to { background-position: -200% 0; } }
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL BUILD + VERIFY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Fix the NG5002 @ symbol error FIRST
2. ng build --configuration production → must complete with 0 errors
3. npm run build:ssr → confirm server.mjs built
4. Deploy to VPS: pm2 reload

Verify:
[ ] Home page loads on first visit AND on return from other pages
[ ] All 9 category icons render correctly (no broken images)
[ ] Material Supplier shows wheelbarrow icon
[ ] Plumber shows pipe/tap icon  
[ ] Featured cards on right show correct construction photos
[ ] Category group sections show real photos
[ ] Popular searches show photos
[ ] Admin category page has Add/Edit with SVG upload
[ ] Vendor registration shows specializations after category selection
[ ] Vendor dashboard has Specializations tab
[ ] Business profile shows specialization tags
[ ] Search filter includes specialization dropdown when category selected
[ ] Flutter app shows correct icons (using Material Icons)
[ ] Flutter vendor registration has specialization step
[ ] No broken image placeholders anywhere
```
