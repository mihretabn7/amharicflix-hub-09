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
import { Card, CardContent } from "@/components/ui/card";

const Home = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    genre: 'all',
    language: 'all',
    rating: 'all'
  });
  const [session, setSession] = useState<any>(null);

  // Fetch available filters
  const { data: filterOptions } = useQuery({
    queryKey: ['filter-options'],
    queryFn: async () => {
      const [genresResponse, languagesResponse] = await Promise.all([
        supabase.from("movies").select("genre").not("genre", "is", null),
        supabase.from("movies").select("language").not("language", "is", null)
      ]);

      const uniqueGenres = [...new Set(genresResponse.data?.map(m => m.genre))];
      const uniqueLanguages = [...new Set(languagesResponse.data?.map(m => m.language))];

      return {
        genres: uniqueGenres,
        languages: uniqueLanguages
      };
    }
  });

  const { data: movies, isLoading } = useQuery({
    queryKey: ['movies', filters],
    queryFn: async () => {
      let query = supabase
        .from('movies')
        .select(`
          *,
          movie_ratings(rating)
        `)
        .eq('is_hidden', false);

      if (filters.genre !== 'all') {
        query = query.eq('genre', filters.genre);
      }
      if (filters.language !== 'all') {
        query = query.eq('language', filters.language);
      }

      const { data: moviesData, error } = await query;

      if (error) throw error;

      // Calculate average ratings
      const processedMovies = moviesData?.map(movie => {
        const ratings = movie.movie_ratings || [];
        const averageRating = ratings.length > 0
          ? ratings.reduce((acc: number, curr: any) => acc + curr.rating, 0) / ratings.length
          : 0;

        return {
          ...movie,
          averageRating,
          hasRatings: ratings.length > 0
        };
      });

      // Filter by rating if needed
      if (filters.rating !== 'all') {
        const minRating = parseInt(filters.rating);
        return processedMovies.filter(movie => movie.hasRatings && movie.averageRating >= minRating);
      }

      return processedMovies;
    },
  });

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

  if (isLoading) {
    return (
      <div className="min-h-screen pt-16">
        <div className="container mx-auto px-4">
          <div className="h-[70vh] w-full relative overflow-hidden rounded-xl bg-card animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="h-8 w-48" />
            </div>
          </div>
          <div className="mt-12">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <Skeleton key={i} className="aspect-[2/3] rounded-md" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const featuredMovie = movies && movies.length > 0 ? movies[0] : null;

  return (
    <div className="min-h-screen">
      {featuredMovie && (
        <div className="relative h-[80vh] w-full">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-300 hover:scale-105"
            style={{
              backgroundImage: `url(${featuredMovie.thumbnail_url})`
            }}
          >
            <div className="hero-gradient" />
          </div>

          <div className="relative h-full flex items-center">
            <div className="container mx-auto px-4 animate-fade-in">
              <h1 className="font-display text-5xl md:text-7xl font-bold mb-4 max-w-2xl">
                {featuredMovie.title}
              </h1>
              <div className="flex space-x-4">
                <Button
                  size="lg"
                  className="bg-netflix-red hover:bg-netflix-red/90 transition-colors duration-300"
                  onClick={() => navigate(`/movie/${featuredMovie.id}`)}
                >
                  <Play className="mr-2 h-5 w-5" /> Play Now
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="backdrop-blur-sm bg-black/20 hover:bg-black/40 transition-colors duration-300"
                  onClick={() => navigate(`/movie/${featuredMovie.id}`)}
                >
                  <Info className="mr-2 h-5 w-5" /> More Info
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="py-12 bg-gradient-to-b from-background/80 to-background">
        <Card className="container mx-auto px-4">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-display font-bold">Featured Movies</h2>

              <div className="flex flex-wrap gap-4">
                <Select
                  value={filters.genre}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, genre: value }))}
                >
                  <SelectTrigger className="w-[140px] bg-card border-netflix-gray/20">
                    <SelectValue placeholder="Genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    {filterOptions?.genres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.language}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, language: value }))}
                >
                  <SelectTrigger className="w-[140px] bg-card border-netflix-gray/20">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    {filterOptions?.languages.map((language) => (
                      <SelectItem key={language} value={language}>
                        {language}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.rating}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, rating: value }))}
                >
                  <SelectTrigger className="w-[140px] bg-card border-netflix-gray/20">
                    <SelectValue placeholder="Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="4">4+ Stars</SelectItem>
                    <SelectItem value="3">3+ Stars</SelectItem>
                    <SelectItem value="2">2+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {movies?.map((movie) => (
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
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Home;