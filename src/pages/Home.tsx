import { useEffect, useState } from "react";
import { Play, Info, Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { supabase, fetchUserLocation } from "@/integrations/supabase/client";
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

  useEffect(() => {
    const logUserLocation = async () => {
      const locationData = await fetchUserLocation();
      console.log("User location on home page:", locationData);
    };

    logUserLocation();
  }, []);

  const { data: movies, isLoading } = useQuery({
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
        averageRating: movie.movie_ratings.length > 0
          ? movie.movie_ratings.reduce((acc: number, curr: any) => acc + curr.rating, 0) / movie.movie_ratings.length
          : 0
      }));
    },
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

  return (
    <div className="min-h-screen">
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

      <section className="py-12 bg-gradient-to-b from-background/80 to-background mt-[-120px] relative z-10">
        <Card className="container mx-auto px-4">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl md:text-3xl font-display font-bold">Featured Movies</h2>
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