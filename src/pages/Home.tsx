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
      <section className="py-4 md:py-12">
        <div className="container mx-auto px-4">
          {filteredMovies.length > 0 ? (
            <Slider {...settings}>
              {featuredMovies.map((movie) => (
                <div key={movie.id} className="relative h-[50vh] md:h-[80vh] w-full lg:w-1/2 mx-auto rounded-xl overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-300 hover:scale-105"
                    style={{
                      backgroundImage: `url(${movie.thumbnail_url})`,
                      objectFit: 'cover',
                    }}
                  >
                    <div className="hero-gradient" />
                  </div>

                  <div className="relative h-full flex items-center">
                    <div className="container mx-auto px-4 animate-fade-in">
                      <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold mb-4">
                        {movie.title}
                      </h1>
                      <div className="flex flex-wrap space-x-2 space-y-2 md:space-y-0 md:space-x-4">
                        <Button
                          size={isMobile ? "default" : "lg"}
                          className="bg-netflix-red hover:bg-netflix-red/90 transition-colors duration-300"
                          onClick={() => navigate(`/movie/${movie.id}`)}
                        >
                          <Play className="mr-2 h-4 w-4 md:h-5 md:w-5" /> Play
                        </Button>
                        <Button
                          size={isMobile ? "default" : "lg"}
                          variant="outline"
                          className="backdrop-blur-sm bg-black/20 hover:bg-black/40 transition-colors duration-300"
                          onClick={() => navigate(`/movie/${movie.id}`)}
                        >
                          <Info className="mr-2 h-4 w-4 md:h-5 md:w-5" /> Info
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          ) : (
            <div className="flex justify-center items-center h-[40vh]">
              <p className="text-xl text-muted-foreground">No movies found matching your search.</p>
            </div>
          )}
          
          <div className={`mt-6 mb-4 ${isMobile ? 'sticky top-[3.5rem] z-10 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4' : ''}`}>
            <div className="flex flex-col gap-4">
              <div className="flex gap-3 items-center w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search movies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[230px] md:w-[250px]">
                    <div className="p-2 space-y-3">
                      <Accordion type="single" collapsible defaultValue={genreAccordionOpen ? "genre" : undefined}>
                        <AccordionItem value="genre">
                          <AccordionTrigger onClick={() => setGenreAccordionOpen((prev) => !prev)}>
                            Genre
                            {genreAccordionOpen ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="max-h-56 overflow-y-auto flex flex-col gap-1 px-1 py-2">
                              <Button
                                variant={filterGenre === "all" ? "default" : "outline"}
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => setFilterGenre("all")}
                              >All Genres</Button>
                              {filters?.genres.map((genre) => (
                                <Button
                                  key={genre}
                                  variant={filterGenre === genre ? "default" : "outline"}
                                  size="sm"
                                  className="w-full justify-start"
                                  onClick={() => setFilterGenre(genre)}
                                >{genre}</Button>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                      <div>
                        <label className="text-sm font-medium">Language</label>
                        <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                          <SelectTrigger className="mt-1">
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
                        <Select value={ratingFilter} onValueChange={setRatingFilter}>
                          <SelectTrigger className="mt-1">
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
                          <SelectTrigger className="mt-1">
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
              {isMobile && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hidden">
                  <Select value={ratingFilter} onValueChange={setRatingFilter}>
                    <SelectTrigger className="h-8 text-xs min-w-[100px]">
                      <SelectValue placeholder="Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ratings</SelectItem>
                      <SelectItem value="4">4+ Stars</SelectItem>
                      <SelectItem value="3">3+ Stars</SelectItem>
                      <SelectItem value="2">2+ Stars</SelectItem>
                    </SelectContent>
                  </Select>
                  <Accordion type="single" collapsible className="min-w-[110px]" defaultValue={genreAccordionOpen ? "genre" : undefined}>
                    <AccordionItem value="genre">
                      <AccordionTrigger onClick={() => setGenreAccordionOpen((prev) => !prev)}>
                        Genre
                        {genreAccordionOpen ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="max-h-52 overflow-y-auto flex flex-col gap-1 py-1">
                          <Button
                            variant={filterGenre === "all" ? "default" : "outline"}
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => setFilterGenre("all")}
                          >All Genres</Button>
                          {filters?.genres.map((genre) => (
                            <Button
                              key={genre}
                              variant={filterGenre === genre ? "default" : "outline"}
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => setFilterGenre(genre)}
                            >{genre}</Button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  <Select value={sortBy} onValueChange={(value: "latest" | "rating") => setSortBy(value)}>
                    <SelectTrigger className="h-8 text-xs min-w-[100px]">
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

      <section className="py-8 md:py-12 bg-gradient-to-b from-background/80 to-background mt-[-60px] md:mt-[-120px] relative z-10">
        <Card className="container mx-auto px-4">
          <CardContent className="pt-6 space-y-12">
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-6">New Releases</h2>
              <div className={movieRowContainer}>
                {newMovies.map((movie) => (
                  <Link
                    to={`/movie/${movie.id}`}
                    key={movie.id}
                    className={`movie-card group animate-fade-in ${movieCardWidth}`}
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
                            <MessageSquare className="h-3 w-3 text-white/80" />
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
            </div>

            {trendingMovies.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-6 h-6 text-netflix-red" />
                  <h2 className="text-2xl md:text-3xl font-display font-bold">Trending Now</h2>
                </div>
                <div className={movieRowContainer}>
                  {trendingMovies.map((movie) => (
                    <Link
                      to={`/movie/${movie.id}`}
                      key={movie.id}
                      className={`movie-card group animate-fade-in ${movieCardWidth}`}
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
                              <MessageSquare className="h-3 w-3 text-white/80" />
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
              </div>
            )}

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
                <div key={genre}>
                  <h2 className="text-2xl md:text-3xl font-display font-bold mb-6">{genre}</h2>
                  <div className={movieRowContainer}>
                    {genreMovies.slice(0, 24).map((movie) => (
                      <Link
                        to={`/movie/${movie.id}`}
                        key={movie.id}
                        className={`movie-card group animate-fade-in ${movieCardWidth}`}
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
                                <MessageSquare className="h-3 w-3 text-white/80" />
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
                </div>
              ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Home;
