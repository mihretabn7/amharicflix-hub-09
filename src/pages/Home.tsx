
import { useEffect, useState, useRef, useCallback } from "react";
import { Play, Info, Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Home = () => {
  const navigate = useNavigate();
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [session, setSession] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const isMobile = useIsMobile();

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

  const { data: movies, isLoading, fetchNextPage, isFetchingNextPage } = useQuery({
    queryKey: ['movies', ratingFilter, page],
    queryFn: async ({ pageParam = 1 }) => {
      const pageSize = 12;
      const from = (pageParam - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('movies')
        .select(`
          *,
          movie_ratings(rating)
        `)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (ratingFilter !== 'all') {
        const minRating = parseInt(ratingFilter);
        query = query.gte('movie_ratings.rating', minRating);
      }

      const { data, error } = await query;

      if (error) throw error;

      const processedData = data?.map(movie => ({
        ...movie,
        averageRating: movie.movie_ratings.length > 0
          ? movie.movie_ratings.reduce((acc: number, curr: any) => acc + curr.rating, 0) / movie.movie_ratings.length
          : 0
      }));

      setHasMore(data.length === pageSize);
      return processedData || [];
    },
    getNextPageParam: (lastPage, allPages) => {
      return hasMore ? allPages.length + 1 : undefined;
    }
  });

  // Intersection observer for infinite scrolling
  const lastMovieElementRef = useCallback((node: HTMLElement | null) => {
    if (isLoading || isFetchingNextPage) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
        fetchNextPage();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, isFetchingNextPage, hasMore, fetchNextPage]);

  const settings = {
    dots: isMobile ? false : true,
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

  if (isLoading && !movies) {
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

  const allMovies = movies || [];
  const featuredMovies = allMovies.slice(0, 5);

  // Categories for scrollable rows (Netflix-style)
  const categories = [
    { title: "Newest Arrivals", movies: allMovies.slice(0, 10) },
    { title: "Trending Now", movies: [...allMovies].sort(() => Math.random() - 0.5).slice(0, 10) },
    { title: "Popular in Ethiopia", movies: [...allMovies].sort(() => Math.random() - 0.5).slice(0, 10) }
  ];

  return (
    <div className="min-h-screen">
      <section className={isMobile ? "pt-0" : "pt-12"}>
        <div className={isMobile ? "w-full" : "container mx-auto px-4"}>
          <Slider {...settings}>
            {featuredMovies.map((movie) => (
              <div key={movie.id} className={`relative ${isMobile ? 'h-[80vh]' : 'h-[80vh]'} w-full lg:w-1/2 mx-auto ${isMobile ? '' : 'rounded-xl'} overflow-hidden`}>
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-300"
                  style={{
                    backgroundImage: `url(${movie.thumbnail_url})`,
                    objectFit: 'cover',
                  }}
                >
                  <div className={`${isMobile ? 'netflix-hero-overlay' : 'hero-gradient'}`} />
                </div>

                <div className="relative h-full flex items-end">
                  <div className={`${isMobile ? 'netflix-hero-content pb-20 px-4' : 'container mx-auto px-4'} animate-fade-in`}>
                    <h1 className={`font-display ${isMobile ? 'text-3xl' : 'text-4xl md:text-5xl lg:text-6xl'} font-bold mb-4 line-clamp-2`}>
                      {movie.title}
                    </h1>
                    {movie.description && (
                      <p className={`text-gray-300 mb-4 ${isMobile ? 'line-clamp-2 text-sm' : 'line-clamp-3'}`}>
                        {movie.description}
                      </p>
                    )}
                    <div className="flex space-x-2">
                      <Button
                        size={isMobile ? "default" : "lg"}
                        className="bg-netflix-red hover:bg-netflix-red/90 transition-colors duration-300"
                        onClick={() => navigate(`/movie/${movie.id}`)}
                      >
                        <Play className="mr-2 h-5 w-5" /> Play
                      </Button>
                      <Button
                        size={isMobile ? "default" : "lg"}
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
        </div>
      </section>

      {isMobile ? (
        // Netflix-style mobile layout with horizontal scrolling categories
        <div className="mt-[-50px] relative z-10">
          {categories.map((category, index) => (
            <div key={index} className="netflix-row mb-6">
              <h2 className="netflix-row-title">{category.title}</h2>
              <ScrollArea className="netflix-row-content pb-2">
                <div className="flex gap-3 pb-2">
                  {category.movies.map((movie, movieIndex) => (
                    <Link
                      to={`/movie/${movie.id}`}
                      key={movie.id}
                      className="netflix-card-item hover-scale"
                    >
                      <div className="relative">
                        <img
                          src={movie.thumbnail_url}
                          alt={movie.title}
                          className="netflix-card-img rounded-sm"
                          loading="lazy"
                        />
                        <div className="netflix-card-badge">
                          <div className="flex items-center">
                            <Star className="h-3 w-3 text-netflix-gold mr-1" />
                            <span className="text-xs">{movie.averageRating ? movie.averageRating.toFixed(1) : 'N/A'}</span>
                          </div>
                          <h3 className="text-xs font-medium line-clamp-1">{movie.title}</h3>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black/40">
                          <Button size="sm" variant="ghost" className="rounded-full bg-white text-black p-2">
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ))}

          <div className="netflix-row mb-6">
            <h2 className="netflix-row-title">All Movies</h2>
            <div className="grid grid-cols-3 gap-3">
              {allMovies.map((movie, index) => {
                const isLastElement = index === allMovies.length - 1;
                return (
                  <Link
                    to={`/movie/${movie.id}`}
                    key={movie.id}
                    ref={isLastElement ? lastMovieElementRef : null}
                    className="movie-card group animate-fade-in"
                  >
                    <div className="aspect-[2/3] bg-card rounded-md overflow-hidden relative">
                      <img
                        src={movie.thumbnail_url}
                        alt={movie.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 p-2 w-full">
                          <h3 className="text-xs font-medium mb-1 line-clamp-1">{movie.title}</h3>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 text-netflix-gold" />
                              <span className="text-xs">
                                {movie.averageRating ? movie.averageRating.toFixed(1) : 'N/A'}
                              </span>
                            </div>
                            <MessageSquare className="h-3 w-3 text-netflix-gray" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-netflix-red border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Desktop layout
        <section className="py-12 bg-gradient-to-b from-background/80 to-background mt-[-120px] relative z-10">
          <Card className="container mx-auto px-4">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl md:text-3xl font-display font-bold">Featured Movies</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {allMovies.map((movie, index) => {
                  const isLastElement = index === allMovies.length - 1;
                  return (
                    <Link
                      to={`/movie/${movie.id}`}
                      key={movie.id}
                      ref={isLastElement ? lastMovieElementRef : null}
                      className="movie-card group animate-fade-in hover-scale"
                    >
                      <div className="aspect-[2/3] bg-card rounded-md overflow-hidden relative">
                        <img
                          src={movie.thumbnail_url}
                          alt={movie.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="movie-card-overlay">
                          <div className="absolute bottom-0 p-4 w-full">
                            <h3 className="text-sm font-medium mb-2 line-clamp-2 group-hover:line-clamp-none transition-all duration-300">{movie.title}</h3>
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
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                          <Button size="sm" variant="ghost" className="rounded-full bg-white text-black p-2">
                            <Play className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              {isFetchingNextPage && (
                <div className="flex justify-center py-4 mt-8">
                  <div className="animate-spin h-8 w-8 border-2 border-netflix-red border-t-transparent rounded-full"></div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
};

export default Home;
