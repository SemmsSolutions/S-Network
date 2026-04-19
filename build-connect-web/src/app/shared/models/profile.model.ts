export interface Profile {
    id: string; // Matches auth.users(id)
    name?: string;
    phone?: string;
    role: 'user' | 'vendor' | 'admin';
    avatar_url?: string;
    created_at: string;
}
