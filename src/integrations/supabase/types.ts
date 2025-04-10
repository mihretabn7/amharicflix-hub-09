export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_settings: {
        Row: {
          allow_movie_requests: boolean | null
          allow_user_registration: boolean | null
          auto_approve_movies: boolean | null
          auto_block_reported_content: boolean | null
          cache_duration: number | null
          content_moderation_enabled: boolean | null
          default_user_role: string | null
          enable_comments: boolean | null
          enable_ratings: boolean | null
          id: number
          maintenance_mode: boolean | null
          max_daily_uploads: number | null
          max_movies_per_page: number | null
          max_upload_size: number | null
          report_threshold: number | null
          require_email_verification: boolean | null
          updated_at: string | null
        }
        Insert: {
          allow_movie_requests?: boolean | null
          allow_user_registration?: boolean | null
          auto_approve_movies?: boolean | null
          auto_block_reported_content?: boolean | null
          cache_duration?: number | null
          content_moderation_enabled?: boolean | null
          default_user_role?: string | null
          enable_comments?: boolean | null
          enable_ratings?: boolean | null
          id?: number
          maintenance_mode?: boolean | null
          max_daily_uploads?: number | null
          max_movies_per_page?: number | null
          max_upload_size?: number | null
          report_threshold?: number | null
          require_email_verification?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allow_movie_requests?: boolean | null
          allow_user_registration?: boolean | null
          auto_approve_movies?: boolean | null
          auto_block_reported_content?: boolean | null
          cache_duration?: number | null
          content_moderation_enabled?: boolean | null
          default_user_role?: string | null
          enable_comments?: boolean | null
          enable_ratings?: boolean | null
          id?: number
          maintenance_mode?: boolean | null
          max_daily_uploads?: number | null
          max_movies_per_page?: number | null
          max_upload_size?: number | null
          report_threshold?: number | null
          require_email_verification?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      anonymous_views: {
        Row: {
          browser_info: string | null
          country_code: string | null
          device_info: string | null
          id: string
          ip_address: string | null
          movie_id: string | null
          viewed_at: string | null
        }
        Insert: {
          browser_info?: string | null
          country_code?: string | null
          device_info?: string | null
          id?: string
          ip_address?: string | null
          movie_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          browser_info?: string | null
          country_code?: string | null
          device_info?: string | null
          id?: string
          ip_address?: string | null
          movie_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anonymous_views_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      csv_movie_uploads: {
        Row: {
          created_at: string
          error_message: string | null
          filename: string
          id: string
          processed_at: string | null
          status: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          filename: string
          id?: string
          processed_at?: string | null
          status?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          filename?: string
          id?: string
          processed_at?: string | null
          status?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      genre_suggestions: {
        Row: {
          created_at: string
          id: string
          movie_id: string | null
          suggested_genre: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          movie_id?: string | null
          suggested_genre: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          movie_id?: string | null
          suggested_genre?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "genre_suggestions_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "genre_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      movie_ratings: {
        Row: {
          created_at: string
          id: string
          movie_id: string | null
          rating: number | null
          review: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          movie_id?: string | null
          rating?: number | null
          review?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          movie_id?: string | null
          rating?: number | null
          review?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movie_ratings_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movie_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      movie_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          movie_id: string | null
          reason: string
          reporter_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          movie_id?: string | null
          reason: string
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          movie_id?: string | null
          reason?: string
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movie_reports_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movie_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movie_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      movies: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          episode_number: number | null
          genre: string | null
          id: string
          is_hidden: boolean
          language: string | null
          series_id: string | null
          share_count: number | null
          thumbnail_url: string
          title: string
          verified_report_count: number | null
          watch_count: number | null
          youtube_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          episode_number?: number | null
          genre?: string | null
          id?: string
          is_hidden?: boolean
          language?: string | null
          series_id?: string | null
          share_count?: number | null
          thumbnail_url: string
          title: string
          verified_report_count?: number | null
          watch_count?: number | null
          youtube_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          episode_number?: number | null
          genre?: string | null
          id?: string
          is_hidden?: boolean
          language?: string | null
          series_id?: string | null
          share_count?: number | null
          thumbnail_url?: string
          title?: string
          verified_report_count?: number | null
          watch_count?: number | null
          youtube_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movies_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_sent: boolean | null
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_sent?: boolean | null
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_sent?: boolean | null
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          id: string
          is_blocked: boolean | null
          last_sign_in_at: string | null
          phone_number: string
          remember_me: boolean | null
          role: string
          subscription_plan: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id: string
          is_blocked?: boolean | null
          last_sign_in_at?: string | null
          phone_number: string
          remember_me?: boolean | null
          role?: string
          subscription_plan?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_blocked?: boolean | null
          last_sign_in_at?: string | null
          phone_number?: string
          remember_me?: boolean | null
          role?: string
          subscription_plan?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      security_settings: {
        Row: {
          auto_block_suspicious_ips: boolean | null
          content_report_threshold: number | null
          id: number
          max_login_attempts: number | null
          require_phone_verification: boolean | null
          updated_at: string | null
        }
        Insert: {
          auto_block_suspicious_ips?: boolean | null
          content_report_threshold?: number | null
          id: number
          max_login_attempts?: number | null
          require_phone_verification?: boolean | null
          updated_at?: string | null
        }
        Update: {
          auto_block_suspicious_ips?: boolean | null
          content_report_threshold?: number | null
          id?: number
          max_login_attempts?: number | null
          require_phone_verification?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          created_at: string
          id: string
          message: string
          resolved_at: string | null
          severity: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          resolved_at?: string | null
          severity: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          resolved_at?: string | null
          severity?: string
          title?: string
        }
        Relationships: []
      }
      system_errors: {
        Row: {
          created_at: string | null
          error_info: Json | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_info?: Json | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_info?: Json | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_analytics: {
        Row: {
          browser: string | null
          city: string | null
          coordinates: string | null
          country: string | null
          device: string | null
          id: number
          ip: string
          region: string | null
          timestamp: string
          user_status: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          coordinates?: string | null
          country?: string | null
          device?: string | null
          id?: number
          ip: string
          region?: string | null
          timestamp?: string
          user_status?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          coordinates?: string | null
          country?: string | null
          device?: string | null
          id?: number
          ip?: string
          region?: string | null
          timestamp?: string
          user_status?: string | null
        }
        Relationships: []
      }
      user_donations: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          donation_type: string
          id: string
          payment_processor: string | null
          payment_status: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          donation_type: string
          id?: string
          payment_processor?: string | null
          payment_status?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          donation_type?: string
          id?: string
          payment_processor?: string | null
          payment_status?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          admin_response: string | null
          created_at: string
          feedback_text: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          feedback_text: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          feedback_text?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          created_at: string | null
          id: string
          input_method: string | null
          interaction_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          input_method?: string | null
          interaction_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          input_method?: string | null
          interaction_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_movie_history: {
        Row: {
          browser_info: string | null
          country_code: string | null
          created_at: string | null
          device_info: string | null
          id: string
          movie_id: string | null
          rating: number | null
          rating_timestamp: string | null
          report: boolean | null
          report_reason: string | null
          report_timestamp: string | null
          user_id: string | null
          watch_duration: number | null
          watch_position: number | null
          watched_at: string | null
        }
        Insert: {
          browser_info?: string | null
          country_code?: string | null
          created_at?: string | null
          device_info?: string | null
          id?: string
          movie_id?: string | null
          rating?: number | null
          rating_timestamp?: string | null
          report?: boolean | null
          report_reason?: string | null
          report_timestamp?: string | null
          user_id?: string | null
          watch_duration?: number | null
          watch_position?: number | null
          watched_at?: string | null
        }
        Update: {
          browser_info?: string | null
          country_code?: string | null
          created_at?: string | null
          device_info?: string | null
          id?: string
          movie_id?: string | null
          rating?: number | null
          rating_timestamp?: string | null
          report?: boolean | null
          report_reason?: string | null
          report_timestamp?: string | null
          user_id?: string | null
          watch_duration?: number | null
          watch_position?: number | null
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_movie_history_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_movie_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      get_all_donations_with_users: {
        Args: Record<PropertyKey, never>
        Returns: Json[]
      }
      get_all_feedback_with_users: {
        Args: Record<PropertyKey, never>
        Returns: Json[]
      }
      get_anonymous_views_by_period: {
        Args: Record<PropertyKey, never>
        Returns: {
          period: string
          views: number
        }[]
      }
      get_browser_stats: {
        Args: { start_date: string; end_date: string }
        Returns: {
          browser_name: string
          browser_version: string
          total_views: number
          avg_duration: number
        }[]
      }
      get_country: {
        Args: { ip: string }
        Returns: string
      }
      get_country_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          country: string
          country_count: number
        }[]
      }
      get_detailed_device_stats: {
        Args: { start_date: string; end_date: string }
        Returns: {
          os_name: string
          os_version: string
          device_type: string
          total_views: number
          avg_duration: number
        }[]
      }
      get_error_stats: {
        Args: { start_date: string; end_date: string }
        Returns: {
          error_type: string
          error_count: number
          affected_users: number
        }[]
      }
      get_input_method_stats: {
        Args: { start_date: string; end_date: string }
        Returns: {
          input_type: string
          total_uses: number
          unique_users: number
        }[]
      }
      get_movie_analytics: {
        Args: { start_date: string; end_date: string; group_by: string }
        Returns: {
          time_period: string
          total_views: number
          unique_viewers: number
          avg_watch_duration: number
          most_watched_movie: Json
          most_watched_genre: string
          completion_rate: number
        }[]
      }
      get_network_stats: {
        Args: { start_date: string; end_date: string }
        Returns: {
          network_type: string
          avg_bandwidth: number
          total_views: number
          buffering_count: number
        }[]
      }
      get_report_status_values: {
        Args: Record<PropertyKey, never>
        Returns: {
          status_value: string
        }[]
      }
      get_user_activity_stats: {
        Args: { start_date: string; end_date: string }
        Returns: {
          date_period: string
          views_count: number
          ratings_count: number
          reports_count: number
          unique_users: number
        }[]
      }
      get_views_by_country: {
        Args:
          | Record<PropertyKey, never>
          | { start_date?: string; end_date?: string }
        Returns: {
          country_code: string
          total_views: number
          registered_views: number
          anonymous_views: number
        }[]
      }
      getuseractivitystats: {
        Args: { start_date: string; end_date: string }
        Returns: {
          date_period: string
          views_count: number
          ratings_count: number
          reports_count: number
          unique_users: number
          user_ip: string
        }[]
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { uri: string }
          | { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { uri: string } | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { uri: string; content: string; content_type: string }
          | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      increment_movie_share_count: {
        Args: { movie_id: string }
        Returns: undefined
      }
      increment_movie_watch_count: {
        Args: { movie_id: string }
        Returns: undefined
      }
      increment_verified_report_count: {
        Args: { movie_id: string }
        Returns: undefined
      }
      submit_report: {
        Args: { p_movie_id: string; p_reporter_id: string; p_reason: string }
        Returns: undefined
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      track_movie_share: {
        Args: {
          p_movie_id: string
          p_user_id?: string
          p_share_method?: string
          p_user_ip?: string
          p_browser_info?: string
          p_device_info?: string
        }
        Returns: undefined
      }
      track_movie_view: {
        Args: { movie_id: string; user_ip: string }
        Returns: undefined
      }
      track_movie_view_with_country: {
        Args:
          | {
              p_movie_id: string
              p_user_id?: string
              p_user_ip?: string
              p_browser_info?: string
              p_device_info?: string
            }
          | { p_movie_id: string; p_user_id?: string; p_user_ip?: string }
          | {
              p_movie_id: string
              p_user_id?: string
              p_user_ip?: string
              p_browser_info?: string
              p_device_info?: string
              p_country_code?: string
            }
        Returns: undefined
      }
      update_donation_status: {
        Args: {
          donation_id_param: string
          status_param: string
          completed_at_param?: string
        }
        Returns: undefined
      }
      update_feedback_response: {
        Args: {
          feedback_id_param: string
          admin_response_param: string
          status_param?: string
        }
        Returns: undefined
      }
      update_report_status: {
        Args: { report_id: string; new_status: string }
        Returns: undefined
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
    }
    Enums: {
      movie_reports_status: "pending" | "resolved" | "dismissed" | "new_value"
      notification_type:
        | "report"
        | "new_movie"
        | "system_alert"
        | "security_warning"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      movie_reports_status: ["pending", "resolved", "dismissed", "new_value"],
      notification_type: [
        "report",
        "new_movie",
        "system_alert",
        "security_warning",
      ],
    },
  },
} as const
