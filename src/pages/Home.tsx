import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[80vh] w-full">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=2000&q=80)`
          }}
        >
          <div className="hero-gradient" />
        </div>
        
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-4">
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-4 max-w-2xl">
              Discover Ethiopian Cinema
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-xl">
              Stream the best Amharic movies and shows, all in one place.
            </p>
            <div className="flex space-x-4">
              <Button size="lg" className="bg-netflix-red hover:bg-netflix-red/90">
                <Play className="mr-2 h-5 w-5" /> Play Now
              </Button>
              <Button size="lg" variant="outline">
                <Info className="mr-2 h-5 w-5" /> More Info
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Trending Now</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Link to={`/movie/${i}`} key={i} className="movie-card">
                <div className="aspect-[2/3] bg-gray-800 rounded-md overflow-hidden">
                  <img
                    src={`https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=500&q=60`}
                    alt="Movie poster"
                    className="w-full h-full object-cover"
                  />
                  <div className="movie-card-overlay">
                    <div className="absolute bottom-0 p-4">
                      <h3 className="text-sm font-medium">Movie Title {i}</h3>
                      <p className="text-xs text-gray-300">2024 • Drama</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;