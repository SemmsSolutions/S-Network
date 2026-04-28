import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="min-h-screen bg-surface py-12">
      <div class="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-xl shadow-sm">
        <h1 class="text-4xl font-heading font-bold text-navy mb-6">About S-Network</h1>
        <div class="prose max-w-none text-gray-700">
          <p class="mb-4">S-Network is the premier platform connecting building and construction professionals with clients. From verified turnkey contractors to artisan interior designers, our platform bridges the gap between project requirements and trusted execution.</p>
          <h2 class="text-2xl font-bold mt-8 mb-4">Our Mission</h2>
          <p class="mb-4">To bring transparency, speed, and reliability to the fragmented construction sector via a powerful digital ecosystem.</p>
        </div>
      </div>
    </div>
  `
})
export class AboutComponent { }
