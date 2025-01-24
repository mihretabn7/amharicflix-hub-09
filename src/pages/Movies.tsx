import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/types/movie";

const Movies = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const { data, error } = await supabase
          .from('movies')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMovies(data || []);
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Movies</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {movies.map((movie) => (

          <Link 
          to={`/movie/${movie.id}`} 
          key={movie.id} 
          className="movie-card group animate-fade-in"
        >
          <div className="aspect-[2/3] bg-card rounded-md overflow-hidden relative">
            <img
              src={movie.thumbnail_url}
              alt={movie.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="movie-card-overlay">
              <div className="absolute bottom-0 p-4 w-full">
                <h3 className="text-sm font-medium mb-2 line-clamp-2">{movie.title}</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-netflix-gold" />
                    <span className="text-sm">
                      {movie.averageRating ? movie.averageRating.toFixed(1) : 'No ratings'}
                    </span>
                  </div>
                  <MessageSquare className="h-4 w-4 text-netflix-gray" />
                </div>
              </div>
            </div>
          </div>
        </Link>
        ))}
      </div>
    </div>
  );
};

export default Movies;