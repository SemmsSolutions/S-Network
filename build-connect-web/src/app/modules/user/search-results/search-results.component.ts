import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BusinessCardComponent } from '../../../shared/components/business-card/business-card.component';
import { SupabaseService } from '../../../core/services/supabase.service';
import { CompareService } from '../../../core/services/compare.service';
import { MaterialService } from '../../../core/services/material.service';
import { MaterialGroup } from '../../../shared/models/material.model';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, BusinessCardComponent, FormsModule, RouterModule],
  template: `
    <div class="bg-surface min-h-screen font-body p-4 md:p-8 relative pb-24">
      <div class="max-w-7xl mx-auto search-layout" [class.filter-open]="filterOpen">
        
        <!-- Sidebar Filters -->
        <aside class="filter-sidebar bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-4" [class.open]="filterOpen">
          <div class="filter-header mb-4 flex justify-between items-center border-b border-gray-100 pb-4 md:hidden">
            <h3 class="font-bold text-lg text-primary">Filters</h3>
            <button class="close-filter font-bold text-gray-500 text-xl" (click)="filterOpen = false">✕</button>
          </div>
          <h2 class="text-xl font-heading font-bold text-primary mb-4 hidden md:block">Filters</h2>

          <!-- Category Filter -->
          <div class="filter-section">
            <label class="filter-label">Category</label>
            <select [(ngModel)]="filters.category_id" (change)="onFilterCategoryChange()" class="filter-select">
              <option value="">All Categories</option>
              <option *ngFor="let c of categories" [value]="c.id">{{c.name}}</option>
            </select>
          </div>

          <!-- Dynamic Specializations Filter -->
          <div class="filter-section" *ngIf="availableSpecs.length > 0">
            <label class="filter-label">Specializations</label>
            <select [(ngModel)]="filters.spec_id" (change)="executeSearch()" class="filter-select">
              <option value="">Any Specialization</option>
              <option *ngFor="let s of availableSpecs" [value]="s.id">{{s.name}}</option>
            </select>
          </div>
          
          <div class="filter-section">
            <label class="filter-label">Minimum Rating</label>
            <select [(ngModel)]="filters.rating_min" (change)="executeSearch()" class="filter-select">
              <option [value]="0">Any Rating</option>
              <option [value]="4">4+ Stars</option>
              <option [value]="4.5">4.5+ Stars</option>
            </select>
          </div>

          <div class="filter-section">
            <label class="filter-label">Materials</label>
            <select [(ngModel)]="filters.material_group_id" (change)="executeSearch()" class="filter-select">
              <option value="">Any Material</option>
              <option *ngFor="let g of materialGroups" [value]="g.id">{{g.icon}} {{g.name}}</option>
            </select>
          </div>

          <div class="filter-section">
            <label class="filter-label">Radius (km)</label>
            <input type="number" [(ngModel)]="filters.radius" (change)="executeSearch()" placeholder="Distance" class="filter-input mb-1">
            <p class="text-xs text-gray-400">Only works if Location was auto-detected</p>
          </div>

          <div class="filter-section mb-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" [(ngModel)]="filters.verified_only" (change)="executeSearch()" class="rounded text-primary focus:ring-primary h-4 w-4 border-gray-300">
              <span class="text-sm font-bold text-gray-700">Verified Only</span>
            </label>
          </div>
          
          <button (click)="executeSearch(); filterOpen = false" class="w-full bg-secondary text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition font-heading shadow-md md:hidden">Apply Filters</button>
        </aside>

        <!-- Results Grid -->
        <main class="flex-1 w-full min-w-0">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 class="text-2xl font-heading font-bold text-primary truncate w-full sm:w-auto">Search Results <span *ngIf="params.q" class="text-gray-500">for "{{params.q}}"</span></h1>
            
            <div class="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start">
              <!-- Mobile filter toggle button! -->
              <button class="md:hidden border border-gray-300 rounded-lg px-4 py-2 text-sm font-bold flex gap-2 items-center bg-white shadow-sm" (click)="filterOpen = true">
                <span>⚙️</span> Filters <span class="bg-primary text-white rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center text-[10px]" *ngIf="activeFilterCount">{{activeFilterCount}}</span>
              </button>

              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-500 font-bold hidden sm:inline">Sort by:</span>
                <select [(ngModel)]="filters.sort_by" (change)="executeSearch()" class="filter-select font-bold text-primary shadow-sm border-gray-200">
                  <option value="relevance">Relevance</option>
                  <option value="rating">Rating: High to Low</option>
                  <option value="most_reviewed">Most Reviewed</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>
          </div>

          <div *ngIf="loading" class="flex justify-center p-12"><div class="animate-spin text-4xl">🏗️</div></div>

          <div *ngIf="!loading && businesses.length === 0" class="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">
             <div class="text-4xl text-gray-300 mb-4">🔍</div>
             <p class="text-gray-500 font-bold">No businesses found matching your criteria.</p>
          </div>

          <div *ngIf="!loading && businesses.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <app-business-card *ngFor="let biz of businesses" [business]="biz"></app-business-card>
          </div>
          
          <!-- Basic Pagination -->
          <div *ngIf="!loading && totalCount > filters.limit" class="flex justify-center mt-12 gap-2 text-sm font-bold">
             <button [disabled]="filters.page <= 1" (click)="changePage(-1)" class="px-4 py-2 bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition">Prev</button>
             <span class="px-4 py-2 bg-gray-50 border border-gray-200 rounded text-primary">{{filters.page}}</span>
             <button [disabled]="businesses.length < filters.limit" (click)="changePage(1)" class="px-4 py-2 bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition">Next</button>
          </div>
        </main>
      </div>

      <!-- Compare Tray -->
      <div *ngIf="compareCount > 0" class="fixed bottom-0 left-0 right-0 bg-primary bg-opacity-95 backdrop-blur text-white p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.2)] z-50 transform transition-transform">
         <div class="max-w-7xl mx-auto flex justify-between items-center px-4">
            <div class="font-bold">
               <span class="text-xl">⚖️</span>
               <span class="ml-2">{{compareCount}} Business{{compareCount > 1 ? 'es' : ''}} Selected</span>
            </div>
            <div class="flex gap-4">
               <button (click)="clearCompare()" class="text-sm font-bold text-gray-300 hover:text-white transition">Clear</button>
               <a routerLink="/compare" class="bg-secondary px-6 py-2 rounded-lg font-bold shadow hover:bg-opacity-90 transition">Compare Now</a>
            </div>
         </div>
      </div>

    </div>
  `
})
export class SearchResultsComponent implements OnInit {
  businesses: any[] = [];
  loading = true;
  totalCount = 0;
  compareCount = 0;
  materialGroups: MaterialGroup[] = [];
  categories: any[] = [];
  availableSpecs: any[] = [];
  filterOpen = false;

