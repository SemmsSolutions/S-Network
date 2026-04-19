import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-login-prompt-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <!-- Overlay backdrop -->
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm px-4"
         (click)="onClose.emit()">
      <div class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in"
           (click)="$event.stopPropagation()">
        <!-- Close button -->
        <button (click)="onClose.emit()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold transition">✕</button>

        <!-- Header -->
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-3xl">📋</span>
          </div>
          <h2 class="text-2xl font-heading font-bold text-gray-800 mb-2">Sign in to send your enquiry</h2>
          <p class="text-gray-500 text-sm leading-relaxed">
            Create a free account or sign in to contact
            <strong class="text-gray-700">{{businessName}}</strong>
            and get your project quote.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3 mb-6">
          <button (click)="goToLogin()" class="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-opacity-90 transition shadow-md">
            🔐 Login to Send Enquiry
          </button>
          <button (click)="goToRegister()" class="w-full py-3 border-2 border-primary text-primary rounded-xl font-bold text-sm hover:bg-primary hover:text-white transition">
            ✨ Create Free Account
          </button>
        </div>

        <!-- Mobile App Banner -->
        <div class="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
          <p class="text-sm font-bold text-gray-700 mb-2">📱 Get faster responses on the S-Network mobile app</p>
          <p class="text-xs text-gray-500">Direct chat, instant notifications & more</p>
        </div>
      </div>
    </div>
  `,
    styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
  `]
})
export class LoginPromptModalComponent {
    @Input() businessName: string = '';
    @Input() businessId: string = '';
    @Output() onClose = new EventEmitter<void>();

    constructor(private router: Router) { }

    goToLogin() {
        const redirect = `/business/${this.businessId}?openQuote=true`;
        this.router.navigate(['/auth/login'], { queryParams: { redirect } });
        this.onClose.emit();
    }

    goToRegister() {
        const redirect = `/business/${this.businessId}?openQuote=true`;
        this.router.navigate(['/auth/register'], { queryParams: { redirect } });
        this.onClose.emit();
    }
}
