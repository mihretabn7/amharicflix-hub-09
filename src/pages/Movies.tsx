import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/types/movie";
import { Star, MessageSquare, Search, Filter, Youtube, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import useIsMobile from "@/hooks/use-mobile";
import MovieRow from "@/components/movie/MovieRow";
import { getFirstGenre } from "@/utils/genre";
import { toast } from "sonner";

const Movies = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [filterLanguage, setFilterLanguage] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"latest" | "rating">("latest");
  const [fetching, setFetching] = useState(false);
  const [autoFetchAttempted, setAutoFetchAttempted] = useState(false);

  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

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
    },
  });

  // Auto-fetch from YouTube when database is empty (first visit)
  useEffect(() => {
    const autoFetch = async () => {
      if (autoFetchAttempted) return;
      if (isLoading || !movies) return;
      if (movies.length > 0) return;

      setAutoFetchAttempted(true);
      setFetching(true);

      try {
        toast.info("Database is empty — fetching movies from YouTube...", { duration: 5000 });

        const { data, error } = await supabase.functions.invoke('fetch-ethiopian-movies');

        if (error) throw error;

        if (data?.success && data.processed > 0) {
          toast.success(`Fetched ${data.processed} movies from YouTube!`);
          queryClient.invalidateQueries({ queryKey: ['movies'] });
        } else if (data?.success) {
          toast.info("No new movies found. Try adding some manually from the admin panel.");
        }
      } catch (err: any) {
        console.error("Auto-fetch failed:", err);
        toast.error("Could not auto-fetch movies. Please use the admin panel.");
      } finally {
        setFetching(false);
      }
    };

    autoFetch();
  }, [movies, isLoading, autoFetchAttempted, queryClient]);

  // Manual refresh handler
  const handleManualFetch = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-ethiopian-movies');

      if (error) {
        let errorMessage = error.message;
        try {
          const errorBody = JSON.parse(error.message);
          errorMessage = errorBody.error || errorBody.message || error.message;
        } catch { /* use original */ }
        throw new Error(errorMessage);
      }

      if (data?.success) {
        toast.success(`Fetched ${data.processed} new movies! (${data.totalUnique} total found)`);
        queryClient.invalidateQueries({ queryKey: ['movies'] });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch from YouTube");
    } finally {
      setFetching(false);
    }
  };

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
    <div className="min-h-screen pt-14">
      {/* Header Section */}
      <section className="py-8 md:py-12 bg-gradient-to-b from-background/95 to-background border-b border-border/10">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
                Discover Movies
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto md:mx-0">
                Explore our extensive collection of Ethiopian and international films
              </p>
            </div>
            
            {/* Search and Filter Section */}
            <div className="flex flex-col gap-4">
              <div className="flex gap-3 items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search movies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 border-border/20 bg-background/50 backdrop-blur-sm"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 border-border/20 bg-background/50 backdrop-blur-sm">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[260px] bg-background/95 backdrop-blur-sm border-border/20">
                    <div className="p-3 space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Genre</label>
                        <Select value={filterGenre} onValueChange={setFilterGenre}>
                          <SelectTrigger className="border-border/20">
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
                        <label className="text-sm font-medium mb-2 block">Language</label>
                        <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                          <SelectTrigger className="border-border/20">
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
                        <label className="text-sm font-medium mb-2 block">Rating</label>
                        <Select value={filterRating} onValueChange={setFilterRating}>
                          <SelectTrigger className="border-border/20">
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
                        <label className="text-sm font-medium mb-2 block">Sort By</label>
                        <Select value={sortBy} onValueChange={(value: "latest" | "rating") => setSortBy(value)}>
                          <SelectTrigger className="border-border/20">
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

                {/* YouTube Fetch Button */}
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 border-red-300 text-red-600 hover:bg-red-50"
                  onClick={handleManualFetch}
                  disabled={fetching}
                  title="Fetch new movies from YouTube"
                >
                  {fetching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Youtube className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Mobile Quick Filters */}
              {isMobile && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hidden">
                  <Select value={filterGenre} onValueChange={setFilterGenre}>
                    <SelectTrigger className="h-8 text-xs min-w-[90px] border-border/20 bg-background/50">
                      <SelectValue placeholder="Genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {filters?.genres.slice(0, 5).map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterRating} onValueChange={setFilterRating}>
                    <SelectTrigger className="h-8 text-xs min-w-[90px] border-border/20 bg-background/50">
                      <SelectValue placeholder="Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="4">4+ ★</SelectItem>
                      <SelectItem value="3">3+ ★</SelectItem>
                      <SelectItem value="2">2+ ★</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={(value: "latest" | "rating") => setSortBy(value)}>
                    <SelectTrigger className="h-8 text-xs min-w-[90px] border-border/20 bg-background/50">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">Latest</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Movies Grid Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          {filteredMovies.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto space-y-4">
                {fetching ? (
                  <>
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-red-500" />
                    <p className="text-xl text-muted-foreground">Fetching movies from YouTube...</p>
                    <p className="text-sm text-muted-foreground">This may take a minute or two.</p>
                  </>
                ) : (
                  <>
                    <p className="text-xl text-muted-foreground">No movies found matching your criteria.</p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        variant="outline"
                        onClick={handleManualFetch}
                        className="hover:bg-primary hover:text-primary-foreground gap-2"
                      >
                        <Youtube className="h-4 w-4" />
                        Fetch from YouTube
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchQuery("");
                          setFilterGenre("all");
                          setFilterRating("all");
                          setFilterLanguage("all");
                        }}
                        className="hover:bg-primary hover:text-primary-foreground"
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredMovies.length} movie{filteredMovies.length !== 1 ? 's' : ''}
                </p>
                <div className="text-sm text-muted-foreground">
                  Sorted by {sortBy === 'latest' ? 'Latest' : 'Rating'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {filteredMovies.map((movie) => (
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
        </div>
      </section>
    </div>
  );
};

export default Movies;
