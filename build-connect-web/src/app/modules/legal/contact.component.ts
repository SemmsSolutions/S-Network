import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-surface py-12">
      <div class="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-xl shadow-sm">
        <h1 class="text-4xl font-heading font-bold text-navy mb-6">Contact Support</h1>
        <div class="prose max-w-none text-gray-700">
          <p class="mb-4">For partnership queries, technical support, or listing verifications, please reach out to us.</p>
          <div class="bg-gray-50 p-6 rounded-lg mt-8">
             <p class="font-bold text-navy mb-2">Email: <a [href]="mailtoLink" class="text-primary hover:underline">support&#64;s-network.in</a></p>
             <p class="font-bold text-navy">Phone: +91 99999 00000</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ContactComponent {
  readonly mailtoLink = 'mailto:support' + '@' + 's-network.in';
}
