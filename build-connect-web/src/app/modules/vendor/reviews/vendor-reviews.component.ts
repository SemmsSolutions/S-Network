import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
    selector: 'app-vendor-reviews',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="max-w-6xl mx-auto pb-12">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-heading font-bold text-primary tracking-wide">Customer Reviews</h1>
          <p class="text-gray-500 font-medium">Read, manage, and reply to what your customers are saying.</p>
        </div>
      </div>

      <div *ngIf="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin text-4xl">⏳</div>
      </div>

      <div *ngIf="!loading && !business" class="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200">
        <strong class="font-bold">Error:</strong> We couldn't find your business profile. Have you set one up in the Profile tab yet?
      </div>

      <div *ngIf="!loading && business">
        <div *ngIf="reviews.length === 0" class="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-200">
          <div class="text-6xl mb-4 opacity-50">🌟</div>
          <h3 class="text-xl font-bold font-heading text-gray-900 mb-2">No reviews yet</h3>
          <p class="text-gray-500 font-medium">When customers leave reviews on your profile, they will appear here.</p>
        </div>

        <div *ngIf="reviews.length > 0" class="space-y-6">
          <div *ngFor="let review of reviews" class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div class="flex justify-between items-start mb-4">
              <div>
                <div class="flex items-center gap-3 mb-1">
                  <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 text-sm overflow-hidden">
                    <img *ngIf="review.profiles?.avatar_url" [src]="review.profiles.avatar_url" class="w-full h-full object-cover">
                    <span *ngIf="!review.profiles?.avatar_url">{{review.profiles?.name?.charAt(0)}}</span>
                  </div>
                  <div>
                    <h4 class="font-bold text-gray-900">{{review.profiles?.name || 'Anonymous User'}}</h4>
                    <p class="text-xs text-gray-500 font-medium">{{review.created_at | date:'mediumDate'}}</p>
                  </div>
                </div>
              </div>
              <div class="flex gap-1 text-yellow-400">
                <span *ngFor="let i of [1,2,3,4,5]" [class.opacity-30]="i > review.rating">★</span>
              </div>
            </div>

            <p class="text-gray-700 font-medium mb-4 leading-relaxed">{{review.review_text}}</p>

            <!-- Vendor Reply Section -->
            <div class="bg-gray-50 rounded-lg p-5 border border-gray-100">
              <div *ngIf="review.vendor_reply">
                <div class="flex items-center gap-2 mb-2">
                  <span class="bg-primary text-white text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded">Owner Reply</span>
                </div>
                <p class="text-gray-700 font-medium text-sm leading-relaxed">{{review.vendor_reply}}</p>
              </div>

              <div *ngIf="!review.vendor_reply">
                <div *ngIf="replyingTo !== review.id">
                  <button (click)="startReply(review.id)" class="text-sm text-secondary font-bold hover:underline">💬 Reply as Owner</button>
                </div>
                <div *ngIf="replyingTo === review.id" class="mt-2">
                  <textarea [(ngModel)]="replyText" placeholder="Write a professional response..." class="w-full p-3 border border-gray-300 rounded-lg bg-white h-24 font-medium resize-none mb-3 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"></textarea>
                  <div class="flex gap-2 justify-end">
                    <button (click)="replyingTo = null" class="px-4 py-2 font-bold text-gray-500 hover:bg-gray-200 rounded-lg transition text-sm">Cancel</button>
                    <button (click)="submitReply(review.id)" [disabled]="!replyText.trim() || isSubmitting" class="bg-secondary text-white px-5 py-2 rounded-lg font-bold hover:bg-opacity-90 disabled:opacity-50 transition text-sm flex items-center gap-2">
                      <span *ngIf="isSubmitting">⏳</span> Post Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VendorReviewsComponent implements OnInit {
    loading = true;
    business: any = null;
    reviews: any[] = [];

    replyingTo: string | null = null;
    replyText = '';
    isSubmitting = false;

    constructor(private supabase: SupabaseService) { }

    async ngOnInit() {
        await this.loadData();
    }

    async loadData() {
        this.loading = true;
        try {
            const { data: { user } } = await this.supabase.client.auth.getUser();
            if (!user) return;

            const { data: b } = await this.supabase.client.from('businesses').select('id').eq('owner_id', user.id).single();
            if (b) {
                this.business = b;
                const { data: rData } = await this.supabase.client
                    .from('reviews')
                    .select('*, profiles(name, avatar_url)')
                    .eq('business_id', b.id)
                    .order('created_at', { ascending: false });

                if (rData) this.reviews = rData;
            }
        } catch (e) {
            console.error(e);
        } finally {
            this.loading = false;
        }
    }

    startReply(reviewId: string) {
        this.replyingTo = reviewId;
        this.replyText = '';
    }

    async submitReply(reviewId: string) {
        if (!this.replyText.trim()) return;
        this.isSubmitting = true;

        try {
            const { error } = await this.supabase.client.functions.invoke('vendor-reply-review', {
                body: { review_id: reviewId, reply_text: this.replyText.trim() }
            });

            if (!error) {
                // Find and update local review
                const review = this.reviews.find(r => r.id === reviewId);
                if (review) review.vendor_reply = this.replyText.trim();
                this.replyingTo = null;
                this.replyText = '';
            } else {
                alert('Failed to post reply. Please try again.');
            }
        } catch (e) {
            console.error(e);
            alert('An error occurred.');
        } finally {
            this.isSubmitting = false;
        }
    }
}
