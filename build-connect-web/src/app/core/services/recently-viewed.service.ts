import { Injectable } from '@angular/core';

export interface ViewedBusiness {
    id: string;
    name: string;
    category: string;
    image_url: string;
}

@Injectable({ providedIn: 'root' })
export class RecentlyViewedService {
    private readonly KEY = 'buildconnect_recently_viewed';

    getViewed(): ViewedBusiness[] {
        const raw = localStorage.getItem(this.KEY);
        return raw ? JSON.parse(raw) : [];
    }

    addViewed(business: ViewedBusiness) {
        if (!business || !business.id) return;
        let viewed = this.getViewed();
        viewed = viewed.filter(b => b.id !== business.id);
        viewed.unshift(business);
        if (viewed.length > 5) viewed = viewed.slice(0, 5);
        localStorage.setItem(this.KEY, JSON.stringify(viewed));
    }
}
