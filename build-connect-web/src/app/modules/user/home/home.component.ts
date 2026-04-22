import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { BusinessCardComponent } from '../../../shared/components/business-card/business-card.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BusinessCardComponent],
  template: `
    <!-- HERO SECTION -->
    <section class="hero-section">
      <div class="hero-inner container flex gap-6">

        <!-- Left: Banner Carousel -->
        <div class="hero-banner flex-[2] relative rounded-xl overflow-hidden shadow-sm h-[400px]">
          <div class="banner-slides w-full h-full relative">
            <div class="banner-slide absolute inset-0 transition-opacity duration-500" *ngFor="let slide of bannerSlides; let i = index"
                 [class.opacity-100]="i === activeBannerIndex" [class.z-10]="i === activeBannerIndex"
                 [class.opacity-0]="i !== activeBannerIndex" [class.z-0]="i !== activeBannerIndex">
              <img [src]="slide.image" [alt]="slide.title" loading="lazy" class="w-full h-full object-cover">
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
          <a *ngFor="let fc of featuredCards" [routerLink]="fc.link" class="featured-card flex bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:border-[#CC0000] hover:shadow-md transition h-24 shrink-0 group">
            <img [src]="fc.image" [alt]="fc.title" loading="lazy" class="w-24 h-full object-cover">
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
              <img [src]="cat.iconSvg" [alt]="cat.name" class="cat-icon-img w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-sm" loading="lazy">
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
                <a href="#" aria-label="Facebook" class="w-10 h-10 rounded-full bg-white/10 hover:bg-[#CC0000] flex items-center justify-center transition text-white text-lg">f</a>
                <a href="#" aria-label="Instagram" class="w-10 h-10 rounded-full bg-white/10 hover:bg-[#CC0000] flex items-center justify-center transition text-white text-lg">in</a>
                <a href="#" aria-label="LinkedIn" class="w-10 h-10 rounded-full bg-white/10 hover:bg-[#CC0000] flex items-center justify-center transition text-white text-lg">ln</a>
                <a href="#" aria-label="Twitter" class="w-10 h-10 rounded-full bg-white/10 hover:bg-[#CC0000] flex items-center justify-center transition text-white text-lg">x</a>
              </div>
            </div>
            
            <div class="footer-col flex flex-col gap-3">
              <h4 class="text-white font-bold mb-2 uppercase tracking-wider text-sm border-l-2 border-[#CC0000] pl-3">Quick Links</h4>
              <a routerLink="/" class="hover:text-white transition w-max text-sm hover:translate-x-1 inline-block">Home</a>
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
    { name: 'Civil Contractor', slug: 'civil-contractor', icon: '👷' },
    { name: 'Residential Builder', slug: 'residential-builder', icon: '🏠' },
    { name: 'Commercial Contractor', slug: 'commercial-contractor', icon: '🏢' },
    { name: 'Turnkey Contractor', slug: 'turnkey-contractor', icon: '🔑' },
    { name: 'Architect', slug: 'architect', icon: '📐' },
    { name: 'Interior Designer', slug: 'interior-designer', icon: '🎨' },
    { name: 'Electrician', slug: 'electrician', icon: '⚡' },
    { name: 'Plumber / Waterproofing', slug: 'plumber-waterproofing', icon: '🔧' },
    { name: 'Material Supplier', slug: 'material-supplier', icon: '🧱' }
  ];

  featuredVendors: any[] = [];
  topRatedVendors: any[] = [];
  popularSearches = [
    { term: 'Civil Contractors in Chennai', image: 'https://images.unsplash.com/photo-1541888049-74d3269b61e2?auto=format&fit=crop&w=400&q=80' },
    { term: 'Interior Designers in Mumbai', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80' },
    { term: 'House Construction Cost', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=80' },
    { term: 'Commercial Contractors', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80' },
    { term: 'Modular Kitchen Designers', image: 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=400&q=80' },
  ];
  currentUser: any = null;
  selectedCity = '';
  searchQuery = '';
  activeBannerIndex = 0;
  selectedPopCat = '';
  autocompleteResults: any[] = [];
  cities = ['Chennai', 'Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad'];
  private bannerInterval: any;
  currentYear = new Date().getFullYear();

  // Construction-specific banner slides
  bannerSlides = [
    { title: 'Build Your Dream Home', subtitle: 'Connect with verified contractors across India', cta: 'Find Contractors', link: '/search', image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80' },
    { title: 'Trusted Architects Near You', subtitle: 'Licensed professionals with proven portfolios', cta: 'Browse Architects', link: '/search?category=architect', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80' },
    { title: 'Interior Design Services', subtitle: 'Transform your space with expert designers', cta: 'Explore Designs', link: '/search?category=interior-designer', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80' },
  ];

  // Featured category cards beside banner
  featuredCards = [
    { title: 'Civil Contractors', badge: 'VERIFIED', desc: 'Get instant quotes', link: '/search?category=civil-contractor', image: 'https://images.unsplash.com/photo-1541888049-74d3269b61e2?auto=format&fit=crop&w=150&q=80' },
    { title: 'Architects', badge: 'PREMIUM', desc: 'Licensed professionals', link: '/search?category=architect', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=150&q=80' },
    { title: 'Interior Designers', badge: 'TOP RATED', desc: 'Award-winning designs', link: '/search?category=interior-designer', image: 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=150&q=80' },
    { title: 'Material Suppliers', badge: 'BEST PRICE', desc: 'Bulk pricing available', link: '/search?category=material-supplier', image: 'https://images.unsplash.com/photo-1504307651254-35680f356f67?auto=format&fit=crop&w=150&q=80' },
  ];

  // Grouped category sections
  categoryGroups = [
    {
      title: 'Construction & Building',
      items: [
        { name: 'House Construction', image: 'https://images.unsplash.com/photo-1518481612222-68bab828cdac?auto=format&fit=crop&w=150&q=80' },
        { name: 'Commercial Buildings', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=150&q=80' },
        { name: 'Renovation Work', image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=150&q=80' },
      ]
    },
    {
      title: 'Interior & Design',
      items: [
        { name: 'Modular Kitchen', image: 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=150&q=80' },
        { name: 'Living Room Design', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=150&q=80' },
        { name: 'Bedroom Interior', image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=150&q=80' },
      ]
    },
    {
      title: 'Electrical & Plumbing',
      items: [
        { name: 'Home Wiring', image: 'https://images.unsplash.com/photo-1621217598858-69258ce2452a?auto=format&fit=crop&w=150&q=80' },
        { name: 'Waterproofing', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=150&q=80' },
        { name: 'Sanitary Fitting', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=150&q=80' },
      ]
    },
    {
      title: 'Windows & Finishing',
      items: [
        { name: 'UPVC Windows', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=150&q=80' },
        { name: 'False Ceiling', image: 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=150&q=80' },
        { name: 'Flooring Work', image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=150&q=80' },
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
    private router: Router
  ) { }

  ngOnInit() {
    this.selectedCity = localStorage.getItem('snet_city') || 'Chennai';
    this.loadHomeData();
    this.startBannerAutoplay();
    this.loadCurrentUser();
  }

  async loadHomeData() {
    // Load categories
    const { data: cats } = await this.supabase.client.from('categories').select('*').order('name');
    this.categories = (cats ?? []).map((c: any, i: number) => ({
      ...c,
      bgColor: ['#FEE2E2', '#DBEAFE', '#DCF5E7', '#FEF3C7', '#EDE9FE', '#FCE7F3', '#E0F2FE', '#F0FDF4', '#FFF7ED'][i % 9],
      // For this implementation, using external SVGs or falling back if none generated
      iconSvg: `assets/icons/${c.slug}.svg` // Ensure you have dummy icons or rely on alt text
    }));
    this.selectedPopCat = this.categories[0]?.slug ?? '';

    // Load featured vendors via edge function
    const { data: homepage } = await this.supabase.client.functions.invoke('get-homepage-data', {
      body: { city: this.selectedCity }
    });
    if (homepage) {
      this.featuredVendors = homepage.featured ?? homepage.top_rated?.slice(0, 6) ?? [];
      this.topRatedVendors = homepage.top_rated ?? [];
    } else {
      // Fallback
      const { data: pop } = await this.supabase.client.from('businesses').select('*, categories(name)').eq('is_verified', true).eq('is_on_vacation', false).order('total_views', { ascending: false }).limit(6);
      if (pop) this.featuredVendors = pop;
      this.topRatedVendors = pop || [];
    }
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
  }
}
