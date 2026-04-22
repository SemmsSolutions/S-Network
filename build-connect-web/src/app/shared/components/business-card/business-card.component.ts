import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { RatingStarsComponent } from '../rating-stars/rating-stars.component';
import { CompareService } from '../../../core/services/compare.service';

@Component({
  selector: 'app-business-card',
  standalone: true,
  imports: [CommonModule, RouterModule, RatingStarsComponent],
  template: `
    <div class="biz-card card card-hover" (click)="openProfile()">
      <!-- Cover Image -->
      <div class="biz-img-wrap relative h-48 bg-gray-100">
        <img [src]="business.cover_image_url || 'assets/images/placeholder-business.jpg'"
             [alt]="business.name" loading="lazy" class="w-full h-full object-cover">
        <div class="absolute top-2 left-2 flex gap-2">
          <span class="badge-verified bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-bold shadow-sm border border-green-200" *ngIf="business.is_verified">✓ Verified</span>
          <span class="badge-premium bg-amber-50 text-amber-700 px-2 py-1 rounded-full text-xs font-bold shadow-sm border border-amber-200" *ngIf="business.is_premium">★ Premium</span>
        </div>
        <button class="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-50 transition" (click)="toggleSave($event)" title="Save">
          <svg width="16" height="16" viewBox="0 0 24 24" [attr.fill]="isSaved ? '#CC0000' : 'none'" [attr.stroke]="isSaved ? '#CC0000' : '#444B5D'" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 flex flex-col justify-between" style="min-height: 180px;">
        <div>
          <div class="flex justify-between items-start">
            <h3 class="text-xl font-bold text-gray-900 truncate pr-2">{{ business.name }}</h3>
            <div class="flex items-center gap-1 shrink-0" *ngIf="(business.avg_rating || business.rating) > 0">
              <span class="stars-green bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded text-xs">{{ business.avg_rating || business.rating | number:'1.1-1' }} ★</span>
              <span class="text-xs text-gray-500">({{ business.total_reviews || 0 }})</span>
            </div>
          </div>

          <div class="flex items-center gap-2 mt-1 text-sm text-gray-600">
            <span class="font-medium text-gray-800 truncate" style="max-width: 140px;">{{ business.categories?.name || 'Service' }}</span>
            <span class="text-gray-300">•</span>
            <span class="truncate">📍 {{ business.city }}</span>
          </div>

          <div class="flex items-center gap-2 mt-2 text-xs font-semibold">
            <span [class]="isOpenNow() ? 'text-green-600' : 'text-red-500'">
              ● {{ isOpenNow() ? 'Open Now' : 'Closed' }}
            </span>
            <span class="text-gray-300" *ngIf="business.year_established">•</span>
            <span class="bg-gray-100 text-gray-700 px-2 py-0.5 rounded" *ngIf="business.year_established">
              {{ currentYear - business.year_established }}+ Yrs Exp
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 mt-4 pt-3 border-t border-gray-100">
          <button class="flex-1 flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-800 font-semibold py-2 rounded-lg transition border border-gray-200 text-sm" (click)="callBusiness($event)" title="Call">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>
            Call
          </button>
          <button class="flex-[1.5] flex items-center justify-center gap-1 bg-[#CC0000] hover:bg-[#990000] text-white font-semibold py-2 rounded-lg transition shadow-sm text-sm" (click)="enquireNow($event)">
            📋 Enquire Now
          </button>
          <button class="flex items-center justify-center bg-[#25D366] hover:bg-[#1DA851] text-white p-2 rounded-lg transition shadow-sm" (click)="openWhatsApp($event)" *ngIf="business.whatsapp" title="WhatsApp">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/></svg>
          </button>
        </div>
      </div>
    </div>
  `
})
export class BusinessCardComponent implements OnInit {
  @Input() business: any;
  @Input() compact: boolean = false;
  isSaved = false;
  isCompared = false;
  currentYear = new Date().getFullYear();

  constructor(private compareService: CompareService, private router: Router) { }

  ngOnInit() {
    this.compareService.selection$.subscribe(sel => {
      this.isCompared = !!sel.find(s => s.id === this.business.id);
    });
  }

  isOpenNow() {
    const hr = new Date().getHours();
    return hr >= 9 && hr < 18;
  }

  toggleSave(e: Event) {
    e.stopPropagation();
    this.isSaved = !this.isSaved;
    // Call Supabase save logic here later
  }

  openProfile() {
    if (this.business.slug || this.business.id) {
      this.router.navigate(['/business', this.business.slug || this.business.id]);
    }
  }

  callBusiness(e: Event) {
    e.stopPropagation();
    if (this.business.phone) window.open(`tel:${this.business.phone}`);
  }

  enquireNow(e: Event) {
    e.stopPropagation();
    // Normally open inquiry modal
    alert('Enquiry form coming soon!');
  }

  openWhatsApp(e: Event) {
    e.stopPropagation();
    if (this.business.whatsapp) window.open(`https://wa.me/91${this.business.whatsapp}`, '_blank');
  }

  toggleCompare(e: any) {
    e.stopPropagation();
    if (e.target.checked) {
      this.compareService.toggleCompare({ id: this.business.id, name: this.business.name });
    } else {
      this.compareService.toggleCompare({ id: this.business.id, name: '' });
    }
  }
}
