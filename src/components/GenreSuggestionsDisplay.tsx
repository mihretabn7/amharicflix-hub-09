
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GenreSuggestionsDisplayProps {
  movieId: string;
}

const GenreSuggestionsDisplay = ({ movieId }: GenreSuggestionsDisplayProps) => {
  const { data: genreSuggestions } = useQuery({
    queryKey: ['genreSuggestions', movieId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('genre_suggestions')
        .select('suggested_genre, id')
        .eq('movie_id', movieId);

      if (error) throw error;

      // Count suggestions manually and get top 3
      const counts = data.reduce((acc: Record<string, number>, curr) => {
        acc[curr.suggested_genre] = (acc[curr.suggested_genre] || 0) + 1;
        return acc;
      }, {});

      // Convert to array and sort by count, limit to top 3
      return Object.entries(counts)
        .map(([genre, count]) => ({ suggested_genre: genre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    }
  });

  if (!genreSuggestions?.length) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Top suggested genres:</h4>
      <div className="flex flex-wrap gap-2">
        {genreSuggestions.map((suggestion) => (
          <div 
            key={suggestion.suggested_genre} 
            className="bg-background/10 px-2 py-1 rounded text-sm"
          >
            {suggestion.suggested_genre}
            <span className="text-muted-foreground ml-1">({suggestion.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GenreSuggestionsDisplay;
