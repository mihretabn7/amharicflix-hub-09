import { Star, Clock, Film, Flag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface UserStatsProps {
  stats: {
    totalWatches: number;
    totalWatchTime: number; // in minutes
    averageRating: number;
    totalRatings: number;
    totalReports: number;
    favoriteGenre?: string;
    completionRate: number; // percentage of movies watched to completion
  };
}

export const UserStats = ({ stats }: UserStatsProps) => {
  const formatWatchTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Watch Time Card */}
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Watch Time</p>
              <h3 className="text-2xl font-bold mt-2">{formatWatchTime(stats.totalWatchTime)}</h3>
            </div>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-4">
            <div className="text-xs text-muted-foreground mb-1">
              {stats.totalWatches} movies watched
            </div>
            <Progress value={stats.completionRate} className="h-1" />
          </div>
        </CardContent>
      </Card>

      {/* Ratings Card */}
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
              <div className="flex items-baseline mt-2">
                <h3 className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</h3>
                <span className="text-sm text-muted-foreground ml-1">/5</span>
              </div>
            </div>
            <Star className="h-4 w-4 text-netflix-gold" />
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            {stats.totalRatings} ratings given
          </div>
        </CardContent>
      </Card>

      {/* Movies Card */}
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Movies Watched</p>
              <h3 className="text-2xl font-bold mt-2">{stats.totalWatches}</h3>
            </div>
            <Film className="h-4 w-4 text-muted-foreground" />
          </div>
          {stats.favoriteGenre && (
            <div className="mt-4 text-xs text-muted-foreground">
              Favorite Genre: {stats.favoriteGenre}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reports Card */}
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Reports Made</p>
              <h3 className="text-2xl font-bold mt-2">{stats.totalReports}</h3>
            </div>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Helping keep the platform safe
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
