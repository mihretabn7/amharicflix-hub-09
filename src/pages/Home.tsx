import { useEffect, useState, useRef } from "react";
import { Play, Info, Star, MessageSquare, Search, Filter, TrendingUp, ChevronDown, ChevronUp, Share, Youtube, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { fetchUserLocation, updateUserStatus } from "@/utils/location";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import useIsMobile from "@/hooks/use-mobile";
import { getFirstGenre } from "@/utils/genre";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from "@/components/ui/accordion";

const Home = () => {
  const navigate = useNavigate();
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterLanguage, setFilterLanguage] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"latest" | "rating">("latest");
  const [session, setSession] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [moviesByGenre, setMoviesByGenre] = useState<Record<string, any[]>>({});
  const isMobile = useIsMobile();
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [genreAccordionOpen, setGenreAccordionOpen] = useState(false);
  const [fetching, setFetching] = useState(false);

  const movieCardClass = "min-w-[130px] max-w-[180px] transition-transform duration-300 hover:scale-105 group";
  const movieRowContainer = "flex gap-3 py-1 overflow-x-auto no-scrollbar";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        fetchUserLocation().then(locationData => {
          if (locationData && locationData.ip) {
            updateUserStatus(locationData.ip);
          }
        });
      } else {
        fetchUserLocation();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
      if (session?.user) {
        fetchUserLocation().then(locationData => {
          if (locationData && locationData.ip) {
            updateUserStatus(locationData.ip);
          }
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: movies, isLoading } = useQuery({
    queryKey: ['movies', ratingFilter, filterGenre, filterLanguage, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('movies')
        .select(`* , movie_ratings(rating)`)
        .eq('is_hidden', false);
      if (filterGenre !== "all") {
        query = query.eq('genre', filterGenre);
      }
      if (filterLanguage !== "all") {
        query = query.eq('language', filterLanguage);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const processedMovies = data.map(movie => ({
          ...movie,
          averageRating: movie.movie_ratings.length > 0
            ? movie.movie_ratings.reduce((acc: number, curr: any) => acc + curr.rating, 0) / movie.movie_ratings.length
            : 0
        }));

        const byGenre: Record<string, any[]> = {};
        processedMovies.forEach(movie => {
          if (movie.genre) {
            if (!byGenre[movie.genre]) {
              byGenre[movie.genre] = [];
            }
            byGenre[movie.genre].push(movie);
          }
        });

        Object.keys(byGenre).forEach(genre => {
          byGenre[genre].sort((a, b) => 
            ((b.watch_count || 0) + (b.share_count || 0)) - 
            ((a.watch_count || 0) + (a.share_count || 0))
          );
        });

        setMoviesByGenre(byGenre);
        return processedMovies;
      }
      return [];
    },
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

  useEffect(() => {
    const autoFetch = async () => {
      if (fetching) return;
      if (isLoading || !movies) return;
      if (movies.length > 0) return;

      setFetching(true);
      try {
        toast.info("Fetching movies from YouTube...", { duration: 5000 });
        const { data, error } = await supabase.functions.invoke('fetch-ethiopian-movies');
        if (error) throw error;
        if (data?.success && data.processed > 0) {
          toast.success(`Fetched ${data.processed} movies!`);
          window.location.reload();
        }
      } catch (err: any) {
        console.error("Auto-fetch failed:", err);
      } finally {
        setFetching(false);
      }
    };

    autoFetch();
  }, [movies, isLoading]);

  const handleManualFetch = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-ethiopian-movies');
      if (error) throw error;
      if (data?.success) {
        toast.success(`Fetched ${data.processed} new movies!`);
        window.location.reload();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch");
    } finally {
      setFetching(false);
    }
  };

  const filteredMovies = movies?.filter(movie =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (movie.description?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (movie.genre?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen pt-14">
        <div className="container mx-auto px-4 py-4">
          <div className="h-[50vh] md:h-[70vh] w-full relative overflow-hidden rounded-xl bg-card animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="h-8 w-48" />
            </div>
          </div>
        </div>
        <section className="py-8 md:py-12 bg-gradient-to-b from-background/80 to-background">
          <Card className="container mx-auto px-4">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl md:text-3xl font-display font-bold">Featured Movies</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                {[...Array(12)].map((_, i) => (
                  <Skeleton key={i} className="aspect-[2/3] rounded-md" />
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    );
  }

  const featuredMovies = filteredMovies.slice(0, 5);
  const featuredFilms = filteredMovies.slice(0, 7);
  const trendingMovies = filteredMovies
    .filter(movie => (movie.watch_count || 0) + (movie.share_count || 0) > 10)
    .sort((a, b) => 
      ((b.watch_count || 0) + (b.share_count || 0)) - 
      ((a.watch_count || 0) + (a.share_count || 0))
    )
    .slice(0, 7);

  const newMovies = filteredMovies
    .slice()
    .sort((a, b) => {
      const aTime = new Date(a.created_at || a.updated_at || 0).getTime();
      const bTime = new Date(b.created_at || b.updated_at || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 7);

  const genreSections = Object.entries(moviesByGenre)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 4)
    .map(([genre, movies]) => ({
      genre,
      movies: movies.slice(0, 7),
    }));

  const featuredMovie = featuredMovies[0];

  const handleShare = async (movie: any) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: movie.title,
          text: `Watch ${movie.title} on AmharicFlix`,
          url: `${window.location.origin}/movie/${movie.id}`,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/movie/${movie.id}`);
        toast.success("Link copied to clipboard!");
      } catch (error) {
        toast.error("Failed to copy link");
      }
    }
  };

  // Auto-advance carousel for desktop featured section
  useEffect(() => {
    if (isMobile) return;
    if (!carouselRef.current) return;

    const len = featuredMovies.length;
    if (len <= 1) return;

    let mounted = true;
    const interval = setInterval(() => {
      if (!mounted) return;
      if (carouselPaused) return;
      setCarouselIndex((prev) => (prev + 1) % len);
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [featuredMovies, isMobile, carouselPaused]);

  // Scroll carousel when index changes
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const idx = carouselIndex;
    const width = el.clientWidth;
    try {
      el.scrollTo({ left: width * idx, behavior: 'smooth' });
    } catch (err) {
      // fallback
      el.scrollLeft = width * idx;
    }
  }, [carouselIndex]);

  return (
    <div className={`min-h-screen ${isMobile ? 'pt-14 pb-20' : 'pt-16'} bg-background`}>
      {isMobile && featuredMovie && (
        <section className="relative">
          <div className="relative h-[75vh] w-full overflow-hidden">
            <img
              src={featuredMovie.thumbnail_url}
              alt={featuredMovie.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-8">
              <h1 className="text-white text-2xl font-bold mb-4 line-clamp-2">
                {featuredMovie.title}
              </h1>
              <div className="flex gap-3 mb-6">
                <Button
                  size="lg"
                  className="flex-1 bg-white text-black hover:bg-gray-200 font-semibold"
                  onClick={() => navigate(`/movie/${featuredMovie.id}`)}
                >
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  Play
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 border-gray-400 text-white hover:bg-white/10"
                  onClick={() => handleShare(featuredMovie)}
                >
                  <Share className="mr-2 h-5 w-5" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {!isMobile && (
        <section className="relative mb-8">
          <div className="w-full overflow-hidden">
            {filteredMovies.length > 0 ? (
              <div
                ref={carouselRef}
                onMouseEnter={() => setCarouselPaused(true)}
                onMouseLeave={() => setCarouselPaused(false)}
                className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
              >
                {featuredMovies.map((movie) => (
                  <div key={movie.id} className="relative group h-[70vh] w-full shrink-0 snap-center overflow-hidden">
                    <img
                      src={movie.thumbnail_url}
                      alt={movie.title}
                      className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    <div className="absolute inset-x-0 bottom-0 px-8 pb-8 opacity-0 translate-y-6 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out">
                      <div className="rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 p-6 max-w-2xl mx-auto">
                        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-white/90 tracking-tight leading-tight">
                          {movie.title}
                        </h1>
                        <div className="mt-5 flex flex-wrap gap-3">
                          <Button
                            size="lg"
                            className="bg-netflix-red hover:bg-netflix-red/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                            onClick={() => navigate(`/movie/${movie.id}`)}
                          >
                            <Play className="mr-2 h-5 w-5" /> Play Now
                          </Button>
                          <Button
                            size="lg"
                            variant="outline"
                            className="backdrop-blur-sm bg-white/10 border-white/30 text-white hover:bg-white/20 transition-all duration-300"
                            onClick={() => handleShare(movie)}
                          >
                            <Share className="mr-2 h-5 w-5" /> Share
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-center items-center h-[50vh] bg-gradient-to-b from-muted/20 to-background">
                <div className="text-center">
                  <p className="text-xl text-muted-foreground mb-4">No movies found matching your search.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchQuery("")}
                    className="hover:bg-primary hover:text-primary-foreground"
                  >
                    Clear Search
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {!isMobile && (
        <section className="py-6 bg-background/80 backdrop-blur-sm border-y border-border/10">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex flex-col gap-4">
              <div className="flex gap-3 items-center w-full">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search movies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full border-border/20 bg-background/50 backdrop-blur-sm"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 border-red-300 text-red-600 hover:bg-red-50"
                  onClick={handleManualFetch}
                  disabled={fetching}
                  title="Fetch new movies from YouTube"
                >
                  {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Youtube className="h-4 w-4" />}
                </Button>
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
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4 gap-4">
            <h2 className="text-xl font-bold text-foreground">Featured Films</h2>
            <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate('/movies')}>
              See more
            </Button>
          </div>
          <ScrollArea className="w-full">
            <div className="flex gap-3 py-1">
              {featuredFilms.map((movie) => (
                <Link
                  to={`/movie/${movie.id}`}
                  key={movie.id}
                  className={movieCardClass}
                >
                  <div className="relative rounded-lg overflow-hidden bg-card shadow-md hover:shadow-lg transition-all duration-300">
                    <img
                      src={movie.thumbnail_url}
                      alt={movie.title}
                      className="w-full aspect-[2/3] object-cover"
                    />
                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-2">
                      <h3 className="text-xs font-medium line-clamp-2 text-white">{movie.title}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 text-netflix-gold" />
                        <span className="text-xs text-white">
                          {movie.averageRating !== undefined ? movie.averageRating.toFixed(1) : movie.duration_minutes ? `${movie.duration_minutes} min` : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <ScrollBar className="opacity-0 h-1" orientation="horizontal" />
          </ScrollArea>
        </div>
      </section>

      <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4 gap-4">
            <h2 className="text-xl font-bold text-foreground">New Releases</h2>
            <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate('/movies')}>
              See more
            </Button>
          </div>
          <ScrollArea className="w-full">
            <div className="flex gap-3 py-1">
              {newMovies.map((movie) => (
                <Link
                  to={`/movie/${movie.id}`}
                  key={movie.id}
                  className={movieCardClass}
                >
                  <div className="relative rounded-lg overflow-hidden bg-card shadow-md hover:shadow-lg transition-all duration-300">
                    <img
                      src={movie.thumbnail_url}
                      alt={movie.title}
                      className="w-full aspect-[2/3] object-cover"
                    />
                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-2">
                      <h3 className="text-xs font-medium line-clamp-2 text-white">{movie.title}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 text-netflix-gold" />
                        <span className="text-xs text-white">
                          {movie.averageRating !== undefined ? movie.averageRating.toFixed(1) : movie.duration_minutes ? `${movie.duration_minutes} min` : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <ScrollBar className="opacity-0 h-1" orientation="horizontal" />
          </ScrollArea>
        </div>
      </section>

      {genreSections.map((section) => (
        <section className="py-6" key={section.genre}>
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-4 gap-4">
              <h2 className="text-xl font-bold text-foreground">{section.genre}</h2>
              <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate('/movies')}>
                See more
              </Button>
            </div>
            <ScrollArea className="w-full">
              <div className="flex gap-3 py-1">
                {section.movies.map((movie) => (
                  <Link
                    to={`/movie/${movie.id}`}
                    key={movie.id}
                    className={movieCardClass}
                  >
                    <div className="relative rounded-lg overflow-hidden bg-card shadow-md transition-transform duration-300 transform group-hover:shadow-xl group-hover:-translate-y-1">
                      <img
                        src={movie.thumbnail_url}
                        alt={movie.title}
                        className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-2">
                        <h3 className="text-xs font-medium line-clamp-2 text-white">{movie.title}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 text-netflix-gold" />
                          <span className="text-xs text-white">
                            {movie.averageRating !== undefined ? movie.averageRating.toFixed(1) : movie.duration_minutes ? `${movie.duration_minutes} min` : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <ScrollBar className="opacity-0 h-1" orientation="horizontal" />
            </ScrollArea>
          </div>
        </section>
      ))}

      <section className="py-6">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold mb-4 text-foreground">Trending Now</h2>
          
          <ScrollArea className="w-full">
            <div className="flex gap-3 py-1">
              {trendingMovies.map((movie) => (
                <Link
                  to={`/movie/${movie.id}`}
                  key={movie.id}
                  className={movieCardClass}
                >
                  <div className="relative rounded-lg overflow-hidden bg-card shadow-md hover:shadow-lg transition-all duration-300">
                    <img
                      src={movie.thumbnail_url}
                      alt={movie.title}
                      className="w-full aspect-[2/3] object-cover"
                    />
                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-2">
                      <h3 className="text-xs font-medium line-clamp-2 text-white">{movie.title}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 text-netflix-gold" />
                        <span className="text-xs text-white">
                          {movie.averageRating !== undefined ? movie.averageRating.toFixed(1) : movie.duration_minutes ? `${movie.duration_minutes} min` : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <ScrollBar className="opacity-0 h-1" orientation="horizontal" />
          </ScrollArea>
        </div>
      </section>
    </div>
  );
};

export default Home;