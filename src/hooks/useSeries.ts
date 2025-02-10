
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
            // First, get all unique series IDs
            const { data: seriesIds } = await supabase
                .from('movies')
                .select('series_id')
                .not('series_id', 'is', null)
                .not('series_id', 'eq', '')
                .is('is_hidden', false);

            if (!seriesIds?.length) return [];

            // Get unique series IDs
            const uniqueSeriesIds = [...new Set(seriesIds.map(item => item.series_id))];

            // Fetch the first episode of each series (which contains series info)
            let query = supabase
                .from('movies')
                .select(`
                    *,
                    movie_ratings (
                        rating
                    ),
                    episodes:movies!series_id(
                        *
                    )
                `)
                .in('id', uniqueSeriesIds)
                .is('is_hidden', false);

            if (filterGenre !== "all") {
                query = query.eq('genre', filterGenre);
            }

            const { data, error } = await query;
            if (error) throw error;

            const processedSeries = data?.map(series => {
                const seriesData = {
                    ...series,
                    episodeCount: series.episodes?.length || 0,
                    averageRating: series.movie_ratings?.length > 0
                        ? series.movie_ratings.reduce((acc: number, curr: any) => acc + curr.rating, 0) / series.movie_ratings.length
                        : 0
                };
                return seriesData as SeriesWithEpisodes;
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
