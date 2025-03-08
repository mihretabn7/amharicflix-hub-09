
import { useEffect, useState } from "react";
import { Play, Share, Star, Info } from "lucide-react";
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
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useIsMobile } from "@/hooks/use-mobile";
import { Movie } from "@/types/movie";

const Home = () => {
  const navigate = useNavigate();
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [session, setSession] = useState<any>(null);
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

  const { data: movies, isLoading } = useQuery<Movie[]>({
    queryKey: ['movies', ratingFilter],
    queryFn: async () => {
      let query = supabase
        .from('movies')
        .select(`
          *,
          movie_ratings(rating)
        `)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      if (ratingFilter !== 'all') {
        const minRating = parseInt(ratingFilter);
        query = query.gte('movie_ratings.rating', minRating);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data?.map(movie => ({
        ...movie,
        averageRating: movie.movie_ratings && movie.movie_ratings.length > 0
          ? movie.movie_ratings.reduce((acc: number, curr: any) => acc + curr.rating, 0) / movie.movie_ratings.length
          : 0
      })) || [];
    },
  });

  const handleShareMovie = (movie: Movie) => {
    if (navigator.share) {
      navigator.share({
        title: movie.title,
        text: `Check out this Ethiopian movie: ${movie.title}`,
        url: `${window.location.origin}/movie/${movie.id}`,
      })
      .then(() => console.log('Successful share'))
      .catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback for browsers that don't support navigator.share
      const url = `${window.location.origin}/movie/${movie.id}`;
      navigator.clipboard.writeText(url)
        .then(() => toast.success("Link copied to clipboard"))
        .catch(() => toast.error("Failed to copy link"));
    }
  };

  const settings = {
    dots: !isMobile,
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
  };

  const renderMovieCard = (movie: Movie) => (
    <Link
      to={`/movie/${movie.id}`}
      key={movie.id}
      className={isMobile ? "mobile-card-item" : "movie-card group animate-fade-in"}
    >
      <div className={isMobile ? "" : "aspect-[2/3] bg-card rounded-md overflow-hidden relative"}>
        <img
          src={movie.thumbnail_url}
          alt={movie.title}
          className={isMobile ? "mobile-card-img" : "w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"}
        />
        <div className={isMobile ? "mobile-card-badge" : "movie-card-overlay"}>
          <div className={isMobile ? "" : "absolute bottom-0 p-4 w-full"}>
            <h3 className={isMobile ? "text-xs font-medium line-clamp-2" : "text-sm font-medium mb-2 line-clamp-2"}>
              {movie.title}
            </h3>
            {!isMobile && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-netflix-gold" />
                  <span className="text-sm">
                    {movie.averageRating ? movie.averageRating.toFixed(1) : 'No ratings'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );

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

  const featuredMovies = movies ? movies.slice(0, 5) : [];
  const trendingMovies = movies ? movies.slice(0, 6) : [];
  const newReleases = movies ? movies.slice(6, 12) : [];
  const ethiopianClassics = movies ? movies.slice(12, 18) : [];

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      {isMobile ? (
        // Mobile Hero View
        <div className="mobile-hero">
          {featuredMovies.length > 0 && (
            <>
              <img 
                src={featuredMovies[0].thumbnail_url} 
                alt={featuredMovies[0].title} 
                className="mobile-hero-img"
              />
              <div className="mobile-hero-overlay">
                <h1 className="mobile-hero-title">{featuredMovies[0].title}</h1>
                <p className="text-sm text-gray-300">New Ethiopian Movie 2025</p>
                <div className="mobile-hero-actions">
                  <button 
                    className="mobile-btn-play"
                    onClick={() => navigate(`/movie/${featuredMovies[0].id}`)}
                  >
                    <Play className="h-5 w-5" /> Play
                  </button>
                  <button 
                    className="mobile-btn-share"
                    onClick={() => handleShareMovie(featuredMovies[0])}
                  >
                    <Share className="h-5 w-5" /> Share
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        // Desktop Hero View
        <section className="pt-12">
          <div className="container mx-auto px-4">
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
          </div>
        </section>
      )}

      {/* Movie Sections */}
      {isMobile ? (
        // Mobile Movie Sections
        <div className="pb-20">
          {/* Trending Now Section */}
          <div className="mobile-row mt-4">
            <h2 className="mobile-row-title">Trending Now</h2>
            <div className="mobile-row-content">
              {trendingMovies.map(movie => renderMovieCard(movie))}
            </div>
          </div>

          {/* New Releases Section */}
          <div className="mobile-row mt-6">
            <h2 className="mobile-row-title">New Releases</h2>
            <div className="mobile-row-content">
              {newReleases.map(movie => renderMovieCard(movie))}
            </div>
          </div>

          {/* Ethiopian Classics Section */}
          <div className="mobile-row mt-6">
            <h2 className="mobile-row-title">Ethiopian Classics</h2>
            <div className="mobile-row-content">
              {ethiopianClassics.map(movie => renderMovieCard(movie))}
            </div>
          </div>
        </div>
      ) : (
        // Desktop Movie Sections
        <section className="py-12 bg-gradient-to-b from-background/80 to-background mt-[-120px] relative z-10">
          <Card className="container mx-auto px-4">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl md:text-3xl font-display font-bold">Featured Movies</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {movies?.map(movie => renderMovieCard(movie))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
};

export default Home;
