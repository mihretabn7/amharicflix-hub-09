
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface GenreSuggestionsDisplayProps {
  movieId: string;
}

const GenreSuggestionsDisplay = ({ movieId }: GenreSuggestionsDisplayProps) => {
  const isMobile = useIsMobile();
  
  const { data: genreSuggestions } = useQuery({
    queryKey: ['genreSuggestions', movieId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('genre_suggestions')
        .select('suggested_genre, id')
        .eq('movie_id', movieId);

      if (error) throw error;

      // Count suggestions manually
      const counts = data.reduce((acc: Record<string, number>, curr) => {
        acc[curr.suggested_genre] = (acc[curr.suggested_genre] || 0) + 1;
        return acc;
      }, {});

      // Convert to array and sort by count
      return Object.entries(counts)
        .map(([genre, count]) => ({ suggested_genre: genre, count }))
        .sort((a, b) => b.count - a.count);
    }
  });

  if (!genreSuggestions?.length) return null;

  return (
    <div className={`space-y-2 mt-2 ${isMobile ? 'netflix-card p-3' : ''}`}>
      <h3 className="font-medium mb-2">Genre Suggestions</h3>
      {genreSuggestions.map((suggestion) => (
        <div key={suggestion.suggested_genre} className="flex justify-between">
          <span>{suggestion.suggested_genre}</span>
          <span className="text-gray-400">{suggestion.count} votes</span>
        </div>
      ))}
    </div>
  );
};

export default GenreSuggestionsDisplay;
