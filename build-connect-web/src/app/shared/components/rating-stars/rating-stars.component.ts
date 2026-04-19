import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-rating-stars',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="flex text-warning text-sm">
      <span *ngFor="let star of stars; let i = index">
        <span [class.opacity-30]="i >= rating">★</span>
      </span>
    </div>
  `
})
export class RatingStarsComponent {
    @Input() rating: number = 0;
    stars = [1, 2, 3, 4, 5];
}
