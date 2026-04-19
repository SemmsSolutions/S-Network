import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LeadFormModalComponent } from '../../../shared/components/lead-form-modal/lead-form-modal.component';
import { LoginPromptModalComponent } from '../../../shared/components/login-prompt-modal/login-prompt-modal.component';
import { RatingStarsComponent } from '../../../shared/components/rating-stars/rating-stars.component';
import { SupabaseService } from '../../../core/services/supabase.service';
import { RecentlyViewedService } from '../../../core/services/recently-viewed.service';
import { MaterialService } from '../../../core/services/material.service';
import { BusinessMaterial, MaterialGroup } from '../../../shared/models/material.model';

@Component({
  selector: 'app-business-profile',
  standalone: true,
  imports: [CommonModule, LeadFormModalComponent, LoginPromptModalComponent, RatingStarsComponent, FormsModule],
  template: `
    <div class="bg-surface min-h-screen font-body pb-24 relative" *ngIf="business">
      <!-- Header -->
      <header class="bg-white border-b shadow-sm border-gray-200">
        <div class="max-w-5xl mx-auto p-4 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <span class="bg-primary bg-opacity-10 text-primary font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider">{{business.categories?.name || 'Category'}}</span>
              <span *ngIf="business.is_verified" class="bg-success text-white font-bold px-2 py-1 rounded text-xs flex items-center shadow-sm">Verified</span>
              <span [class]="isOpenNow() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" class="font-bold px-2 py-1 rounded text-xs flex items-center shadow-sm">{{isOpenNow() ? 'Open Now' : 'Closed'}}</span>
            </div>
            <h1 class="text-3xl md:text-4xl font-heading font-bold text-primary">{{business.name}}</h1>
            <p class="text-gray-500 mt-2 font-bold tracking-wide">📍 {{business.address}}, {{business.city}}</p>
            <div class="flex items-center gap-2 mt-3">
              <app-rating-stars [rating]="business.avg_rating || business.rating"></app-rating-stars>
              <span class="font-bold text-primary">{{(business.avg_rating || business.rating | number:'1.1-1')}}</span>
              <span class="text-sm text-gray-500 font-bold">({{business.total_reviews}} reviews)</span>
            </div>
          </div>
          
          <div class="flex flex-wrap gap-4 w-full md:w-auto">
            <button (click)="trackCall()" class="flex-1 md:flex-none flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-6 py-3 font-bold text-primary hover:bg-gray-50 transition shadow-sm relative overflow-hidden">
              <span *ngIf="calling" class="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center font-bold text-primary">Connecting...</span>
              📞 Call
            </button>
            <a *ngIf="business.whatsapp" [href]="'https://wa.me/' + business.whatsapp" target="_blank" class="flex-1 md:flex-none flex items-center justify-center gap-2 bg-success text-white rounded-lg px-6 py-3 font-bold hover:bg-opacity-90 transition shadow-sm">
              💬 WhatsApp
            </a>
            <button (click)="shareProfile()" class="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg px-4 py-3 font-bold hover:bg-gray-200 transition shadow-sm">
              🔗 Share
            </button>
          </div>
        </div>
      </header>

      <div class="max-w-5xl mx-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Main Content -->
        <main class="md:col-span-2 space-y-8">
          
          <!-- Trust Signals -->
          <section class="flex flex-wrap gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
             <div class="flex flex-col">
               <span class="text-xs uppercase tracking-widest text-primary font-bold opacity-70">Response Rate</span>
               <span class="font-bold text-lg text-primary">{{business.response_rate | number:'1.0-0'}}%</span>
             </div>
             <div class="w-px bg-blue-200 hidden sm:block"></div>
             <div class="flex flex-col">
               <span class="text-xs uppercase tracking-widest text-primary font-bold opacity-70">Avg Response Time</span>
               <span class="font-bold text-lg text-primary">{{business.avg_response_time_hours < 1 ? '< 1h' : (business.avg_response_time_hours | number:'1.0-1') + 'h'}}</span>
             </div>
             <div class="w-px bg-blue-200 hidden sm:block"></div>
             <div class="flex flex-col">
               <span class="text-xs uppercase tracking-widest text-primary font-bold opacity-70">Established</span>
               <span class="font-bold text-lg text-primary">{{business.year_established || 'N/A'}}</span>
             </div>
          </section>

          <section *ngIf="business.description">
            <h2 class="text-2xl font-heading font-bold text-primary mb-4 border-b border-gray-200 pb-2">About</h2>
            <p class="text-gray-700 leading-relaxed font-medium">{{business.description}}</p>
          </section>

          <section *ngIf="business.service_areas && business.service_areas.length > 0">
            <h2 class="text-2xl font-heading font-bold text-primary mb-4 border-b border-gray-200 pb-2">Service Areas</h2>
            <div class="flex flex-wrap gap-2">
              <span *ngFor="let area of business.service_areas" class="px-3 py-1 bg-gray-100 rounded text-sm font-bold text-gray-700 border border-gray-200 shadow-sm">{{area}}</span>
            </div>
          </section>

          <!-- Materials & Products Section -->
          <section *ngIf="groupedMaterials.length > 0">
             <h2 class="text-2xl font-heading font-bold text-primary mb-4 border-b border-gray-200 pb-2">Materials & Products</h2>
             <div class="space-y-4">
                <details *ngFor="let group of groupedMaterials" class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm group cursor-pointer" open>
                   <summary class="font-bold text-gray-800 list-none flex justify-between items-center outline-none">
                     <span class="text-lg">{{group.icon}} {{group.name}}</span>
                     <span class="text-primary group-open:rotate-180 transition-transform">▼</span>
                   </summary>
                   <div class="mt-4 flex flex-wrap gap-3">
                      <div *ngFor="let m of group.items" class="bg-gray-50 border border-gray-200 rounded p-3 flex flex-col min-w-[200px] flex-1">
                         <div class="font-bold text-primary flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-secondary"></span>
                            {{m.material_items?.name}}
                         </div>
                         <div *ngIf="m.custom_description" class="text-sm text-gray-500 mt-1 pl-4 break-words">
                            {{m.custom_description}}
                         </div>
                      </div>
                   </div>
                </details>
             </div>
          </section>

          <section *ngIf="business.business_images?.length">
            <h2 class="text-2xl font-heading font-bold text-primary mb-4 border-b border-gray-200 pb-2">Portfolio</h2>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div *ngFor="let img of business.business_images" class="bg-gray-100 aspect-square rounded-lg overflow-hidden shadow-sm">
                <img [src]="img.image_url" class="object-cover w-full h-full">
              </div>
            </div>
          </section>

          <!-- FAQs -->
          <section *ngIf="faqs.length > 0">
            <h2 class="text-2xl font-heading font-bold text-primary mb-4 border-b border-gray-200 pb-2">Frequently Asked Questions</h2>
            <div class="space-y-4">
               <details *ngFor="let faq of faqs" class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm group cursor-pointer">
                 <summary class="font-bold text-gray-800 list-none flex justify-between items-center outline-none">
                   {{faq.question}}
                   <span class="text-primary group-open:rotate-180 transition-transform">▼</span>
                 </summary>
                 <p class="mt-4 text-gray-600 font-medium">{{faq.answer}}</p>
               </details>
            </div>
          </section>

          <section>
            <h2 class="text-2xl font-heading font-bold text-primary mb-4 border-b border-gray-200 pb-2">Reviews</h2>
            <div class="space-y-6">
              <div *ngFor="let r of reviews" class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div class="flex items-center justify-between mb-3">
                  <span class="font-bold text-primary">{{r.user_name || 'Anonymous'}}</span>
                  <app-rating-stars [rating]="r.rating"></app-rating-stars>
                </div>
                <p class="text-gray-600 font-medium">{{r.comment}}</p>
                <div class="mt-4 flex items-center justify-between">
                  <span class="text-xs text-gray-400 font-bold uppercase tracking-widest">{{r.created_at | date}}</span>
                  <button (click)="toggleHelpful(r)" [class.text-primary]="r.has_voted" class="text-xs font-bold text-gray-500 hover:text-primary transition flex items-center gap-1 border border-gray-200 px-3 py-1 rounded-full shadow-sm hover:shadow">
                    👍 Helpful ({{r.helpful_count || 0}})
                  </button>
                </div>
                <div *ngIf="r.vendor_reply" class="mt-6 bg-blue-50 p-4 rounded-lg border-l-4 border-primary">
                  <p class="text-xs font-bold uppercase tracking-widest text-primary mb-1">Response from Owner</p>
                  <p class="text-sm text-gray-700 font-medium">{{r.vendor_reply}}</p>
                </div>
              </div>
              <div *ngIf="reviews.length === 0" class="text-gray-500 italic font-medium">No reviews yet. Be the first to review!</div>
            </div>
          </section>

          <!-- Report -->
          <div class="pt-8 text-center">
            <button (click)="showReportModal = true" class="text-xs text-gray-400 hover:text-red-500 underline uppercase tracking-widest font-bold transition">Report this Business</button>
          </div>
        </main>
        
        <!-- Sidebar -->
        <aside class="hidden md:block">
          <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200 sticky top-24">
            <h3 class="font-heading font-bold text-xl mb-2 text-primary">Ready to start?</h3>
            <p class="text-sm text-gray-500 mb-6 font-medium">Get an estimated quote directly from the business.</p>
            <button (click)="isModalOpen = true" class="w-full bg-secondary text-white font-bold py-4 rounded-lg hover:bg-opacity-90 transition shadow-md font-heading text-lg">
              Request Quote
            </button>
          </div>
        </aside>
      </div>

      <!-- Mobile Sticky CTA Bottom Bar -->
      <div class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:hidden z-40">
        <button (click)="isModalOpen = true" class="w-full bg-secondary text-white font-bold py-4 rounded-lg hover:bg-opacity-90 transition font-heading shadow-md text-lg">
          Request Quote
        </button>
      </div>

      <!-- Modal -->
      <app-lead-form-modal *ngIf="isModalOpen" [businessId]="business.id" (close)="isModalOpen = false" (submitLead)="handleLeadSubmit($event)"></app-lead-form-modal>

      <!-- Report Modal -->
      <div *ngIf="showReportModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
        <div class="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
          <h2 class="text-2xl font-bold font-heading mb-6 text-gray-900">Report Business</h2>
          <div class="space-y-4">
             <select [(ngModel)]="reportReason" class="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 font-medium">
                <option value="Fake listing">Fake listing</option>
                <option value="Wrong info">Wrong info</option>
                <option value="Spam">Spam</option>
                <option value="Closed business">Closed business</option>
                <option value="Other">Other</option>
             </select>
             <textarea [(ngModel)]="reportDesc" placeholder="Additional details..." class="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 h-24 font-medium resize-none"></textarea>
          </div>
          <div class="mt-8 flex gap-3 justify-end">
             <button (click)="showReportModal=false" class="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancel</button>
             <button (click)="submitReport()" [disabled]="!reportReason || reporting" class="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 transition">Submit Report</button>
          </div>
        </div>
      </div>

    </div>
    <!-- Login Prompt Modal for unauthenticated users -->
    <app-login-prompt-modal
      *ngIf="showLoginPrompt && business"
      [businessName]="business.name"
      [businessId]="business.id"
      (onClose)="showLoginPrompt = false">
    </app-login-prompt-modal>
    
    <div *ngIf="!business && !loading" class="h-screen flex items-center justify-center text-gray-500 font-bold">Business not found.</div>
    <div *ngIf="loading" class="h-screen flex items-center justify-center"><div class="animate-spin text-4xl">🏗️</div></div>
  `
})
export class BusinessProfileComponent implements OnInit {
  isModalOpen = false;
  showReportModal = false;
  showLoginPrompt = false;
  business: any = null;
  reviews: any[] = [];
  faqs: any[] = [];
  loading = true;
  calling = false;

