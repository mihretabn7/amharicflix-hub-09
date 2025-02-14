declare module '@/types/supabase' {
    interface Database {
        public: {
            Tables: {
                admin_settings: {
                    Row: {
                        id: number;
                        max_movies_per_page: number;
                        allow_movie_requests: boolean;
                        enable_comments: boolean;
                        enable_ratings: boolean;
                        auto_approve_movies: boolean;
                        max_daily_uploads: number;
                        require_email_verification: boolean;
                        allow_user_registration: boolean;
                        default_user_role: string;
                        report_threshold: number;
                        content_moderation_enabled: boolean;
                        auto_block_reported_content: boolean;
                        maintenance_mode: boolean;
                        cache_duration: number;
                        max_upload_size: number;
                        updated_at: string;
                    };
                    Insert: Omit<Row, 'id' | 'updated_at'>;
                    Update: Partial<Omit<Row, 'id' | 'updated_at'>>;
                };
                // ... other tables
            };
        };
    }
} 