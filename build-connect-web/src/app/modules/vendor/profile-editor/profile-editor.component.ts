import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { MaterialService } from '../../../core/services/material.service';
import { MaterialGroup, MaterialItem } from '../../../shared/models/material.model';
import { forkJoin, of } from 'rxjs';

interface EditorGroup extends MaterialGroup {
  items: (MaterialItem & { selected?: boolean, custom_description?: string })[];
}

@Component({
  selector: 'app-profile-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="max-w-4xl">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-heading font-bold text-primary tracking-wide">Business Profile</h1>
        <button (click)="save()" [disabled]="form.invalid || isSaving" 
                class="bg-primary hover:bg-opacity-90 text-white font-bold py-2 px-6 rounded-lg transition disabled:opacity-50 shadow-md font-heading">
          {{ isSaving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form [formGroup]="form" class="p-6 md:p-8 space-y-6 flex flex-col">
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Business Name</label>
               <input formControlName="name" class="w-full border-gray-300 border p-3 rounded-lg font-body focus:ring-primary focus:border-primary shadow-sm">
             </div>
             <div>
               <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Phone Number</label>
               <input formControlName="phone" class="w-full border-gray-300 border p-3 rounded-lg font-body bg-gray-50 opacity-70 shadow-sm" readonly>
             </div>
             <div>
               <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">WhatsApp Link Number</label>
               <input formControlName="whatsapp" class="w-full border-gray-300 border p-3 rounded-lg font-body focus:ring-primary shadow-sm" placeholder="e.g. 919876543210">
             </div>
             <div>
               <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">City</label>
               <input formControlName="city" class="w-full border-gray-300 border p-3 rounded-lg font-body focus:ring-primary shadow-sm">
             </div>
             <div class="md:col-span-2">
               <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Address</label>
               <input formControlName="address" class="w-full border-gray-300 border p-3 rounded-lg font-body focus:ring-primary shadow-sm">
             </div>
          </div>

          <div>
             <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Description</label>
             <textarea formControlName="description" rows="5" class="w-full border-gray-300 border p-3 rounded-lg font-body focus:ring-primary shadow-sm" placeholder="Tell clients about your business..."></textarea>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Areas Served</label>
            <input formControlName="state" class="w-full border-gray-300 border p-3 rounded-lg font-body focus:ring-primary shadow-sm" placeholder="e.g. Tamil Nadu">
          </div>

          <!-- Materials & Products -->
          <div class="pt-8 mt-4 border-t border-gray-200">
             <div class="mb-4">
                <h3 class="text-xl font-heading font-bold text-primary tracking-wide">Materials & Products</h3>
                <p class="text-sm font-medium text-gray-500">Select what you offer and provide optional details like sizes or brands.</p>
             </div>
             
             <div class="space-y-4">
                <details *ngFor="let g of editorGroups" class="border border-gray-200 rounded-lg shadow-sm group">
                   <summary class="font-bold text-gray-800 list-none p-4 flex justify-between items-center cursor-pointer outline-none bg-gray-50 hover:bg-gray-100 rounded-lg group-open:rounded-b-none group-open:bg-white group-open:border-b transition">
                     <span class="text-lg">{{g.icon}} {{g.name}}</span>
                     <span class="text-primary group-open:rotate-180 transition-transform">▼</span>
                   </summary>
                   <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div *ngFor="let item of g.items" class="border border-gray-200 rounded p-3 flex flex-col {{ item.selected ? 'bg-blue-50 border-blue-200' : 'bg-white' }}">
                         <label class="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" [(ngModel)]="item.selected" [ngModelOptions]="{standalone: true}" class="w-5 h-5 text-primary rounded focus:ring-primary border-gray-300">
                            <span class="font-bold text-gray-700">{{item.name}}</span>
                         </label>
                         <div *ngIf="item.selected" class="mt-2 pl-8">
                            <input type="text" [(ngModel)]="item.custom_description" [ngModelOptions]="{standalone: true}" placeholder="Add description (e.g. brands, sizes, specs)" class="w-full p-2 border border-gray-300 rounded text-sm font-medium outline-none focus:border-secondary">
                         </div>
                      </div>
                   </div>
                </details>
             </div>
          </div>

          <!-- FAQs -->
          <div class="pt-8 mt-4 border-t border-gray-200">
              <div class="flex justify-between items-center mb-4">
                 <h3 class="text-xl font-heading font-bold text-primary tracking-wide">Frequently Asked Questions</h3>
                 <button type="button" (click)="addFaq()" class="bg-blue-50 text-secondary font-bold px-4 py-2 border border-blue-200 rounded hover:bg-blue-100 transition shadow-sm text-sm">+ Add FAQ</button>
              </div>
              <div class="space-y-4">
                 <div *ngFor="let faq of faqs; let i = index" class="border border-gray-200 p-4 rounded-lg bg-gray-50 relative shadow-sm">
                     <button type="button" (click)="removeFaq(i)" class="absolute top-4 right-4 text-red-500 font-bold hover:text-red-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition">✕</button>
                     <input [(ngModel)]="faq.question" [ngModelOptions]="{standalone: true}" placeholder="e.g., Do you offer free structural estimates?" class="w-full pr-12 mb-3 p-3 border border-gray-300 rounded-lg font-bold focus:ring-primary focus:border-primary shadow-sm">
                     <textarea [(ngModel)]="faq.answer" [ngModelOptions]="{standalone: true}" placeholder="e.g., Yes, we evaluate the site and offer a core structural estimate free of charge." class="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-primary focus:border-primary shadow-sm" rows="2"></textarea>
                 </div>
                 <div *ngIf="faqs.length === 0" class="text-center p-6 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-gray-500 font-medium">No FAQs added yet. Adding them improves your profile ranking!</div>
              </div>
          </div>

          <div class="pt-8 mt-4 border-t border-gray-200">
              <h3 class="text-xl font-heading font-bold text-primary mb-4 tracking-wide">Portfolio Images</h3>
              <div class="bg-surface border-2 border-dashed border-gray-300 rounded-xl p-10 text-center flex flex-col items-center transition hover:border-primary">
                 <span class="text-5xl mb-3">📸</span>
                 <p class="font-bold text-gray-700 mb-4">Upload high-quality photos of your work</p>
                 <input type="file" (change)="uploadImage($event)" accept="image/*" class="hidden" #fileInput>
                 <button type="button" (click)="fileInput.click()" class="bg-secondary text-white font-bold py-3 px-8 rounded-lg hover:bg-opacity-90 transition shadow-md tracking-wide">Select Image</button>
              </div>
          
              <!-- Gallery Grid -->
              <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4" *ngIf="portfolioImages.length > 0">
                <div *ngFor="let img of portfolioImages" class="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  <img [src]="img.image_url" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center">
                     <button type="button" (click)="deleteImage(img.id)" class="bg-secondary text-white w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold hover:bg-opacity-90 transform scale-75 group-hover:scale-100 shadow-lg">✕</button>
                  </div>
                </div>
              </div>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ProfileEditorComponent implements OnInit {
  form: FormGroup;
  businessId?: string;
  isSaving = false;
  portfolioImages: any[] = [];
  faqs: { question: string, answer: string }[] = [];
  editorGroups: EditorGroup[] = [];

  constructor(private fb: FormBuilder, private supabase: SupabaseService, private materialService: MaterialService) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      phone: [''],
      whatsapp: [''],
      city: ['', Validators.required],
      address: [''],
      description: [''],
      state: ['']
    });
  }

  async ngOnInit() {
    const { data: userData } = await this.supabase.client.auth.getUser();
    if (!userData.user) return;

    const { data: biz } = await this.supabase.client
      .from('businesses')
      .select('*')
      .eq('owner_id', userData.user.id)
      .maybeSingle();

    if (biz) {
      this.businessId = biz.id;
      this.form.patchValue(biz);

      const [{ data: images }, { data: qData }] = await Promise.all([
        this.supabase.client.from('business_images').select('*').eq('business_id', biz.id),
        this.supabase.client.from('business_faqs').select('question, answer').eq('business_id', biz.id)
      ]);

      if (images) this.portfolioImages = images;
      if (qData) this.faqs = qData;

      this.loadMaterials();
    }
  }

  loadMaterials() {
    forkJoin({
      groups: this.materialService.getMaterialGroups(),
      businessMaterials: this.businessId ? this.materialService.getBusinessMaterials(this.businessId) : of([])
    }).subscribe(({ groups, businessMaterials }) => {
      // For each group, we also need to load its items
      const groupObservables = groups.map(g => this.materialService.getMaterialItems(g.id));

      forkJoin(groupObservables).subscribe(itemsArrays => {
        this.editorGroups = groups.map((g, i) => {
          return {
            ...g,
            items: itemsArrays[i].map(item => {
              const matchedBM = businessMaterials.find(bm => bm.material_item_id === item.id);
              return {
                ...item,
                selected: !!matchedBM,
                custom_description: matchedBM?.custom_description || ''
              };
            })
          };
        });
      });
    });
  }

  async save() {
    if (!this.businessId || this.form.invalid) return;
    this.isSaving = true;

    try {
      await this.supabase.client
        .from('businesses')
        .update(this.form.value)
        .eq('id', this.businessId);

      // Sync FAQs
      await this.supabase.client.from('business_faqs').delete().eq('business_id', this.businessId);
      if (this.faqs.length > 0) {
        const payload = this.faqs.filter(f => f.question && f.answer).map(f => ({ business_id: this.businessId, question: f.question, answer: f.answer }));
        if (payload.length > 0) {
          await this.supabase.client.from('business_faqs').insert(payload);
        }
      }

      // Sync Materials
      const selectedMaterials: { itemId: string, desc: string }[] = [];
      this.editorGroups.forEach(g => {
        g.items.forEach(item => {
          if (item.selected) {
            selectedMaterials.push({ itemId: item.id, desc: item.custom_description || '' });
          }
        });
      });
      await this.materialService.updateBusinessMaterials(this.businessId, selectedMaterials);

      alert('Profile updated successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      this.isSaving = false;
    }
  }

  async uploadImage(event: any) {
    const file = event.target.files[0];
    if (!file || !this.businessId) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `businesses/${this.businessId}/portfolio/${fileName}`;

      const { data, error } = await this.supabase.client.storage
        .from('s-network-media')
        .upload(filePath, file);

      if (error) throw error;

      const { data: publicUrlObj } = this.supabase.client.storage
        .from('s-network-media')
        .getPublicUrl(filePath);

      if (publicUrlObj) {
        const { data: newImage } = await this.supabase.client
          .from('business_images')
          .insert({ business_id: this.businessId, image_url: publicUrlObj.publicUrl, caption: '' })
          .select()
          .maybeSingle();

        if (newImage) this.portfolioImages.push(newImage);
      }
    } catch (err) {
      console.error('Upload error', err);
      alert('Error uploading image');
    }
  }

  async deleteImage(imageId: string) {
    if (!this.businessId) return;
    try {
      await this.supabase.client.from('business_images').delete().eq('id', imageId);
      this.portfolioImages = this.portfolioImages.filter(img => img.id !== imageId);
    } catch (err) {
      console.error('Delete error', err);
    }
  }

  addFaq() {
    this.faqs.push({ question: '', answer: '' });
  }

  removeFaq(idx: number) {
    this.faqs.splice(idx, 1);
  }
}
