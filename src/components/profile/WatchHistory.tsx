import { formatDistanceToNow } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Play, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface WatchHistoryItem {
  id: string;
  watch_duration: number;
  watched_at: string;
  movie: {
    id: string;
    title: string;
    thumbnail_url: string;
    duration_minutes: number | null;
  };
}

interface WatchHistoryProps {
  items: WatchHistoryItem[];
}

export const WatchHistory = ({ items }: WatchHistoryProps) => {
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No watch history yet. Start watching movies to see them here!
      </div>
    );
  }

  // Deduplicate movies by keeping only the most recent watch record for each movie
  const uniqueMovies = items.reduce<Record<string, WatchHistoryItem>>((acc, item) => {
    const existingItem = acc[item.movie.id];
    
    if (!existingItem || new Date(item.watched_at) > new Date(existingItem.watched_at)) {
      acc[item.movie.id] = item;
    }
    
    return acc;
  }, {});

  const uniqueItems = Object.values(uniqueMovies);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {uniqueItems.map((item) => {
        const progress = item.movie.duration_minutes
          ? (item.watch_duration / (item.movie.duration_minutes * 60)) * 100
          : 0;

        return (
          <div
            key={item.id}
            className="group relative overflow-hidden rounded-lg bg-card hover:shadow-xl transition-all duration-300"
          >
            <div className="aspect-video relative overflow-hidden">
              <img
                src={item.movie.thumbnail_url}
                alt={item.movie.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

              {/* Watch Duration Overlay */}
              <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded-md text-xs flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {Math.floor(item.watch_duration / 60)}m
              </div>

              {/* Play Button Overlay */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute inset-0 m-auto w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                onClick={() => navigate(`/movie/${item.movie.id}`)}
              >
                <Play className="w-6 h-6" />
              </Button>
            </div>

            <div className="p-4">
              <h3 className="font-medium line-clamp-1 mb-2">{item.movie.title}</h3>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-1" />

                <p className="text-xs text-muted-foreground mt-2">
                  Watched {formatDistanceToNow(new Date(item.watched_at))} ago
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
