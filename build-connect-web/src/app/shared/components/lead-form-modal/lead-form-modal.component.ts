import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-lead-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative max-h-[95vh] overflow-y-auto">
        <div class="bg-gradient-to-br from-primary to-secondary p-6 rounded-t-2xl">
          <button (click)="close.emit()" class="absolute top-4 right-4 text-white opacity-80 hover:opacity-100 text-2xl font-bold leading-none">✕</button>
          <h2 class="text-2xl font-heading font-bold text-white mb-1">Request a Quote</h2>
          <p class="text-white text-opacity-80 text-sm font-medium">Tell us about your project and we'll connect you right away.</p>
        </div>
        
        <form [formGroup]="form" (ngSubmit)="submit()" class="p-6">
          
          <div class="mb-5">
            <h3 class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Your Contact Details</h3>
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Full Name <span class="text-red-500">*</span></label>
                <input type="text" formControlName="user_name" placeholder="Your full name" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1">Phone Number <span class="text-red-500">*</span></label>
                  <input type="tel" formControlName="user_phone" placeholder="+91 XXXXX XXXXX" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1">Email (optional)</label>
                  <input type="email" formControlName="user_email" placeholder="you@email.com" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
              </div>
            </div>
          </div>
          
          <div class="border-t border-gray-100 mb-5 pt-5">
            <h3 class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Project Details</h3>
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Project Type <span class="text-red-500">*</span></label>
                <select formControlName="project_type" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                  <option value="New Construction">New Construction</option>
                  <option value="Renovation">Renovation / Remodel</option>
                  <option value="Repair">Repair</option>
                  <option value="Interior Design">Interior Design</option>
                  <option value="Consultation">Consultation</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1">Min Budget (₹)</label>
                  <input type="number" formControlName="budget_min" placeholder="e.g. 50000" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary">
                </div>
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1">Max Budget (₹)</label>
                  <input type="number" formControlName="budget_max" placeholder="e.g. 200000" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary">
                </div>
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Timeline</label>
                <input type="text" formControlName="timeline" placeholder="e.g. Within 1 month, ASAP, Flexible" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary">
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Project Description <span class="text-red-500">*</span></label>
                <textarea formControlName="message" rows="3" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Describe what you need, location, and any specific requirements..."></textarea>
              </div>
            </div>
          </div>

          <button type="submit" [disabled]="form.invalid || submitting" class="w-full bg-secondary text-white font-heading font-bold py-4 rounded-xl hover:bg-opacity-90 disabled:opacity-50 transition text-lg shadow-md">
            <span *ngIf="!submitting">📬 Send Quote Request</span>
            <span *ngIf="submitting">Sending...</span>
          </button>
          <p class="text-xs text-center text-gray-400 mt-3 font-medium">Your details will be sent directly to the vendor and our team.</p>
        </form>
      </div>
    </div>
  `
})
export class LeadFormModalComponent implements OnInit {
  @Input() businessId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() submitLead = new EventEmitter<any>();

  form: FormGroup;
  submitting = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private supabase: SupabaseService) {
    this.form = this.fb.group({
      user_name: ['', Validators.required],
      user_phone: ['', [Validators.required, Validators.pattern(/\d{10,}/)]],
      user_email: [''],
      project_type: ['New Construction', Validators.required],
      budget_min: [null],
      budget_max: [null],
      timeline: [''],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  async ngOnInit() {
    const user = this.authService.currentUser;
    if (user) {
      const { data: profile } = await this.supabase.client
        .from('profiles')
        .select('name, phone')
        .eq('id', user.id)
        .maybeSingle();
      if (profile) {
        this.form.patchValue({
          user_name: profile.name || '',
          user_phone: profile.phone || '',
          user_email: user.email || ''
        });
      }
    }
  }

  submit() {
    if (this.form.valid) {
      this.submitting = true;
      this.submitLead.emit(this.form.value);
    }
  }
}
