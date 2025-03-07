
import { Movie } from "@/types/movie";
import MovieRating from "@/components/MovieRating";
import MovieReportModal from "@/components/MovieReportModal";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
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
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface MoviePlayerProps {
  movie: Movie;
  userId?: string;
  onRatingSubmit: () => void;
}

const MoviePlayer = ({ movie, userId, onRatingSubmit }: MoviePlayerProps) => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authAction, setAuthAction] = useState<"rate" | "report" | "share">("rate");
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Track the view when the component mounts
    const trackView = async () => {
      try {
        // Get browser and device info
        const browserInfo = navigator.userAgent;
        const deviceInfo = {
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          platform: navigator.platform,
          vendor: navigator.vendor,
          isMobile: window.innerWidth < 768
        };
        
        if (userId) {
          // Track for registered user
          await supabase.rpc('track_movie_view_with_country', {
            p_movie_id: movie.id,
            p_user_id: userId,
            p_user_ip: null,
            p_browser_info: browserInfo,
            p_device_info: JSON.stringify(deviceInfo)
          });
          console.log("Successfully tracked view for registered user");
        } else {
          // Track for anonymous user using our edge function
          try {
            console.log("Attempting to get IP via edge function...");
            const response = await supabase.functions.invoke('get-my-ip', {
              method: 'POST', // Be explicit about the method
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.error) {
              throw new Error(response.error.message);
            }
            
            const ipData = response.data;
            const ip = ipData?.ip || "Unknown";
            console.log("IP detected:", ip);

            await supabase.rpc('track_movie_view_with_country', {
              p_movie_id: movie.id,
              p_user_id: null,
              p_user_ip: ip,
              p_browser_info: browserInfo,
              p_device_info: JSON.stringify(deviceInfo)
            });
            console.log("Successfully tracked anonymous view with IP");
          } catch (ipError) {
            console.error("Error getting IP:", ipError);
            // Still track the view even if IP detection fails
            await supabase.rpc('track_movie_view_with_country', {
              p_movie_id: movie.id,
              p_user_id: null,
              p_user_ip: null,
              p_browser_info: browserInfo,
              p_device_info: JSON.stringify(deviceInfo)
            });
            console.log("Tracked view without IP due to error");
          }
        }
      } catch (error) {
        console.error("Error tracking view:", error);
        // Use toast but don't show error to user for background operations
        // toast({
        //   variant: "destructive",
        //   title: "Error",
        //   description: "Failed to track view statistics",
        // });
      }
    };

    trackView();
  }, [movie.id, userId]);

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
        <div className={`bg-card p-4 border-t border-border space-y-6 ${isMobile ? 'netflix-controls' : ''}`}>
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
        <div className={`bg-card p-4 border-t border-border ${isMobile ? 'netflix-controls' : ''}`}>
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
        <DialogContent className={`${isMobile ? 'netflix-modal w-[90%]' : 'sm:max-w-md'} rounded-xl`}>
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
