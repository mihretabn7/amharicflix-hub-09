import { Card } from "@/components/ui/card";
import { Play } from "lucide-react";
import { Link } from "react-router-dom";

const Movies = () => {
  // Sample movie data (in a real app, this would come from an API)
  const movies = [
    {
      id: 1,
      title: "Ethiopian Drama 1",
      thumbnail: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=500&q=60",
      genre: "Drama",
      year: "2024"
    },
    {
      id: 2,
      title: "Comedy Show",
      thumbnail: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=500&q=60",
      genre: "Comedy",
      year: "2024"
    },
    // Add more sample movies as needed
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8">All Movies</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {movies.map((movie) => (
            <Link to={`/movie/${movie.id}`} key={movie.id}>
              <Card className="group relative overflow-hidden transition-all hover:scale-105">
                <div className="aspect-[2/3] relative">
                  <img
                    src={movie.thumbnail}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-12 h-12 text-white" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-1">{movie.title}</h3>
                  <p className="text-sm text-gray-500">{movie.year} • {movie.genre}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Movies;