  get activeFilterCount(): number {
    let count = 0;
    if (this.filters.rating_min) count++;
    if (this.filters.spec_id) count++;
    if (this.filters.category_id) count++;
    if (this.filters.verified_only) count++;
    if (this.filters.radius && this.filters.radius !== 20) count++;
    if (this.filters.material_group_id) count++;
    return count;
  }

  params: any = {};
  filters = {
    rating_min: 0,
    radius: 20,
    verified_only: false,
    material_group_id: '',
    category_id: '',
    spec_id: '',
    sort_by: 'relevance',
    page: 1,
    limit: 12
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabase: SupabaseService,
    private compareService: CompareService,
    private materialService: MaterialService
  ) { }

  async ngOnInit() {
    this.compareService.selection$.subscribe(sel => this.compareCount = sel.length);
    this.materialService.getMaterialGroups().subscribe(g => this.materialGroups = g);

    const { data: cats } = await this.supabase.client.from('categories').select('id, name, slug').order('name');
    this.categories = cats || [];

    this.route.queryParams.subscribe(params => {
      this.params = { ...params };
      this.filters.page = 1;

      // Extract category id if slug provided
      if (params['category']) {
        const cat = this.categories.find(c => c.slug === params['category']);
        if (cat) {
          this.filters.category_id = cat.id;
          this.loadSpecsForCategory(cat.id);
        }
      }

      this.executeSearch();
    });
  }

  async loadSpecsForCategory(catId: string) {
    if (!catId) {
      this.availableSpecs = [];
      this.filters.spec_id = '';
      return;
    }
    const { data } = await this.supabase.client.from('category_specializations')
      .select('id, name').eq('category_id', catId).order('sort_order', { ascending: true });
    this.availableSpecs = data || [];
  }

  onFilterCategoryChange() {
    this.filters.spec_id = ''; // reset spec
    this.loadSpecsForCategory(this.filters.category_id);
    this.executeSearch();
  }

  async executeSearch() {
    this.loading = true;
    try {
      const body: any = {
        ...this.params,
        ...this.filters
      };

      if (this.params.q) {
        body.query = this.params.q;
      }

      // Clean up empty fields so it doesn't break search fn
      if (!body.material_group_id) delete body.material_group_id;
      if (!body.category_id) delete body.category_id;
      if (!body.spec_id) delete body.spec_id;

      const { data, error } = await this.supabase.client.functions.invoke('search-businesses', { body });
      if (data) {
        this.businesses = data.data || [];
        this.totalCount = data.totalCount || 0;
      }
    } catch (e) { console.error(e); }
    this.loading = false;
  }

  changePage(delta: number) {
    this.filters.page += delta;
    this.executeSearch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clearCompare() {
    this.compareService.clear();
  }
}
