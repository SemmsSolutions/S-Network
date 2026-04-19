import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
    selector: 'app-saved',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="max-w-6xl mx-auto py-8 px-4 font-body">
      <h1 class="text-2xl font-heading font-bold text-primary mb-6">💾 Saved Businesses</h1>

      <div *ngIf="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>

      <div *ngIf="!loading && businesses.length === 0" class="text-center py-16 bg-white rounded-xl shadow-md">
        <p class="text-5xl mb-4">📌</p>
        <h3 class="text-lg font-bold text-gray-700 mb-2">No saved businesses yet</h3>
        <p class="text-gray-500 text-sm mb-4">Save businesses to easily find them later</p>
        <a routerLink="/search" class="text-primary font-bold hover:underline">Browse Businesses →</a>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngFor="let biz of businesses" class="bg-white rounded-xl shadow-md p-4 border border-gray-100 hover:shadow-lg transition">
          <h3 class="font-bold text-gray-800 mb-1">{{biz.name}}</h3>
          <p class="text-sm text-gray-500 mb-2">📍 {{biz.city}}</p>
          <p class="text-xs text-gray-400 line-clamp-2">{{biz.description}}</p>
          <div class="flex gap-2 mt-3">
            <a [routerLink]="['/business', biz.id]" class="text-primary text-sm font-bold hover:underline">View →</a>
            <button (click)="unsave(biz.saved_id)" class="text-red-500 text-sm font-bold hover:underline ml-auto">Remove</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SavedComponent implements OnInit {
    businesses: any[] = [];
    loading = true;

    constructor(private auth: AuthService, private supabase: SupabaseService) { }

    async ngOnInit() {
        const user = this.auth.currentUser;
        if (!user) { this.loading = false; return; }

        const { data } = await this.supabase.client
            .from('saved_businesses')
            .select('id, business_id, businesses(id, name, city, description)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        this.businesses = (data || []).map((s: any) => ({
            ...s.businesses,
            saved_id: s.id
        }));
        this.loading = false;
    }

    async unsave(savedId: string) {
        await this.supabase.client.from('saved_businesses').delete().eq('id', savedId);
        this.businesses = this.businesses.filter(b => b.saved_id !== savedId);
    }
}
