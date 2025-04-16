import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/types/movie";
import { Star, MessageSquare, Search, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";

const Movies = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [filterLanguage, setFilterLanguage] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"latest" | "rating">("latest");
  const isMobile = useIsMobile();

  const { data: movies, isLoading } = useQuery({
    queryKey: ['movies', filterGenre, filterRating, filterLanguage, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('movies')
        .select(`
          *,
          movie_ratings(rating)
        `)
        .eq('is_hidden', false)
        .is('series_id', null);

      if (filterGenre !== "all") {
        query = query.eq('genre', filterGenre);
      }
      if (filterLanguage !== "all") {
        query = query.eq('language', filterLanguage);
      }

      const { data, error } = await query;
      if (error) throw error;

      const processedMovies = data?.map(movie => ({
        ...movie,
        averageRating: movie.movie_ratings.length > 0
          ? movie.movie_ratings.reduce((acc: number, curr: any) => acc + curr.rating, 0) / movie.movie_ratings.length
          : 0
      })) || [];

      // Apply rating filter
      let filteredMovies = processedMovies;
      if (filterRating !== "all") {
        const minRating = parseInt(filterRating);
        filteredMovies = filteredMovies.filter(m => m.averageRating >= minRating);
      }

      // Apply sorting
      if (sortBy === "rating") {
        filteredMovies.sort((a, b) => b.averageRating - a.averageRating);
      } else {
        filteredMovies.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      return filteredMovies;
    }
  });

  const { data: filters } = useQuery({
    queryKey: ['movie-filters'],
    queryFn: async () => {
      const [genresResponse, languagesResponse] = await Promise.all([
        supabase.from('movies').select('genre').not('genre', 'is', null),
        supabase.from('movies').select('language').not('language', 'is', null)
      ]);

      const uniqueGenres = [...new Set(genresResponse.data?.map(m => m.genre))];
      const uniqueLanguages = [...new Set(languagesResponse.data?.map(m => m.language))];

      return {
        genres: uniqueGenres,
        languages: uniqueLanguages
      };
    }
  });

  const filteredMovies = (movies || []).filter(movie =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (movie.description?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (movie.genre?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div className="min-h-screen bg-netflix-dark pt-24 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-netflix-dark pt-24">
      <Card className="container mx-auto px-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">Movies</h1>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <div className="p-2 space-y-2">
                    <div>
                      <label className="text-sm font-medium">Genre</label>
                      <Select value={filterGenre} onValueChange={setFilterGenre}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Genres" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Genres</SelectItem>
                          {filters?.genres.map((genre) => (
                            <SelectItem key={genre} value={genre}>
                              {genre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Language</label>
                      <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Languages" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Languages</SelectItem>
                          {filters?.languages.map((language) => (
                            <SelectItem key={language} value={language}>
                              {language}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Rating</label>
                      <Select value={filterRating} onValueChange={setFilterRating}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Ratings" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Ratings</SelectItem>
                          <SelectItem value="4">4+ Stars</SelectItem>
                          <SelectItem value="3">3+ Stars</SelectItem>
                          <SelectItem value="2">2+ Stars</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Sort By</label>
                      <Select value={sortBy} onValueChange={(value: "latest" | "rating") => setSortBy(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="latest">Latest</SelectItem>
                          <SelectItem value="rating">Rating</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {filteredMovies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No movies found matching your criteria.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredMovies.map((movie) => (
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
                      {isMobile ? (
                        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/90 to-transparent p-2">
                          <h3 className="text-sm font-medium line-clamp-2 text-white">{movie.title}</h3>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-netflix-gold" />
                              <span className="text-xs text-white">
                                {movie.averageRating ? movie.averageRating.toFixed(1) : 'No ratings'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
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
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Movies;
