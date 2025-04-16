
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { MOVIE_GENRES } from "@/constants/genres";

interface GenreSuggestionProps {
  movieId: string;
  userId: string;
  onSuggestionSubmit?: () => void;
}

const GenreSuggestion = ({ movieId, userId, onSuggestionSubmit }: GenreSuggestionProps) => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const isMobile = useIsMobile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedGenres.length === 0) {
      toast.error("Please select at least one genre");
      return;
    }

    try {
      // Submit each selected genre
      await Promise.all(
        selectedGenres.map(genre =>
          supabase
            .from('genre_suggestions')
            .insert({
              movie_id: movieId,
              user_id: userId,
              suggested_genre: genre
            })
        )
      );

      toast.success("Genre suggestions submitted!");
      setSelectedGenres([]);
      if (onSuggestionSubmit) onSuggestionSubmit();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(current =>
      current.includes(genre)
        ? current.filter(g => g !== genre)
        : [...current, genre]
    );
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${isMobile ? 'netflix-card' : ''}`}>
      <div className="text-sm font-medium mb-2">Suggest genres that fit this movie:</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {MOVIE_GENRES.map((genre) => (
          <div key={genre} className="flex items-center space-x-2">
            <Checkbox
              id={genre}
              checked={selectedGenres.includes(genre)}
              onCheckedChange={() => toggleGenre(genre)}
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
      <Button type="submit" className={isMobile ? 'w-full' : ''}>
        Submit Suggestions ({selectedGenres.length})
      </Button>
    </form>
  );
};

export default GenreSuggestion;
