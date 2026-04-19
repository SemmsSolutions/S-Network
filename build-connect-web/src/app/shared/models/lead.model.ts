export interface Lead {
    id: string;
    business_id: string;
    user_id?: string;
    user_name?: string;
    user_phone?: string;
    user_email?: string;
    message?: string;
    budget_min?: number;
    budget_max?: number;
    project_type?: string;
    timeline?: string;
    status: 'new' | 'contacted' | 'converted' | 'lost';
    created_at: string;
}
