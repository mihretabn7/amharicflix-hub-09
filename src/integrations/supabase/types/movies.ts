import { Json } from './json';

export interface MovieTable {
  Row: {
    created_at: string
    description: string | null
    genre: string | null
    id: string
    language: string | null
    thumbnail_url: string
    title: string
    youtube_id: string
    series_id: string | null
    episode_number: number | null
    duration_minutes: number | null
    watch_count: number | null
    share_count: number | null
    is_hidden: boolean | null
  }
  Insert: {
    created_at?: string
    description?: string | null
    genre?: string | null
    id?: string
    language?: string | null
    thumbnail_url: string
    title: string
    youtube_id: string
    series_id?: string | null
    episode_number?: number | null
    duration_minutes?: number | null
    watch_count?: number | null
    share_count?: number | null
    is_hidden?: boolean | null
  }
  Update: {
    created_at?: string
    description?: string | null
    genre?: string | null
    id?: string
    language?: string | null
    thumbnail_url?: string
    title?: string
    youtube_id?: string
    series_id?: string | null
    episode_number?: number | null
    duration_minutes?: number | null
    watch_count?: number | null
    share_count?: number | null
    is_hidden?: boolean | null
  }
  Relationships: []
}