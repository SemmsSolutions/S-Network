import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
    selector: 'app-admin-rankings',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="p-6">
      <h1 class="text-3xl font-heading font-bold text-primary mb-6">🏆 Rankings Override</h1>

      <!-- SECTION 1: Homepage Control -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div *ngFor="let section of homepageSections" class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 class="font-heading font-bold text-secondary mb-3">{{section.label}}</h3>
          <div *ngFor="let item of section.items; let i = index" class="flex justify-between items-center py-2 border-b border-gray-50">
            <span class="text-sm"><strong>#{{i+1}}</strong> {{item.businesses?.name || 'Unknown'}}</span>
            <button (click)="removeOverride(item.id, section)" class="text-red-400 hover:text-red-600 text-xs font-bold">×</button>
          </div>
          <div *ngIf="section.items.length === 0" class="text-gray-400 text-xs py-2">No vendors assigned yet.</div>
          <button (click)="openAddModal(section)" class="mt-3 w-full border border-dashed border-gray-300 rounded py-2 text-sm text-gray-500 hover:text-primary hover:border-primary transition font-bold">+ Add Vendor</button>
        </div>
      </div>

      <!-- SECTION 2: Search Pinning -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h3 class="text-lg font-heading font-bold text-secondary mb-4">📌 Search Result Pinning</h3>
        <div *ngFor="let pin of searchPins; let i = index" class="flex justify-between items-center py-2 border-b border-gray-50">
          <span class="text-sm"><strong>#{{pin.position_order}}</strong> {{pin.businesses?.name}}</span>
          <button (click)="removeOverride(pin.id, null)" class="text-red-400 hover:text-red-600 text-xs font-bold">Remove</button>
        </div>
        <div *ngIf="searchPins.length === 0" class="text-gray-400 text-xs py-2">No pinned vendors.</div>

        <div class="mt-4 flex gap-3">
          <input [(ngModel)]="pinSearch" placeholder="Search vendor to pin..." class="flex-1 border border-gray-300 rounded px-3 py-2 text-sm">
          <input [(ngModel)]="pinPosition" type="number" min="1" max="10" placeholder="Pos" class="w-20 border border-gray-300 rounded px-3 py-2 text-sm">
          <button (click)="pinVendor()" [disabled]="!pinSearch || !pinPosition" class="bg-primary text-white px-4 py-2 rounded font-bold text-sm disabled:opacity-50">Pin</button>
        </div>
      </div>

      <!-- Add Vendor Modal -->
      <div *ngIf="addModalSection" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" (click)="addModalSection = null">
        <div class="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl" (click)="$event.stopPropagation()">
          <h3 class="font-bold text-lg mb-3">Add Vendor to {{addModalSection.label}}</h3>
          <input [(ngModel)]="vendorSearchQuery" (input)="searchVendors()" placeholder="Search approved vendors..." class="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-3">
          <div *ngFor="let v of vendorSearchResults" (click)="addToSection(v)" class="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded cursor-pointer border-b border-gray-50">
            <div>
              <p class="font-bold text-sm">{{v.name}}</p>
              <p class="text-xs text-gray-400">{{v.categories?.name}} · {{v.city}}</p>
            </div>
            <span class="text-primary font-bold text-xs">+ Add</span>
          </div>
          <button (click)="addModalSection = null" class="mt-4 text-gray-400 text-sm font-bold">Close</button>
        </div>
      </div>
    </div>
  `
})
export class AdminRankingsComponent implements OnInit {
    homepageSections = [
        { type: 'homepage_featured', label: 'Featured Vendors', items: [] as any[] },
        { type: 'homepage_popular', label: 'Popular Vendors', items: [] as any[] },
        { type: 'homepage_recommended', label: 'Recommended Vendors', items: [] as any[] },
    ];
    searchPins: any[] = [];
    pinSearch = '';
    pinPosition = 1;
    addModalSection: any = null;
    vendorSearchQuery = '';
    vendorSearchResults: any[] = [];

    constructor(private supabase: SupabaseService) { }

    async ngOnInit() { await this.loadAll(); }

    async loadAll() {
        for (const section of this.homepageSections) {
            const { data } = await this.supabase.client.from('admin_overrides')
                .select('*, businesses(name, city, categories(name))')
                .eq('override_type', section.type).eq('is_active', true)
                .order('position_order', { ascending: true });
            section.items = data || [];
        }
        const { data: pins } = await this.supabase.client.from('admin_overrides')
            .select('*, businesses(name, city)')
            .eq('override_type', 'search_pinned').eq('is_active', true)
            .order('position_order', { ascending: true });
        this.searchPins = pins || [];
    }

    openAddModal(section: any) { this.addModalSection = section; this.vendorSearchQuery = ''; this.vendorSearchResults = []; }

    async searchVendors() {
        if (!this.vendorSearchQuery) { this.vendorSearchResults = []; return; }
        const { data } = await this.supabase.client.from('businesses')
            .select('id, name, city, categories(name)')
            .eq('is_active', true).ilike('name', `%${this.vendorSearchQuery}%`).limit(10);
        this.vendorSearchResults = data || [];
    }

    async addToSection(vendor: any) {
        if (!this.addModalSection) return;
        const nextPos = this.addModalSection.items.length + 1;
        await this.supabase.client.from('admin_overrides').upsert({
            business_id: vendor.id,
            override_type: this.addModalSection.type,
            position_order: nextPos,
            is_active: true
        }, { onConflict: 'business_id,override_type,category_id' });
        this.addModalSection = null;
        await this.loadAll();
    }

    async removeOverride(id: string, section: any) {
        await this.supabase.client.from('admin_overrides').delete().eq('id', id);
        await this.loadAll();
    }

    async pinVendor() {
        // Find vendor by name
        const { data } = await this.supabase.client.from('businesses')
            .select('id').ilike('name', `%${this.pinSearch}%`).limit(1).maybeSingle();
        if (!data) return;
        await this.supabase.client.from('admin_overrides').upsert({
            business_id: data.id,
            override_type: 'search_pinned',
            position_order: this.pinPosition,
            is_active: true
        }, { onConflict: 'business_id,override_type,category_id' });
        this.pinSearch = '';
        this.pinPosition = 1;
        await this.loadAll();
    }
}
