import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-verification-badge',
    standalone: true,
    imports: [CommonModule],
    template: `
    <span *ngIf="status === 'verified'"
          [class]="badgeClass"
          [title]="'GST/MSME Verified by S-Network'">
      ✓ Verified
    </span>
  `,
    styles: [`
    .badge-small {
      display: inline-flex; align-items: center; gap: 4px;
      background: #2ECC71; color: white; font-size: 10px; font-weight: 700;
      padding: 2px 8px; border-radius: 12px;
    }
    .badge-medium {
      display: inline-flex; align-items: center; gap: 4px;
      background: #2ECC71; color: white; font-size: 12px; font-weight: 700;
      padding: 4px 12px; border-radius: 16px;
    }
    .badge-large {
      display: inline-flex; align-items: center; gap: 6px;
      background: #2ECC71; color: white; font-size: 14px; font-weight: 700;
      padding: 6px 16px; border-radius: 20px;
    }
  `]
})
export class VerificationBadgeComponent {
    @Input() status: string = 'unverified';
    @Input() size: 'small' | 'medium' | 'large' = 'small';

    get badgeClass(): string {
        return `badge-${this.size}`;
    }
}
