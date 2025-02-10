
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SeriesWithEpisodes } from "@/types/movie";

interface UseSeriesProps {
    filterGenre: string;
    filterRating: string;
    sortBy: "latest" | "rating";
}

export const useSeries = ({ filterGenre, filterRating, sortBy }: UseSeriesProps) => {
    return useQuery({
        queryKey: ['series', filterGenre, filterRating, sortBy],
        queryFn: async () => {
            // First, get all series (first episode of each series serves as series info)
            let query = supabase
                .from('movies')
                .select(`
                    *,
                    movie_ratings (
                        rating,
                        created_at
                    ),
                    episodes:movies!series_id(
                        *
                    )
                `)
                .is('episode_number', null) // Get only series headers
                .not('series_id', 'is', null) // Must be part of a series
                .is('is_hidden', false);

            if (filterGenre !== "all") {
                query = query.eq('genre', filterGenre);
            }

            const { data, error } = await query;
            if (error) throw error;

            const processedSeries = data?.map(series => {
                // Ensure episodes is always an array
                const episodes = Array.isArray(series.episodes) ? series.episodes : [];
                
                const seriesData = {
                    ...series,
                    episodes,
                    episodeCount: episodes.length,
                    movie_ratings: series.movie_ratings || [],
                    averageRating: series.movie_ratings?.length > 0
                        ? series.movie_ratings.reduce((acc: number, curr: any) => acc + curr.rating, 0) / series.movie_ratings.length
                        : 0
                } as SeriesWithEpisodes;
                
                return seriesData;
            }) || [];

            // Apply rating filter
            let filteredSeries = processedSeries;
            if (filterRating !== "all") {
                const minRating = parseInt(filterRating);
                filteredSeries = filteredSeries.filter(s => (s.averageRating || 0) >= minRating);
            }

            // Apply sorting
            if (sortBy === "rating") {
                filteredSeries.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
            } else {
                filteredSeries.sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
            }

            return filteredSeries;
        }
    });
};
