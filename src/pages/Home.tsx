
import { useEffect, useState } from "react";
import { Play, Info, Star, MessageSquare, Search, Filter } from "lucide-react";
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

const Home = () => {
  const navigate = useNavigate();
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterLanguage, setFilterLanguage] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"latest" | "rating">("latest");
  const [session, setSession] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      // Check if user is logged in and update status if needed
      if (session?.user) {
        fetchUserLocation().then(locationData => {
          if (locationData && locationData.ip) {
            updateUserStatus(locationData.ip);
          }
        });
      } else {
        // If not logged in, just track as anonymous
        fetchUserLocation();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
      // Update status when auth state changes
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

      // Process and calculate average ratings
      const processedMovies = data?.map(movie => ({
        ...movie,
        averageRating: movie.movie_ratings.length > 0
          ? movie.movie_ratings.reduce((acc: number, curr: any) => acc + curr.rating, 0) / movie.movie_ratings.length
          : 0
      })) || [];

      // Apply rating filter
      let filteredMovies = processedMovies;
      if (ratingFilter !== "all") {
        const minRating = parseInt(ratingFilter);
        filteredMovies = filteredMovies.filter(m => m.averageRating >= minRating);
      }

      // Apply sorting
      if (sortBy === "rating") {
        filteredMovies.sort((a, b) => b.averageRating - a.averageRating);
      } else {
        filteredMovies.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }

      return filteredMovies;
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
    arrows: false,
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
      <div className="min-h-screen">
        <div className="container mx-auto px-4">
          <div className="h-[70vh] w-full relative overflow-hidden rounded-xl bg-card animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="h-8 w-48" />
            </div>
          </div>
        </div>

        <section className="py-12 bg-gradient-to-b from-background/80 to-background">
          <Card className="container mx-auto px-4">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl md:text-3xl font-display font-bold">Featured Movies</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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

  return (
    <div className="min-h-screen">
      <section className="pt-12">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 max-w-md">
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
                      <Select value={ratingFilter} onValueChange={setRatingFilter}>
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
          </div>
          
          {filteredMovies.length > 0 ? (
            <Slider {...settings}>
              {featuredMovies.map((movie) => (
                <div key={movie.id} className="relative h-[80vh] w-full lg:w-1/2 mx-auto rounded-xl overflow-hidden">
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
                      <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                        {movie.title}
                      </h1>
                      <div className="flex space-x-4">
                        <Button
                          size="lg"
                          className="bg-netflix-red hover:bg-netflix-red/90 transition-colors duration-300"
                          onClick={() => navigate(`/movie/${movie.id}`)}
                        >
                          <Play className="mr-2 h-5 w-5" /> Play Now
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="backdrop-blur-sm bg-black/20 hover:bg-black/40 transition-colors duration-300"
                          onClick={() => navigate(`/movie/${movie.id}`)}
                        >
                          <Info className="mr-2 h-5 w-5" /> More Info
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
        </div>
      </section>

      <section className="py-12 bg-gradient-to-b from-background/80 to-background mt-[-120px] relative z-10">
        <Card className="container mx-auto px-4">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <h2 className="text-2xl md:text-3xl font-display font-bold">Featured Movies</h2>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-muted-foreground mr-2">Filter by rating:</label>
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger className="w-[140px]">
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
            </div>

            {filteredMovies.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground">No movies found matching your search criteria.</p>
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
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Home;
