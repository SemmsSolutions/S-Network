import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { CityService } from '../../../core/services/city.service';
import { BusinessCardComponent } from '../../../shared/components/business-card/business-card.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BusinessCardComponent, SafeHtmlPipe],
  template: `
    <!-- HERO SECTION -->
    <section class="hero-section" style="padding-top: 24px; background:#f8f9fa;">
      <div class="hero-inner container flex gap-6">

        <!-- Left: Banner Carousel -->
        <div class="hero-banner flex-[2] relative rounded-xl overflow-hidden shadow-sm h-[400px]">
          <div class="banner-slides w-full h-full relative">
            <div class="banner-slide absolute inset-0 transition-opacity duration-500" *ngFor="let slide of bannerSlides; let i = index"
                 [class.opacity-100]="i === activeBannerIndex" [class.z-10]="i === activeBannerIndex"
                 [class.opacity-0]="i !== activeBannerIndex" [class.z-0]="i !== activeBannerIndex">
              <img [src]="slide.image" [alt]="slide.title" loading="eager" class="w-full h-full object-cover">
              <div class="banner-overlay absolute inset-0 bg-gradient-to-r from-black/80 to-transparent flex flex-col justify-center p-12">
                <h2 class="text-white text-4xl font-bold mb-4 w-2/3">{{ slide.title }}</h2>
                <p class="text-white/90 text-lg mb-8 w-2/3">{{ slide.subtitle }}</p>
                <a [routerLink]="slide.link" class="btn-red w-max text-lg px-6 py-3">{{ slide.cta }}</a>
              </div>
            </div>
          </div>
          <button class="banner-prev absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white text-white hover:text-black w-10 h-10 rounded-full flex items-center justify-center transition backdrop-blur-sm" (click)="prevSlide()">‹</button>
          <button class="banner-next absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white text-white hover:text-black w-10 h-10 rounded-full flex items-center justify-center transition backdrop-blur-sm" (click)="nextSlide()">›</button>
          <div class="banner-dots absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            <span *ngFor="let s of bannerSlides; let i = index"
                  class="w-2.5 h-2.5 rounded-full cursor-pointer transition-all"
                  [ngClass]="i === activeBannerIndex ? 'bg-white w-6' : 'bg-white/50'"
                  (click)="activeBannerIndex = i"></span>
          </div>
        </div>

        <!-- Right: Featured Category Cards -->
        <div class="hero-featured-cards flex-1 flex flex-col gap-4 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <a *ngFor="let fc of featuredCards"
             [routerLink]="['/search']"
             [queryParams]="{category: fc.catSlug}"
             class="featured-card flex bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:border-[#CC0000] hover:shadow-md transition h-24 shrink-0 group">
            <img [src]="fc.image" [alt]="fc.title" loading="eager" class="w-24 h-full object-cover"
                 (error)="fc.image='https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=160&fit=crop&q=80'">
            <div class="featured-card-content p-3 flex-1 flex flex-col justify-center relative">
              <div class="fc-badge text-[10px] font-bold tracking-wider text-[#1DA851] bg-[#1DA851]/10 px-2 py-0.5 rounded w-max mb-1">{{ fc.badge }}</div>
              <h3 class="text-sm font-bold text-gray-900 group-hover:text-[#CC0000] transition">{{ fc.title }}</h3>
              <p class="text-xs text-gray-500 truncate">{{ fc.desc }}</p>
              <span class="fc-arrow absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-[#CC0000] group-hover:translate-x-1 transition text-xl">›</span>
            </div>
          </a>
        </div>
      </div>
    </section>

    <!-- SEARCH BAR (mobile only — desktop in navbar) -->
    <section class="mobile-search-bar md:hidden py-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
      <div class="container">
        <div class="mobile-search-inner flex flex-col gap-3">
          <input type="text" [(ngModel)]="searchQuery" placeholder="What are you looking for?" class="form-input w-full bg-gray-50 border-gray-200 focus:bg-white transition pb-3 mb-2" style="font-size:16px;">
          <div class="flex gap-2">
            <select [(ngModel)]="selectedCity" class="city-select form-input flex-[1.5] bg-gray-50 border-gray-200">
              <option value="">All Cities</option>
              <option *ngFor="let city of cities" [value]="city">{{ city }}</option>
            </select>
            <button class="btn-red flex-[1] justify-center" (click)="doSearch()">Search</button>
          </div>
        </div>
      </div>
    </section>

    <!-- CATEGORY ICON GRID -->
    <section class="section category-section bg-white pt-8 pb-12">
      <div class="container">
        <div class="categories-grid grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-4">
          <a *ngFor="let cat of categories"
             [routerLink]="['/search']"
             [queryParams]="{category: cat.slug}"
             class="category-icon-card flex flex-col items-center gap-3 group cursor-pointer">
            <div class="cat-icon-wrap w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 group-hover:shadow-md" [style.background]="cat.bgColor">
              <div class="cat-icon-img w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center drop-shadow-sm" [innerHTML]="getCategoryIcon(cat.slug) | safeHtml"></div>
            </div>
            <span class="cat-name text-xs sm:text-sm font-semibold text-center text-gray-800 group-hover:text-[#CC0000] transition line-clamp-2 px-1">{{ cat.name }}</span>
          </a>
        </div>
      </div>
    </section>

    <!-- GROUPED CATEGORY SECTIONS -->
    <section class="section grouped-categories py-12">
      <div class="container">
        <div class="grouped-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div *ngFor="let group of categoryGroups" class="group-card card bg-white p-5 hover:shadow-md transition border-gray-100">
            <h3 class="group-title text-base font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-100 inline-block">{{ group.title }}</h3>
            <div class="group-items flex flex-col gap-4 mt-2">
              <a *ngFor="let item of group.items"
                 [routerLink]="['/search']"
                 [queryParams]="{q: item.name}"
                 class="group-item flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 hover:text-[#CC0000] group/item transition cursor-pointer">
                <img [src]="item.image" [alt]="item.name" loading="lazy" class="w-12 h-12 rounded-lg object-cover shadow-sm group-hover/item:scale-105 transition-transform">
                <span class="text-sm font-semibold text-gray-700 group-hover/item:text-[#CC0000]">{{ item.name }}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- POPULAR SEARCHES -->
    <section class="section popular-section py-12 bg-gray-50 border-y border-gray-100" *ngIf="popularSearches.length">
      <div class="container">
        <h2 class="section-title text-xl font-bold mb-6 border-b-4 border-[#CC0000] inline-block pb-1">Popular Searches</h2>
        <div class="popular-grid flex overflow-x-auto gap-4 pb-4 snap-x custom-scrollbar">
          <a *ngFor="let ps of popularSearches"
             [routerLink]="['/search']"
             [queryParams]="{q: ps.term}"
             class="popular-card relative flex-none w-64 h-40 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition snap-start group cursor-pointer block">
            <img [src]="ps.image" [alt]="ps.term" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            <div class="popular-overlay absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4">
              <h4 class="text-white font-bold mb-2">{{ ps.term }}</h4>
              <span class="btn-outline-white inline-block w-max text-xs px-3 py-1.5 rounded-full border border-white/70 text-white hover:bg-white hover:text-black transition">🔍 Search Now</span>
            </div>
          </a>
        </div>
      </div>
    </section>

    <!-- FEATURED VENDORS -->
    <section class="section py-12" *ngIf="featuredVendors.length">
      <div class="container">
        <div class="section-header flex justify-between items-end mb-6">
          <h2 class="section-title text-xl font-bold m-0 border-b-4 border-[#CC0000] inline-block pb-1">Featured Professionals</h2>
          <a routerLink="/search" class="see-all text-sm font-bold text-[#CC0000] hover:underline pb-1">See All →</a>
        </div>
        <div class="vendors-horizontal-scroll flex overflow-x-auto gap-6 pb-4 snap-x custom-scrollbar">
          <div *ngFor="let v of featuredVendors" class="w-80 flex-none snap-start">
             <app-business-card [business]="v"></app-business-card>
          </div>
        </div>
      </div>
    </section>

    <!-- TOP RATED THIS WEEK -->
    <section class="section bg-[#0A1628] py-16 mt-8">
      <div class="container">
        <h2 class="section-title text-white text-2xl font-bold mb-8 border-b-4 border-[#CC0000] inline-block pb-2">Top Rated in {{ selectedCity || 'Your City' }}</h2>
        <div class="top-rated-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div *ngFor="let v of topRatedVendors">
             <app-business-card [business]="v" [compact]="true"></app-business-card>
          </div>
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section class="section py-16 bg-white border-b border-gray-100">
      <div class="container text-center">
        <h2 class="text-2xl font-bold mb-12">How S-Network Works</h2>
        <div class="how-steps flex flex-col md:flex-row justify-center items-center md:items-start gap-8 md:gap-12">
          
          <div class="how-step max-w-[220px] group">
            <div class="step-icon w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm border border-gray-100 group-hover:bg-[#CC0000] group-hover:text-white transition-colors duration-300">🔍</div>
            <h3 class="font-bold text-lg mb-2">Search</h3>
            <p class="text-sm text-gray-500">Find verified construction professionals in your area by category or keyword</p>
          </div>
          
          <div class="how-arrow text-gray-300 text-3xl hidden md:block mt-8">→</div>
          
          <div class="how-step max-w-[220px] group">
            <div class="step-icon w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm border border-gray-100 group-hover:bg-[#CC0000] group-hover:text-white transition-colors duration-300">📋</div>
            <h3 class="font-bold text-lg mb-2">Compare</h3>
            <p class="text-sm text-gray-500">View portfolios, read reviews, check verification status and ratings</p>
          </div>
          
          <div class="how-arrow text-gray-300 text-3xl hidden md:block mt-8">→</div>
          
          <div class="how-step max-w-[220px] group">
            <div class="step-icon w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm border border-gray-100 group-hover:bg-[#CC0000] group-hover:text-white transition-colors duration-300">💬</div>
            <h3 class="font-bold text-lg mb-2">Connect</h3>
            <p class="text-sm text-gray-500">Send a quote request and get connected with the right professional</p>
          </div>
          
          <div class="how-arrow text-gray-300 text-3xl hidden md:block mt-8">→</div>
          
          <div class="how-step max-w-[220px] group">
            <div class="step-icon w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm border border-gray-100 group-hover:bg-[#CC0000] group-hover:text-white transition-colors duration-300">🏗️</div>
            <h3 class="font-bold text-lg mb-2">Build</h3>
            <p class="text-sm text-gray-500">Work with trusted verified vendors and track your project progress</p>
          </div>

        </div>
      </div>
    </section>

    <!-- ABOUT SECTION -->
    <section class="section py-16 bg-gray-50">
      <div class="container text-center max-w-4xl mx-auto">
        <h2 class="text-2xl font-bold mb-4">India's Construction Professional Network</h2>
        <p class="text-gray-600 mb-10 leading-relaxed text-lg">S-Network connects homeowners, real estate investors, and businesses with verified construction professionals across India. Find civil contractors, architects, interior designers, electricians, plumbers, and material suppliers — all verified with GST/MSME documents.</p>
        
        <div class="about-stats grid grid-cols-2 md:grid-cols-4 gap-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div class="stat flex flex-col gap-1">
            <span class="stat-num text-3xl font-black text-[#0A1628]">500+</span>
            <span class="stat-label text-sm font-semibold text-gray-500 tracking-wider uppercase">Verified Vendors</span>
          </div>
          <div class="stat flex flex-col gap-1 md:border-l border-gray-100">
            <span class="stat-num text-3xl font-black text-[#0A1628]">10K+</span>
            <span class="stat-label text-sm font-semibold text-gray-500 tracking-wider uppercase">Leads Generated</span>
          </div>
          <div class="stat flex flex-col gap-1 md:border-l border-gray-100">
            <span class="stat-num text-3xl font-black text-[#0A1628]">50+</span>
            <span class="stat-label text-sm font-semibold text-gray-500 tracking-wider uppercase">Cities Covered</span>
          </div>
          <div class="stat flex flex-col gap-1 md:border-l border-gray-100">
            <span class="stat-num text-3xl font-black text-[#0A1628]">4.8★</span>
            <span class="stat-label text-sm font-semibold text-gray-500 tracking-wider uppercase">Average Rating</span>
          </div>
        </div>
      </div>
    </section>

    <!-- POPULAR CATEGORIES (tab + links) -->
    <section class="section pop-categories-section py-12 bg-white border-t border-gray-200">
      <div class="container">
        <h2 class="section-title text-xl font-bold mb-6">Popular Categories</h2>
        <div class="pop-cat-tabs flex overflow-x-auto gap-2 pb-4 mb-4 border-b border-gray-100 custom-scrollbar">
          <button *ngFor="let cat of categories" (click)="selectedPopCat = cat.slug"
                  [class.text-[#CC0000]]="selectedPopCat === cat.slug"
                  [class.border-[#CC0000]]="selectedPopCat === cat.slug"
                  [class.border-b-2]="selectedPopCat === cat.slug"
                  [class.font-bold]="selectedPopCat === cat.slug"
                  [class.text-gray-500]="selectedPopCat !== cat.slug"
                  class="pop-cat-tab px-4 py-2 whitespace-nowrap hover:text-[#CC0000] focus:outline-none transition">{{ cat.name }}</button>
        </div>
        <div class="pop-cat-links grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-2">
          <a *ngFor="let link of getPopCatLinks(selectedPopCat)"
             [routerLink]="['/search']" [queryParams]="{q: link}"
             class="pop-cat-link text-sm text-gray-600 hover:text-[#CC0000] hover:underline py-1 block truncate" title="{{link}}">{{ link }}</a>
        </div>
      </div>
    </section>

    <!-- MOBILE APP BANNER -->
    <section class="app-banner-section bg-gradient-to-r from-[#0A1628] to-[#0D1F3C] overflow-hidden">
      <div class="container">
        <div class="app-banner flex flex-col md:flex-row items-center justify-between py-12 md:py-0 px-4">
          <div class="app-banner-text text-white md:w-1/2 md:py-20 z-10 text-center md:text-left">
            <h3 class="text-3xl md:text-4xl font-bold mb-4 font-heading">📱 Get Instant Lead Notifications</h3>
            <p class="text-lg opacity-90 mb-8 max-w-lg">Download the S-Network app and receive real-time alerts for every new enquiry, manage your business profile, and respond to clients instantly.</p>
            <a href="#" class="btn-red bg-white text-[#CC0000] hover:bg-gray-100 hover:text-[#CC0000] text-lg px-8 py-3 rounded-xl shadow-lg font-bold">Download App</a>
          </div>
          <div class="md:w-1/3 mt-8 md:mt-12 flex justify-center relative translate-y-8">
            <div class="w-64 h-[500px] bg-gray-800 rounded-[3rem] border-[8px] border-gray-900 shadow-2xl relative overflow-hidden flex items-center justify-center">
              <span class="text-white/50 text-xl font-bold text-center px-4">S-Network<br>App UI</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="site-footer bg-[#0D1F3C] text-gray-300 pt-16 pb-6 border-t border-white/10">
      <div class="footer-top">
        <div class="container">
          <div class="footer-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div class="footer-col">
              <div class="sn-logo footer-logo text-white text-2xl font-black mb-4 tracking-wide"><span class="text-[#CC0000]">S</span>-<span class="text-[#CC0000]">N</span>etwork</div>
              <p class="text-sm opacity-80 mb-6 leading-relaxed">India's trusted platform for finding verified construction professionals, from building to interior design.</p>
              <div class="footer-social flex gap-4">
                <a href="https://www.facebook.com/share/1BBtS14Thg/" target="_blank" rel="noopener" aria-label="Facebook" class="w-10 h-10 rounded-full bg-white/10 hover:bg-[#1877F2] flex items-center justify-center transition text-white text-lg">f</a>
                 <a href="https://www.instagram.com/snetwork.in" target="_blank" rel="noopener" aria-label="Instagram" class="w-10 h-10 rounded-full bg-white/10 hover:bg-gradient-to-br hover:from-[#f09433] hover:to-[#bc1888] flex items-center justify-center transition text-white text-lg">in</a>
                 <a href="#" aria-label="LinkedIn" class="w-10 h-10 rounded-full bg-white/10 hover:bg-[#0A66C2] flex items-center justify-center transition text-white text-lg">ln</a>
                 <a href="#" aria-label="Twitter" class="w-10 h-10 rounded-full bg-white/10 hover:bg-[#1DA1F2] flex items-center justify-center transition text-white text-lg">x</a>
              </div>
            </div>
            
            <div class="footer-col flex flex-col gap-3">
              <h4 class="text-white font-bold mb-2 uppercase tracking-wider text-sm border-l-2 border-[#CC0000] pl-3">Quick Links</h4>
              <a routerLink="/home" class="hover:text-white transition w-max text-sm hover:translate-x-1 inline-block">Home</a>
              <a routerLink="/search" class="hover:text-white transition w-max text-sm hover:translate-x-1 inline-block">Browse Vendors</a>
              <a routerLink="/auth/register" class="hover:text-white transition w-max text-sm hover:translate-x-1 inline-block">List Your Business</a>
              <a routerLink="/auth/login" class="hover:text-white transition w-max text-sm hover:translate-x-1 inline-block">Login</a>
              <a routerLink="/contact" class="hover:text-white transition w-max text-sm hover:translate-x-1 inline-block">Contact Support</a>
            </div>
            
            <div class="footer-col flex flex-col gap-3">
              <h4 class="text-white font-bold mb-2 uppercase tracking-wider text-sm border-l-2 border-[#CC0000] pl-3">Top Categories</h4>
              <a *ngFor="let cat of categories.slice(0,6)" [routerLink]="['/search']" [queryParams]="{category: cat.slug}" class="hover:text-white transition w-max text-sm hover:translate-x-1 inline-block">
                {{ cat.name }}
              </a>
            </div>
            
            <div class="footer-col flex flex-col gap-3">
              <h4 class="text-white font-bold mb-2 uppercase tracking-wider text-sm border-l-2 border-[#CC0000] pl-3">For Professionals</h4>
              <a routerLink="/auth/register" class="hover:text-white transition text-[#CC0000] w-max font-bold text-sm hover:translate-x-1 inline-block">Free Business Listing</a>
              <a routerLink="/vendor/dashboard" class="hover:text-white transition w-max text-sm hover:translate-x-1 inline-block">Vendor Dashboard</a>
              <a routerLink="/vendor/leads" class="hover:text-white transition w-max text-sm hover:translate-x-1 inline-block">Manage Leads & Enquiries</a>
              
              <h4 class="text-white font-bold mt-4 mb-2 uppercase tracking-wider text-sm border-l-2 border-[#CC0000] pl-3">Legal Info</h4>
              <a routerLink="/privacy" class="hover:text-white transition w-max text-sm hover:translate-x-1 inline-block">Privacy Policy</a>
              <a routerLink="/terms" class="hover:text-white transition w-max text-sm hover:translate-x-1 inline-block">Terms & Conditions</a>
            </div>
          </div>
        </div>
      </div>
      <div class="footer-bottom border-t border-white/5 pt-6 mt-4">
        <div class="container">
          <p class="text-center text-xs opacity-70">© {{ currentYear }} S-Network Platform. All rights reserved. Made in India, for India.</p>
        </div>
      </div>
    </footer>
  `
})
export class HomeComponent implements OnInit, OnDestroy {
  categories: any[] = [
    { id: '1', name: 'Architect', slug: 'architect', bgColor: '#DCFCE7' },
    { id: '2', name: 'Civil Contractor', slug: 'civil-contractor', bgColor: '#FEE2E2' },
    { id: '3', name: 'Commercial Contractor', slug: 'commercial-contractor', bgColor: '#EDE9FE' },
    { id: '4', name: 'Electrician', slug: 'electrician', bgColor: '#FEF9C3' },
    { id: '5', name: 'Interior Designer', slug: 'interior-designer', bgColor: '#FCE7F3' },
    { id: '6', name: 'Material Supplier', slug: 'material-supplier', bgColor: '#F0FDF4' },
    { id: '7', name: 'Plumber / Waterproofing', slug: 'plumber-waterproofing', bgColor: '#E0F2FE' },
    { id: '8', name: 'Residential Builder', slug: 'residential-builder', bgColor: '#DBEAFE' },
    { id: '9', name: 'Turnkey Contractor', slug: 'turnkey-contractor', bgColor: '#FEF3C7' },
  ];

