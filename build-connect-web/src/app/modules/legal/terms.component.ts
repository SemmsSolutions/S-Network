import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-terms',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="min-h-screen bg-surface py-12 px-4 font-body">
      <div class="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h1 class="text-3xl font-heading font-bold text-primary mb-6">Terms of Service</h1>
        <p class="text-sm text-gray-500 mb-6">Last updated: April 2026</p>

        <div class="space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 class="text-lg font-bold text-secondary mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using S-Network, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-secondary mb-2">2. Platform Description</h2>
            <p>S-Network is a construction industry platform connecting users with verified service providers. It is an exclusive platform for a selected organization.</p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-secondary mb-2">3. User Accounts</h2>
            <p>You are responsible for maintaining the security of your account. You must provide accurate information during registration. Sharing accounts is prohibited.</p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-secondary mb-2">4. Vendor Responsibilities</h2>
            <p>Vendors must provide accurate business information. Submitting fraudulent verification documents will result in account termination. Vendors are responsible for the services they offer.</p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-secondary mb-2">5. Verification</h2>
            <p>The Verified badge indicates that submitted GST/MSME documents have been reviewed. It does not constitute an endorsement or guarantee of service quality.</p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-secondary mb-2">6. Prohibited Conduct</h2>
            <p>Users may not: submit false information, harass other users, attempt to circumvent security measures, or use the platform for illegal activities.</p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-secondary mb-2">7. Contact</h2>
            <p>For questions about these terms, contact us at <strong>legal&#64;snetwork.app</strong>.</p>
          </section>
        </div>
      </div>
    </div>
  `
})
export class TermsComponent { }
