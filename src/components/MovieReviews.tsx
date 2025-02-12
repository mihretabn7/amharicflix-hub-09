import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { format } from "date-fns";
import { Star } from "lucide-react";

interface MovieReviewsProps {
  movieId: string;
}

interface Review {
  id: string;
  rating: number;
  review: string;
  created_at: string;
  profiles: {
    email: string;
    username: string | null;
    avatar_url: string | null;
  };
}

const MovieReviews: React.FC<MovieReviewsProps> = ({ movieId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from('movie_ratings')
        .select(`
          id,
          rating,
          review,
          created_at,
          profiles (
            email,
            username,
            avatar_url
          )
        `)
        .eq('movie_id', movieId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setReviews(data);
      }
    };

    fetchReviews();
  }, [movieId]);

  if (reviews.length === 0) {
    return (
      <div className="bg-card rounded-lg p-4">
        <h3 className="text-xl font-semibold mb-2">User Reviews</h3>
        <p className="text-muted-foreground text-sm">
          No reviews yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-4">
      <h3 className="text-xl font-semibold mb-4">User Reviews</h3>

      <div className="grid gap-4">
        {reviews.map((review) => (
          <div key={review.id} className="flex items-start gap-3 p-3 bg-black/20 rounded-lg">
            <Avatar className="h-8 w-8">
              {review.profiles.avatar_url ? (
                <AvatarImage src={review.profiles.avatar_url} />
              ) : (
                <AvatarFallback>
                  {review.profiles.username?.[0] || review.profiles.email[0]}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">
                  {review.profiles.username || review.profiles.email.split('@')[0]}
                </span>
                <div className="flex items-center text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                  <Star className="h-3 w-3 fill-current" />
                  <span className="ml-1 text-xs">{review.rating}</span>
                </div>
                <span className="text-xs text-muted-foreground ml-auto">
                  {format(new Date(review.created_at), 'MMM d, yyyy')}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-300 break-words">{review.review}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MovieReviews;