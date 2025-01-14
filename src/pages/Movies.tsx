import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Play, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const Movies = () => {
  const fetchMovies = async () => {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  };

  const { data: movies, isLoading, error, refetch } = useQuery({
    queryKey: ['movies'],
    queryFn: fetchMovies,
  });

  useEffect(() => {
    const fetchYoutubeMovies = async () => {
      const toastId = toast.loading('Fetching movies from YouTube...');
      
      try {
        const { data, error } = await supabase.functions.invoke('fetch-ethiopian-movies', {
          body: { timestamp: new Date().toISOString() }, // Add timestamp to prevent caching
        });
        
        if (error) {
          console.error('Error invoking function:', error);
          toast.error('Failed to fetch movies: ' + error.message, { id: toastId });
          return;
        }

        console.log('Function response:', data);
        
        if (data.processed === 0) {
          toast.error('No new movies were found. Please try again later.', { id: toastId });
          return;
        }

        await refetch(); // Refresh the movies list
        toast.success(`Successfully fetched ${data.processed} movies`, { id: toastId });
      } catch (error) {
        console.error('Error fetching movies:', error);
        toast.error('Failed to fetch movies. Please try again later.', { id: toastId });
      }
    };

    fetchYoutubeMovies();
  }, [refetch]);

  if (error) {
    toast.error('Error loading movies');
    return <div>Error loading movies</div>;
  }

  return (
    <div className="min-h-screen bg-netflix-dark">
      {/* Hero Section */}
      <div className="relative h-[70vh] w-full mb-8">
        {movies && movies.length > 0 && (
          <>
            <div className="absolute inset-0">
              <img
                src={movies[0].thumbnail_url}
                alt={movies[0].title}
                className="w-full h-full object-cover"
              />
              <div className="hero-gradient" />
            </div>
            <div className="relative container mx-auto h-full flex items-end pb-20">
              <div className="max-w-2xl text-left">
                <h1 className="text-5xl font-bold mb-4 font-display">{movies[0].title}</h1>
                <p className="text-lg mb-6 line-clamp-3">{movies[0].description}</p>
                <Link 
                  to={`/movie/${movies[0].id}`}
                  className="inline-flex items-center gap-2 bg-netflix-red hover:bg-netflix-red/90 text-white px-6 py-3 rounded-md transition-colors"
                >
                  <Play className="w-5 h-5" /> Play Now
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Movies Grid */}
      <div className="container mx-auto px-6">
        <h2 className="text-2xl font-bold mb-6">Ethiopian Movies</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <Card key={i} className="bg-netflix-dark border-netflix-gray">
                <Skeleton className="aspect-[2/3] w-full" />
                <div className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </Card>
            ))
          ) : (
            movies?.map((movie) => (
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Movies;