import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CompareService, CompareBusiness } from '../../../core/services/compare.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { RatingStarsComponent } from '../../../shared/components/rating-stars/rating-stars.component';

@Component({
    selector: 'app-compare',
    standalone: true,
    imports: [CommonModule, RouterModule, RatingStarsComponent],
    template: `
    <div class="bg-surface min-h-screen font-body py-12 px-4">
      <div class="max-w-6xl mx-auto">
        <div class="flex justify-between items-center mb-8">
          <h1 class="text-3xl font-heading font-bold text-primary">Compare Businesses</h1>
          <button (click)="clearAll()" *ngIf="businesses.length > 0" class="text-red-500 font-bold hover:underline">Clear All</button>
        </div>

        <div *ngIf="loading" class="flex justify-center p-12"><div class="animate-spin text-4xl">🏗️</div></div>

        <div *ngIf="!loading && businesses.length === 0" class="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="text-5xl mb-4">⚖️</div>
          <h2 class="text-xl font-bold text-gray-800 mb-2">Nothing to compare yet</h2>
          <p class="text-gray-500 mb-6">Select up to 3 businesses from the search results to compare their features side-by-side.</p>
          <a routerLink="/search" class="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-opacity-90 transition">Find Professionals</a>
        </div>

        <div *ngIf="!loading && businesses.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
          <table class="w-full text-left min-w-[800px]">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="p-6 bg-gray-50 w-48 font-heading font-bold text-gray-500 uppercase tracking-widest">Features</th>
                <th *ngFor="let b of businesses" class="p-6 border-l border-gray-200 w-1/3 relative">
                  <button (click)="remove(b.id)" class="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition">✕</button>
                  <div class="h-24 bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    <img *ngIf="b.business_images?.length" [src]="b.business_images[0].image_url" class="object-cover w-full h-full">
                    <span *ngIf="!b.business_images?.length" class="text-4xl text-gray-300">🏢</span>
                  </div>
                  <h3 class="font-bold text-xl text-primary leading-tight">{{b.name}}</h3>
                  <a [routerLink]="['/business', b.id]" class="text-sm text-secondary font-bold hover:underline mt-2 inline-block">View Profile</a>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr>
                <td class="p-4 bg-gray-50 font-bold text-gray-700 text-sm">Rating</td>
                <td *ngFor="let b of businesses" class="p-4 border-l border-gray-200">
                   <div class="flex items-center gap-2">
                     <app-rating-stars [rating]="b.avg_rating"></app-rating-stars>
                     <span class="font-bold text-gray-800">{{b.avg_rating | number:'1.1-1'}} ({{b.reviews?.length || 0}})</span>
                   </div>
                </td>
              </tr>
              <tr>
                <td class="p-4 bg-gray-50 font-bold text-gray-700 text-sm">Category</td>
                <td *ngFor="let b of businesses" class="p-4 border-l border-gray-200">
                  <span class="bg-gray-100 px-3 py-1 rounded text-sm font-bold text-primary">{{b.categories?.name}}</span>
                </td>
              </tr>
              <tr>
                <td class="p-4 bg-gray-50 font-bold text-gray-700 text-sm">Verified</td>
                <td *ngFor="let b of businesses" class="p-4 border-l border-gray-200 text-center">
                  <span *ngIf="b.is_verified" class="text-success text-2xl">✓</span>
                  <span *ngIf="!b.is_verified" class="text-gray-300 text-2xl">-</span>
                </td>
              </tr>
              <tr>
                <td class="p-4 bg-gray-50 font-bold text-gray-700 text-sm">Response Rate</td>
                <td *ngFor="let b of businesses" class="p-4 border-l border-gray-200 font-bold text-gray-800">
                  {{b.response_rate | number:'1.0-0'}}%
                </td>
              </tr>
              <tr>
                <td class="p-4 bg-gray-50 font-bold text-gray-700 text-sm">Pincode / City</td>
                <td *ngFor="let b of businesses" class="p-4 border-l border-gray-200 text-gray-600 font-medium">
                  {{b.city}}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class CompareComponent implements OnInit {
    businesses: any[] = [];
    loading = true;

    constructor(
        private compareService: CompareService,
        private supabase: SupabaseService
    ) { }

    ngOnInit() {
        this.compareService.selection$.subscribe(selection => {
            this.loadData(selection);
        });
    }

    async loadData(selection: CompareBusiness[]) {
        if (selection.length === 0) {
            this.businesses = [];
            this.loading = false;
            return;
        }

        this.loading = true;
        const ids = selection.map(s => s.id);

        try {
            const { data } = await this.supabase.client
                .from('businesses')
                .select(`*, categories(name), business_images(image_url), reviews(rating)`)
                .in('id', ids);

            if (data) {
                this.businesses = data.map(b => {
                    const avg = b.reviews && b.reviews.length > 0 ? b.reviews.reduce((s: number, rv: any) => s + rv.rating, 0) / b.reviews.length : 0;
                    return { ...b, avg_rating: avg };
                });
                // Sort strictly by ID list to keep them consistent if desired, or skip
            }
        } catch (e) { console.error(e); }
        this.loading = false;
    }

    remove(id: string) {
        this.compareService.toggleCompare({ id, name: '' }); // Just passing ID is enough for removal logic
    }

    clearAll() {
        this.compareService.clear();
    }
}
