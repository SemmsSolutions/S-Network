import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CityService {
    private readonly KEY = 'buildconnect_city';
    private citySubject = new BehaviorSubject<string>(localStorage.getItem(this.KEY) || '');
    city$ = this.citySubject.asObservable();

    get currentCity(): string {
        return this.citySubject.value;
    }

    setCity(city: string) {
        localStorage.setItem(this.KEY, city);
        this.citySubject.next(city);
    }
}
