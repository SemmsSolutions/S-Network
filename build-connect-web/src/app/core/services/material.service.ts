import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { MaterialGroup, MaterialItem, BusinessMaterial } from '../../shared/models/material.model';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class MaterialService {
    constructor(private supabase: SupabaseService) { }

    getMaterialGroups(): Observable<MaterialGroup[]> {
        return from(this.supabase.client.from('material_category_groups').select('*').order('sort_order'))
            .pipe(map(res => res.data as MaterialGroup[] || []));
    }

    getMaterialItems(groupId: string): Observable<MaterialItem[]> {
        return from(this.supabase.client.from('material_items').select('*').eq('group_id', groupId).order('sort_order'))
            .pipe(map(res => res.data as MaterialItem[] || []));
    }

    getBusinessMaterials(businessId: string): Observable<BusinessMaterial[]> {
        return from(this.supabase.client.from('business_materials').select('*, material_items(*)').eq('business_id', businessId))
            .pipe(map(res => res.data as BusinessMaterial[] || []));
    }

    async updateBusinessMaterials(businessId: string, selections: { itemId: string, desc: string }[]): Promise<void> {
        // Delete existing
        await this.supabase.client.from('business_materials').delete().eq('business_id', businessId);

        if (selections.length > 0) {
            // Insert new
            const insterts = selections.map(s => ({
                business_id: businessId,
                material_item_id: s.itemId,
                custom_description: s.desc
            }));
            await this.supabase.client.from('business_materials').insert(insterts);
        }
    }
}
