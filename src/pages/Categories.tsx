import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/types/movie";
import { Link } from "react-router-dom";
import { Star, TrendingUp, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import useIsMobile from "@/hooks/use-mobile";
import MovieRow from "@/components/movie/MovieRow";
import { getFirstGenre } from "@/utils/genre";

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
    <div className="min-h-screen pt-14">
      {/* Header Section */}
      <section className="py-8 md:py-12 bg-gradient-to-b from-background/95 to-background border-b border-border/10">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center md:text-left space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold">
              Browse Categories
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto md:mx-0">
              Explore movies and series organized by genre, popularity, and release date
            </p>
          </div>
        </div>
      </section>

      {/* Categories Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="space-y-16">
            {/* New Releases Section */}
            {newMovies.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold">New Releases</h2>
                  <Link 
                    to="/movies?sort=latest" 
                    className="text-sm md:text-base text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    View All →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {newMovies.slice(0, 12).map((movie) => (
                    <Link
                      to={`/movie/${movie.id}`}
                      key={movie.id}
                      className="group animate-fade-in hover:scale-105 transition-transform duration-300"
                    >
                      <div className="aspect-[2/3] bg-card rounded-lg overflow-hidden relative shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <img
                          src={movie.thumbnail_url}
                          alt={movie.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                          <h3 className="text-sm md:text-base font-semibold line-clamp-2 text-white mb-1">{movie.title}</h3>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-white/90">
                                {movie.averageRating ? movie.averageRating.toFixed(1) : 'New'}
                              </span>
                            </div>
                            {movie.genre && (
                              <span className="text-xs text-white/70 bg-black/30 px-2 py-0.5 rounded">
                                {getFirstGenre(movie.genre)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Section */}
            {trendingMovies.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-netflix-red" />
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold">Trending Now</h2>
                  </div>
                  <Link 
                    to="/movies?sort=trending" 
                    className="text-sm md:text-base text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    View All →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {trendingMovies.slice(0, 12).map((movie) => (
                    <Link
                      to={`/movie/${movie.id}`}
                      key={movie.id}
                      className="group animate-fade-in hover:scale-105 transition-transform duration-300"
                    >
                      <div className="aspect-[2/3] bg-card rounded-lg overflow-hidden relative shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <img
                          src={movie.thumbnail_url}
                          alt={movie.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                          <h3 className="text-sm md:text-base font-semibold line-clamp-2 text-white mb-1">{movie.title}</h3>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-white/90">
                                {movie.averageRating ? movie.averageRating.toFixed(1) : 'Hot'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-netflix-red" />
                              <span className="text-xs text-white/70">
                                {(movie.watch_count || 0) + (movie.share_count || 0)} views
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Genre Sections */}
            {sortedGenres.map(([genre, movies]) => (
              <div key={genre} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold">{genre}</h2>
                  <Link 
                    to={`/movies?genre=${encodeURIComponent(genre)}`} 
                    className="text-sm md:text-base text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    View All →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {movies.slice(0, 12).map((movie) => (
                    <Link
                      to={`/movie/${movie.id}`}
                      key={movie.id}
                      className="group animate-fade-in hover:scale-105 transition-transform duration-300"
                    >
                      <div className="aspect-[2/3] bg-card rounded-lg overflow-hidden relative shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <img
                          src={movie.thumbnail_url}
                          alt={movie.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                          <h3 className="text-sm md:text-base font-semibold line-clamp-2 text-white mb-1">{movie.title}</h3>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-white/90">
                                {movie.averageRating ? movie.averageRating.toFixed(1) : 'New'}
                              </span>
                            </div>
                            <span className="text-xs text-white/70 bg-black/30 px-2 py-0.5 rounded">
                              {movie.language || 'Amharic'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Categories;
