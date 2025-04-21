
// Collapsible support
import { Movie } from "@/types/movie";
import { useState } from "react";
import { Button } from "./ui/button";
import MovieReviews from "./MovieReviews";
import { useIsMobile } from "@/hooks/use-mobile";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./ui/collapsible";

interface MovieDetailsSectionProps {
  movie: Movie;
  userId?: string;
}

const MovieDetailsSection = ({ movie, userId }: MovieDetailsSectionProps) => {
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const description = movie.description || "No description available.";
  const shortDescription = description.slice(0, 150);
  const needsReadMore = description.length > 150;
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();

  // Placeholder for reviews count—MovieReviews will receive the count as prop
  // But we pass the movieId, so MovieReviews must handle it
  // We'll render a badge with the number of reviews from MovieReviews (callback pattern or move inside MovieReviews)

  return (
    <div className={isMobile ? "netflix-details pb-16 px-4" : ""}>
      <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
        <div className="flex items-center">
          <h2 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold mb-4 flex-1`}>Movie Details</h2>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="ml-2">
              {detailsOpen ? "Hide" : "Show"}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Description</h3>
              <p className="text-gray-300">
                {isExpanded ? description : shortDescription}
                {needsReadMore && !isExpanded && "..."}
                {needsReadMore && (
                  <Button
                    variant="link"
                    className="text-netflix-red pl-1"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? "Read less" : "Read more"}
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
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* REVIEWS Collapsible */}
      <div className="mt-6">
        <Collapsible open={reviewsOpen} onOpenChange={setReviewsOpen}>
          <div className="flex items-center mb-2">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="mr-2">
                {reviewsOpen ? "Hide reviews" : "Show reviews"}
              </Button>
            </CollapsibleTrigger>
            {/* The MovieReviews component will show the review count in the button label if needed */}
          </div>
          <CollapsibleContent>
            <MovieReviews movieId={movie.id} currentUserId={userId} />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default MovieDetailsSection;
