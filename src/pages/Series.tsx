import { useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SeriesFilters from "@/components/series/SeriesFilters";
import MovieRow from "@/components/movie/MovieRow";
import { useSeries } from "@/hooks/useSeries";

const Series = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterGenre, setFilterGenre] = useState<string>("all");
    const [filterRating, setFilterRating] = useState<string>("all");
    const [sortBy, setSortBy] = useState<"latest" | "rating">("latest");

    const { data: series, isLoading } = useSeries({
        filterGenre,
        filterRating,
        sortBy
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
                            <SeriesFilters
                                filterGenre={filterGenre}
                                setFilterGenre={setFilterGenre}
                                filterRating={filterRating}
                                setFilterRating={setFilterRating}
                                sortBy={sortBy}
                                setSortBy={setSortBy}
                                genres={genres}
                            />
                        </div>
                        <MovieRow movies={filteredSeries} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Series;
