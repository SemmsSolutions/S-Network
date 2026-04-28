import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LeadFormModalComponent } from '../../../shared/components/lead-form-modal/lead-form-modal.component';
import { LoginPromptModalComponent } from '../../../shared/components/login-prompt-modal/login-prompt-modal.component';
import { RatingStarsComponent } from '../../../shared/components/rating-stars/rating-stars.component';
import { SupabaseService } from '../../../core/services/supabase.service';
import { RecentlyViewedService } from '../../../core/services/recently-viewed.service';
import { MaterialService } from '../../../core/services/material.service';
import { BusinessMaterial } from '../../../shared/models/material.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-business-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, LeadFormModalComponent, LoginPromptModalComponent, RatingStarsComponent, FormsModule],
  template: `
    <div class="bg-surface min-h-screen font-body pb-24 relative" *ngIf="business">
      
      <!-- Breadcrumb -->
      <div class="breadcrumb-bar bg-white border-b border-gray-200 py-2">
        <div class="max-w-7xl mx-auto px-4 md:px-8 text-sm text-gray-500">
          <nav class="flex gap-2 items-center flex-wrap">
            <a routerLink="/home" class="hover:text-primary transition">Home</a> &rsaquo;
            <a [routerLink]="['/search']" [queryParams]="{category: business?.categories?.slug}" class="hover:text-primary transition">{{ business?.categories?.name }}</a> &rsaquo;
            <a [routerLink]="['/search']" [queryParams]="{city: business?.city}" class="hover:text-primary transition">{{ business?.city }}</a> &rsaquo;
            <span class="text-gray-800 font-medium">{{ business?.name }}</span>
          </nav>
        </div>
      </div>

      <!-- Image Mosaic (Justdial style: 1 large + 4 small) -->
      <section class="profile-gallery bg-white pt-4 md:pt-6">
        <div class="max-w-7xl mx-auto px-4 md:px-8">
          <div class="gallery-mosaic grid grid-cols-1 md:grid-cols-2 gap-2 h-[300px] md:h-[400px] rounded-xl overflow-hidden">
            <div class="gallery-main h-full w-full bg-gray-100 cursor-pointer relative group">
              <img [src]="images[0] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'"
                   [alt]="business?.name" loading="lazy" (click)="openLightbox(0)" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
            </div>
            <div class="gallery-grid hidden md:grid grid-cols-2 grid-rows-2 gap-2 h-full">
              <div *ngFor="let img of images.slice(1, 5); let i = index" class="gallery-thumb bg-gray-100 cursor-pointer relative group h-full w-full">
                <img [src]="img" [alt]="business?.name + ' photo ' + (i+2)" loading="lazy" (click)="openLightbox(i+1)" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                <div class="more-overlay absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white font-bold text-xl" *ngIf="i === 3 && images.length > 5" (click)="openLightbox(4)">
                  <span>+{{ images.length - 5 }} More</span>
                </div>
              </div>
              <!-- Fill emtpy boxes if less than 5 images -->
              <div *ngFor="let empty of emptyThumbs" class="gallery-thumb bg-gray-100 w-full h-full"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Business Header -->
      <section class="profile-header-section bg-white border-b border-gray-200 pt-6 pb-0">
        <div class="max-w-7xl mx-auto px-4 md:px-8">
          <div class="profile-header flex flex-col md:flex-row justify-between gap-6 mb-6">
            <div class="profile-header-left flex gap-4 items-start">
              <div class="biz-logo-circle w-16 h-16 rounded-full bg-red-100 text-primary flex items-center justify-center text-2xl font-bold font-heading shrink-0" *ngIf="!business?.logo_url">
                {{ business?.name?.charAt(0) | uppercase }}
              </div>
              <img *ngIf="business?.logo_url" [src]="business.logo_url" class="w-16 h-16 rounded-full object-cover shrink-0 border border-gray-200 shadow-sm">
              
              <div class="profile-title-group">
                <h1 class="text-3xl md:text-4xl font-bold font-heading text-navy">{{ business?.name }}</h1>
                <div class="profile-meta-row flex flex-wrap items-center gap-3 mt-2 text-sm font-medium">
                  <span class="bg-green-600 text-white px-2 py-0.5 rounded flex items-center font-bold shadow-sm top-rated-badge" *ngIf="business?.rating > 0">{{ business?.rating | number:'1.1-1' }} ★</span>
                  <span class="text-gray-500 font-bold" *ngIf="business?.total_reviews">({{ business?.total_reviews }} Ratings)</span>
                  <span class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold shadow-sm flex items-center" *ngIf="business?.is_verified"><svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"></path></svg>Verified</span>
                  <span class="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-bold shadow-sm" *ngIf="business?.year_established">{{ currentYear - business?.year_established }} Years in Business</span>
                </div>
                <div class="profile-location-row flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-600">
                  <span class="font-medium">📍 {{ business?.address }}, {{ business?.city }}</span>
                  <span class="font-bold flex items-center gap-1" [class.text-green-600]="isOpenNow()" [class.text-red-600]="!isOpenNow()">
                    <span class="w-2 h-2 rounded-full" [class.bg-green-600]="isOpenNow()" [class.bg-red-600]="!isOpenNow()"></span>
                    {{ isOpenNow() ? 'Open Now' : 'Closed' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Action Bar -->
            <div class="profile-actions-bar flex flex-wrap gap-3 items-start shrink-0">
               <button class="bg-white border-2 border-primary text-primary hover:bg-red-50 hover:text-primary px-6 py-3 font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm" (click)="callBusiness()">
                 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                 {{ business?.phone }}
               </button>
               <button class="bg-primary text-white hover:bg-red-700 px-6 py-3 font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm" (click)="openEnquireForm()">
                 💬 Enquire Now
               </button>
               <a [href]="'https://wa.me/' + business?.whatsapp" target="_blank" class="bg-green-500 text-white hover:bg-green-600 px-5 py-3 font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm" *ngIf="business?.whatsapp">
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/></svg>
               </a>
               <button class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg transition-colors shadow-sm" (click)="shareProfile()" title="Share">📤</button>
               <a [routerLink]="['/vendor/profile']" *ngIf="isOwner" class="bg-gray-800 text-white hover:bg-gray-900 px-5 py-3 font-bold rounded-lg transition-colors shadow-sm" title="Edit Profile">✏️ Edit</a>
            </div>
          </div>

          <!-- Tab Navigation -->
          <div class="profile-tabs flex gap-6 border-t border-gray-200 pt-1 -mb-px overflow-x-auto no-scrollbar">
            <button *ngFor="let tab of profileTabs" (click)="activeTab = tab.id"
                    [class.border-primary]="activeTab === tab.id"
                    [class.text-primary]="activeTab === tab.id"
                    [class.border-transparent]="activeTab !== tab.id"
                    class="profile-tab py-4 px-2 font-bold text-[15px] border-b-4 transition-colors whitespace-nowrap focus:outline-none flex items-center justify-center relative hover:text-primary">
              {{ tab.label }}
              <span class="absolute top-3 right-0 w-2 h-2 rounded-full bg-red-500" *ngIf="tab.id === 'reviews' && reviews.length"></span>
            </button>
          </div>
        </div>
      </section>

      <!-- Tab Content Section -->
      <section class="profile-tab-content mt-6">
        <div class="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Main Content (Left, 2 cols) -->
          <div class="profile-main lg:col-span-2 space-y-8">
            
            <!-- OVERVIEW TAB -->
            <div *ngIf="activeTab === 'overview'" class="space-y-8 animate-fadeIn">
              <div class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200">
                <h3 class="text-2xl font-bold font-heading text-navy mb-4">About {{ business?.name }}</h3>
                <p class="text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">{{ business?.description || 'No description available.' }}</p>
                <div class="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-gray-100 pt-6">
                  <div class="flex flex-col">
                    <span class="text-xs text-gray-500 font-bold uppercase tracking-wider">Response Rate</span>
                    <span class="text-lg font-bold text-navy">{{ business?.response_rate || 95 | number:'1.0-0' }}%</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-xs text-gray-500 font-bold uppercase tracking-wider">Avg Response Time</span>
                    <span class="text-lg font-bold text-navy">{{ (business?.avg_response_time_hours || 1) < 1 ? '< 1h' : (business?.avg_response_time_hours || 1 | number:'1.0-1') + 'h' }}</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-xs text-gray-500 font-bold uppercase tracking-wider">Established</span>
                    <span class="text-lg font-bold text-navy">{{ business?.year_established || 'N/A' }}</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-xs text-gray-500 font-bold uppercase tracking-wider">Followers</span>
                    <span class="text-lg font-bold text-navy">{{ business?.save_count || 0 }}</span>
                  </div>
                </div>
              </div>

              <!-- Materials / Products (Existing structured view) -->
              <div class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200" *ngIf="groupedMaterials.length">
                <h3 class="text-2xl font-bold font-heading text-navy mb-4">Materials & Products</h3>
                <div class="space-y-4">
                  <details *ngFor="let group of groupedMaterials" class="group/mktg" open>
                    <summary class="font-bold text-lg text-navy flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors list-none outline-none">
                      <span class="flex items-center gap-2">{{group.icon}} {{group.name}}</span>
                      <svg class="w-5 h-5 text-gray-500 transform group-open/mktg:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </summary>
                    <div class="mt-4 p-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div *ngFor="let m of group.items" class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div class="font-bold text-gray-800 flex items-center gap-2">
                          <span class="w-2 h-2 rounded-full bg-primary"></span>
                          {{m.material_items?.name}}
                        </div>
                        <p class="text-sm text-gray-500 mt-2 break-words" *ngIf="m.custom_description">{{m.custom_description}}</p>
                      </div>
                    </div>
                  </details>
                </div>
              </div>

              <!-- Service Areas -->
              <div class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200" *ngIf="business?.service_areas?.length">
                <h3 class="text-2xl font-bold font-heading text-navy mb-4">Service Areas</h3>
                <div class="flex flex-wrap gap-2">
                  <span *ngFor="let a of business?.service_areas" class="bg-gray-100 text-gray-700 px-4 py-2 rounded-full font-bold shadow-sm border border-gray-200">📍 {{ a }}</span>
                </div>
              </div>
            </div>

            <!-- PHOTOS TAB -->
            <div *ngIf="activeTab === 'photos'" class="animate-fadeIn">
              <div class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200">
                <h3 class="text-2xl font-bold font-heading text-navy mb-4">Portfolio & Gallery</h3>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  <div *ngFor="let img of images; let i = index" class="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer group shadow-sm border border-gray-200" (click)="openLightbox(i)">
                    <img [src]="img" class="w-full h-full object-cover group-hover:scale-110 transition duration-500" loading="lazy">
                  </div>
                </div>
                <div *ngIf="!images.length" class="text-center py-12 text-gray-500 font-medium">No photos uploaded yet.</div>
              </div>
            </div>

            <!-- REVIEWS TAB -->
            <div *ngIf="activeTab === 'reviews'" class="animate-fadeIn">
              <div class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200">
                <h3 class="text-2xl font-bold font-heading text-navy mb-6">Customer Reviews</h3>
                
                <div class="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b border-gray-100">
                  <div class="bg-gray-50 p-6 rounded-xl flex-shrink-0 text-center border border-gray-200">
                    <div class="text-5xl font-bold font-heading text-navy">{{ (business?.avg_rating || business?.rating) | number:'1.1-1' }}</div>
                    <div class="my-2 flex justify-center text-green-500 text-xl font-bold gap-1">
                      <span *ngFor="let s of [1,2,3,4,5]" [class.text-green-500]="s <= (business?.avg_rating || business?.rating)" [class.text-gray-300]="s > (business?.avg_rating || business?.rating)">★</span>
                    </div>
                    <div class="text-gray-500 font-bold text-sm">{{ business?.total_reviews || 0 }} Ratings</div>
                  </div>
                  <!-- Rating Bars -->
                  <div class="flex-grow flex flex-col gap-2">
                    <div *ngFor="let bar of ratingBars" class="flex items-center text-sm font-bold gap-3">
                      <span class="w-12 text-gray-600">{{ bar.stars }} ★</span>
                      <div class="flex-grow h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div class="h-full bg-green-500 rounded-full" [style.width]="bar.percent + '%'"></div>
                      </div>
                      <span class="w-10 text-right text-gray-400">{{ bar.count }}</span>
                    </div>
                  </div>
                </div>

                <div class="flex justify-end mb-6" *ngIf="currentUser">
                   <button class="bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-sm" (click)="openReviewModal()">Write a Review</button>
                </div>

                <div class="space-y-6">
                  <div *ngFor="let r of reviews" class="p-6 rounded-xl border border-gray-100 bg-white hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between mb-3">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">{{(r.profiles?.name || 'A')?.charAt(0) | uppercase}}</div>
                        <div>
                          <div class="font-bold text-navy">{{r.profiles?.name || 'Anonymous User'}}</div>
                          <div class="text-xs text-gray-500 font-bold">{{r.created_at | date:'longDate'}}</div>
                        </div>
                      </div>
                      <div class="flex text-green-500 text-lg font-bold">
                        <span *ngFor="let s of [1,2,3,4,5]" [class.text-green-500]="s <= r.rating" [class.text-gray-300]="s > r.rating">★</span>
                      </div>
                    </div>
                    <p class="text-gray-700 font-medium leading-relaxed my-4">{{r.comment}}</p>
                    <div class="flex items-center">
                      <button (click)="toggleHelpful(r)" [class.text-primary]="r.has_voted" [class.bg-red-50]="r.has_voted" [class.border-primary]="r.has_voted" class="text-xs font-bold text-gray-600 hover:text-primary transition flex items-center gap-1 border border-gray-300 px-4 py-1.5 rounded-full hover:bg-gray-50">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path></svg>
                        Helpful ({{r.helpful_count || 0}})
                      </button>
                    </div>
                    <div *ngIf="r.vendor_reply" class="mt-4 bg-gray-50 p-4 rounded-lg border-l-4 border-navy border border-gray-200">
                      <p class="text-xs font-bold uppercase tracking-widest text-navy mb-2">Response from Owner</p>
                      <p class="text-sm text-gray-700 font-medium">{{r.vendor_reply}}</p>
                    </div>
                  </div>
                  <div *ngIf="!reviews.length" class="text-gray-500 italic font-medium py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    No reviews yet. Support this business by leaving the first review!
                  </div>
                </div>
              </div>
            </div>

            <!-- QUICK INFO TAB -->
            <div *ngIf="activeTab === 'info'" class="animate-fadeIn space-y-6">
              <div class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200">
                <h3 class="text-2xl font-bold font-heading text-navy mb-6">Contact & Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 line-clamp-none">
                  <div class="space-y-5">
                    <div class="flex items-start gap-4">
                      <div class="w-10 h-10 rounded-full bg-red-50 text-primary flex items-center justify-center shrink-0">📞</div>
                      <div>
                        <p class="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Phone</p>
                        <p class="font-bold text-gray-800">{{ business?.phone }}</p>
                      </div>
                    </div>
                    <div class="flex items-start gap-4" *ngIf="business?.whatsapp">
                      <div class="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0">💬</div>
                      <div>
                        <p class="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">WhatsApp</p>
                        <p class="font-bold text-gray-800">{{ business?.whatsapp }}</p>
                      </div>
                    </div>
                    <div class="flex items-start gap-4" *ngIf="business?.website_url">
                      <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">🌐</div>
                      <div>
                        <p class="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Website</p>
                        <a [href]="business?.website_url" target="_blank" class="font-bold text-blue-600 hover:underline break-all">{{ business?.website_url }}</a>
                      </div>
                    </div>
                    <div class="flex items-start gap-4">
                      <div class="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">📍</div>
                      <div>
                        <p class="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Full Address</p>
                        <p class="font-bold text-gray-800">{{ business?.address }}</p>
                        <p class="text-gray-600">{{ business?.city }}, {{ business?.pincode }}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                     <h4 class="font-bold font-heading text-lg text-navy mb-4">Working Hours</h4>
                     <ul class="space-y-3 font-medium text-sm">
                        <li class="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span class="text-gray-600">Mon - Sat</span>
                          <span class="font-bold text-green-600">09:00 AM - 06:00 PM</span>
                        </li>
                        <li class="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span class="text-gray-600">Sunday</span>
                          <span class="font-bold text-red-600">Closed</span>
                        </li>
                     </ul>
                  </div>
                </div>
              </div>

              <!-- Map Embed -->
              <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 class="text-xl font-bold font-heading text-navy mb-4">Location Map</h3>
                <div class="h-64 bg-gray-200 rounded-lg overflow-hidden border border-gray-300">
                   <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1!2d77.5946!3d12.9716!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTLCsDU4JzE3LjgiTiA3N8KwMzUnNDAuNiJF!5e0!3m2!1sen!2sin!4v1" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
                </div>
              </div>
            </div>

            <!-- FAQs Section (visible outside tabs or inside info tab) -->
            <div *ngIf="faqs.length && activeTab === 'overview'" class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 mt-8">
              <h3 class="text-2xl font-bold font-heading text-navy mb-6">Frequently Asked Questions</h3>
              <div class="space-y-4">
                 <details *ngFor="let faq of faqs" class="group/faq border bg-white border-gray-200 rounded-lg shadow-sm">
                   <summary class="font-bold text-gray-800 list-none flex justify-between items-center p-5 cursor-pointer outline-none hover:bg-gray-50 transition-colors">
                     {{faq.question}}
                     <span class="text-gray-400 group-open/faq:rotate-180 transition-transform">
                       <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                     </span>
                   </summary>
                   <div class="px-5 pb-5">
                      <p class="text-gray-600 font-medium pt-2 border-t border-gray-100">{{faq.answer}}</p>
                   </div>
                 </details>
              </div>
            </div>

          </div>

          <!-- Sticky Sidebar (Right Col) -->
          <div class="profile-sidebar lg:col-span-1">
            <div class="sticky top-24 space-y-6">
              
              <!-- Lead Form Card -->
              <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h3 class="font-heading font-bold text-xl mb-2 text-navy flex items-center justify-between">
                  Send Enquiry 
                  <span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold uppercase tracking-widest">Fast Reply</span>
                </h3>
                <p class="text-sm text-gray-500 mb-5 font-medium border-b border-gray-100 pb-4">Directly contact the business to get quotes and details.</p>
                <form (ngSubmit)="submitEnquiry()" #f="ngForm" class="space-y-4">
                  <select [(ngModel)]="enquiryForm.project_type" name="project_type" class="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm" required>
                    <option value="" disabled>Select Requirement Type</option>
                    <option value="New Construction">New Construction</option>
                    <option value="Renovation">Renovation</option>
                    <option value="Interior Design">Interior Design</option>
                    <option value="Material Supply">Material Supply</option>
                    <option value="Electrical Work">Electrical Work</option>
                    <option value="Other">Other</option>
                  </select>
                  <div class="grid grid-cols-2 gap-3">
                    <input type="number" [(ngModel)]="enquiryForm.budget_min" name="budget_min" placeholder="Min Budget ₹" class="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm">
                    <input type="number" [(ngModel)]="enquiryForm.budget_max" name="budget_max" placeholder="Max Budget ₹" class="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm">
                  </div>
                  <textarea [(ngModel)]="enquiryForm.message" name="message" placeholder="Describe your project requirement in detail..." rows="3" class="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm resize-none" required></textarea>
                  <input type="text" [(ngModel)]="enquiryForm.user_name" name="user_name" placeholder="Your Name" class="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm" required [disabled]="currentUser">
                  <input type="tel" [(ngModel)]="enquiryForm.user_phone" name="user_phone" placeholder="Your Mobile Number" class="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm" required>
                  <button type="submit" class="w-full bg-primary text-white font-bold py-3.5 rounded-lg hover:bg-red-700 transition shadow-md flex items-center justify-center gap-2 mt-2" [disabled]="submitting || f.invalid">
                    <span *ngIf="!submitting">Send Enquiry</span>
                    <span *ngIf="submitting" class="flex items-center gap-2"><svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Sending...</span>
                  </button>
                  <p class="text-[11px] text-gray-400 text-center mt-2 font-bold uppercase tracking-wider">Your details are safe and shared only with this vendor.</p>
                </form>
              </div>

              <!-- Report Link -->
              <div class="text-center pt-2">
                 <button (click)="showReportModal = true" class="text-xs text-gray-400 hover:text-red-500 underline font-bold transition">Report this Business</button>
              </div>

            </div>
          </div>

        </div>
      </section>

      <!-- Modals & Overlays -->

      <!-- Write Review Modal (Simple custom built inline) -->
      <div *ngIf="showReviewModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
        <div class="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-md animate-scaleIn">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold font-heading text-navy">Rate & Review</h2>
            <button (click)="showReviewModal=false" class="text-gray-400 hover:text-gray-700"><svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <div class="text-center mb-6">
            <p class="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Your Rating</p>
            <div class="flex justify-center gap-2 cursor-pointer text-4xl">
              <span *ngFor="let s of [1,2,3,4,5]" 
                    (click)="myReviewRating = s"
                    (mouseenter)="myHoverRating = s" 
                    (mouseleave)="myHoverRating = 0"
                    [class.text-gray-200]="s > (myHoverRating || myReviewRating)"
                    [class.text-green-500]="s <= (myHoverRating || myReviewRating)">
                ★
              </span>
            </div>
          </div>
          <textarea [(ngModel)]="myReviewText" rows="4" placeholder="Share details of your experience with this professional..." class="w-full p-4 border border-gray-300 rounded-lg bg-gray-50 mb-6 font-medium text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"></textarea>
          <button (click)="submitReview()" [disabled]="!myReviewRating || reporting" class="w-full bg-primary text-white font-bold py-3.5 rounded-lg disabled:opacity-50 hover:bg-red-700 transition">
             {{ reporting ? 'Submitting...' : 'Post Review' }}
          </button>
        </div>
      </div>

      <!-- Report Modal -->
      <div *ngIf="showReportModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
        <div class="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-md animate-scaleIn">
          <h2 class="text-2xl font-bold font-heading text-navy mb-6">Report Business</h2>
          <div class="space-y-4 mb-6">
             <label class="block text-sm font-bold text-gray-700 mb-1">Reason</label>
             <select [(ngModel)]="reportReason" class="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 font-medium text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
                <option value="Fake listing">Fake listing</option>
                <option value="Wrong verification info">Wrong verification info</option>
                <option value="Spam / Scammer">Spam / Scammer</option>
                <option value="Closed business">Closed business</option>
                <option value="Other">Other</option>
             </select>
             <label class="block text-sm font-bold text-gray-700 mb-1 mt-4">Description (Optional)</label>
             <textarea [(ngModel)]="reportDesc" placeholder="Provide more details..." class="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 h-24 font-medium text-sm resize-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none"></textarea>
          </div>
          <div class="flex gap-3 justify-end">
             <button (click)="showReportModal=false" class="px-5 py-2.5 font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition border border-gray-200">Cancel</button>
             <button (click)="submitReport()" [disabled]="!reportReason || reporting" class="bg-red-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 transition">Submit Report</button>
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
    
    <!-- Loaders -->
    <div *ngIf="!business && !loading" class="min-h-[60vh] flex flex-col items-center justify-center bg-surface">
      <div class="text-6xl mb-4">🔍</div>
      <h2 class="text-2xl font-bold font-heading text-navy">Business Not Found</h2>
      <p class="text-gray-500 font-medium mt-2 mb-6">The listing you are looking for does not exist or has been removed.</p>
      <a routerLink="/home" class="text-primary font-bold hover:underline">Return to Home</a>
    </div>
    <div *ngIf="loading" class="min-h-screen flex items-center justify-center bg-surface">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  `,
  styles: [`.no-scrollbar::-webkit-scrollbar { display: none; }.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }.animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }.animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`]
})
export class BusinessProfileComponent implements OnInit {
  isModalOpen = false;
  showReportModal = false;
  showLoginPrompt = false;
  showReviewModal = false;

