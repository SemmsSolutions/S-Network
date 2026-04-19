import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CompareBusiness {
    id: string;
    name: string;
}

@Injectable({ providedIn: 'root' })
export class CompareService {
    private selection = new BehaviorSubject<CompareBusiness[]>([]);
    selection$ = this.selection.asObservable();

    get count() {
        return this.selection.value.length;
    }

    toggleCompare(business: CompareBusiness) {
        const current = this.selection.value;
        if (current.find(b => b.id === business.id)) {
            this.selection.next(current.filter(b => b.id !== business.id));
        } else {
            if (current.length >= 3) {
                alert('You can only compare up to 3 businesses.');
                return;
            }
            this.selection.next([...current, business]);
        }
    }

    clear() {
        this.selection.next([]);
    }
}
