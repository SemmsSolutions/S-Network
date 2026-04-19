import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="min-h-screen bg-surface flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-body">
      <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div>
          <h2 class="text-center text-3xl font-heading font-extrabold text-primary">Sign in to your account</h2>
        </div>

        <div class="mt-6 space-y-6">
            <!-- Email Login -->
            <div class="space-y-4">
                <div>
                   <label class="block text-sm font-bold text-gray-700">Email Address</label>
                   <input type="email" [(ngModel)]="email" placeholder="you@example.com" class="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                </div>
                <div>
                   <label class="block text-sm font-bold text-gray-700">Password</label>
                   <input type="password" [(ngModel)]="password" placeholder="••••••••" class="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                </div>
                <button (click)="loginWithEmail()" [disabled]="loading || !email || !password" class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition disabled:opacity-50">
                    {{ loading ? 'Signing in...' : 'Sign In' }}
                </button>
            </div>

            <div class="relative py-2">
               <div class="absolute inset-0 flex items-center">
                 <div class="w-full border-t border-gray-300"></div>
               </div>
               <div class="relative flex justify-center text-sm">
                 <span class="px-2 bg-white text-gray-500 font-bold uppercase tracking-wide">Or</span>
               </div>
            </div>

            <button (click)="loginWithGoogle()" class="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer">
              <span class="mr-2 border-r pr-2 border-gray-300">G</span> Continue with Google
            </button>
        </div>

        <div *ngIf="errorMsg" class="mt-4 text-center text-sm text-red-600 font-bold">{{errorMsg}}</div>
        <div *ngIf="successMsg" class="mt-4 text-center text-sm text-green-600 font-bold">{{successMsg}}</div>

        <div class="mt-6 flex items-center justify-between text-sm">
           <span class="text-gray-600">Don't have an account?
             <a routerLink="/auth/register" class="font-bold text-primary hover:text-secondary transition"> Register free</a>
           </span>
           <button type="button" (click)="forgotPassword()" class="text-primary font-bold hover:underline">Forgot password?</button>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
    email = '';
    password = '';
    loading = false;
    errorMsg = '';
    successMsg = '';

    constructor(private supabase: SupabaseService, private router: Router) { }

    async loginWithEmail() {
        this.loading = true;
        this.errorMsg = '';
        try {
            const { error } = await this.supabase.client.auth.signInWithPassword({
                email: this.email,
                password: this.password
            });
            if (error) throw error;
            this.router.navigate(['/auth/callback']);
        } catch (e: any) {
            const msg = e.message || '';
            if (msg.includes('Invalid login credentials')) {
                this.errorMsg = '❌ Incorrect email or password.';
            } else if (msg.includes('Email not confirmed')) {
                this.errorMsg = '📧 Please verify your email first.';
            } else if (msg.includes('Too many requests')) {
                this.errorMsg = '⏳ Too many attempts. Please wait a moment.';
            } else if (msg.includes('User not found')) {
                this.errorMsg = '❌ No account found with this email.';
            } else {
                this.errorMsg = msg || 'Error signing in';
            }
        } finally {
            this.loading = false;
        }
    }

    async loginWithGoogle() {
        try {
            await this.supabase.client.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/auth/callback'
                }
            });
        } catch (e) {
            console.error(e);
        }
    }

    async forgotPassword() {
        if (!this.email) { this.errorMsg = 'Enter your email address first'; return; }
        const { error } = await this.supabase.client.auth.resetPasswordForEmail(this.email, {
            redirectTo: window.location.origin + '/auth/reset-password'
        });
        if (error) { this.errorMsg = error.message; return; }
        this.successMsg = '✅ Password reset email sent! Check your inbox.';
        this.errorMsg = '';
    }
}
