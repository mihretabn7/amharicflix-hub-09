
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MOVIE_GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime",
  "Documentary", "Drama", "Family", "Fantasy", "Historical",
  "Horror", "Musical", "Mystery", "Romance", "Science Fiction",
  "Thriller", "War", "Western"
];

interface GenreSuggestionProps {
  movieId: string;
  userId: string;
  onSuggestionSubmit?: () => void;
}

const GenreSuggestion = ({ movieId, userId, onSuggestionSubmit }: GenreSuggestionProps) => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const handleSubmit = async () => {
    try {
      if (selectedGenres.length === 0) {
        toast.error("Please select at least one genre");
        return;
      }

      const promises = selectedGenres.map(genre => 
        supabase
          .from('genre_suggestions')
          .insert({
            movie_id: movieId,
            user_id: userId,
            suggested_genre: genre
          })
      );

      await Promise.all(promises);
      toast.success("Genre suggestions submitted!");
      setSelectedGenres([]);
      if (onSuggestionSubmit) onSuggestionSubmit();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {MOVIE_GENRES.map((genre) => (
          <div key={genre} className="flex items-center space-x-2">
            <Checkbox
              id={genre}
              checked={selectedGenres.includes(genre)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedGenres([...selectedGenres, genre]);
                } else {
                  setSelectedGenres(selectedGenres.filter((g) => g !== genre));
                }
              }}
            />
            <label
              htmlFor={genre}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {genre}
            </label>
          </div>
        ))}
      </div>
      <Button 
        type="button" 
        onClick={handleSubmit}
        disabled={selectedGenres.length === 0}
      >
        Submit Genre Suggestions
      </Button>
    </div>
  );
};

export default GenreSuggestion;
