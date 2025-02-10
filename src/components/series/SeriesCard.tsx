
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { SeriesWithEpisodes } from "@/types/movie";

interface SeriesCardProps {
    series: SeriesWithEpisodes;
}

const SeriesCard = ({ series }: SeriesCardProps) => {
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
    );
};

export default SeriesCard;
