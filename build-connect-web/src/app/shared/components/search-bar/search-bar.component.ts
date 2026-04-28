import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { SearchHistoryService } from '../../../core/services/search-history.service';
import { CityService } from '../../../core/services/city.service';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative w-full text-left mx-auto">
      <div class="flex flex-col md:flex-row gap-2 bg-white p-2 rounded-xl shadow-lg border border-gray-100">
        
        <!-- Query Input -->
        <div class="relative flex-1 flex items-center">
          <span class="pl-4 text-gray-400">🔍</span>
          <input 
            type="text" 
            [(ngModel)]="query" 
            (ngModelChange)="onQueryChange($event)"
            (focus)="showDropdown = true"
            (keydown.enter)="search()"
            placeholder="What service do you need?" 
            class="w-full p-4 font-body text-gray-800 bg-transparent focus:outline-none placeholder-gray-400"
          >
          <button *ngIf="speechSupported" (click)="startVoiceSearch()" class="p-4 text-gray-400 hover:text-primary transition" title="Voice Search">
            <span [class.animate-pulse]="isListening" [class.text-red-500]="isListening">🎙️</span>
          </button>
        </div>

        <div class="hidden md:block w-px bg-gray-200 my-2"></div>

        <!-- Location Input -->
        <div class="relative w-full md:w-1/3 flex items-center">
          <span class="pl-4 text-gray-400">📍</span>
          <input 
            type="text" 
            [(ngModel)]="city" 
            (ngModelChange)="onCityChange($event)"
            (keydown.enter)="search()"
            placeholder="City or Pincode" 
            class="w-full p-4 font-body text-gray-800 bg-transparent focus:outline-none placeholder-gray-400"
          >
          <button (click)="nearMe()" [disabled]="locating" class="p-4 text-gray-400 hover:text-primary transition disabled:opacity-50" title="Near Me">
            <span [class.animate-pulse]="locating">🎯</span>
          </button>
        </div>

        <button (click)="search()" class="bg-secondary hover:bg-opacity-90 text-white font-bold px-8 py-4 rounded-lg transition tracking-wide shadow-sm">
          Search
        </button>
      </div>

      <!-- Dropdown -->
      <div *ngIf="showDropdown && (suggestions.length > 0 || history.length > 0)" 
           class="absolute top-full left-0 right-0 mt-3 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
        
        <!-- Suggestions -->
        <div *ngIf="query && suggestions.length > 0">
          <div class="px-4 py-3 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">Suggestions</div>
          <ul>
            <li *ngFor="let s of suggestions" (click)="selectSuggestion(s)" class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-3 transition">
              <span class="text-2xl">{{s.icon || '🏢'}}</span>
              <div>
                <div class="font-bold text-gray-800">{{s.name}}</div>
                <div class="text-xs text-gray-500">{{s.type === 'category' ? 'Category' : s.city}}</div>
              </div>
            </li>
          </ul>
        </div>

        <!-- History -->
        <div *ngIf="!query && history.length > 0">
          <div class="px-4 py-3 bg-gray-50 flex justify-between items-center border-b border-gray-100">
            <span class="text-xs font-bold text-gray-500 uppercase tracking-widest">Recent Searches</span>
            <button (click)="clearHistory($event)" class="text-xs text-red-500 hover:underline font-bold uppercase tracking-widest">Clear</button>
          </div>
          <ul>
            <li *ngFor="let h of history" (click)="selectHistory(h)" class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-3 text-gray-700 transition">
              <span class="text-gray-400">🕒</span>
              <span class="font-medium">{{h}}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `
})
export class SearchBarComponent implements OnInit {
  query = '';
  city = '';
  showDropdown = false;

  speechSupported = false;
  isListening = false;
  locating = false;

  history: string[] = [];
  suggestions: any[] = [];
  private querySubject = new Subject<string>();

  constructor(
    private router: Router,
    private supabase: SupabaseService,
    private historyService: SearchHistoryService,
    private cityService: CityService,
    private eRef: ElementRef
  ) {
    this.speechSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

    this.querySubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(q => {
      if (q.length > 1) {
        this.fetchSuggestions(q);
      } else {
        this.suggestions = [];
      }
    });
  }

  ngOnInit() {
    this.history = this.historyService.getHistory();
    this.cityService.city$.subscribe(c => {
      if (!this.city && c) this.city = c;
    });
  }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  onQueryChange(val: string) {
    this.querySubject.next(val);
  }

  onCityChange(val: string) {
    this.cityService.setCity(val);
  }

  async fetchSuggestions(q: string) {
    try {
      // Fetch Businesses
      const { data: bizData } = await this.supabase.client
        .from('businesses')
        .select('id, name, city')
        .ilike('name', `%${q}%`)
        .eq('is_verified', true)
        .eq('is_on_vacation', false)
        .limit(5);

      // Fetch Categories
      const { data: catData } = await this.supabase.client
        .from('categories')
        .select('name, slug, icon_name')
        .ilike('name', `%${q}%`)
        .limit(3);

      const results = [];
      if (catData) results.push(...catData.map((c: any) => ({ ...c, type: 'category', icon: c.icon_name })));
      if (bizData) results.push(...bizData.map((b: any) => ({ ...b, type: 'business' })));

      this.suggestions = results;
    } catch (e) { console.error(e); }
  }

  selectSuggestion(item: any) {
    this.showDropdown = false;
    this.historyService.addTerms(item.name);
    if (item.type === 'category') {
      this.router.navigate(['/search'], { queryParams: { category: item.slug, city: this.city } });
    } else {
      this.router.navigate(['/search'], { queryParams: { q: item.name, city: this.city } });
    }
  }

  selectHistory(term: string) {
    this.query = term;
    this.search();
  }

  clearHistory(e: Event) {
    e.stopPropagation();
    this.historyService.clearHistory();
    this.history = [];
  }

  search() {
    this.showDropdown = false;
    if (this.query) this.historyService.addTerms(this.query);
    this.router.navigate(['/search'], { queryParams: { q: this.query, city: this.city } });
  }

  startVoiceSearch() {
    if (!this.speechSupported) return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRec();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => this.isListening = true;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.query = transcript;
      this.search();
    };
    recognition.onerror = () => this.isListening = false;
    recognition.onend = () => this.isListening = false;

    recognition.start();
  }

  async nearMe() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    this.locating = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.locating = false;
        this.router.navigate(['/search'], {
          queryParams: { lat: position.coords.latitude, lng: position.coords.longitude }
        });
      },
      (error) => {
        this.locating = false;
        alert("Unable to retrieve your location. Please type a city manually.");
      }
    );
  }
}
