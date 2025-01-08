import { useState } from "react";
import { useForm } from "react-hook-form";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MovieRatingProps {
  movieId: string;
  userId: string;
  onRatingSubmit?: () => void;
}

const MovieRating = ({ movieId, userId, onRatingSubmit }: MovieRatingProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data: any) => {
    try {
      const { error } = await supabase
        .from('movie_ratings')
        .upsert({
          movie_id: movieId,
          user_id: userId,
          rating,
          review: data.review
        });

      if (error) throw error;

      toast.success("Rating submitted successfully!");
      reset();
      setRating(0);
      if (onRatingSubmit) onRatingSubmit();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-6 w-6 cursor-pointer ${
              (hoveredRating || rating) >= star
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
        Submit Rating
      </Button>
    </form>
  );
};

export default MovieRating;