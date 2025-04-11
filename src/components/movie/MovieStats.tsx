
import { Eye, Share2, Star, Clock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface MovieStatsProps {
  watchCount: number;
  shareCount: number;
  averageRating: number;
  totalWatchTime: number;
}

const MovieStats = ({ watchCount, shareCount, averageRating, totalWatchTime }: MovieStatsProps) => {
  const isMobile = useIsMobile();

  return (
    <div className={isMobile ? "netflix-stats mb-6" : ""}>
      <h3 className={isMobile ? "netflix-row-title text-xl mb-3" : "text-lg font-semibold mb-4"}>Stats</h3>
      <div className={isMobile ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 md:grid-cols-4 gap-4"}>
        <div className={isMobile ? "netflix-card p-3" : "bg-card p-4 rounded-lg"}>
          <div className="flex items-center gap-2 text-netflix-gold">
            <Eye className="w-5 h-5" />
            <span className={isMobile ? "text-sm" : ""}>{watchCount.toLocaleString()} views</span>
          </div>
        </div>
        <div className={isMobile ? "netflix-card p-3" : "bg-card p-4 rounded-lg"}>
          <div className="flex items-center gap-2 text-netflix-gold">
            <Share2 className="w-5 h-5" />
            <span className={isMobile ? "text-sm" : ""}>{shareCount.toLocaleString()} shares</span>
          </div>
        </div>
        <div className={isMobile ? "netflix-card p-3" : "bg-card p-4 rounded-lg"}>
          <div className="flex items-center gap-2 text-netflix-gold">
            <Star className="w-5 h-5" />
            <span className={isMobile ? "text-sm" : ""}>{averageRating.toFixed(1)} rating</span>
          </div>
          {isMobile && averageRating > 0 && (
            <div className="netflix-progress mt-2">
              <div 
                className="netflix-progress-fill" 
                style={{ width: `${(averageRating / 5) * 100}%` }}
              ></div>
            </div>
          )}
        </div>
        <div className={isMobile ? "netflix-card p-3" : "bg-card p-4 rounded-lg"}>
          <div className="flex items-center gap-2 text-netflix-gold">
            <Clock className="w-5 h-5" />
            <span className={isMobile ? "text-sm" : ""}>{Math.floor(totalWatchTime / 60)}m watched</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieStats;
