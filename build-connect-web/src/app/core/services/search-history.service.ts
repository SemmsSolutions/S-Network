import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SearchHistoryService {
    private readonly KEY = 'buildconnect_search_history';

    getHistory(): string[] {
        const raw = localStorage.getItem(this.KEY);
        return raw ? JSON.parse(raw) : [];
    }

    addTerms(term: string) {
        if (!term || term.trim().length === 0) return;
        let history = this.getHistory();
        history = history.filter(t => t.toLowerCase() !== term.toLowerCase());
        history.unshift(term.trim());
        if (history.length > 10) history = history.slice(0, 10);
        localStorage.setItem(this.KEY, JSON.stringify(history));
    }

    clearHistory() {
        localStorage.removeItem(this.KEY);
    }
}
