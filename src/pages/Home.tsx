import { useEffect, useState } from "react";
import { Play, Info, Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Home = () => {
  const navigate = useNavigate();
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: movies, isLoading } = useQuery({
    queryKey: ['movies', ratingFilter],
    queryFn: async () => {
      let query = supabase
        .from('movies')
        .select(`
          *,
          movie_ratings(rating)
        `);

      if (ratingFilter !== 'all') {
        const minRating = parseInt(ratingFilter);
        query = query.gte('movie_ratings.rating', minRating);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Calculate average rating for each movie
      return data?.map(movie => ({
        ...movie,
        averageRating: movie.movie_ratings.length > 0
          ? movie.movie_ratings.reduce((acc: number, curr: any) => acc + curr.rating, 0) / movie.movie_ratings.length
          : 0
      }));
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-16">
        <div className="container mx-auto px-4">
          <Skeleton className="h-[70vh] w-full mb-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      {movies && movies.length > 0 && (
        <div className="relative h-[80vh] w-full">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${movies[0].thumbnail_url})`
            }}
          >
            <div className="hero-gradient" />
          </div>
          
          <div className="relative h-full flex items-center">
            <div className="container mx-auto px-4">
              <h1 className="font-display text-5xl md:text-7xl font-bold mb-4 max-w-2xl">
                {movies[0].title}
              </h1>
              <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-xl">
                {movies[0].description}
              </p>
              <div className="flex space-x-4">
                <Button 
                  size="lg" 
                  className="bg-netflix-red hover:bg-netflix-red/90"
                  onClick={() => navigate(`/movie/${movies[0].id}`)}
                >
                  <Play className="mr-2 h-5 w-5" /> Play Now
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate(`/movie/${movies[0].id}`)}
                >
                  <Info className="mr-2 h-5 w-5" /> More Info
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Movies Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Featured Movies</h2>
            <Select
              value={ratingFilter}
              onValueChange={(value) => setRatingFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="3">3+ Stars</SelectItem>
                <SelectItem value="2">2+ Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {movies?.map((movie) => (
              <Link to={`/movie/${movie.id}`} key={movie.id} className="movie-card group">
                <div className="aspect-[2/3] bg-gray-800 rounded-md overflow-hidden relative">
                  <img
                    src={movie.thumbnail_url}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="movie-card-overlay">
                    <div className="absolute bottom-0 p-4">
                      <h3 className="text-sm font-medium mb-1">{movie.title}</h3>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm">
                          {movie.averageRating ? movie.averageRating.toFixed(1) : 'No ratings'}
                        </span>
                        <MessageSquare className="h-4 w-4 ml-2" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;