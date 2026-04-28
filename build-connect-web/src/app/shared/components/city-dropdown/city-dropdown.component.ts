import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CityService } from '../../../core/services/city.service';

@Component({
    selector: 'app-city-dropdown',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="city-dropdown-wrapper relative" (click)="preventClose($event)">
      <button class="city-btn flex items-center gap-[6px] bg-white/10 hover:bg-white/20 border border-white/25 text-white px-3.5 py-2 rounded-md cursor-pointer text-[13px] whitespace-nowrap transition" (click)="toggleDropdown($event)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          <circle cx="12" cy="9" r="2.5"/>
        </svg>
        {{ selectedCity || 'Select City' }}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      <div class="city-panel absolute top-[calc(100%+6px)] left-0 w-[280px] bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] border border-[#E2E6F0] z-[3000] overflow-hidden" *ngIf="isOpen">
        <div class="city-search-wrap p-3 border-b border-[#E2E6F0]">
          <input
            type="text"
            [(ngModel)]="citySearch"
            placeholder="Search city..."
            class="city-search-input w-full px-3 py-2 border-[1.5px] border-[#E2E6F0] rounded-md text-[13px] focus:outline-none focus:border-[#CC0000] text-black"
            (input)="filterCities()"
            #cityInput
          >
        </div>

        <div class="city-detect flex items-center gap-2 px-4 py-2.5 cursor-pointer text-[#CC0000] text-[13px] font-medium border-b border-[#E2E6F0] hover:bg-[#FFF5F5]" (click)="detectCity()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          </svg>
          Detect my location
        </div>

        <div class="city-section-title px-4 pt-2 font-bold text-[11px] uppercase tracking-wider text-[#7B8299]">Popular Cities</div>
        <div class="city-list flex flex-wrap gap-1.5 p-3 max-h-[240px] overflow-y-auto">
          <button
            *ngFor="let city of filteredCities"
            class="city-option bg-[#F7F8FC] border border-[#E2E6F0] rounded-md px-3 py-[5px] text-[12px] cursor-pointer text-[#444B5D] transition hover:bg-[#FEE2E2] hover:border-[#CC0000] hover:text-[#CC0000]"
            [style.background]="city === selectedCity ? '#CC0000' : ''"
            [style.color]="city === selectedCity ? 'white' : ''"
            (click)="selectCity(city)"
          >
            {{ city }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class CityDropdownComponent implements OnInit {
    @Input() selectedCity = '';
    @Output() cityChanged = new EventEmitter<string>();

    isOpen = false;
    citySearch = '';

    allCities = [
        'Chennai', 'Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Pune',
        'Kolkata', 'Ahmedabad', 'Coimbatore', 'Surat', 'Jaipur', 'Lucknow',
        'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam',
        'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana',
        'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali',
        'Vasai-Virar', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad'
    ];

    filteredCities = [...this.allCities];

    constructor(private cityService: CityService) { }

    ngOnInit(): void {
        if (!this.selectedCity) {
            this.selectedCity = this.cityService.currentCity || '';
        }

        // Close dropdown on outside clicks
        document.addEventListener('click', this.onDocumentClick.bind(this));
    }

    ngOnDestroy() {
        document.removeEventListener('click', this.onDocumentClick.bind(this));
    }

    toggleDropdown(event: Event) {
        event.stopPropagation();
        this.isOpen = !this.isOpen;
    }

    preventClose(event: Event) {
        event.stopPropagation();
    }

    onDocumentClick() {
        this.isOpen = false;
    }

    filterCities(): void {
        const q = this.citySearch.toLowerCase();
        this.filteredCities = this.allCities.filter(c => c.toLowerCase().includes(q));
    }

    selectCity(city: string): void {
        this.selectedCity = city;
        this.cityChanged.emit(city);
        this.cityService.setCity(city);
        this.isOpen = false;
        this.citySearch = '';
        this.filteredCities = [...this.allCities];
    }

    detectCity(): void {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const resp = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
                    );
                    const data = await resp.json();
                    const city = data.address?.city ?? data.address?.town ?? data.address?.county ?? '';
                    if (city) this.selectCity(city);
                } catch {
                    console.warn('Reverse geocode failed');
                }
            },
            () => console.warn('Location permission denied')
        );
    }
}
