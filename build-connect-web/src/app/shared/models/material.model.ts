export interface MaterialGroup {
    id: string;
    name: string;
    icon: string | null;
    sort_order: number;
}

export interface MaterialItem {
    id: string;
    group_id: string;
    name: string;
    description: string | null;
    sort_order: number;
}

export interface BusinessMaterial {
    id: string;
    business_id: string;
    material_item_id: string;
    custom_description: string | null;
    material_items?: MaterialItem;
}