  reportReason = 'Fake listing';
  reportDesc = '';
  reporting = false;

  groupedMaterials: { name: string, icon: string | null, items: BusinessMaterial[] }[] = [];

  constructor(
    private route: ActivatedRoute,
    private supabase: SupabaseService,
    private rvService: RecentlyViewedService,
    private materialService: MaterialService
  ) { }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('slug');
    if (id) await this.loadBusiness(id);
  }

  async loadBusiness(id: string) {
    try {
      const { data: b } = await this.supabase.client.from('businesses').select('*, categories(name), business_images(image_url)').eq('id', id).single();
      if (b) {
        this.business = b;
        this.rvService.addViewed({ id: b.id, name: b.name, category: b.categories?.name, image_url: b.business_images?.[0]?.image_url });

        this.supabase.client.functions.invoke('increment-view-count', { body: { business_id: b.id } });

        const [{ data: rData }, { data: fData }] = await Promise.all([
          this.supabase.client.from('reviews').select('*').eq('business_id', b.id).order('created_at', { ascending: false }),
          this.supabase.client.from('business_faqs').select('*').eq('business_id', b.id)
        ]);

        if (rData) {
          const avg = rData.length > 0 ? rData.reduce((s: number, rv: any) => s + rv.rating, 0) / rData.length : b.rating;
          this.business.avg_rating = avg;
          this.business.total_reviews = rData.length;
          this.reviews = rData;
        }
        if (fData) this.faqs = fData;

        // Fetch Materials
        this.materialService.getMaterialGroups().subscribe(groups => {
          this.materialService.getBusinessMaterials(b.id).subscribe(bMats => {
            const groupsMap = new Map<string, { name: string, icon: string | null, items: BusinessMaterial[] }>();

            bMats.forEach(bm => {
              if (bm.material_items) {
                const gId = bm.material_items.group_id;
                if (!groupsMap.has(gId)) {
                  const gInfo = groups.find(g => g.id === gId);
                  groupsMap.set(gId, { name: gInfo?.name || 'Other', icon: gInfo?.icon || '', items: [] });
                }
                groupsMap.get(gId)!.items.push(bm);
              }
            });
            this.groupedMaterials = Array.from(groupsMap.values());
          });
        });
      }
    } catch (e) { console.error(e); }
    this.loading = false;
  }

  isOpenNow() {
    const hr = new Date().getHours();
    return hr >= 9 && hr < 18;
  }

  async trackCall() {
    this.calling = true;
    try {
      await this.supabase.client.functions.invoke('log-call-lead', { body: { business_id: this.business.id } });
      setTimeout(() => {
        this.calling = false;
        window.location.href = `tel:${this.business.phone}`;
      }, 1000);
    } catch (e) {
      this.calling = false;
      window.location.href = `tel:${this.business.phone}`;
    }
  }

  shareProfile() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: this.business.name, url }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  }

  async submitReport() {
    this.reporting = true;
    const { data: { user } } = await this.supabase.client.auth.getUser();
    try {
      const { error } = await this.supabase.client.from('reported_businesses').insert({
        business_id: this.business.id,
        reporter_id: user?.id || null,
        reason: this.reportReason,
        description: this.reportDesc
      });
      if (!error) {
        alert('Report submitted for review.');
        this.showReportModal = false;
      }
    } catch (e) { console.error(e); }
    this.reporting = false;
  }

  async toggleHelpful(review: any) {
    const { data: { user } } = await this.supabase.client.auth.getUser();
    if (!user) { alert('Please sign in to vote.'); return; }

    try {
      const res = await this.supabase.client.functions.invoke('toggle-helpful-review', { body: { review_id: review.id } });
      if (res.data && res.data.count !== undefined) {
        review.helpful_count = res.data.count;
        review.has_voted = res.data.helpful;
      }
    } catch (e) { console.error(e); }
  }

  // Section 2: Check auth before showing quote form; show login prompt for guests
  async handleGetQuote() {
    const { data: { session } } = await this.supabase.client.auth.getSession();
    if (!session) {
      // Store intended action
      sessionStorage.setItem('pendingQuote', JSON.stringify({
        businessId: this.business.id,
        businessName: this.business.name
      }));
      this.showLoginPrompt = true;
      return;
    }
    this.isModalOpen = true;
  }

  async handleLeadSubmit(data: any) {
    try {
      const { data: { user } } = await this.supabase.client.auth.getUser();
      const { error } = await this.supabase.client.functions.invoke('create-lead', {
        body: {
          business_id: this.business.id,
          user_id: user?.id || null,
          user_name: data.user_name,
          user_phone: data.user_phone,
          user_email: data.user_email || null,
          project_type: data.project_type,
          budget_min: data.budget_min || null,
          budget_max: data.budget_max || null,
          timeline: data.timeline || null,
          message: data.message
        }
      });
      if (error) throw error;
      this.isModalOpen = false;
      alert('✅ Quote request sent! The vendor will contact you shortly.');
    } catch (e) {
      console.error(e);
      alert('Failed to send request. Please try again.');
    }
  }
}