  business: any = null;
  reviews: any[] = [];
  faqs: any[] = [];
  loading = true;
  calling = false;
  currentUser: any = null;
  isOwner = false;
  isSaved = false;

  activeTab = 'overview';
  profileTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'photos', label: 'Portfolio' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'info', label: 'Quick Info' }
  ];

  images: string[] = [];
  emptyThumbs: any[] = []; // To fill grid if images < 5

  reportReason = 'Fake listing';
  reportDesc = '';
  reporting = false;

  enquiryForm: any = { project_type: '', budget_min: null, budget_max: null, message: '', user_name: '', user_phone: '' };
  submitting = false;

  // Review states
  hasReviewed = false;
  hoverRating = 0;
  myReviewRating = 0;
  myHoverRating = 0;
  myReviewText = '';
  ratingBars: any[] = [];

  currentYear = new Date().getFullYear();
  groupedMaterials: { name: string, icon: string | null, items: BusinessMaterial[] }[] = [];
  similarBusinesses: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private supabase: SupabaseService,
    private rvService: RecentlyViewedService,
    private materialService: MaterialService,
    public sanitizer: DomSanitizer
  ) { }

  async ngOnInit() {
    await this.checkAuth();
    // Re-run on every navigation to this route (fixes stale data)
    this.route.paramMap.subscribe(async params => {
      const slugOrId = params.get('id') || params.get('slug');
      if (slugOrId) {
        this.resetState();
        await this.loadBusiness(slugOrId);
      }
    });
  }

  resetState(): void {
    this.business = null;
    this.images = [];
    this.emptyThumbs = [];
    this.reviews = [];
    this.faqs = [];
    this.similarBusinesses = [];
    this.groupedMaterials = [];
    this.loading = true;
  }

  async checkAuth() {
    const { data: { session } } = await this.supabase.client.auth.getSession();
    if (session) {
      const { data } = await this.supabase.client.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      this.currentUser = data;
      this.enquiryForm.user_name = data?.name || '';
      this.enquiryForm.user_phone = data?.phone || '';
    }
  }

  async loadBusiness(slugOrId: string) {
    try {
      this.loading = true;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

      const query = this.supabase.client.from('businesses').select('*, categories(name, slug), business_images(image_url)');

      if (isUUID) {
        query.eq('id', slugOrId);
      } else {
        query.eq('slug', slugOrId);
      }

      const { data: b, error } = await query.maybeSingle();

      if (b && !error) {
        this.business = b;
        this.isOwner = this.currentUser?.id === b.vendor_id;

        // Populate images
        this.images = b.business_images?.map((i: any) => i.image_url) || [];
        if (b.cover_image_url && !this.images.includes(b.cover_image_url)) {
          this.images.unshift(b.cover_image_url);
        }

        // Calculate empty thumb slots
        const needed = 5 - this.images.length;
        this.emptyThumbs = needed > 0 ? Array(needed).fill(0) : [];

        this.rvService.addViewed({ id: b.id, name: b.name, category: b.categories?.name, image_url: this.images[0] });
        this.supabase.client.functions.invoke('increment-view-count', { body: { business_id: b.id } });

        this.checkSavedStatus();

        // Load parallel content
        await Promise.all([
          this.loadReviews(b.id),
          this.loadFaqs(b.id),
          this.loadMaterials(b.id)
        ]);
      }
    } catch (e) {
      console.error('Error loading business:', e);
    }
    this.loading = false;
  }

  async loadReviews(bizId: string) {
    const { data: rData } = await this.supabase.client.from('reviews').select('*, profiles(name)').eq('business_id', bizId).order('created_at', { ascending: false });
    if (rData) {
      this.reviews = rData;
      this.business.total_reviews = rData.length;

      if (rData.length > 0) {
        const sum = rData.reduce((s: number, rv: any) => s + rv.rating, 0);
        this.business.avg_rating = sum / rData.length;
      } else {
        this.business.avg_rating = this.business.rating || 0;
      }

      this.hasReviewed = this.currentUser ? !!rData.find(r => r.user_id === this.currentUser.id) : false;
      this.calculateRatingBars();
    }
  }

  calculateRatingBars() {
    this.ratingBars = [];
    const total = this.reviews.length || 1; // prevent div by zero
    for (let i = 5; i >= 1; i--) {
      const count = this.reviews.filter(r => r.rating === i).length;
      this.ratingBars.push({ stars: i, count, percent: (count / total) * 100 });
    }
  }

  async loadFaqs(bizId: string) {
    const { data } = await this.supabase.client.from('business_faqs').select('*').eq('business_id', bizId);
    if (data) this.faqs = data;
  }

  async loadMaterials(bizId: string) {
    this.materialService.getMaterialGroups().subscribe(groups => {
      this.materialService.getBusinessMaterials(bizId).subscribe(bMats => {
        const groupsMap = new Map<string, any>();
        bMats.forEach(bm => {
          if (bm.material_items) {
            const gId = bm.material_items.group_id;
            if (!groupsMap.has(gId)) {
              const gInfo = groups.find(g => g.id === gId);
              groupsMap.set(gId, { name: gInfo?.name || 'Other', icon: gInfo?.icon || '', items: [] });
            }
            groupsMap.get(gId).items.push(bm);
          }
        });
        this.groupedMaterials = Array.from(groupsMap.values());
      });
    });
  }

  async checkSavedStatus() {
    if (!this.currentUser) return;
    const { data } = await this.supabase.client.from('saved_businesses').select('id').eq('user_id', this.currentUser.id).eq('business_id', this.business.id).maybeSingle();
    this.isSaved = !!data;
  }

  async toggleSave() {
    if (!this.currentUser) {
      this.showLoginPrompt = true;
      return;
    }
    this.isSaved = !this.isSaved; // optimistic UI
    if (this.isSaved) {
      await this.supabase.client.from('saved_businesses').insert({ user_id: this.currentUser.id, business_id: this.business.id });
    } else {
      await this.supabase.client.from('saved_businesses').delete().match({ user_id: this.currentUser.id, business_id: this.business.id });
    }
  }

  isOpenNow() {
    const hr = new Date().getHours();
    return hr >= 9 && hr < 18; // Generic approx
  }

  openLightbox(index: number) {
    if (this.images.length === 0) return;
    // Implementation placeholder for image lightbox
    alert("Viewing " + this.images[index]);
  }

  openEnquireForm() {
    if (!this.currentUser) {
      this.showLoginPrompt = true;
      return;
    }
    // Scroll to side form on mobile, focus input on desktop
    document.querySelector('select[name="project_type"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async submitEnquiry() {
    if (!this.currentUser) {
      this.showLoginPrompt = true;
      return;
    }

    this.submitting = true;
    try {
      const { error } = await this.supabase.client.functions.invoke('create-lead', {
        body: {
          business_id: this.business.id,
          user_id: this.currentUser.id,
          user_name: this.enquiryForm.user_name,
          user_phone: this.enquiryForm.user_phone,
          project_type: this.enquiryForm.project_type,
          budget_min: this.enquiryForm.budget_min,
          budget_max: this.enquiryForm.budget_max,
          message: this.enquiryForm.message
        }
      });
      if (error) throw error;
      alert('✅ Quote request sent successfully! The vendor will contact you shortly.');
      this.enquiryForm.message = '';
    } catch (e) {
      console.error('Lead submission failed', e);
      alert('Failed to send request. Please try again later.');
    }
    this.submitting = false;
  }

  async callBusiness() {
    this.calling = true;
    try {
      await this.supabase.client.functions.invoke('log-call-lead', { body: { business_id: this.business.id } });
    } catch (e) { }

    this.calling = false;
    window.location.href = `tel:${this.business.phone}`;
  }

  shareProfile() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: this.business.name, url }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      alert('Profile link copied to clipboard!');
    }
  }

  openReviewModal() {
    if (!this.currentUser) {
      this.showLoginPrompt = true;
      return;
    }
    this.showReviewModal = true;
  }

  async submitReview() {
    this.reporting = true;
    try {
      const { error } = await this.supabase.client.from('reviews').insert({
        business_id: this.business.id,
        user_id: this.currentUser.id,
        rating: this.myReviewRating,
        comment: this.myReviewText
      });

      if (!error) {
        alert('Review posted successfully!');
        this.showReviewModal = false;
        this.loadReviews(this.business.id); // Reload
      } else {
        throw error;
      }
    } catch (e) {
      console.error(e);
      alert('Error posting review');
    }
    this.reporting = false;
  }

  async submitReport() {
    this.reporting = true;
    try {
      await this.supabase.client.from('reported_businesses').insert({
        business_id: this.business.id,
        reporter_id: this.currentUser?.id || null,
        reason: this.reportReason,
        description: this.reportDesc
      });
      alert('Report submitted for review.');
      this.showReportModal = false;
    } catch (e) { }
    this.reporting = false;
  }

  async toggleHelpful(review: any) {
    if (!this.currentUser) {
      this.showLoginPrompt = true;
      return;
    }

    try {
      const res = await this.supabase.client.functions.invoke('toggle-helpful-review', { body: { review_id: review.id } });
      if (res.data) {
        review.helpful_count = res.data.count;
        review.has_voted = res.data.helpful;
      }
    } catch (e) { console.error(e); }
  }
}