  featuredVendors: any[] = [];
  topRatedVendors: any[] = [];
  popularSearches = [
    { term: 'Civil Contractors', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&h=300&fit=crop&q=80' },
    { term: 'Interior Designers', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=500&h=300&fit=crop&q=80' },
    { term: 'House Construction', image: 'https://images.unsplash.com/photo-1541888049-74d3269b61e2?w=500&h=300&fit=crop&q=80' },
    { term: 'Commercial Contractors', image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=500&h=300&fit=crop&q=80' },
    { term: 'Modular Kitchen', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=300&fit=crop&q=80' },
  ];
  currentUser: any = null;
  selectedCity = localStorage.getItem('snet_city') || 'Chennai';
  searchQuery = '';
  activeBannerIndex = 0;
  selectedPopCat = '';
  autocompleteResults: any[] = [];
  cities = ['Chennai', 'Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad'];
  loading = false;
  private bannerInterval: any;
  private routerSub?: Subscription;
  currentYear = new Date().getFullYear();

  // Construction-specific banner slides
  bannerSlides = [
    { title: 'Build Your Dream Home', subtitle: 'Connect with verified contractors across India', cta: 'Find Contractors', link: '/search', image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80' },
    { title: 'Trusted Architects Near You', subtitle: 'Licensed professionals with proven portfolios', cta: 'Browse Architects', link: '/search?category=architect', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80' },
    { title: 'Interior Design Services', subtitle: 'Transform your space with expert designers', cta: 'Explore Designs', link: '/search?category=interior-designer', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80' },
  ];

  // Featured category cards beside banner
  featuredCards = [
    { title: 'Civil Contractors', badge: 'VERIFIED', desc: 'Get instant quotes', catSlug: 'civil-contractor', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=160&fit=crop&q=80' },
    { title: 'Architects', badge: 'PREMIUM', desc: 'Licensed professionals', catSlug: 'architect', image: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=400&h=160&fit=crop&q=80' },
    { title: 'Interior Designers', badge: 'TOP RATED', desc: 'Award-winning designs', catSlug: 'interior-designer', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&h=160&fit=crop&q=80' },
    { title: 'Material Suppliers', badge: 'BEST PRICE', desc: 'Bulk pricing available', catSlug: 'material-supplier', image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=160&fit=crop&q=80' },
  ];

  // Grouped category sections
  categoryGroups = [
    {
      title: 'Construction & Building',
      items: [
        { name: 'House Construction', image: 'https://images.unsplash.com/photo-1541888049-74d3269b61e2?w=300&h=180&fit=crop&q=80' },
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

  // Popular category subcategory links
  popCatLinks: Record<string, string[]> = {
    'civil-contractor': ['Residential Construction', 'Commercial Building', 'Foundation Work', 'Waterproofing', 'Renovation', 'RCC Work', 'Brick Work', 'Plastering', 'Tiling Work', 'Painting'],
    'architect': ['Residential Architect', 'Commercial Architect', '3D Elevation', 'Building Plan', 'Vastu Consultant', 'Landscape Design', 'Green Building'],
    'interior-designer': ['Modular Kitchen', 'Living Room', 'Bedroom Design', 'Office Interior', 'Hotel Interior', 'Retail Store', 'False Ceiling'],
    'electrician': ['Home Wiring', 'Industrial Wiring', 'Switchboard Installation', 'CCTV Installation', 'Solar Panel', 'Generator Installation'],
    'plumber': ['Pipe Fitting', 'Drainage', 'Waterproofing', 'Bathroom Fitting', 'Water Tank', 'Hot Water Heater'],
    'material-supplier': ['Cement Supplier', 'Steel Supplier', 'Bricks Supplier', 'Sand Supplier', 'Tiles Supplier', 'Paint Supplier'],
  };

  getPopCatLinks(slug: string): string[] {
    return this.popCatLinks[slug] ?? [];
  }

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private cityService: CityService
  ) { }

  ngOnInit() {
    // Step 1: Set city immediately from storage to avoid BehaviorSubject double-trigger
    const savedCity = localStorage.getItem('snet_city') || 'Chennai';
    this.selectedCity = savedCity;

    // Step 2: Load data once immediately
    this.loadHomeData();
    this.startBannerAutoplay();
    this.loadCurrentUser();

    // Step 3: Subscribe to city changes AFTER setting initial city
    // skip(0) behavior: compare against already-set selectedCity so first emit is a no-op
    this.cityService.city$.subscribe(city => {
      if (city && this.selectedCity !== city) {
        this.selectedCity = city;
        localStorage.setItem('snet_city', city);
        this.loadHomeData();
      }
    });
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src =
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&h=180&fit=crop&q=80';
  }

  getCategoryIcon(slug: string): string {
    const icons: Record<string, string> = {
      'architect': `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="12" fill="#DCFCE7"/>
        <path d="M24 10L12 34h24L24 10z" fill="none" stroke="#16A34A" stroke-width="2.5" stroke-linejoin="round"/>
        <line x1="17" y1="26" x2="31" y2="26" stroke="#16A34A" stroke-width="2" stroke-linecap="round"/>
        <line x1="24" y1="10" x2="24" y2="7" stroke="#16A34A" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="24" cy="10" r="2" fill="#16A34A"/>
      </svg>`,
      'civil-contractor': `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="12" fill="#FEE2E2"/>
        <path d="M10 36h28M14 36V22l10-10 10 10v14" fill="none" stroke="#CC0000" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        <rect x="19" y="26" width="10" height="10" rx="1" fill="none" stroke="#CC0000" stroke-width="2"/>
        <line x1="24" y1="12" x2="24" y2="8" stroke="#CC0000" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="21" y1="10" x2="27" y2="10" stroke="#CC0000" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      'commercial-contractor': `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="12" fill="#EDE9FE"/>
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
        <circle cx="18" cy="22" r="8" fill="none" stroke="#D97706" stroke-width="2.5"/>
        <circle cx="18" cy="22" r="3.5" fill="#D97706" opacity="0.3"/>
        <line x1="24" y1="22" x2="38" y2="22" stroke="#D97706" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="35" y1="22" x2="35" y2="27" stroke="#D97706" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="30" y1="22" x2="30" y2="26" stroke="#D97706" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`,
      'interior-designer': `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="12" fill="#FCE7F3"/>
        <circle cx="32" cy="16" r="6" fill="none" stroke="#DB2777" stroke-width="2"/>
        <circle cx="30" cy="14" r="1.5" fill="#DB2777"/>
        <circle cx="34" cy="14" r="1.5" fill="#DB2777" opacity="0.5"/>
        <circle cx="32" cy="18" r="1.5" fill="#DB2777" opacity="0.7"/>
        <path d="M16 36l12-12-4-4L12 32c-2 2-2 4 0 4 1 0 2.5-1 4 0z" fill="none" stroke="#DB2777" stroke-width="2" stroke-linejoin="round"/>
        <path d="M24 24l4-4" stroke="#DB2777" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      'electrician': `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="12" fill="#FEF9C3"/>
        <path d="M27 8L16 26h12L13 42l22-20H23L27 8z" fill="#CA8A04" stroke="#CA8A04" stroke-width="1" stroke-linejoin="round"/>
      </svg>`,
      'plumber': `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="12" fill="#E0F2FE"/>
        <rect x="8" y="20" width="22" height="8" rx="4" fill="none" stroke="#0284C7" stroke-width="2.5"/>
        <path d="M30 24h2a4 4 0 014 4v6" fill="none" stroke="#0284C7" stroke-width="2.5" stroke-linecap="round"/>
        <rect x="34" y="30" width="5" height="7" rx="2" fill="none" stroke="#0284C7" stroke-width="2.5"/>
        <path d="M8 20L8 15" stroke="#0284C7" stroke-width="2.5" stroke-linecap="round"/>
        <rect x="5" y="12" width="6" height="5" rx="2" fill="none" stroke="#0284C7" stroke-width="2"/>
      </svg>`,
      'plumber-waterproofing': `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="12" fill="#E0F2FE"/>
        <rect x="8" y="20" width="22" height="8" rx="4" fill="none" stroke="#0284C7" stroke-width="2.5"/>
        <path d="M30 24h2a4 4 0 014 4v6" fill="none" stroke="#0284C7" stroke-width="2.5" stroke-linecap="round"/>
        <rect x="34" y="30" width="5" height="7" rx="2" fill="none" stroke="#0284C7" stroke-width="2.5"/>
        <path d="M8 20L8 15" stroke="#0284C7" stroke-width="2.5" stroke-linecap="round"/>
        <rect x="5" y="12" width="6" height="5" rx="2" fill="none" stroke="#0284C7" stroke-width="2"/>
      </svg>`,
      'residential-builder': `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="12" fill="#DBEAFE"/>
        <path d="M9 36h30M13 36V22l11-11 11 11v14" fill="none" stroke="#1D4ED8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        <rect x="20" y="27" width="8" height="9" rx="1" fill="none" stroke="#1D4ED8" stroke-width="2"/>
        <rect x="13" y="24" width="5" height="5" rx="1" fill="none" stroke="#1D4ED8" stroke-width="1.5"/>
        <rect x="30" y="24" width="5" height="5" rx="1" fill="none" stroke="#1D4ED8" stroke-width="1.5"/>
        <rect x="29" y="13" width="4" height="6" rx="1" fill="none" stroke="#1D4ED8" stroke-width="2"/>
      </svg>`,
      'material-supplier': `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="12" fill="#F0FDF4"/>
        <circle cx="16" cy="36" r="4.5" fill="none" stroke="#15803D" stroke-width="2.5"/>
        <circle cx="16" cy="36" r="1.5" fill="#15803D"/>
        <path d="M20 36 L24 22 L40 22 L38 36 Z" fill="none" stroke="#15803D" stroke-width="2.5" stroke-linejoin="round"/>
        <line x1="25" y1="28" x2="37" y2="28" stroke="#15803D" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
        <line x1="26" y1="25" x2="38" y2="25" stroke="#15803D" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
        <line x1="20" y1="36" x2="10" y2="26" stroke="#15803D" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="24" y1="22" x2="10" y2="22" stroke="#15803D" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`,
    };
    return icons[slug] ?? `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="#F3F4F6"/>
      <text x="24" y="32" text-anchor="middle" font-size="20" font-family="serif">🏗️</text>
    </svg>`;
  }

  async loadHomeData() {
    this.loading = true;
    try {
      // Load categories
      const { data: cats, error: catError } = await this.supabase.client.from('categories').select('*').order('name');
      if (catError) {
        console.warn('Categories error:', catError);
        this.categories = this.getFallbackCategories();
      } else {
        this.categories = (cats ?? []).map((c: any, i: number) => ({
          ...c,
          bgColor: ['#FEE2E2', '#DBEAFE', '#DCF5E7', '#FEF3C7', '#EDE9FE', '#FCE7F3', '#E0F2FE', '#F0FDF4', '#FFF7ED'][i % 9]
        }));
      }
      this.selectedPopCat = this.categories[0]?.slug ?? '';

      // Load top vendors (non-critical)
      const { data: pop } = await this.supabase.client.from('businesses').select('*, categories(name)').eq('is_verified', true).eq('is_active', true).order('rating', { ascending: false }).limit(8);
      this.topRatedVendors = pop || [];

      // Try homepage edge function for featured vendors
      try {
        const { data: homepage } = await this.supabase.client.functions.invoke('get-homepage-data', {
          body: { city: this.selectedCity }
        });
        if (homepage?.featured?.length) {
          this.featuredVendors = homepage.featured;
        } else {
          this.featuredVendors = this.topRatedVendors.slice(0, 4);
        }
      } catch {
        this.featuredVendors = this.topRatedVendors.slice(0, 4);
      }
    } catch (err) {
      console.error('Home load error:', err);
      this.categories = this.getFallbackCategories();
      this.featuredVendors = [];
      this.topRatedVendors = [];
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  getFallbackCategories() {
    return [
      { id: '1', name: 'Architect', slug: 'architect', bgColor: '#DCFCE7' },
      { id: '2', name: 'Civil Contractor', slug: 'civil-contractor', bgColor: '#FEE2E2' },
      { id: '3', name: 'Commercial Contractor', slug: 'commercial-contractor', bgColor: '#EDE9FE' },
      { id: '4', name: 'Electrician', slug: 'electrician', bgColor: '#FEF9C3' },
      { id: '5', name: 'Interior Designer', slug: 'interior-designer', bgColor: '#FCE7F3' },
      { id: '6', name: 'Material Supplier', slug: 'material-supplier', bgColor: '#F0FDF4' },
      { id: '7', name: 'Plumber / Waterproofing', slug: 'plumber-waterproofing', bgColor: '#E0F2FE' },
      { id: '8', name: 'Residential Builder', slug: 'residential-builder', bgColor: '#DBEAFE' },
      { id: '9', name: 'Turnkey Contractor', slug: 'turnkey-contractor', bgColor: '#FEF3C7' },
    ];
  }


  async loadCurrentUser() {
    const { data: { session } } = await this.supabase.client.auth.getSession();
    if (session) {
      const { data } = await this.supabase.client.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      this.currentUser = data;
    }
  }

  startBannerAutoplay() {
    this.bannerInterval = setInterval(() => {
      this.activeBannerIndex = (this.activeBannerIndex + 1) % this.bannerSlides.length;
    }, 5000);
  }

  nextSlide() { this.activeBannerIndex = (this.activeBannerIndex + 1) % this.bannerSlides.length; }
  prevSlide() { this.activeBannerIndex = (this.activeBannerIndex - 1 + this.bannerSlides.length) % this.bannerSlides.length; }

  doSearch() {
    if (!this.searchQuery.trim() && !this.selectedCity) return;
    this.router.navigate(['/search'], { queryParams: { q: this.searchQuery, city: this.selectedCity } });
  }

  ngOnDestroy() {
    if (this.bannerInterval) clearInterval(this.bannerInterval);
    this.routerSub?.unsubscribe();
  }
}
