
import { Movie } from "@/types/movie";
import { useState } from "react";
import { Button } from "./ui/button";
import MovieReviews from "./MovieReviews";
import { useIsMobile } from "@/hooks/use-mobile";
import { Star } from "lucide-react";

interface MovieDetailsSectionProps {
  movie: Movie;
  userId?: string;
}

const MovieDetailsSection = ({ movie, userId }: MovieDetailsSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();
  const description = movie.description || 'No description available.';
  const shortDescription = description.slice(0, 150);
  const needsReadMore = description.length > 150;
  
  // Format the rating as stars
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="h-4 w-4 fill-netflix-gold text-netflix-gold" />);
    }
    
    if (hasHalfStar) {
      stars.push(
        <div key="half-star" className="relative">
          <Star className="h-4 w-4 text-netflix-gold" />
          <Star className="absolute top-0 left-0 h-4 w-4 fill-netflix-gold text-netflix-gold overflow-hidden" style={{ clipPath: 'inset(0 50% 0 0)' }} />
        </div>
      );
    }
    
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-400" />);
    }
    
    return (
      <div className="flex items-center space-x-1">
        {stars}
        <span className="ml-2 text-sm">{rating.toFixed(1)}/5</span>
      </div>
    );
  };

  return (
    <div className={isMobile ? "netflix-content p-4" : ""}>
      <h2 className="text-2xl font-bold mb-4">Movie Details</h2>
      <div className="space-y-4">
        <div>
          <h3 className="font-medium">Description</h3>
          <p className="text-gray-300">
            {isExpanded ? description : shortDescription}
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
        <div>
          <h3 className="font-medium">Language</h3>
          <p className="text-gray-300">{movie.language || 'Amharic'}</p>
        </div>
        <div>
          <h3 className="font-medium">Added on</h3>
          <p className="text-gray-300">{new Date(movie.created_at).toLocaleDateString()}</p>
        </div>
        {movie.averageRating !== undefined && (
          <div>
            <h3 className="font-medium">Rating</h3>
            <div className="text-gray-300">
              {renderStars(movie.averageRating)}
            </div>
          </div>
        )}
        <div className={isMobile ? "pb-16" : ""}>
          <MovieReviews movieId={movie.id} currentUserId={userId} />
        </div>
      </div>
    </div>
  );
};

export default MovieDetailsSection;
