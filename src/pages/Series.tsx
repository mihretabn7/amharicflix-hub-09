import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/types/movie";
import { Star, MessageSquare, Search, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface SeriesWithEpisodes extends Movie {
  episodes?: Movie[];
}

const Series = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterGenre, setFilterGenre] = useState<string>("all");
    const [filterRating, setFilterRating] = useState<string>("all");
    const [sortBy, setSortBy] = useState<"latest" | "rating">("latest");

    const { data: series, isLoading } = useQuery({
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
                    id,
                    title,
                    description,
                    thumbnail_url,
                    genre,
                    language,
                    created_at,
                    movie_ratings (
                        rating
                    ),
                    episodes:movies!series_id(
                        id,
                        title,
                        episode_number
                    )
                `)
                .in('id', uniqueSeriesIds)
                .is('is_hidden', false);

            if (filterGenre !== "all") {
                query = query.eq('genre', filterGenre);
            }

            const { data, error } = await query;
            if (error) throw error;

            const processedSeries = (data?.map(series => ({
                ...series,
                episodeCount: Array.isArray(series.episodes) ? series.episodes.length : 0,
                averageRating: series.movie_ratings?.length > 0
                    ? series.movie_ratings.reduce((acc: number, curr: any) => acc + curr.rating, 0) / series.movie_ratings.length
                    : 0
            })) || []) as SeriesWithEpisodes[];

            // Apply rating filter
            let filteredSeries = processedSeries;
            if (filterRating !== "all") {
                const minRating = parseInt(filterRating);
                filteredSeries = filteredSeries.filter(s => s.averageRating >= minRating);
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

    const { data: genres } = useQuery({
        queryKey: ['series-genres'],
        queryFn: async () => {
            const { data } = await supabase
                .from('movies')
                .select('genre')
                .not('series_id', 'is', null)
                .not('genre', 'is', null);

            return [...new Set(data?.map(m => m.genre))] as string[];
        }
    });

    const filteredSeries = (series || []).filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (s.genre?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return <div className="min-h-screen bg-netflix-dark pt-24 flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-netflix-dark pt-24">
            <Card className="container mx-auto px-6">
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold">Series</h1>
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search series..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon">
                                        <Filter className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[200px]">
                                    <div className="p-2 space-y-2">
                                        <div>
                                            <label className="text-sm font-medium">Genre</label>
                                            <Select value={filterGenre} onValueChange={setFilterGenre}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="All Genres" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Genres</SelectItem>
                                                    {genres?.map((genre) => (
                                                        <SelectItem key={genre} value={genre}>
                                                            {genre}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Rating</label>
                                            <Select value={filterRating} onValueChange={setFilterRating}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="All Ratings" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Ratings</SelectItem>
                                                    <SelectItem value="4">4+ Stars</SelectItem>
                                                    <SelectItem value="3">3+ Stars</SelectItem>
                                                    <SelectItem value="2">2+ Stars</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Sort By</label>
                                            <Select value={sortBy} onValueChange={(value: "latest" | "rating") => setSortBy(value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sort By" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="latest">Latest</SelectItem>
                                                    <SelectItem value="rating">Rating</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {filteredSeries.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No series found matching your criteria.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {filteredSeries.map((series) => (
                                    <Link
                                        to={`/series/${series.id}`}
                                        key={series.id}
                                        className="movie-card group animate-fade-in"
                                    >
                                        <div className="aspect-[2/3] bg-card rounded-md overflow-hidden relative">
                                            <img
                                                src={series.thumbnail_url}
                                                alt={series.title}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                            />
                                            <div className="movie-card-overlay">
                                                <div className="absolute bottom-0 p-4 w-full">
                                                    <h3 className="text-sm font-medium mb-2 line-clamp-2">{series.title}</h3>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <Star className="h-4 w-4 text-netflix-gold" />
                                                            <span className="text-sm">
                                                                {series.averageRating ? series.averageRating.toFixed(1) : 'No ratings'}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-netflix-gray">
                                                            {series.episodeCount} Episodes
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Series;
