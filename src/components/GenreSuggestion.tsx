
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Check } from "lucide-react";
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
  const [showAddGenre, setShowAddGenre] = useState(false);
  const [customGenre, setCustomGenre] = useState("");

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre) 
        : [...prev, genre]
    );
  };

  const handleSubmit = async () => {
    try {
      if (selectedGenres.length === 0) {
        toast.error("Please select at least one genre");
        return;
      }

      // Submit each selected genre to the database
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

  const addCustomGenre = async () => {
    if (customGenre.trim()) {
      try {
        await supabase
          .from('genre_suggestions')
          .insert({
            movie_id: movieId,
            user_id: userId,
            suggested_genre: customGenre.trim()
          });
        
        toast.success("Custom genre added!");
        setCustomGenre("");
        setShowAddGenre(false);
        
        if (onSuggestionSubmit) onSuggestionSubmit();
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-3">What genres would you suggest?</h2>
        <p className="text-white/70 text-sm mb-4">
          Help other viewers find this title by suggesting genres that best describe it.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {MOVIE_GENRES.map((genre) => (
            <Badge
              key={genre}
              variant="outline"
              className={`
                cursor-pointer text-sm py-1.5 px-3 
                ${
                  selectedGenres.includes(genre)
                    ? "bg-[#0072d2] text-white border-transparent"
                    : "bg-white/10 hover:bg-white/20 text-white border-none"
                }
              `}
              onClick={() => toggleGenre(genre)}
            >
              {selectedGenres.includes(genre) && <Check className="h-3.5 w-3.5 mr-1" />}
              {genre}
            </Badge>
          ))}
        </div>

        {showAddGenre ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customGenre}
              onChange={(e) => setCustomGenre(e.target.value)}
              placeholder="Enter a genre..."
              className="bg-[#1a2035] border-[#2a3050] text-white placeholder:text-white/50 rounded-md px-3 py-2 flex-1"
            />
            <Button onClick={addCustomGenre} className="bg-[#0072d2] hover:bg-[#0072d2]/90">
              Add
            </Button>
            <Button variant="ghost" onClick={() => setShowAddGenre(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={selectedGenres.length === 0}
            className="mr-2"
          >
            Submit Genre Suggestions
          </Button>
        )}

        {!showAddGenre && (
          <Button
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
            onClick={() => setShowAddGenre(true)}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Suggest a genre
          </Button>
        )}
      </div>
    </div>
  );
};

export default GenreSuggestion;
