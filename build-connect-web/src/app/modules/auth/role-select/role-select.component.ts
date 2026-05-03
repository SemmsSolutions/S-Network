import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-role-select',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="role-select-page">
      <div class="role-select-container">
        <!-- Header -->
        <div class="role-header">
          <a routerLink="/home" class="back-link">← Back to Home</a>
          <div class="sn-logo"><span class="red">S</span>-<span class="red">N</span>etwork</div>
          <h1>Join S-Network</h1>
          <p>Choose how you want to use S-Network</p>
        </div>

        <!-- Role Cards -->
        <div class="role-cards">
          <button class="role-card user-card" (click)="selectRole('user')">
            <div class="role-card-icon">👤</div>
            <h2>I'm Looking for Services</h2>
            <p>Find and hire verified construction professionals near you</p>
            <ul class="role-benefits">
              <li>✓ Search thousands of professionals</li>
              <li>✓ Send quote requests instantly</li>
              <li>✓ Read reviews and compare</li>
              <li>✓ Track your enquiries</li>
            </ul>
            <div class="role-cta">Register as User →</div>
          </button>

          <div class="role-divider"><span>OR</span></div>

          <button class="role-card vendor-card" (click)="selectRole('vendor')">
            <div class="role-card-icon">🏗️</div>
            <h2>I'm a Construction Professional</h2>
            <p>List your business and start receiving leads from customers</p>
            <ul class="role-benefits">
              <li>✓ Free business listing</li>
              <li>✓ Receive project enquiries</li>
              <li>✓ Get Verified badge</li>
              <li>✓ Build your portfolio</li>
            </ul>
            <div class="role-cta vendor-cta">Register as Vendor →</div>
          </button>
        </div>

        <p class="login-link">
          Already have an account? <a routerLink="/auth/login">Login here</a>
        </p>
      </div>
    </div>
  `,
    styles: [`
    .role-select-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #0A1628 0%, #0D1F3C 100%);
      display: flex; align-items: center; justify-content: center; padding: 24px;
    }
    .role-select-container { width: 100%; max-width: 900px; }
    .role-header {
      text-align: center; margin-bottom: 40px; color: white;
    }
    .back-link {
      color: rgba(255,255,255,0.6); text-decoration: none; font-size: 14px;
      display: block; margin-bottom: 16px;
    }
    .back-link:hover { color: white; }
    .sn-logo { font-size: 2rem; font-weight: 900; margin-bottom: 16px; }
    .sn-logo .red { color: #CC0000; }
    h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 8px; }
    p { font-size: 1.1rem; color: rgba(255,255,255,0.7); }
    .role-cards { display: flex; gap: 24px; align-items: stretch; }
    @media (max-width: 640px) { .role-cards { flex-direction: column; } }
    .role-card {
      flex: 1; background: white; border-radius: 20px;
      padding: 36px 28px; text-align: left; cursor: pointer;
      border: 3px solid transparent; transition: all 0.2s;
      display: flex; flex-direction: column; gap: 12px;
    }
    .role-card:hover { transform: translateY(-6px); box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .role-card-icon { font-size: 48px; display: block; }
    .role-card h2 { font-size: 1.3rem; font-weight: 800; color: #0A1628; }
    .role-card p { font-size: 14px; color: #6B7299; line-height: 1.5; }
    .role-benefits { list-style: none; padding: 0; margin: 8px 0; }
    .role-benefits li { font-size: 13px; color: #444; padding: 4px 0; }
    .role-cta {
      margin-top: auto; padding: 14px 24px;
      background: #0A1628; color: white;
      border-radius: 10px; font-weight: 700; font-size: 15px; text-align: center;
    }
    .vendor-card { border-color: #CC0000; background: linear-gradient(135deg, #fff 0%, #FFF5F5 100%); }
    .vendor-card:hover { border-color: #990000; box-shadow: 0 20px 60px rgba(204,0,0,0.2); }
    .vendor-cta { background: #CC0000 !important; }
    .role-divider {
      display: flex; align-items: center; color: rgba(255,255,255,0.5);
      font-weight: 600; font-size: 14px;
    }
    @media (min-width: 641px) {
      .role-divider { flex-direction: column; }
      .role-divider::before, .role-divider::after {
        content: ''; flex: 1; width: 1px;
        background: rgba(255,255,255,0.2); margin: 8px 0;
      }
    }
    @media (max-width: 640px) {
      .role-divider::before, .role-divider::after {
        content: ''; flex: 1; height: 1px;
        background: rgba(255,255,255,0.2); margin: 0 8px;
      }
    }
    .login-link {
      text-align: center; margin-top: 24px;
      color: rgba(255,255,255,0.6); font-size: 14px;
    }
    .login-link a { color: #CC0000; font-weight: 600; text-decoration: none; }
    .login-link a:hover { text-decoration: underline; }
  `]
})
export class RoleSelectComponent {
    constructor(private router: Router) { }

    selectRole(role: 'user' | 'vendor'): void {
        this.router.navigate(['/auth/register'], { queryParams: { role } });
    }
}
