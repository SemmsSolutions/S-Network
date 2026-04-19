export interface Business {
    id: string;
    owner_id: string;
    name: string;
    description?: string;
    category_id?: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
    city?: string;
    state?: string;
    location?: any; // Geography point
    rating: number;
    total_reviews: number;
    total_leads: number;
    is_verified: boolean;
    is_premium: boolean;
    is_active: boolean;
    created_at: string;
    // joined relations
    categories?: any;
}
