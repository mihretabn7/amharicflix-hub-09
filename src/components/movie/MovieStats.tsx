
import { Eye, Share2, Star, Clock } from "lucide-react";

interface MovieStatsProps {
  watchCount: number;
  shareCount: number;
  averageRating: number;
  totalWatchTime: number;
}

const MovieStats = ({ watchCount, shareCount, averageRating, totalWatchTime }: MovieStatsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-card p-4 rounded-lg">
        <div className="flex items-center gap-2 text-netflix-gold">
          <Eye className="w-5 h-5" />
          <span>{watchCount} views</span>
        </div>
      </div>
      <div className="bg-card p-4 rounded-lg">
        <div className="flex items-center gap-2 text-netflix-gold">
          <Share2 className="w-5 h-5" />
          <span>{shareCount} shares</span>
        </div>
      </div>
      <div className="bg-card p-4 rounded-lg">
        <div className="flex items-center gap-2 text-netflix-gold">
          <Star className="w-5 h-5" />
          <span>{averageRating.toFixed(1)} rating</span>
        </div>
      </div>
      <div className="bg-card p-4 rounded-lg">
        <div className="flex items-center gap-2 text-netflix-gold">
          <Clock className="w-5 h-5" />
          <span>{Math.floor(totalWatchTime / 60)}m watched</span>
        </div>
      </div>
    </div>
  );
};

export default MovieStats;
