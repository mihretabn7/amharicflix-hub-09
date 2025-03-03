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
          country_code: string | null
          id: string
          ip_address: string | null
          movie_id: string | null
          viewed_at: string | null
        }
        Insert: {
          country_code?: string | null
          id?: string
          ip_address?: string | null
          movie_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          country_code?: string | null
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
      user_movie_history: {
        Row: {
          country_code: string | null
          created_at: string | null
          id: string
          movie_id: string | null
          user_id: string | null
          watch_duration: number | null
          watch_position: number | null
          watched_at: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          id?: string
          movie_id?: string | null
          user_id?: string | null
          watch_duration?: number | null
          watch_position?: number | null
          watched_at?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          id?: string
          movie_id?: string | null
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
        Args: {
          data: string
        }
        Returns: string
      }
      get_country: {
        Args: {
          ip: string
        }
        Returns: string
      }
      get_report_status_values: {
        Args: Record<PropertyKey, never>
        Returns: {
          status_value: string
        }[]
      }
      get_views_by_country: {
        Args: Record<PropertyKey, never>
        Returns: {
          country_code: string
          total_views: number
          registered_views: number
          anonymous_views: number
        }[]
      }
      http: {
        Args: {
          request: Database["public"]["CompositeTypes"]["http_request"]
        }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete:
        | {
            Args: {
              uri: string
            }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
          }
        | {
            Args: {
              uri: string
              content: string
              content_type: string
            }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
          }
      http_get:
        | {
            Args: {
              uri: string
            }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
          }
        | {
            Args: {
              uri: string
              data: Json
            }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
          }
      http_head: {
        Args: {
          uri: string
        }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: {
          field: string
          value: string
        }
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
        Args: {
          uri: string
          content: string
          content_type: string
        }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post:
        | {
            Args: {
              uri: string
              content: string
              content_type: string
            }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
          }
        | {
            Args: {
              uri: string
              data: Json
            }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
          }
      http_put: {
        Args: {
          uri: string
          content: string
          content_type: string
        }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: {
          curlopt: string
          value: string
        }
        Returns: boolean
      }
      increment_movie_share_count: {
        Args: {
          movie_id: string
        }
        Returns: undefined
      }
      increment_movie_watch_count: {
        Args: {
          movie_id: string
        }
        Returns: undefined
      }
      increment_verified_report_count: {
        Args: {
          movie_id: string
        }
        Returns: undefined
      }
      submit_report: {
        Args: {
          p_movie_id: string
          p_reporter_id: string
          p_reason: string
        }
        Returns: undefined
      }
      text_to_bytea: {
        Args: {
          data: string
        }
        Returns: string
      }
      track_movie_view: {
        Args: {
          movie_id: string
          user_ip: string
        }
        Returns: undefined
      }
      update_report_status: {
        Args: {
          report_id: string
          new_status: string
        }
        Returns: undefined
      }
      urlencode:
        | {
            Args: {
              data: Json
            }
            Returns: string
          }
        | {
            Args: {
              string: string
            }
            Returns: string
          }
        | {
            Args: {
              string: string
            }
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
