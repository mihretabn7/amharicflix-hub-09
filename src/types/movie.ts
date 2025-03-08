
export interface Movie {
  id: string;
  title: string;
  description?: string;
  thumbnail_url: string;
  video_url?: string;
  is_hidden?: boolean;
  created_at?: string;
  updated_at?: string;
  genre?: string;
  duration_minutes?: number;
  language?: string;
  release_year?: number;
  director?: string;
  watch_count?: number;
  series_id?: string;
  episode_number?: number;
  featured?: boolean;
  averageRating?: number;
  movie_ratings?: any[];
}
