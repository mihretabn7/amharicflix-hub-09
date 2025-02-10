
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
  is_hidden?: boolean;
  movie_ratings?: MovieRating[];
}

export interface MovieRating {
  rating: number;
  created_at: string;
}

export interface SeriesWithEpisodes extends Movie {
  episodes: Movie[];
  episodeCount: number;
  averageRating: number;
  movie_ratings: MovieRating[];
}
