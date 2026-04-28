import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-categories-management',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeHtmlPipe],
  template: `
    <div class="admin-cat-layout flex gap-6 h-full min-h-screen bg-gray-50 p-6">

      <!-- LEFT: Category List -->
      <div class="cat-list-panel w-80 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 class="font-bold text-gray-800">Categories</h3>
          <button (click)="startNew()" class="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-opacity-90 transition">+ Add New</button>
        </div>
        <div class="overflow-y-auto flex-1">
          <div *ngFor="let cat of categories"
               (click)="selectCategory(cat)"
               [class.bg-red-50]="selectedCat?.id === cat.id"
               [class.border-l-4]="selectedCat?.id === cat.id"
               [class.border-primary]="selectedCat?.id === cat.id"
               class="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-50 transition">
            <div class="w-10 h-10 flex-shrink-0" [innerHTML]="cat.icon_url ? '' : getCategoryIconSmall(cat.slug) | safeHtml">
              <img *ngIf="cat.icon_url" [src]="cat.icon_url" class="w-10 h-10 object-contain rounded-lg">
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-bold text-sm text-gray-800 truncate">{{ cat.name }}</div>
              <div class="text-xs text-gray-400 font-mono truncate">{{ cat.slug }}</div>
            </div>
            <span class="text-xs text-gray-400 flex-shrink-0">{{ getSpecCount(cat.id) }} specs</span>
          </div>
          <div *ngIf="categories.length === 0" class="p-8 text-center text-gray-400 text-sm">No categories found.</div>
        </div>
      </div>

      <!-- RIGHT: Edit Panel -->
      <div class="flex-1">
        <div *ngIf="!editMode" class="flex items-center justify-center h-full text-gray-400 text-center p-12">
          <div>
            <div class="text-5xl mb-4">🏗️</div>
            <p class="font-bold">Select a category to edit<br>or click "+ Add New"</p>
          </div>
        </div>

        <div *ngIf="editMode" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <h2 class="text-xl font-bold text-gray-900">{{ isNew ? 'New Category' : 'Edit: ' + editForm.name }}</h2>
            <button (click)="cancelEdit()" class="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition">Cancel</button>
          </div>

          <!-- Basic Info -->
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Category Name *</label>
              <input type="text" [(ngModel)]="editForm.name" (input)="autoSlug()" placeholder="e.g. Civil Contractor"
                     class="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-primary focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Slug (URL)</label>
              <input type="text" [(ngModel)]="editForm.slug"
                     class="w-full border border-gray-200 rounded-lg p-3 text-sm font-mono bg-gray-50 focus:border-primary focus:outline-none">
            </div>
            <div class="col-span-2">
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Description</label>
              <textarea [(ngModel)]="editForm.description" rows="2"
                        class="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-primary focus:outline-none" placeholder="Short description..."></textarea>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Sort Order</label>
              <input type="number" [(ngModel)]="editForm.sort_order" class="w-32 border border-gray-200 rounded-lg p-3 text-sm focus:border-primary focus:outline-none">
            </div>
          </div>

          <!-- Icon Upload -->
          <div class="mb-6 p-4 border border-dashed border-gray-200 rounded-xl bg-gray-50">
            <h4 class="font-bold text-sm text-gray-700 mb-3">Category Icon</h4>
            <div class="flex items-center gap-4">
              <div *ngIf="editForm.icon_url" class="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
                <img [src]="editForm.icon_url" alt="icon" class="w-12 h-12 object-contain">
              </div>
              <div *ngIf="!editForm.icon_url && editForm.icon" class="w-16 h-16 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-3xl">
                {{ editForm.icon }}
              </div>
              <div class="flex-1">
                <input type="file" #iconFileInput accept=".svg,image/svg+xml" (change)="onIconFileChange($event)" style="display:none">
                <button (click)="iconFileInput.click()" class="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-white transition">
                  📁 Upload SVG File
                </button>
                <span class="text-xs text-gray-400 ml-2">SVG only, max 200KB</span>
                <div *ngIf="iconUploading" class="text-xs text-primary mt-1 animate-pulse">Uploading...</div>
              </div>
              <div class="flex items-center gap-2">
                <label class="text-xs text-gray-500">Or emoji:</label>
                <input type="text" [(ngModel)]="editForm.icon" maxlength="4"
                       class="w-16 text-center text-2xl border border-gray-200 rounded-lg p-2" placeholder="🏗️">
              </div>
            </div>
          </div>

          <!-- Specializations -->
          <div class="mb-6">
            <div class="flex justify-between items-center mb-3">
              <h4 class="font-bold text-sm text-gray-700">Specializations / Sub-types</h4>
              <span class="text-xs text-gray-400">Vendors select these during registration</span>
            </div>
            <div class="space-y-2 mb-3">
              <div *ngFor="let spec of editSpecializations; let i = index" class="flex items-center gap-2">
                <input type="text" [(ngModel)]="spec.name" placeholder="Specialization name"
                       class="flex-1 border border-gray-200 rounded-lg p-2 text-sm focus:border-primary focus:outline-none">
                <input type="number" [(ngModel)]="spec.sort_order" placeholder="Order" min="1"
                       class="w-20 border border-gray-200 rounded-lg p-2 text-sm text-center">
                <button (click)="removeSpec(i)" class="text-red-500 hover:bg-red-50 w-8 h-8 rounded-lg flex items-center justify-center transition text-lg">✕</button>
              </div>
            </div>
            <div *ngIf="editSpecializations.length === 0" class="text-sm text-gray-400 italic mb-2">No specializations yet.</div>
            <button (click)="addSpec()" class="text-sm border border-gray-200 px-4 py-2 rounded-lg text-primary font-bold hover:bg-gray-50 transition">+ Add Specialization</button>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-4 border-t border-gray-100">
            <button (click)="saveCategory()" [disabled]="saving"
                    class="bg-primary text-white px-6 py-2.5 rounded-lg font-bold hover:bg-opacity-90 transition disabled:opacity-50">
              {{ saving ? 'Saving...' : 'Save Category' }}
            </button>
            <button *ngIf="!isNew" (click)="deleteCategory()" [disabled]="saving"
                    class="border border-red-300 text-red-600 px-4 py-2.5 rounded-lg font-bold hover:bg-red-50 transition disabled:opacity-50">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CategoriesManagementComponent implements OnInit {
  categories: any[] = [];
  specializations: Record<string, any[]> = {};
  selectedCat: any = null;
  editMode = false;
  isNew = false;
  saving = false;
  iconUploading = false;

  editForm: any = {};
  editSpecializations: any[] = [];

  constructor(private supabase: SupabaseService) { }

  async ngOnInit() {
    await this.loadCategories();
  }

  async loadCategories() {
    const { data } = await this.supabase.client.from('categories').select('*').order('sort_order').order('name');
    this.categories = data ?? [];
    // Load spec counts
    const { data: specs } = await this.supabase.client.from('category_specializations').select('category_id');
    if (specs) {
      const counts: Record<string, number> = {};
      specs.forEach((s: any) => { counts[s.category_id] = (counts[s.category_id] ?? 0) + 1; });
      this.specializations = counts as any;
    }
  }

  getSpecCount(catId: string): number {
    return (this.specializations as any)[catId] ?? 0;
  }

  selectCategory(cat: any) {
    this.selectedCat = cat;
    this.editForm = { ...cat };
    this.editMode = true;
    this.isNew = false;
    this.loadSpecs(cat.id);
  }

  startNew() {
    this.selectedCat = null;
    this.editForm = { name: '', slug: '', icon: '🏗️', icon_url: '', description: '', sort_order: 0 };
    this.editSpecializations = [];
    this.editMode = true;
    this.isNew = true;
  }

  cancelEdit() {
    this.editMode = false;
    this.selectedCat = null;
  }

  async loadSpecs(catId: string) {
    const { data } = await this.supabase.client
      .from('category_specializations').select('*')
      .eq('category_id', catId).order('sort_order');
    this.editSpecializations = data ?? [];
  }

  autoSlug(): void {
    this.editForm.slug = this.editForm.name
      .toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').trim();
  }

  addSpec(): void {
    this.editSpecializations.push({ name: '', sort_order: this.editSpecializations.length + 1 });
  }

  removeSpec(i: number): void {
    this.editSpecializations.splice(i, 1);
  }

  async onIconFileChange(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.svg')) { alert('Only SVG files allowed'); return; }
    if (file.size > 200 * 1024) { alert('SVG must be under 200KB'); return; }
    this.iconUploading = true;
    try {
      const path = `categories/${this.editForm.slug ?? 'temp'}-${Date.now()}.svg`;
      const { error } = await this.supabase.client.storage
        .from('s-network-media').upload(path, file, { upsert: true, contentType: 'image/svg+xml' });
      if (error) throw error;
      const { data: { publicUrl } } = this.supabase.client.storage.from('s-network-media').getPublicUrl(path);
      this.editForm.icon_url = publicUrl;
    } catch (err) {
      alert('Failed to upload icon. Please try again.');
    } finally {
      this.iconUploading = false;
    }
  }

  async saveCategory(): Promise<void> {
    if (!this.editForm.name) { alert('Category name is required'); return; }
    this.saving = true;
    try {
      let categoryId = this.editForm.id;
      const payload = {
        name: this.editForm.name, slug: this.editForm.slug,
        icon: this.editForm.icon, icon_url: this.editForm.icon_url,
        description: this.editForm.description, sort_order: this.editForm.sort_order
      };

      if (this.isNew) {
        const { data, error } = await this.supabase.client.from('categories').insert(payload).select().single();
        if (error) throw error;
        categoryId = data.id;
      } else {
        const { error } = await this.supabase.client.from('categories').update(payload).eq('id', categoryId);
        if (error) throw error;
      }

      // Save specializations
      if (!this.isNew && categoryId) {
        const existingIds = this.editSpecializations.filter(s => s.id).map(s => s.id);
        if (existingIds.length) {
          await this.supabase.client.from('category_specializations').delete()
            .eq('category_id', categoryId).not('id', 'in', `(${existingIds.join(',')})`);
        } else {
          await this.supabase.client.from('category_specializations').delete().eq('category_id', categoryId);
        }
      }

      for (const spec of this.editSpecializations) {
        if (spec.id) {
          await this.supabase.client.from('category_specializations')
            .update({ name: spec.name, sort_order: spec.sort_order }).eq('id', spec.id);
        } else {
          await this.supabase.client.from('category_specializations')
            .insert({ category_id: categoryId, name: spec.name, sort_order: spec.sort_order });
        }
      }

      await this.loadCategories();
      this.editMode = false;
      this.selectedCat = null;
      alert('Category saved successfully!');
    } catch (err: any) {
      alert('Failed to save: ' + (err?.message ?? 'Unknown error'));
    } finally {
      this.saving = false;
    }
  }

  async deleteCategory(): Promise<void> {
    if (!confirm(`Are you sure you want to delete "${this.editForm.name}"? This cannot be undone.`)) return;
    this.saving = true;
    try {
      const { error } = await this.supabase.client.from('categories').delete().eq('id', this.editForm.id);
      if (error) throw error;
      await this.loadCategories();
      this.editMode = false;
      this.selectedCat = null;
    } catch (err: any) {
      alert('Cannot delete: ' + (err?.message ?? 'Unknown error'));
    } finally {
      this.saving = false;
    }
  }

  getCategoryIconSmall(slug: string): string {
    const colors: Record<string, string> = {
      'civil-contractor': '#FEE2E2', 'architect': '#DCFCE7',
      'commercial-contractor': '#EDE9FE', 'turnkey-contractor': '#FEF3C7',
      'interior-designer': '#FCE7F3', 'electrician': '#FEF9C3',
      'plumber': '#E0F2FE', 'residential-builder': '#DBEAFE', 'material-supplier': '#F0FDF4'
    };
    const bg = colors[slug] ?? '#F3F4F6';
    return `<div style="width:40px;height:40px;border-radius:10px;background:${bg};display:flex;align-items:center;justify-content:center;font-size:18px;">🏗️</div>`;
  }
}
