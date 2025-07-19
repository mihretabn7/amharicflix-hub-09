import { useEffect, useState } from "react";
import { Play, Info, Star, MessageSquare, Search, Filter, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
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
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { fetchUserLocation, updateUserStatus } from "@/utils/location";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [moviesByGenre, setMoviesByGenre] = useState<Record<string, typeof movies>>({});
  const isMobile = useIsMobile();
  const [genreAccordionOpen, setGenreAccordionOpen] = useState(false);

  const movieRowContainer = "flex gap-3 md:gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-netflix-red scrollbar-track-netflix-dark pb-2 -mx-2 px-2";
  const movieCardWidth = "min-w-[150px] sm:min-w-[200px] md:min-w-[220px] lg:min-w-[240px]";

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
        .select(`
          *,
          movie_ratings(rating)
        `)
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

        const byGenre: Record<string, typeof processedMovies> = {};
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

  const settings = {
    dots: true,
    infinite: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    className: "center",
    centerMode: true,
    centerPadding: "0px",
    arrows: !isMobile,
    variableWidth: false,
    fade: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          arrows: false,
          centerMode: true,
          centerPadding: "0px",
          slidesToShow: 1
        }
      },
      {
        breakpoint: 480,
        settings: {
          arrows: false,
          centerMode: true,
          centerPadding: "0px",
          slidesToShow: 1
        }
      }
    ]
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
  const newMovies = [...filteredMovies].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 12);

  const trendingMovies = filteredMovies
    .filter(movie => (movie.watch_count || 0) + (movie.share_count || 0) > 10)
    .sort((a, b) => 
      ((b.watch_count || 0) + (b.share_count || 0)) - 
      ((a.watch_count || 0) + (a.share_count || 0))
    )
    .slice(0, 12);

  return (
    <div className="min-h-screen pt-14">
      {/* Hero Section with Featured Movies */}
      <section className="relative mb-8">
        <div className="w-full">
          {filteredMovies.length > 0 ? (
            <Slider {...settings}>
              {featuredMovies.map((movie) => (
                <div key={movie.id} className="relative h-[55vh] md:h-[75vh] w-full overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-300"
                    style={{
                      backgroundImage: `url(${movie.thumbnail_url})`,
                      objectFit: 'cover',
                    }}
                  >
                    <div className="hero-gradient" />
                  </div>

                  <div className="relative h-full flex items-center">
                    <div className="container mx-auto px-4 md:px-6 lg:px-8 animate-fade-in">
                      <div className="max-w-2xl">
                        <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold mb-4 text-white drop-shadow-lg">
                          {movie.title}
                        </h1>
                        <p className="text-base md:text-lg text-gray-200 mb-6 line-clamp-3">
                          {movie.description || "Discover amazing content in Ethiopian cinema."}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                          <Button
                            size={isMobile ? "default" : "lg"}
                            className="bg-netflix-red hover:bg-netflix-red/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                            onClick={() => navigate(`/movie/${movie.id}`)}
                          >
                            <Play className="mr-2 h-4 w-4 md:h-5 md:w-5" /> Play Now
                          </Button>
                          <Button
                            size={isMobile ? "default" : "lg"}
                            variant="outline"
                            className="backdrop-blur-sm bg-white/10 border-white/30 text-white hover:bg-white/20 transition-all duration-300"
                            onClick={() => navigate(`/movie/${movie.id}`)}
                          >
                            <Info className="mr-2 h-4 w-4 md:h-5 md:w-5" /> More Info
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
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

      {/* Search and Filter Section */}
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
                      <Select value={ratingFilter} onValueChange={setRatingFilter}>
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
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
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
      </section>

      {/* Content Sections */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-background to-background/95">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="space-y-16">
            {/* New Releases */}
            {newMovies.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold">New Releases</h2>
                  <Link 
                    to="/movies?sort=latest" 
                    className="text-sm md:text-base text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    View All →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {newMovies.map((movie) => (
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

            {/* Trending Now */}
            {trendingMovies.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-netflix-red" />
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold">Trending Now</h2>
                  </div>
                  <Link 
                    to="/movies?sort=trending" 
                    className="text-sm md:text-base text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    View All →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {trendingMovies.map((movie) => (
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
                                {movie.averageRating ? movie.averageRating.toFixed(1) : 'Hot'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-netflix-red" />
                              <span className="text-xs text-white/70">
                                {(movie.watch_count || 0) + (movie.share_count || 0)} views
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Browse by Genre */}
            {Object.entries(moviesByGenre)
              .sort(([, moviesA], [, moviesB]) => {
                const engagementA = moviesA.reduce((sum, movie) => 
                  sum + (movie.watch_count || 0) + (movie.share_count || 0), 0
                );
                const engagementB = moviesB.reduce((sum, movie) => 
                  sum + (movie.watch_count || 0) + (movie.share_count || 0), 0
                );
                return engagementB - engagementA;
              })
              .map(([genre, genreMovies]) => (
                <div key={genre} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold">{genre}</h2>
                    <Link 
                      to={`/movies?genre=${encodeURIComponent(genre)}`} 
                      className="text-sm md:text-base text-primary hover:text-primary/80 transition-colors font-medium"
                    >
                      View All →
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {genreMovies.slice(0, 12).map((movie) => (
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
                              <span className="text-xs text-white/70 bg-black/30 px-2 py-0.5 rounded">
                                {movie.language || 'Amharic'}
                              </span>
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
      </section>
    </div>
  );
};

export default Home;
