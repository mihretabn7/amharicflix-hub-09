import { useState } from "react";
import { Search, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
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
        <div className="min-h-screen pt-14">
            {/* Header Section */}
            <section className="py-8 md:py-12 bg-gradient-to-b from-background/95 to-background border-b border-border/10">
                <div className="container mx-auto px-4 md:px-6 lg:px-8">
                    <div className="space-y-6">
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
                                Discover Series
                            </h1>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto md:mx-0">
                                Binge-watch your favorite Ethiopian and international series
                            </p>
                        </div>
                        
                        {/* Search and Filter Section */}
                        <div className="flex gap-3 items-center">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search series..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 border-border/20 bg-background/50 backdrop-blur-sm"
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
                    </div>
                </div>
            </section>

            {/* Series Grid Section */}
            <section className="py-12 md:py-16">
                <div className="container mx-auto px-4 md:px-6 lg:px-8">
                    {filteredSeries.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="max-w-md mx-auto space-y-4">
                                <p className="text-xl text-muted-foreground">No series found matching your criteria.</p>
                                <Button 
                                    variant="outline" 
                                    onClick={() => {
                                        setSearchQuery("");
                                        setFilterGenre("all");
                                        setFilterRating("all");
                                    }}
                                    className="hover:bg-primary hover:text-primary-foreground"
                                >
                                    Clear All Filters
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Showing {filteredSeries.length} series
                                </p>
                                <div className="text-sm text-muted-foreground">
                                    Sorted by {sortBy === 'latest' ? 'Latest' : 'Rating'}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                                {filteredSeries.map((series) => (
                                    <Link
                                        to={`/series/${series.id}`}
                                        key={series.id}
                                        className="group animate-fade-in hover:scale-105 transition-transform duration-300"
                                    >
                                        <div className="aspect-[2/3] bg-card rounded-lg overflow-hidden relative shadow-lg hover:shadow-xl transition-shadow duration-300">
                                            <img
                                                src={series.thumbnail_url}
                                                alt={series.title}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                                <h3 className="text-sm md:text-base font-semibold line-clamp-2 text-white mb-1">{series.title}</h3>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1">
                                                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                                        <span className="text-xs text-white/90">
                                                            {series.averageRating ? series.averageRating.toFixed(1) : 'New'}
                                                        </span>
                                                    </div>
                                                    {series.genre && (
                                                        <span className="text-xs text-white/70 bg-black/30 px-2 py-0.5 rounded">
                                                            {series.genre}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Series;
