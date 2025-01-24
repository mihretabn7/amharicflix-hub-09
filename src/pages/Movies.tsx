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
            key={movie.id}
            className="movie-card group animate-fade-in"
            to={`/movie/${movie.id}`}
            className="block hover:opacity-75 transition-opacity"
          >
            <div className="relative aspect-video rounded-lg overflow-hidden">
              <img
                src={movie.thumbnail_url}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="mt-2 font-semibold">{movie.title}</h3>
            <p className="text-sm text-gray-500">{movie.genre || 'No genre'}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Movies;