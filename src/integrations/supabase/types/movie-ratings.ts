import { Json } from './json';

export interface MovieRatingTable {
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
    }
  ]
}