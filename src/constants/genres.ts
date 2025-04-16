
export const MOVIE_GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Biography',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'Historical',
  'Horror',
  'Musical',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Sport',
  'Thriller',
  'War',
  'Western',
  // Ethiopian/African specific genres
  'Ethiopian Drama',
  'Amharic Comedy',
  'Cultural',
  'Modern Ethiopian',
  'Traditional',
] as const;

export type MovieGenre = typeof MOVIE_GENRES[number];
