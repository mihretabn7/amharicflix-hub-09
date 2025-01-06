import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Play } from "lucide-react";
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

  const { data: movies, isLoading, error } = useQuery({
    queryKey: ['movies'],
    queryFn: fetchMovies,
  });

  useEffect(() => {
    const fetchYoutubeMovies = async () => {
      try {
        await supabase.functions.invoke('fetch-ethiopian-movies');
        toast.success('Movies updated successfully');
      } catch (error) {
        console.error('Error fetching movies:', error);
        toast.error('Failed to fetch movies');
      }
    };

    fetchYoutubeMovies();
  }, []);

  if (error) {
    toast.error('Error loading movies');
    return <div>Error loading movies</div>;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8">Ethiopian Movies</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 10 }).map((_, i) => (
              <Card key={i} className="group relative overflow-hidden">
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
                <Card className="group relative overflow-hidden transition-all hover:scale-105">
                  <div className="aspect-[2/3] relative">
                    <img
                      src={movie.thumbnail_url}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1 line-clamp-2">{movie.title}</h3>
                    <p className="text-sm text-gray-500">{movie.genre}</p>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Movies;