import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { RecentlyViewedService, ViewedBusiness } from '../../../core/services/recently-viewed.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, SearchBarComponent],
  template: `
    <div class="bg-surface min-h-screen font-body">
      <!-- Hero Section -->
      <section class="bg-primary text-white py-20 px-4 text-center">
        <h1 class="text-5xl font-heading font-bold mb-4">Find. Verify. Build.</h1>
        <p class="text-xl mb-8 opacity-90">Discover trusted construction professionals in your area.</p>
        
        <div class="max-w-4xl mx-auto">
          <app-search-bar></app-search-bar>
        </div>
      </section>

      <!-- Category Grid -->
      <section class="py-16 px-4 max-w-6xl mx-auto">
        <h2 class="text-3xl font-heading font-bold text-center text-primary mb-12">Browse by Category</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <a *ngFor="let cat of categories" [routerLink]="['/search']" [queryParams]="{category: cat.slug}" 
             class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md hover:border-primary transition group cursor-pointer">
            <div class="text-4xl mb-3 group-hover:scale-110 transition-transform">{{cat.icon}}</div>
            <h3 class="font-bold text-primary text-sm">{{cat.name}}</h3>
          </a>
        </div>
      </section>

      <!-- Featured Vendors Preview -->
      <section class="bg-white border-t border-gray-100 py-16 px-4">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-3xl font-heading font-bold text-center text-primary mb-12">Popular Businesses</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div *ngFor="let b of popularBusinesses" class="bg-gray-50 h-80 rounded-xl flex flex-col items-center justify-center p-6 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition" [routerLink]="['/business', b.id]">
              <div class="font-bold text-xl text-primary mb-2 line-clamp-1">{{b.name}}</div>
              <div class="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">{{b.city}}</div>
              <div class="text-4xl text-gray-300">👁️ {{b.total_views}}</div>
            </div>
            <div *ngIf="popularBusinesses.length === 0" class="bg-gray-50 h-80 rounded-xl animate-pulse flex items-center justify-center text-gray-400 w-full col-span-3">Loading Popular...</div>
          </div>
        </div>
      </section>

      <!-- Recently Viewed section -->
      <section *ngIf="recentlyViewed.length > 0" class="py-16 px-4 bg-gray-50 border-t border-gray-100">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-2xl font-heading font-bold text-primary mb-8 px-4 border-l-4 border-secondary">Recently Viewed</h2>
          <div class="flex overflow-x-auto gap-4 pb-4 px-4 snap-x">
            <div *ngFor="let rv of recentlyViewed" [routerLink]="['/business', rv.id]" class="snap-start min-w-[250px] bg-white p-4 rounded-xl border border-gray-200 cursor-pointer shadow-sm hover:shadow-md transition">
              <div class="h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                <img *ngIf="rv.image_url" [src]="rv.image_url" class="object-cover w-full h-full">
                <span *ngIf="!rv.image_url" class="text-4xl">🏢</span>
              </div>
              <h4 class="font-bold text-primary line-clamp-1">{{rv.name}}</h4>
              <p class="text-xs text-gray-500">{{rv.category}}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Trending Searches -->
      <section *ngIf="trending.length > 0" class="py-16 px-4">
        <div class="max-w-6xl mx-auto text-center">
          <h2 class="text-2xl font-heading font-bold text-gray-800 mb-8">Trending Searches</h2>
          <div class="flex flex-wrap justify-center gap-3">
             <span *ngFor="let t of trending" [routerLink]="['/search']" [queryParams]="{q: t.query}" class="px-6 py-3 bg-white border border-gray-200 rounded-full text-primary font-bold text-sm shadow-sm cursor-pointer hover:border-secondary hover:text-secondary transition">{{t.query}}</span>
          </div>
        </div>
      </section>
      <!-- Guest Prompt Banner (only for non-logged-in users) -->
      <div *ngIf="!currentUser" class="bg-[#1A1A2E] text-white"
           style="display:flex;align-items:center;justify-content:space-between;padding:10px 24px;font-size:14px;">
        <span>🏗️ Join S-Network to submit quotes, save businesses, and more</span>
        <div style="display:flex;gap:12px;">
          <a routerLink="/auth/login" style="border:1px solid rgba(255,255,255,0.3);padding:6px 16px;border-radius:8px;color:white;text-decoration:none;">Login</a>
          <a routerLink="/auth/register" style="background:#E85D26;padding:6px 16px;border-radius:8px;color:white;text-decoration:none;font-weight:600;">Register Free</a>
        </div>
      </div>
    </div>
  `
})
export class HomeComponent {
  categories = [
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

  recentlyViewed: ViewedBusiness[] = [];
  popularBusinesses: any[] = [];
  trending: any[] = [];
  currentUser: any = null;

  constructor(private rvService: RecentlyViewedService, private supabase: SupabaseService, private authService: AuthService) { }

  ngOnInit() {
    this.recentlyViewed = this.rvService.getViewed();
    this.loadIntelligence();

    // Auth tracking for guest UI banner
    this.supabase.client.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        const { data } = await this.supabase.client
          .from('profiles').select('*').eq('id', session.user.id).maybeSingle();
        this.currentUser = data;
      } else {
        this.currentUser = null;
      }
    });
  }

  async loadIntelligence() {
    // Popular
    const { data: pop } = await this.supabase.client.from('businesses').select('*').eq('is_verified', true).eq('is_on_vacation', false).order('total_views', { ascending: false }).limit(3);
    if (pop) this.popularBusinesses = pop;

    // Trending (pseudo aggregation since we cant do direct GROUP BY in RPC efficiently right now unless defined. We'll pull recent and dedupe locally for MVP parity)
    const { data: logs } = await this.supabase.client.from('search_logs').select('query').limit(50).order('created_at', { ascending: false });
    if (logs) {
      const counts: Record<string, number> = {};
      logs.filter(l => l.query).forEach(l => { counts[l.query] = (counts[l.query] || 0) + 1; });
      this.trending = Object.entries(counts).map(([query, count]) => ({ query, count })).sort((a, b) => b.count - a.count).slice(0, 8);
    }
  }
}
