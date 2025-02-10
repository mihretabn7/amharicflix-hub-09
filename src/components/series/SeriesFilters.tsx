
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SeriesFiltersProps {
    filterGenre: string;
    setFilterGenre: (value: string) => void;
    filterRating: string;
    setFilterRating: (value: string) => void;
    sortBy: "latest" | "rating";
    setSortBy: (value: "latest" | "rating") => void;
    genres?: string[];
}

const SeriesFilters = ({
    filterGenre,
    setFilterGenre,
    filterRating,
    setFilterRating,
    sortBy,
    setSortBy,
    genres,
}: SeriesFiltersProps) => {
    return (
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
    );
};

export default SeriesFilters;
