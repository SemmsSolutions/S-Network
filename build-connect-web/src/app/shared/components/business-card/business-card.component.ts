import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RatingStarsComponent } from '../rating-stars/rating-stars.component';
import { CompareService } from '../../../core/services/compare.service';

@Component({
  selector: 'app-business-card',
  standalone: true,
  imports: [CommonModule, RouterModule, RatingStarsComponent],
  template: `
    <div class="bg-surface rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-all transform hover:-translate-y-1">
      <div class="h-48 bg-gray-100 relative">
        <div class="absolute inset-0 flex items-center justify-center text-4xl opacity-20" *ngIf="business.categories?.icon">
           {{ business.categories?.icon }}
        </div>
        <div class="absolute top-2 right-2 bg-success text-white text-xs font-bold px-2 py-1 rounded" *ngIf="business.is_verified">
          Verified
        </div>
      </div>
      <div class="p-4">
        <div class="flex justify-between items-start">
          <p class="text-secondary text-sm font-bold uppercase tracking-wider">{{business.categories?.name || business.category?.name || 'Contractor'}}</p>
          <span [class]="isOpenNow() ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'" class="text-xs font-bold px-2 py-1 rounded">{{isOpenNow() ? 'Open' : 'Closed'}}</span>
        </div>
        <h3 class="text-xl font-heading font-bold text-primary mt-1">{{business.name}}</h3>
        <div class="flex items-center justify-between mt-2">
            <div class="flex items-center gap-2">
              <app-rating-stars [rating]="business.avg_rating || business.rating || 0"></app-rating-stars>
              <span class="text-sm text-gray-500">({{(business.reviews ? business.reviews.length : business.total_reviews) || 0}} reviews)</span>
            </div>
            <label class="flex items-center gap-1 text-xs text-gray-500 cursor-pointer font-bold hover:text-primary transition" title="Compare">
               <input type="checkbox" [checked]="isCompared" (change)="toggleCompare($event)" class="rounded text-primary focus:ring-primary"> Compare
            </label>
        </div>
        <p class="text-sm text-gray-600 mt-2 truncate font-body">📍 <span *ngIf="business.distance_km != null" class="font-bold text-primary">{{business.distance_km | number:'1.0-1'}}km - </span>{{business.address || 'Location unavailable'}}, {{business.city}}</p>
        <a [routerLink]="['/business', business.id || business.slug]" class="mt-4 block w-full text-center bg-primary text-white font-bold py-2 rounded-lg hover:bg-opacity-90 transition">
          View Profile
        </a>
      </div>
    </div>
  `
})
export class BusinessCardComponent implements OnInit {
  @Input() business: any;
  isCompared = false;

  constructor(private compareService: CompareService) { }

  ngOnInit() {
    this.compareService.selection$.subscribe(sel => {
      this.isCompared = !!sel.find(s => s.id === this.business.id);
    });
  }

  isOpenNow() {
    const hr = new Date().getHours();
    return hr >= 9 && hr < 18;
  }

  toggleCompare(e: any) {
    if (e.target.checked) {
      this.compareService.toggleCompare({ id: this.business.id, name: this.business.name });
    } else {
      this.compareService.toggleCompare({ id: this.business.id, name: '' });
    }
  }
}
