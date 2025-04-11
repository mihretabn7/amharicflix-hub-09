
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
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

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
    <div className={`relative ${isMobile ? 'h-[60vh] mobile-hero' : 'h-[70vh]'}`}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${movie.thumbnail_url})`
        }}
      >
        <div className="hero-gradient" />
      </div>
      <div className="relative h-full flex items-center">
        <div className={`container mx-auto px-4 ${isMobile ? 'pb-8 mobile-hero-content' : ''}`}>
          <h1 className={`font-display ${isMobile ? 'text-3xl' : 'text-4xl md:text-6xl'} font-bold mb-4`}>
            {movie.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-300 mb-6">
            <span>{new Date(movie.created_at).getFullYear()}</span>
            <span>•</span>
            <span>{movie.genre || 'Genre pending'}</span>
            <span>•</span>
            <span>{movie.language || 'Amharic'}</span>
            {movie.averageRating !== undefined && (
              <div className="flex items-center">
                <span>•</span>
                <span>{movie.averageRating.toFixed(1)}</span>
              </div>
            )}
          </div>
          <div className={`flex items-center ${isMobile ? 'flex-wrap gap-2' : 'space-x-4'}`}>
            <Button
              size={isMobile ? "default" : "lg"}
              className="bg-netflix-red hover:bg-netflix-red/90"
              onClick={onPlay}
            >
              <Play className="mr-2 h-5 w-5" /> Play Now
            </Button>
            <Button 
              size={isMobile ? "default" : "lg"} 
              variant="outline" 
              onClick={handleShareClick}
            >
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
        <DialogContent className={`${isMobile ? 'w-[90%] netflix-modal' : ''} rounded-xl`}>
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
