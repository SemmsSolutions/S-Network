export interface Review {
    id: string;
    business_id: string;
    user_id?: string;
    rating: number; // 1 to 5
    comment?: string;
    created_at: string;
}
