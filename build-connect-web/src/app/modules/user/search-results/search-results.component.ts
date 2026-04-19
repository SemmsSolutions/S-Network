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
      <div class="max-w-7xl mx-auto flex flex-col items-start md:flex-row gap-8">
        
        <!-- Sidebar Filters -->
        <aside class="w-full md:w-64 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex-shrink-0 sticky top-4">
          <h2 class="text-xl font-heading font-bold text-primary mb-4">Filters</h2>
          
          <div class="mb-6">
            <h3 class="font-bold text-gray-700 mb-2 text-sm uppercase">Minimum Rating</h3>
            <select [(ngModel)]="filters.rating_min" (change)="executeSearch()" class="w-full border-gray-300 rounded p-2 text-sm bg-white border font-body outline-none focus:border-secondary">
              <option [value]="0">Any Rating</option>
              <option [value]="4">4+ Stars</option>
              <option [value]="4.5">4.5+ Stars</option>
            </select>
          </div>

          <div class="mb-6">
            <h3 class="font-bold text-gray-700 mb-2 text-sm uppercase">Materials</h3>
            <select [(ngModel)]="filters.material_group_id" (change)="executeSearch()" class="w-full border-gray-300 rounded p-2 text-sm bg-white border font-body outline-none focus:border-secondary">
              <option value="">Any Material</option>
              <option *ngFor="let g of materialGroups" [value]="g.id">{{g.icon}} {{g.name}}</option>
            </select>
          </div>

          <div class="mb-6">
            <h3 class="font-bold text-gray-700 mb-2 text-sm uppercase">Radius (km)</h3>
            <input type="number" [(ngModel)]="filters.radius" (change)="executeSearch()" placeholder="Distance" class="w-full border-gray-300 p-2 rounded text-sm mb-2 border font-body outline-none focus:border-secondary">
            <p class="text-xs text-gray-400">Only works if Location was auto-detected</p>
          </div>

          <div class="mb-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" [(ngModel)]="filters.verified_only" (change)="executeSearch()" class="rounded text-primary focus:ring-primary h-4 w-4 border-gray-300">
              <span class="text-sm font-bold text-gray-700">Verified Only</span>
            </label>
          </div>
          
          <button (click)="executeSearch()" class="w-full bg-secondary text-white font-bold py-2 rounded hover:bg-opacity-90 transition font-heading shadow-sm">Apply Filters</button>
        </aside>

        <!-- Results Grid -->
        <main class="flex-1 w-full">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 class="text-2xl font-heading font-bold text-primary">Search Results <span *ngIf="params.q" class="text-gray-500">for "{{params.q}}"</span></h1>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500 font-bold">Sort by:</span>
              <select [(ngModel)]="filters.sort_by" (change)="executeSearch()" class="border-gray-300 rounded p-2 text-sm bg-white border font-body outline-none focus:border-secondary font-bold text-primary">
                <option value="relevance">Relevance</option>
                <option value="rating">Rating: High to Low</option>
                <option value="most_reviewed">Most Reviewed</option>
                <option value="newest">Newest First</option>
              </select>
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

  params: any = {};
  filters = {
    rating_min: 0,
    radius: 20,
    verified_only: false,
    material_group_id: '',
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

  ngOnInit() {
    this.compareService.selection$.subscribe(sel => this.compareCount = sel.length);
    this.materialService.getMaterialGroups().subscribe(g => this.materialGroups = g);

    this.route.queryParams.subscribe(params => {
      this.params = { ...params };
      // Optional: reset page on new query
      this.filters.page = 1;
      this.executeSearch();
    });
  }

  async executeSearch() {
    this.loading = true;
    try {
      const body = {
        ...this.params,
        ...this.filters
      };

      // Clean up empty material_group_id so it doesn't break search fn
      if (!body.material_group_id) delete body.material_group_id;

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
