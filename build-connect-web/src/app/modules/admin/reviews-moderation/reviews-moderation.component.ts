import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-reviews-moderation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-6xl">
      <h1 class="text-3xl font-heading font-bold text-gray-900 mb-6 tracking-wide">Reviews Moderation</h1>
      
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <ul class="divide-y divide-gray-100">
          <li *ngFor="let r of reviews" class="p-6 hover:bg-gray-50 transition flex flex-col md:flex-row justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span class="font-bold text-gray-900">{{r.user_name || 'Anonymous'}}</span>
                <span class="text-sm text-gray-500">reviewed</span>
                <span class="font-bold text-primary">{{r.businesses?.name}}</span>
                <div class="ml-2 flex text-orange-400 text-sm">
                  <span *ngFor="let s of [1,2,3,4,5]" [class.text-gray-300]="s > r.rating">★</span>
                </div>
              </div>
              <p class="text-gray-700 whitespace-pre-wrap font-medium">{{r.comment}}</p>
              <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mt-3">{{r.created_at | date:'medium'}}</p>
            </div>
            <div class="flex-shrink-0 flex items-start">
               <button (click)="deleteReview(r.id)" [disabled]="isDeleting === r.id" class="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition font-bold text-sm border border-red-200">
                 {{ isDeleting === r.id ? 'Deleting...' : 'Delete Review' }}
               </button>
            </div>
          </li>
          <li *ngIf="reviews.length === 0" class="p-12 text-center text-gray-500 font-medium">No reviews found.</li>
        </ul>
      </div>
    </div>
  `
})
export class ReviewsModerationComponent implements OnInit {
  reviews: any[] = [];
  isDeleting: string | null = null;

  constructor(private supabase: SupabaseService) { }

  async ngOnInit() {
    this.loadReviews();
  }

  async loadReviews() {
    const { data } = await this.supabase.client
      .from('reviews')
      .select('*, businesses(name)')
      .order('created_at', { ascending: false });
    if (data) this.reviews = data;
  }

  async deleteReview(id: string) {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;
    this.isDeleting = id;
    try {
      await this.supabase.client.from('reviews').delete().eq('id', id);
      this.reviews = this.reviews.filter(r => r.id !== id);
    } catch (e) {
      console.error(e);
    } finally {
      this.isDeleting = null;
    }
  }
}
