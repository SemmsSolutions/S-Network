import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { CityService } from '../../../core/services/city.service';
import { CityDropdownComponent } from '../city-dropdown/city-dropdown.component';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, CityDropdownComponent],
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
    searchQuery = '';
    selectedCity = '';
    showUserMenu = false;
    showNotifications = false;
    notifications: any[] = [];
    unreadCount = 0;
    autocompleteResults: any[] = [];

    constructor(
        public authService: AuthService,
        private supabase: SupabaseService,
        private router: Router,
        private cityService: CityService
    ) { }

    ngOnInit() {
        this.cityService.city$.subscribe(city => {
            this.selectedCity = city;
        });
        if (!this.selectedCity) {
            this.selectedCity = localStorage.getItem('snet_city') || 'Chennai';
        }
        this.loadNotifications();
    }

    get currentUser(): any {
        return this.authService.currentUser;
    }

    onCityChange(city: string): void {
        this.selectedCity = city;
        this.cityService.setCity(city);
    }

    onSearchKeyup(event: any) {
        if (event.key === 'Enter') this.doSearch();
    }

    async onSearchInput() {
        if (this.searchQuery.length < 2) {
            this.autocompleteResults = [];
            return;
        }
        const { data } = await this.supabase.client
            .from('businesses')
            .select('name, city, categories(name)')
            .ilike('name', `%${this.searchQuery}%`)
            .limit(5);

        this.autocompleteResults = (data || []).map((b: any) => ({
            name: b.name,
            category: b.categories?.name,
            city: b.city
        }));
    }

    selectSuggestion(entry: any) {
        this.searchQuery = entry.name;
        this.autocompleteResults = [];
        this.doSearch();
    }

    startVoiceSearch() {
        alert("Voice search coming soon!");
    }

    doSearch() {
        this.autocompleteResults = [];
        if (!this.searchQuery.trim()) return;
        this.router.navigate(['/search'], { queryParams: { q: this.searchQuery, city: this.selectedCity } });
    }

    toggleNotifications() {
        this.showNotifications = !this.showNotifications;
        this.showUserMenu = false;
    }

    toggleUserMenu() {
        this.showUserMenu = !this.showUserMenu;
        this.showNotifications = false;
    }

    goToLogin() {
        this.router.navigate(['/auth/login']);
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.user-avatar-menu')) this.showUserMenu = false;
        if (!target.closest('.nav-bell')) this.showNotifications = false;
    }

    async loadNotifications() {
        const user = this.authService.currentUser;
        if (!user) return;
        const { data } = await this.supabase.client
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);
        this.notifications = data || [];
        this.unreadCount = this.notifications.filter(n => !n.is_read).length;
    }
}
