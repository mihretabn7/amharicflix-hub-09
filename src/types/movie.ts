export interface Movie {
  id: string;
  youtube_id: string;
  title: string;
  thumbnail_url: string;
  genre?: string;
  language?: string;
  created_at: string;
  description?: string;
}