
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
import GenreSuggestionsDisplay from "@/components/GenreSuggestionsDisplay";
import GenreSuggestion from "@/components/GenreSuggestion";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface MoviePlayerProps {
  movie: Movie;
  userId?: string;
  onRatingSubmit: () => void;
}

const MoviePlayer = ({ movie, userId, onRatingSubmit }: MoviePlayerProps) => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authAction, setAuthAction] = useState<"rate" | "report" | "share" | "genre">("rate");
  const [genreCollapsibleOpen, setGenreCollapsibleOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Get genre suggestions and most popular count.
  const { data: genreSuggestions = [] } = useQuery({
    queryKey: ['genreSuggestions', movie.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('genre_suggestions')
        .select('suggested_genre, id')
        .eq('movie_id', movie.id);

      if (error) throw error;

      // Count suggestions manually
      const counts = data.reduce((acc: Record<string, number>, curr) => {
        acc[curr.suggested_genre] = (acc[curr.suggested_genre] || 0) + 1;
        return acc;
      }, {});

      // Convert to array and sort by count
      return Object.entries(counts)
        .map(([genre, count]) => ({ suggested_genre: genre, count }))
        .sort((a, b) => b.count - a.count);
    }
  });

  // Popular genre label
  const popularGenres = genreSuggestions.length > 0 ? genreSuggestions.slice(0, 3) : [];
  const totalVotes = genreSuggestions.reduce((sum, g) => sum + Number(g.count), 0);

  useEffect(() => {
    // Track the view when the component mounts
    const trackView = async () => {
      try {
        if (userId) {
          await supabase.rpc('track_movie_view_with_country', {
            p_movie_id: movie.id,
            p_user_id: userId,
            p_user_ip: null,
            p_browser_info: null,
            p_device_info: null
          });
        } else {
          await supabase.rpc('track_movie_view_with_country', {
            p_movie_id: movie.id,
            p_user_id: null,
            p_user_ip: null,
            p_browser_info: null,
            p_device_info: null
          });
        }
      } catch (error) {
        console.error("Error tracking view:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to track view statistics",
        });
      }
    };

    trackView();
  }, [movie.id, userId]);

  const handleAuthRequired = (action: "rate" | "report" | "share" | "genre") => {
    setAuthAction(action);
    setShowAuthDialog(true);
  };

  const redirectToLogin = () => {
    setShowAuthDialog(false);
    navigate("/login", { state: { from: `/movie/${movie.id}` } });
  };

  return (
    <div className={`flex flex-col ${isMobile ? 'h-[calc(100vh-3.5rem)] mt-14' : 'h-full'}`}>
      <div className={`flex-grow bg-black ${isMobile ? 'aspect-video' : ''}`}>
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${movie.youtube_id}?autoplay=1`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      </div>

      {/* Collapsible Genre Suggestions Section */}
      <div className={`bg-card border-t border-border ${isMobile ? 'p-3' : 'p-4'}`}>
        <Collapsible open={genreCollapsibleOpen} onOpenChange={setGenreCollapsibleOpen}>
          <div className="flex items-center mb-2">
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                size={isMobile ? "sm" : "default"}
                className="flex items-center gap-2"
                type="button"
                aria-expanded={genreCollapsibleOpen}
              >
                {genreCollapsibleOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                <span>
                  Genres ({totalVotes} votes)
                </span>
              </Button>
            </CollapsibleTrigger>
            {popularGenres.length > 0 && (
              <div className="flex flex-wrap ml-2 gap-1">
                {popularGenres.map((g) => (
                  <Badge key={g.suggested_genre} className="bg-secondary text-xs px-2 py-1">
                    {g.suggested_genre}: {g.count}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <CollapsibleContent>
            <div className="mt-2">
              <GenreSuggestionsDisplay movieId={movie.id} />
              {userId ? (
                <div className="mt-4">
                  <GenreSuggestion movieId={movie.id} userId={userId} />
                </div>
              ) : (
                <div className="text-sm text-muted-foreground mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleAuthRequired("genre")}>
                    Sign in to suggest genres
                  </Button>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
      
      {userId ? (
        <div className={`bg-card border-t border-border space-y-4 ${isMobile ? 'p-3' : 'p-4'}`}>
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
        <div className={`bg-card border-t border-border ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <p className="text-muted-foreground text-sm">Sign in to rate and review this movie</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size={isMobile ? "sm" : "default"}
                onClick={() => handleAuthRequired("rate")}
              >
                Rate & Review
              </Button>
              <Button
                variant="outline"
                size={isMobile ? "sm" : "default"}
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
              You need to sign in to {authAction === "rate"
                ? "rate and review"
                : authAction === "report"
                  ? "report"
                  : authAction === "genre"
                    ? "suggest a genre for"
                    : "share"
              } this movie.
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

