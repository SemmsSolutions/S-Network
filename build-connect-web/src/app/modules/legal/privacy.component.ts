import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-privacy',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="min-h-screen bg-surface py-12 px-4 font-body">
      <div class="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h1 class="text-3xl font-heading font-bold text-primary mb-6">Privacy Policy</h1>
        <p class="text-sm text-gray-500 mb-6">Last updated: April 2026</p>

        <div class="space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 class="text-lg font-bold text-secondary mb-2">1. Information We Collect</h2>
            <p>We collect information you provide directly: name, email address, phone number, business details, and uploaded documents (GST/MSME certificates for vendor verification). We also collect usage data such as search queries, page views, and device information.</p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-secondary mb-2">2. How We Use Your Information</h2>
            <p>Your information is used to: provide and maintain our platform, verify vendor businesses, display business profiles to users, process lead requests, send notifications, and improve our services.</p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-secondary mb-2">3. Document Handling (GST/MSME)</h2>
            <p>Verification documents are stored securely and are only accessible to the uploading vendor and authorized administrators. They are used solely for business verification purposes and are not shared with third parties.</p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-secondary mb-2">4. Data Storage</h2>
            <p>Your data is stored securely using industry-standard encryption. We use Supabase for database and authentication services, which provides enterprise-grade security.</p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-secondary mb-2">5. Third-Party Services</h2>
            <p>We use Google OAuth for authentication. When you sign in with Google, Google's privacy policy applies to the data they collect.</p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-secondary mb-2">6. Your Rights</h2>
            <p>You can request access to, correction of, or deletion of your personal data by contacting us. Vendors can delete their business profiles at any time.</p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-secondary mb-2">7. Contact</h2>
            <p>For privacy-related questions, contact us at <strong>privacy&#64;snetwork.app</strong>.</p>
          </section>
        </div>
      </div>
    </div>
  `
})
export class PrivacyComponent { }
