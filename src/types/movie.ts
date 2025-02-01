export interface Movie {
  id: string;
  youtube_id: string;
  title: string;
  thumbnail_url: string;
  genre?: string;
  language?: string;
  created_at: string;
  description?: string;
  duration_minutes?: number;
  watch_count?: number;
  share_count?: number;
  series_id?: string | null;
  episode_number?: number | null;
  averageRating?: number;
}