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
  }
  Relationships: []
}