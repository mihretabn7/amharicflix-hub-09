import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/types/movie";
import { Link } from "react-router-dom";
import { Star, TrendingUp, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import useIsMobile from "@/hooks/use-mobile";

const Categories = () => {
  const isMobile = useIsMobile();

  const { data: movies, isLoading } = useQuery({
    queryKey: ['movies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movies')
        .select('*, movie_ratings(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const processedMovies = data.map(movie => ({
        ...movie,
        averageRating: movie.movie_ratings.length > 0
          ? movie.movie_ratings.reduce((acc: number, curr: any) => acc + curr.rating, 0) / movie.movie_ratings.length
          : 0
      }));

      return processedMovies as Movie[];
    },
  });

  // Organize movies by category
  const newMovies = movies?.slice(0, 20) || [];
  
  const trendingMovies = movies
    ?.filter(movie => (movie.watch_count || 0) + (movie.share_count || 0) > 10)
    .sort((a, b) => 
      ((b.watch_count || 0) + (b.share_count || 0)) - 
      ((a.watch_count || 0) + (a.share_count || 0))
    ) || [];

  const moviesByGenre = movies?.reduce((acc: Record<string, Movie[]>, movie) => {
    if (movie.genre) {
      if (!acc[movie.genre]) {
        acc[movie.genre] = [];
      }
      acc[movie.genre].push(movie);
    }
    return acc;
  }, {}) || {};

  // Sort genres by total engagement
  const sortedGenres = Object.entries(moviesByGenre)
    .sort(([, moviesA], [, moviesB]) => {
      const engagementA = moviesA.reduce((sum, movie) => 
        sum + (movie.watch_count || 0) + (movie.share_count || 0), 0
      );
      const engagementB = moviesB.reduce((sum, movie) => 
        sum + (movie.watch_count || 0) + (movie.share_count || 0), 0
      );
      return engagementB - engagementA;
    });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-netflix-dark pt-24">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl font-bold mb-8">Categories</h1>
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <Skeleton key={j} className="aspect-[2/3]" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Helper: category card content for mobile/desktop (keeps style in sync with Home)
  const renderMovieCard = (movie: Movie) => (
    <Link to={`/movie/${movie.id}`} key={movie.id}>
      <div className="movie-card group">
        <img
          src={movie.thumbnail_url}
          alt={movie.title}
          className="w-full aspect-[2/3] object-cover rounded-md"
        />
        {isMobile ? (
          <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/90 to-transparent p-2">
            <h3 className="text-sm font-medium line-clamp-2 text-white">{movie.title}</h3>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-netflix-gold" />
                <span className="text-xs text-white">
                  {movie.duration_minutes ? `${movie.duration_minutes} min` : '-'}
                </span>
              </div>
              <MessageSquare className="h-3 w-3 text-white/80" />
            </div>
          </div>
        ) : (
          <div className="movie-card-overlay">
            <div className="absolute bottom-0 p-4 w-full">
              <h3 className="font-semibold text-sm mb-1 line-clamp-2">{movie.title}</h3>
              <div className="flex items-center gap-2 text-netflix-gold">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm">
                  {movie.duration_minutes ? `${movie.duration_minutes} min` : '-'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-netflix-dark pt-24">
      <div className="container mx-auto px-6">
        <h1 className="text-3xl font-bold mb-8">Categories</h1>
        <div className="space-y-12">
          {/* New Releases Section */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">New Releases</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {newMovies.map((movie) => renderMovieCard(movie))}
            </div>
          </div>

          {/* Trending Section */}
          {trendingMovies.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-6 h-6 text-netflix-red" />
                <h2 className="text-2xl font-semibold">Trending Now</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {trendingMovies.map((movie) => renderMovieCard(movie))}
              </div>
            </div>
          )}

          {/* Genre Sections */}
          {sortedGenres.map(([genre, movies]) => (
            <div key={genre}>
              <h2 className="text-2xl font-semibold mb-6">{genre}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {movies.map((movie) => renderMovieCard(movie))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Categories;
