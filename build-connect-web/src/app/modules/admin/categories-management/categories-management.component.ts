import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-categories-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-heading font-bold text-gray-900 tracking-wide">Category Management</h1>
        <button (click)="openAddModal()" class="bg-primary hover:bg-opacity-90 text-white px-6 py-2 rounded-lg font-bold shadow-sm transition">+ Add Category</button>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-widest text-gray-500 font-bold">
              <th class="p-4 w-16 text-center">Icon</th>
              <th class="p-4">Name</th>
              <th class="p-4">Slug</th>
              <th class="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr *ngFor="let c of categories" class="hover:bg-gray-50 transition">
              <td class="p-4 text-center text-3xl">{{c.icon_name}}</td>
              <td class="p-4 font-bold text-gray-800">{{c.name}}</td>
              <td class="p-4 text-gray-500 font-mono text-sm">{{c.slug}}</td>
              <td class="p-4 text-right space-x-2">
                <button (click)="deleteCategory(c.id)" class="text-red-600 hover:bg-red-50 px-3 py-1 rounded transition font-bold text-sm">Delete</button>
              </td>
            </tr>
            <tr *ngIf="categories.length === 0">
              <td colspan="4" class="p-12 text-center text-gray-500 font-medium">No categories found.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add Category Modal -->
      <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
        <div class="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md animate-fade-in">
          <h2 class="text-2xl font-bold font-heading mb-6 text-gray-900">New Category</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Name</label>
              <input [(ngModel)]="newCat.name" (keyup)="updateSlug()" class="w-full border-gray-300 border p-3 rounded-lg focus:ring-primary font-body">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Slug</label>
              <input [(ngModel)]="newCat.slug" class="w-full border-gray-300 border p-3 rounded-lg bg-gray-50 font-mono text-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Emoji Icon</label>
              <input [(ngModel)]="newCat.icon_name" class="w-20 text-3xl border-gray-300 border p-2 rounded-lg text-center" maxlength="2">
            </div>
          </div>
          
          <div class="mt-8 flex justify-end gap-3">
            <button (click)="showModal = false" class="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancel</button>
            <button (click)="saveCategory()" [disabled]="!newCat.name || !newCat.slug || isSaving" class="bg-success hover:bg-opacity-90 text-white px-6 py-2 rounded-lg font-bold transition disabled:opacity-50">Save</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
  `]
})
export class CategoriesManagementComponent implements OnInit {
  categories: any[] = [];
  showModal = false;
  isSaving = false;
  newCat = { name: '', slug: '', icon_name: '🏗️' };

  constructor(private supabase: SupabaseService) { }

  async ngOnInit() {
    this.loadCategories();
  }

  async loadCategories() {
    const { data } = await this.supabase.client.from('categories').select('*').order('name');
    if (data) this.categories = data;
  }

  openAddModal() {
    this.newCat = { name: '', slug: '', icon_name: '🏗️' };
    this.showModal = true;
  }

  updateSlug() {
    this.newCat.slug = this.newCat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  async saveCategory() {
    this.isSaving = true;
    try {
      const { data, error } = await this.supabase.client.from('categories').insert(this.newCat).select().single();
      if (!error && data) {
        this.categories.push(data);
        this.categories.sort((a, b) => a.name.localeCompare(b.name));
        this.showModal = false;
      } else {
        alert('Error saving category');
      }
    } catch (e) {
      console.error(e);
    } finally {
      this.isSaving = false;
    }
  }

  async deleteCategory(id: string) {
    if (!confirm('Are you sure? This will fail natively if businesses are already attached to this category.')) return;
    try {
      const { error } = await this.supabase.client.from('categories').delete().eq('id', id);
      if (error) {
        alert('Cannot delete constraint violation: ' + error.message);
      } else {
        this.categories = this.categories.filter(c => c.id !== id);
      }
    } catch (e) {
      console.error(e);
    }
  }
}
