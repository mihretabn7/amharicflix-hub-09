
import { Play, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Movie } from "@/types/movie";
import MovieReportModal from "@/components/MovieReportModal";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

interface MovieHeroProps {
  movie: Movie;
  onPlay: () => void;
  onShare: () => void;
  userId?: string;
}

const MovieHero = ({ movie, onPlay, onShare, userId }: MovieHeroProps) => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authAction, setAuthAction] = useState<"report" | "share">("share");
  const navigate = useNavigate();

  const handleAuthRequired = (action: "report" | "share") => {
    setAuthAction(action);
    setShowAuthDialog(true);
  };

  const redirectToLogin = () => {
    setShowAuthDialog(false);
    navigate("/login", { state: { from: `/movie/${movie.id}` } });
  };

  const handleShareClick = () => {
    if (userId) {
      onShare();
    } else {
      handleAuthRequired("share");
    }
  };

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
            <Button size="lg" variant="outline" onClick={handleShareClick}>
              <Share2 className="mr-2 h-5 w-5" /> Share
            </Button>
            {userId ? (
              <MovieReportModal
                movieId={movie.id}
                userId={userId}
              />
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleAuthRequired("report")}
              >
                Report
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Authentication Required Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
            <DialogDescription>
              You need to sign in to {authAction === "share" ? "share" : "report"} this movie.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAuthDialog(false)}>
              Cancel
            </Button>
            <Button onClick={redirectToLogin}>
              Sign In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MovieHero;
