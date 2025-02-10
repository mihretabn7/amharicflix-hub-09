
import { Play, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Movie } from "@/types/movie";
import MovieReportModal from "@/components/MovieReportModal";

interface MovieHeroProps {
  movie: Movie;
  onPlay: () => void;
  onShare: () => void;
  userId?: string;
}

const MovieHero = ({ movie, onPlay, onShare, userId }: MovieHeroProps) => {
  return (
    <div className="relative h-[70vh]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${movie.thumbnail_url})`
        }}
      >
        <div className="hero-gradient" />
      </div>
      <div className="relative h-full flex items-center">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">
            {movie.title}
          </h1>
          <div className="flex items-center space-x-4 text-sm text-gray-300 mb-6">
            <span>{new Date(movie.created_at).getFullYear()}</span>
            <span>{movie.genre || 'Genre pending'}</span>
            <span>{movie.language || 'Amharic'}</span>
            {movie.averageRating !== undefined && (
              <div className="flex items-center">
                <span>{movie.averageRating.toFixed(1)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Button
              size="lg"
              className="bg-netflix-red hover:bg-netflix-red/90"
              onClick={onPlay}
            >
              <Play className="mr-2 h-5 w-5" /> Play Now
            </Button>
            <Button size="lg" variant="outline" onClick={onShare}>
              <Share2 className="mr-2 h-5 w-5" /> Share
            </Button>
            {userId && (
              <MovieReportModal
                movieId={movie.id}
                userId={userId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieHero;
