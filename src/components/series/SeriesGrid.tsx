
import { SeriesWithEpisodes } from "@/types/movie";
import SeriesCard from "./SeriesCard";
import useIsMobile from "@/hooks/use-mobile";

interface SeriesGridProps {
    series: SeriesWithEpisodes[];
}

const SeriesGrid = ({ series }: SeriesGridProps) => {
    const isMobile = useIsMobile();
    
    if (series.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No series found matching your criteria.
            </div>
        );
    }

    return (
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4'}`}>
            {series.map((series) => (
                <SeriesCard key={series.id} series={series} />
            ))}
        </div>
    );
};

export default SeriesGrid;
