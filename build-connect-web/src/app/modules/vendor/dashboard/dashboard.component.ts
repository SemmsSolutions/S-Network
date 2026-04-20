import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { VerificationService } from '../../../core/services/verification.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="max-w-6xl mx-auto pb-12">
      <!-- Verification Banner -->
      <div *ngIf="verificationStatus === 'unverified'" class="mb-6 bg-orange-50 border border-orange-300 p-4 rounded-xl flex justify-between items-center">
        <span class="font-bold text-orange-700">⚡ Get more leads! Verify your business with GST/MSME documents.</span>
        <a routerLink="/vendor/profile" [queryParams]="{tab:'verification'}" class="bg-primary text-white px-4 py-2 rounded font-bold text-sm hover:bg-opacity-90 transition">Get Verified →</a>
      </div>
      <div *ngIf="verificationStatus === 'pending'" class="mb-6 bg-blue-50 border border-blue-300 p-4 rounded-xl">
        <span class="font-bold text-blue-700">🕐 Your verification is under review. We'll notify you within 2–3 business days.</span>
      </div>
      <div *ngIf="verificationStatus === 'verified' && showVerifiedBanner" class="mb-6 bg-green-50 border border-green-300 p-4 rounded-xl flex justify-between items-center">
        <span class="font-bold text-green-700">✅ Your business is Verified on S-Network!</span>
        <button (click)="showVerifiedBanner = false" class="text-green-500 hover:text-green-700 font-bold">×</button>
      </div>
      <div *ngIf="verificationStatus === 'rejected'" class="mb-6 bg-red-50 border border-red-300 p-4 rounded-xl flex justify-between items-center">
        <span class="font-bold text-red-700">❌ Verification not approved: {{rejectionReason}}</span>
        <a routerLink="/vendor/profile" [queryParams]="{tab:'verification'}" class="bg-red-500 text-white px-4 py-2 rounded font-bold text-sm hover:bg-opacity-90 transition">Resubmit →</a>
      </div>
      <!-- Header Row -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
         <div>
            <h1 class="text-3xl font-heading font-bold text-primary tracking-wide">Vendor Dashboard</h1>
            <p class="text-gray-500 font-medium">Welcome back! Here's an overview of your business performance.</p>
         </div>
         
         <div *ngIf="business" class="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3">
            <span class="text-sm font-bold text-gray-700">Accepting Leads</span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" [(ngModel)]="!business.is_on_vacation" (change)="toggleVacation()" [disabled]="savingVacation" class="sr-only peer">
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
            <div *ngIf="savingVacation" class="animate-spin text-xs">⏳</div>
         </div>
      </div>

      <!-- Completeness Banner -->
      <div *ngIf="business && completeness < 100" class="mb-8 bg-blue-50 border border-blue-200 p-6 rounded-xl shadow-sm">
         <div class="flex justify-between items-center mb-2">
            <h3 class="font-bold text-primary flex items-center gap-2"><span>🎯</span> Profile Completeness: {{completeness}}%</h3>
            <a routerLink="/vendor/profile" class="text-secondary font-bold text-sm hover:underline">Complete Profile</a>
         </div>
         <div class="w-full bg-blue-200 rounded-full h-2.5 mb-4">
            <div class="bg-primary h-2.5 rounded-full transition-all" [style.width.%]="completeness"></div>
         </div>
         <p class="text-sm text-gray-600 font-medium">Boost your ranking by completing the following: <span class="font-bold text-primary">{{missingFields.join(', ')}}</span></p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 transform transition hover:-translate-y-1 hover:shadow-md">
          <p class="text-gray-500 font-bold text-xs uppercase tracking-widest mb-1">Total Leads</p>
          <div class="text-4xl font-heading font-bold text-secondary">{{stats.total_leads}}</div>
        </div>
        
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden transform transition hover:-translate-y-1 hover:shadow-md">
          <div class="absolute top-0 right-0 w-2 h-full bg-primary shadow"></div>
          <p class="text-gray-500 font-bold text-xs uppercase tracking-widest mb-1">New Leads</p>
          <div class="text-4xl font-heading font-bold text-primary">{{stats.new_leads}}</div>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 transform transition hover:-translate-y-1 hover:shadow-md">
          <p class="text-gray-500 font-bold text-xs uppercase tracking-widest mb-1">Profile Views</p>
          <div class="text-4xl font-heading font-bold text-gray-800">{{stats.profile_views}}</div>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 transform transition hover:-translate-y-1 hover:shadow-md">
          <p class="text-gray-500 font-bold text-xs uppercase tracking-widest mb-1">Conversion Rate</p>
          <div class="flex items-end gap-2">
            <div class="text-4xl font-heading font-bold text-success">{{stats.conversion_rate | number:'1.0-1'}}%</div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  stats = {
    total_leads: 0,
    new_leads: 0,
    profile_views: 0,
    conversion_rate: 0
  };

  business: any = null;
  completeness = 0;
  missingFields: string[] = [];
  verificationStatus = 'unverified';
  rejectionReason = '';
  showVerifiedBanner = true;
  savingVacation = false;

  constructor(private supabase: SupabaseService, private verificationService: VerificationService) { }

  async ngOnInit() {
    try {
      const { data: { user } } = await this.supabase.client.auth.getUser();
      if (user) {
        const { data: b } = await this.supabase.client.from('businesses').select('*, business_images(id), business_faqs(id)').eq('owner_id', user.id).maybeSingle();
        if (b) {
          this.business = b;
          this.calculateCompleteness(b);
          const v = await this.verificationService.getVerificationStatus(b.id);
          if (v) {
            this.verificationStatus = v.status === 'approved' ? 'verified' : v.status;
            this.rejectionReason = v.rejection_reason || '';
          } else {
            this.verificationStatus = b.verification_status || 'unverified';
            this.rejectionReason = b.verification_rejection_reason || '';
          }
        }
      }

      const { data, error } = await this.supabase.client.functions.invoke('get-vendor-analytics', { method: 'GET' });
      if (data && data.analytics) {
        this.stats.total_leads = data.analytics.total_leads || 0;
        this.stats.profile_views = data.analytics.profile_views || 0;
        this.stats.conversion_rate = data.analytics.conversion_rate || 0;
        this.stats.new_leads = Math.max(0, Math.floor(this.stats.total_leads * 0.15));
      }
    } catch (err) {
      console.error(err);
    }
  }

  calculateCompleteness(b: any) {
    this.missingFields = [];
    const fields = [
      { k: 'name', n: 'Name' },
      { k: 'description', n: 'Description' },
      { k: 'phone', n: 'Phone' },
      { k: 'address', n: 'Address' },
      { k: 'city', n: 'City' }
    ];

    let score = 0;
    const total = fields.length + 3; // 3 extra for areas, images, faqs

    for (const f of fields) {
      if (b[f.k] && String(b[f.k]).trim().length > 0) score++;
      else this.missingFields.push(f.n);
    }

    if (b.service_areas && b.service_areas.length > 0) score++;
    else this.missingFields.push('Service Areas');

    if (b.business_images && b.business_images.length > 0) score++;
    else this.missingFields.push('Portfolio Images');

    if (b.business_faqs && b.business_faqs.length > 0) score++;
    else this.missingFields.push('FAQs');

    this.completeness = Math.round((score / total) * 100);
  }

  async toggleVacation() {
    if (!this.business) return;
    this.savingVacation = true;
    // Inverting because UI binds !is_on_vacation
    const newValue = this.business.is_on_vacation;
    await this.supabase.client.from('businesses').update({ is_on_vacation: newValue }).eq('id', this.business.id);
    this.savingVacation = false;
  }
}
