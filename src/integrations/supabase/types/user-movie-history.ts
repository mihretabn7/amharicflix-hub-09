
import { Json } from './json';

export interface UserMovieHistoryTable {
  Row: {
    id: string
    movie_id: string | null
    user_id: string | null
    watch_duration: number | null
    watched_at: string
  }
  Insert: {
    id?: string
    movie_id?: string | null
    user_id?: string | null
    watch_duration?: number | null
    watched_at?: string
  }
  Update: {
    id?: string
    movie_id?: string | null
    user_id?: string | null
    watch_duration?: number | null
    watched_at?: string
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
    }
  ]
}
