
import { Card, CardContent } from "@/components/ui/card";
import { Star, MessageSquare } from "lucide-react";

interface UserStatsProps {
  stats: {
    averageRating: number;
    totalRatings: number;
    totalReports: number;
  };
}

export const UserStats = ({ stats }: UserStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Star className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
              <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Star className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Movies Rated</p>
              <p className="text-2xl font-bold">{stats.totalRatings}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <MessageSquare className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Reports Made</p>
              <p className="text-2xl font-bold">{stats.totalReports}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
