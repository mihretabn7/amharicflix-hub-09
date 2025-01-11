import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/types/movie";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Star, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Categories = () => {
  const { data: movies, isLoading } = useQuery({
    queryKey: ['movies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Movie[];
    },
  });

  // Separate movies and series based on duration
  const categorizedContent = movies?.reduce((acc: { 
    movies: Movie[], 
    series: Movie[],
    trending: Movie[]
  }, item) => {
    // Add to trending if watch_count + share_count > 10
    if ((item.watch_count || 0) + (item.share_count || 0) > 10) {
      acc.trending.push(item);
    }
    
    // Categorize based on duration
    if (item.duration_minutes >= 60) {
      acc.movies.push(item);
    } else {
      acc.series.push(item);
    }
    
    return acc;
  }, { movies: [], series: [], trending: [] });

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

  return (
    <div className="min-h-screen bg-netflix-dark pt-24">
      <div className="container mx-auto px-6">
        <h1 className="text-3xl font-bold mb-8">Categories</h1>
        <div className="space-y-12">
          {/* Trending Section */}
          {categorizedContent?.trending.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-6 h-6 text-netflix-red" />
                <h2 className="text-2xl font-semibold">Trending Now</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {categorizedContent.trending.map((movie) => (
                  <Link to={`/movie/${movie.id}`} key={movie.id}>
                    <div className="movie-card group">
                      <img
                        src={movie.thumbnail_url}
                        alt={movie.title}
                        className="w-full aspect-[2/3] object-cover rounded-md"
                      />
                      <div className="movie-card-overlay">
                        <div className="absolute bottom-0 p-4 w-full">
                          <h3 className="font-semibold text-sm mb-1 line-clamp-2">{movie.title}</h3>
                          <div className="flex items-center gap-2 text-netflix-gold">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-sm">
                              {movie.watch_count || 0} views
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

          {/* Movies Section */}
          {categorizedContent?.movies.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Movies</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {categorizedContent.movies.map((movie) => (
                  <Link to={`/movie/${movie.id}`} key={movie.id}>
                    <div className="movie-card group">
                      <img
                        src={movie.thumbnail_url}
                        alt={movie.title}
                        className="w-full aspect-[2/3] object-cover rounded-md"
                      />
                      <div className="movie-card-overlay">
                        <div className="absolute bottom-0 p-4 w-full">
                          <h3 className="font-semibold text-sm mb-1 line-clamp-2">{movie.title}</h3>
                          <div className="flex items-center gap-2 text-netflix-gold">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-sm">
                              {movie.duration_minutes} min
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

          {/* Series Section */}
          {categorizedContent?.series.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Series</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {categorizedContent.series.map((movie) => (
                  <Link to={`/movie/${movie.id}`} key={movie.id}>
                    <div className="movie-card group">
                      <img
                        src={movie.thumbnail_url}
                        alt={movie.title}
                        className="w-full aspect-[2/3] object-cover rounded-md"
                      />
                      <div className="movie-card-overlay">
                        <div className="absolute bottom-0 p-4 w-full">
                          <h3 className="font-semibold text-sm mb-1 line-clamp-2">{movie.title}</h3>
                          <div className="flex items-center gap-2 text-netflix-gold">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-sm">
                              {movie.duration_minutes} min
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
        </div>
      </div>
    </div>
  );
};

export default Categories;