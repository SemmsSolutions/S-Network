import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    public client: SupabaseClient;

    constructor() {
        this.client = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
            auth: {
                storage: typeof window !== 'undefined' ? window.localStorage : undefined,
                storageKey: 's-network-auth-token',
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                flowType: 'pkce',
                lock: (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
                    return fn();
                }
            }
        });
    }
}
