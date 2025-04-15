
import { Movie } from "@/types/movie";
import { useState } from "react";
import { Button } from "./ui/button";
import MovieReviews from "./MovieReviews";
import { useIsMobile } from "@/hooks/use-mobile";
import GenreSuggestion from "./GenreSuggestion";
import GenreSuggestionsDisplay from "./GenreSuggestionsDisplay";

interface MovieDetailsSectionProps {
  movie: Movie;
  userId?: string;
}

const MovieDetailsSection = ({ movie, userId }: MovieDetailsSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const description = movie.description || 'No description available.';
  const shortDescription = description.slice(0, 150);
  const needsReadMore = description.length > 150;
  const isMobile = useIsMobile();

  return (
    <div className={isMobile ? "netflix-details pb-16 px-4" : ""}>
      <h2 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold mb-4`}>Movie Details</h2>
      <div className="space-y-4">
        <div>
          <h3 className="font-medium">Description</h3>
          <p className="text-gray-300">
            {isExpanded ? description : shortDescription}
            {needsReadMore && !isExpanded && '...'}
            {needsReadMore && (
              <Button
                variant="link"
                className="text-netflix-red pl-1"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Read less' : 'Read more'}
              </Button>
            )}
          </p>
        </div>
        <div className={isMobile ? "grid grid-cols-2 gap-4" : ""}>
          <div>
            <h3 className="font-medium">Language</h3>
            <p className="text-gray-300">{movie.language}</p>
          </div>
          <div>
            <h3 className="font-medium">Added on</h3>
            <p className="text-gray-300">{new Date(movie.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Genre Suggestions</h3>
          <GenreSuggestionsDisplay movieId={movie.id} />
          {userId && <GenreSuggestion movieId={movie.id} userId={userId} />}
        </div>
        
        <MovieReviews movieId={movie.id} currentUserId={userId} />
      </div>
    </div>
  );
};

export default MovieDetailsSection;
