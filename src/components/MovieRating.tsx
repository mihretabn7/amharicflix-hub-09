import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Star, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface MovieRatingProps {
  movieId: string;
  userId: string;
  onRatingSubmit?: () => void;
}

const MovieRating = ({ movieId, userId, onRatingSubmit }: MovieRatingProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const { register, handleSubmit, reset, setValue } = useForm();
  const [existingRating, setExistingRating] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExistingRating = async () => {
      const { data, error } = await supabase
        .from('movie_ratings')
        .select('*')
        .eq('movie_id', movieId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        toast.error("Failed to fetch rating");
        return;
      }

      if (data) {
        setExistingRating(data);
        setRating(data.rating || 0);
        setValue('review', data.review || '');
      }
    };

    fetchExistingRating();
  }, [movieId, userId]);

  const onSubmit = async (data: any) => {
    try {
      const { error } = await supabase
        .from('movie_ratings')
        .upsert({
          id: existingRating?.id,
          movie_id: movieId,
          user_id: userId,
          rating,
          review: data.review
        });

      if (error) throw error;

      toast.success(existingRating ? "Rating updated successfully!" : "Rating submitted successfully!");
      if (onRatingSubmit) onRatingSubmit();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-4">
      {userId ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-6 w-6 cursor-pointer ${(hoveredRating || rating) >= star
                    ? "text-yellow-400 fill-current"
                    : "text-gray-400"
                  }`}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              />
            ))}
          </div>
          <Textarea
            placeholder="Write your review..."
            {...register("review")}
            className="min-h-[100px]"
          />
          <Button type="submit" disabled={!rating}>
            {existingRating ? "Update Rating" : "Submit Rating"}
          </Button>
        </form>
      ) : (
        <div className="text-center p-6 border rounded-lg bg-card">
          <div className="mb-4">
            <Star className="h-12 w-12 text-netflix-gold mx-auto" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Want to rate this movie?</h3>
          <p className="text-muted-foreground mb-4">
            Sign in to share your rating and review
          </p>
          <Button onClick={() => navigate('/login')} className="gap-2">
            <LogIn className="h-4 w-4" />
            Sign In to Rate
          </Button>
        </div>
      )}
    </div>
  );
};

export default MovieRating;