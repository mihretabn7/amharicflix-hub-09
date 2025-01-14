import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/types/movie";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
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

  // Group movies by genre
  const moviesByGenre = movies?.reduce((acc: { [key: string]: Movie[] }, movie) => {
    const genre = movie.genre || 'Uncategorized';
    if (!acc[genre]) {
      acc[genre] = [];
    }
    acc[genre].push(movie);
    return acc;
  }, {});

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
          {moviesByGenre && Object.entries(moviesByGenre).map(([genre, genreMovies]) => (
            <div key={genre}>
              <h2 className="text-2xl font-semibold mb-6">{genre}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {genreMovies.map((movie) => (
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
                            <span className="text-sm">New</span>
                          </div>
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
    </div>
  );
};

export default Categories;