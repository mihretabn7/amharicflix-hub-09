
import { Movie } from "@/types/movie";
import MovieRating from "@/components/MovieRating";
import MovieReportModal from "@/components/MovieReportModal";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface MoviePlayerProps {
  movie: Movie;
  userId?: string;
  onRatingSubmit: () => void;
}

const MoviePlayer = ({ movie, userId, onRatingSubmit }: MoviePlayerProps) => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authAction, setAuthAction] = useState<"rate" | "report" | "share">("rate");
  const navigate = useNavigate();

  const handleAuthRequired = (action: "rate" | "report" | "share") => {
    setAuthAction(action);
    setShowAuthDialog(true);
  };

  const redirectToLogin = () => {
    setShowAuthDialog(false);
    navigate("/login", { state: { from: `/movie/${movie.id}` } });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow bg-black">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${movie.youtube_id}?autoplay=1`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
      
      {userId ? (
        <div className="bg-card p-4 border-t border-border space-y-6">
          <MovieRating
            movieId={movie.id}
            userId={userId}
            onRatingSubmit={onRatingSubmit}
          />
          <div className="flex justify-end">
            <MovieReportModal
              movieId={movie.id}
              userId={userId}
            />
          </div>
        </div>
      ) : (
        <div className="bg-card p-4 border-t border-border">
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <p className="text-muted-foreground">Sign in to rate and review this movie</p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleAuthRequired("rate")}
              >
                Rate & Review
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleAuthRequired("report")}
              >
                Report
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Required Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
            <DialogDescription>
              You need to sign in to {authAction === "rate" ? "rate and review" : authAction === "report" ? "report" : "share"} this movie.
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

export default MoviePlayer;
