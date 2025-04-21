import { useState, useEffect } from "react";
import { Star, Edit2, Check, X, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

interface MovieReviewsProps {
  movieId: string;
  currentUserId?: string;
}

interface Review {
  id: string;
  rating: number;
  review: string;
  created_at: string;
  user_id: string;
  profiles: {
    email: string;
    phone_number: string;
    username: string | null;
    avatar_url: string | null;
  };
}

const MovieReviews = ({ movieId, currentUserId }: MovieReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedRating, setEditedRating] = useState(0);

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('movie_ratings')
      .select(`
        *,
        profiles (
          email,
          phone_number,
          username,
          avatar_url
        )
      `)
      .eq('movie_id', movieId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Failed to load reviews");
      return;
    }

    setReviews(data as Review[]);
  };

  useEffect(() => {
    fetchReviews();
  }, [movieId]);

  const handleEdit = (review: Review) => {
    setEditingReview(review.id);
    setEditedContent(review.review || "");
    setEditedRating(review.rating || 0);
  };

  const handleSave = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('movie_ratings')
        .update({
          review: editedContent,
          rating: editedRating
        })
        .eq('id', reviewId);

      if (error) throw error;

      toast.success("Review updated successfully!");
      setEditingReview(null);
      fetchReviews();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCancel = () => {
    setEditingReview(null);
    setEditedContent("");
    setEditedRating(0);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Reviews</h3>
      {reviews.map((review) => (
        <div key={review.id} className="bg-card p-4 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={review.profiles?.avatar_url || ''} />
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {review.profiles?.username || review.profiles?.email || review.profiles?.phone_number}
                </div>
                {!editingReview || editingReview !== review.id ? (
                  <div className="flex items-center">
                    {[...Array(review.rating || 0)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 cursor-pointer ${
                          editedRating >= star
                            ? "text-yellow-400 fill-current"
                            : "text-gray-400"
                        }`}
                        onClick={() => setEditedRating(star)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            {currentUserId === review.user_id && (
              <div className="flex items-center space-x-2">
                {editingReview === review.id ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSave(review.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancel}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(review)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
          {editingReview === review.id ? (
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="mt-2"
            />
          ) : (
            <p className="text-gray-300">{review.review}</p>
          )}
          <div className="text-sm text-gray-400">
            {new Date(review.created_at).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MovieReviews;