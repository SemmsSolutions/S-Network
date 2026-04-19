import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-surface flex items-center justify-center py-8 px-4 font-body">
      <div class="max-w-lg w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h2 class="text-center text-2xl font-heading font-extrabold text-primary mb-2">Create an Account</h2>

        <!-- Step Indicator (vendors only) -->
        <div *ngIf="role === 'vendor'" class="flex items-center justify-center gap-2 mb-6">
          <div *ngFor="let s of [1,2,3]" class="flex items-center gap-2">
            <div [class]="step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'" class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">{{s}}</div>
            <span *ngIf="s < 3" class="w-8 h-px" [class]="step > s ? 'bg-primary' : 'bg-gray-200'"></span>
          </div>
        </div>

        <!-- STEP 1: Account Details -->
        <div *ngIf="step === 1" class="space-y-4">
          <div>
            <label class="block text-sm font-bold text-gray-700">Full Name *</label>
            <input type="text" [(ngModel)]="fullName" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary">
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700">Email *</label>
            <input type="email" [(ngModel)]="email" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary">
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700">Password *</label>
            <input type="password" [(ngModel)]="password" placeholder="Min 8 characters" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary">
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700">Phone *</label>
            <div class="mt-1 flex">
              <span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm font-bold">+91</span>
              <input type="tel" [(ngModel)]="phone" placeholder="9876543210" class="flex-1 rounded-r-md border border-gray-300 px-3 py-2 text-sm focus:ring-primary focus:border-primary">
            </div>
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700">Account Type *</label>
            <select [(ngModel)]="role" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-primary focus:border-primary">
              <option value="user">Looking for Professionals (User)</option>
              <option value="vendor">Offering Services (Vendor)</option>
            </select>
          </div>

          <!-- User: direct register -->
          <button *ngIf="role === 'user'" (click)="registerUser()" [disabled]="loading || !fullName || !email || !password || password.length < 6" class="w-full py-3 bg-primary text-white rounded-md font-bold text-sm hover:bg-opacity-90 transition disabled:opacity-50 cursor-pointer">
            {{loading ? 'Creating...' : 'Create Account'}}
          </button>
          <!-- Vendor: go to step 2 -->
          <button *ngIf="role === 'vendor'" (click)="step = 2" [disabled]="!fullName || !email || !password || password.length < 6 || !phone" class="w-full py-3 bg-primary text-white rounded-md font-bold text-sm hover:bg-opacity-90 transition disabled:opacity-50 cursor-pointer">
            Next: Business Details →
          </button>

          <div class="relative py-2">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-300"></div></div>
            <div class="relative flex justify-center text-sm"><span class="px-2 bg-white text-gray-500 font-bold">Or</span></div>
          </div>
          <button (click)="registerWithGoogle()" class="w-full py-3 border border-gray-300 rounded-md bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer">
            <span class="mr-2 border-r pr-2 border-gray-300">G</span> Register with Google
          </button>
          
          <div *ngIf="errorMsg" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm font-bold text-center">
             {{errorMsg}}
          </div>
        </div>

        <!-- STEP 2: Business Details (Vendor only) -->
        <div *ngIf="step === 2" class="space-y-4">
          <p class="text-sm text-gray-500 mb-2">Step 2: Tell us about your business</p>
          <div>
            <label class="block text-sm font-bold text-gray-700">Business Name *</label>
            <input [(ngModel)]="bizName" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700">Category *</label>
            <select [(ngModel)]="bizCategory" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
              <option value="">Select category</option>
              <option *ngFor="let c of categories" [value]="c.id">{{c.name}}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700">Address *</label>
            <input [(ngModel)]="bizAddress" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-bold text-gray-700">City *</label>
              <input [(ngModel)]="bizCity" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700">State *</label>
              <input [(ngModel)]="bizState" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            </div>
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700">Description * <span class="text-xs text-gray-400">(min 50 chars)</span></label>
            <textarea [(ngModel)]="bizDescription" rows="3" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"></textarea>
            <p class="text-xs text-gray-400 mt-1">{{bizDescription.length}}/50 characters</p>
          </div>
          <div class="flex gap-3">
            <button (click)="step = 1" class="flex-1 py-3 border border-gray-300 rounded-md font-bold text-sm text-gray-700 hover:bg-gray-50">← Back</button>
            <button (click)="step = 3" [disabled]="!bizName || !bizCategory || !bizAddress || !bizCity || !bizState || bizDescription.length < 50" class="flex-1 py-3 bg-primary text-white rounded-md font-bold text-sm disabled:opacity-50">Next: Documents →</button>
          </div>
        </div>

        <!-- STEP 3: Document Upload (Vendor only) -->
        <div *ngIf="step === 3" class="space-y-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <h3 class="font-bold text-blue-800 mb-1">📄 Document Verification</h3>
            <p class="text-blue-700">Submit your business documents to get verified on S-Network. Documents are reviewed within 1–2 business days.</p>
          </div>

          <!-- GST -->
          <div class="border border-gray-200 rounded-lg p-4">
            <h4 class="font-bold text-sm text-gray-700 mb-2">GST Certificate</h4>
            <input [(ngModel)]="gstNumber" placeholder="e.g. 29ABCDE1234F1Z5" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-2 font-mono">
            <p *ngIf="gstNumber && !isGstValid" class="text-red-500 text-xs mb-2">Invalid GST format</p>
            <input type="file" (change)="onFileSelect($event, 'gst')" accept=".pdf,.jpg,.jpeg,.png" class="text-xs">
            <p *ngIf="gstFile" class="text-green-600 text-xs mt-1">✓ {{gstFile.name}}</p>
          </div>

          <!-- MSME -->
          <div class="border border-gray-200 rounded-lg p-4">
            <h4 class="font-bold text-sm text-gray-700 mb-2">MSME / Udyam Certificate</h4>
            <input [(ngModel)]="msmeNumber" placeholder="e.g. UDYAM-TN-01-0012345" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-2 font-mono">
            <p *ngIf="msmeNumber && !isMsmeValid" class="text-red-500 text-xs mb-2">Invalid MSME format</p>
            <input type="file" (change)="onFileSelect($event, 'msme')" accept=".pdf,.jpg,.jpeg,.png" class="text-xs">
            <p *ngIf="msmeFile" class="text-green-600 text-xs mt-1">✓ {{msmeFile.name}}</p>
          </div>

          <p class="text-xs text-gray-500">You must submit at least one document (GST or MSME) to complete registration.</p>

          <div *ngIf="errorMsg" class="text-red-600 text-sm font-bold">{{errorMsg}}</div>

          <div class="flex gap-3">
            <button (click)="step = 2" class="flex-1 py-3 border border-gray-300 rounded-md font-bold text-sm text-gray-700 hover:bg-gray-50">← Back</button>
            <button (click)="submitFullVendorRegistration()" [disabled]="loading || !canSubmitDocs" class="flex-1 py-3 bg-primary text-white rounded-md font-bold text-sm disabled:opacity-50">
              {{loading ? 'Registering...' : 'Submit Registration'}}
            </button>
          </div>
        </div>

        <!-- Success screen -->
        <div *ngIf="step === 99" class="text-center py-8">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center"><span class="text-3xl">✅</span></div>
          <h3 class="font-heading font-bold text-xl text-primary mb-2">Registration Successful!</h3>
          <p class="text-gray-600 text-sm mb-6">{{role === 'vendor' ? 'Your registration is under review. Please check your email and wait for admin approval.' : 'Please sign in to continue.'}}</p>
          <a routerLink="/auth/login" class="text-primary font-bold hover:underline">Go to Login →</a>
        </div>

        <div *ngIf="step === 1" class="mt-6 text-center text-sm">
          <span class="text-gray-600">Already have an account? </span>
          <a routerLink="/auth/login" class="font-bold text-primary hover:text-secondary transition">Sign in here</a>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent implements OnInit {
  step = 1;
  // Step 1
  fullName = ''; email = ''; password = ''; phone = ''; role = 'user';
  // Step 2
  bizName = ''; bizCategory = ''; bizAddress = ''; bizCity = ''; bizState = ''; bizDescription = '';
  categories: any[] = [];
  // Step 3
  gstNumber = ''; msmeNumber = ''; gstFile: File | null = null; msmeFile: File | null = null;

  loading = false; errorMsg = '';

  private gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  private msmeRegex = /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/;

  get isGstValid(): boolean { return !this.gstNumber || this.gstRegex.test(this.gstNumber); }
  get isMsmeValid(): boolean { return !this.msmeNumber || this.msmeRegex.test(this.msmeNumber); }
  get canSubmitDocs(): boolean {
    const hasGst = this.gstNumber && this.gstFile && this.isGstValid;
    const hasMsme = this.msmeNumber && this.msmeFile && this.isMsmeValid;
    return !!(hasGst || hasMsme);
  }

  constructor(private supabase: SupabaseService, private router: Router) { }

  async ngOnInit() {
    const { data } = await this.supabase.client.from('categories').select('id, name').order('name');
    this.categories = data || [];
  }

  onFileSelect(event: any, type: string) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { this.errorMsg = 'File must be under 5MB'; return; }
    if (type === 'gst') this.gstFile = file;
    if (type === 'msme') this.msmeFile = file;
  }

  async registerUser() {
    this.loading = true; this.errorMsg = '';
    try {
      const { data, error } = await this.supabase.client.auth.signUp({
        email: this.email, password: this.password,
        options: { data: { full_name: this.fullName, phone: '+91' + this.phone.replace(/\D/g, ''), role: 'user' } }
      });
      if (error) {
        const errorMessages: Record<string, string> = {
          'User already registered': 'An account with this email already exists. Please login.',
          'Password should be at least 6 characters': 'Password must be at least 8 characters.',
          'Invalid email': 'Please enter a valid email address.',
        };
        this.errorMsg = errorMessages[error.message] ?? error.message;
        this.loading = false;
        return;
      }

      // Supabase Email Enumeration protection fake-success Check
      // If the email already exists, Supabase returns a fake User object with an empty identities array.
      if (!data?.user || (data.user.identities && data.user.identities.length === 0)) {
        throw new Error('An account with this email already exists.');
      }

      this.step = 99;
    } catch (e: any) { this.errorMsg = e.message; }
    this.loading = false;
  }

  async submitFullVendorRegistration() {
    this.loading = true; this.errorMsg = '';
    try {
      // 1. Sign up (trigger sets role to pending_vendor)
      const { data: signUpData, error: signUpErr } = await this.supabase.client.auth.signUp({
        email: this.email, password: this.password,
        options: { data: { full_name: this.fullName, phone: '+91' + this.phone.replace(/\D/g, ''), role: 'vendor' } }
      });
      if (signUpErr) {
        const errorMessages: Record<string, string> = {
          'User already registered': 'An account with this email already exists. Please login.',
          'Password should be at least 6 characters': 'Password must be at least 8 characters.',
          'Invalid email': 'Please enter a valid email address.',
        };
        this.errorMsg = errorMessages[signUpErr.message] ?? signUpErr.message;
        this.loading = false;
        return;
      }

      // Supabase Email Enumeration protection fake-success Check
      if (!signUpData?.user || (signUpData.user.identities && signUpData.user.identities.length === 0)) {
        throw new Error('An account with this email already exists.');
      }

      const userId = signUpData.user.id;


      // 2. Wait for session (if auto-confirm enabled)
      await new Promise(r => setTimeout(r, 1000));
      const { data: { session } } = await this.supabase.client.auth.getSession();

      if (session) {
        // 3. Create business record
        const { data: biz, error: bizErr } = await this.supabase.client.from('businesses').insert({
          name: this.bizName, category_id: this.bizCategory, address: this.bizAddress,
          city: this.bizCity, state: this.bizState, description: this.bizDescription,
          owner_id: userId, is_active: false, phone: '+91' + this.phone.replace(/\D/g, '')
        }).select('id').single();
        if (bizErr) throw bizErr;

        // 4. Upload documents
        let gstUrl = null, msmeUrl = null;
        if (this.gstFile) {
          const ext = this.gstFile.name.split('.').pop();
          const path = `verifications/${biz.id}/gst-certificate.${ext}`;
          await this.supabase.client.storage.from('s-network-media').upload(path, this.gstFile, { upsert: true });
          const { data: urlData } = this.supabase.client.storage.from('s-network-media').getPublicUrl(path);
          gstUrl = urlData.publicUrl;
        }
        if (this.msmeFile) {
          const ext = this.msmeFile.name.split('.').pop();
          const path = `verifications/${biz.id}/msme-certificate.${ext}`;
          await this.supabase.client.storage.from('s-network-media').upload(path, this.msmeFile, { upsert: true });
          const { data: urlData } = this.supabase.client.storage.from('s-network-media').getPublicUrl(path);
          msmeUrl = urlData.publicUrl;
        }

        // 5. Submit verification
        await this.supabase.client.functions.invoke('submit-verification', {
          body: {
            business_id: biz.id,
            gst_number: this.gstNumber || null, gst_certificate_url: gstUrl,
            msme_number: this.msmeNumber || null, msme_certificate_url: msmeUrl
          }
        });

        // 6. Sign out — vendor must wait for approval
        await this.supabase.client.auth.signOut();
      }

      this.step = 99;
    } catch (e: any) {
      this.errorMsg = e.message || 'Registration failed';
    }
    this.loading = false;
  }

  async registerWithGoogle() {
    await this.supabase.client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback', queryParams: { access_type: 'offline', prompt: 'consent' } }
    });
  }
}
