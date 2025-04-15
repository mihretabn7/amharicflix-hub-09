
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { SeriesWithEpisodes } from "@/types/movie";
import { useIsMobile } from "@/hooks/use-mobile";

interface SeriesCardProps {
    series: SeriesWithEpisodes;
}

const SeriesCard = ({ series }: SeriesCardProps) => {
    const isMobile = useIsMobile();
    
    return (
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
                {isMobile ? (
                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/90 to-transparent p-2">
                        <h3 className="text-sm font-medium line-clamp-2 text-white">{series.title}</h3>
                        <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-netflix-gold" />
                                <span className="text-xs text-white">
                                    {series.averageRating ? series.averageRating.toFixed(1) : 'No ratings'}
                                </span>
                            </div>
                            <span className="text-[10px] text-white/80">
                                {series.episodeCount} Eps
                            </span>
                        </div>
                    </div>
                ) : (
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
                )}
            </div>
        </Link>
    );
};

export default SeriesCard;
