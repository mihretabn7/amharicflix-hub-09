
import { Link } from "react-router-dom";
import { formatDateTime } from "@/utils/date-utils";

interface WatchHistoryItemProps {
  id: string;
  movie: {
    id: string;
    title: string;
    thumbnail_url: string;
    duration_minutes?: number;
  };
  watch_duration: number;
  watched_at: string;
}

export const WatchHistory = ({ items }: { items: WatchHistoryItemProps[] }) => {
  return (
    <div className="grid gap-4 mt-4">
      {items && items.length > 0 ? (
        items.map((item) => (
          <Link
            key={item.id}
            to={`/movie/${item.movie.id}`}
            className="group relative aspect-video overflow-hidden rounded-lg"
          >
            <img
              src={item.movie.thumbnail_url}
              alt={item.movie.title}
              className="object-cover w-full h-full transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 p-4 w-full">
              <h3 className="font-medium text-white mb-1">{item.movie.title}</h3>
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span>{Math.floor(item.watch_duration / 60)}m watched</span>
                <span>{formatDateTime(item.watched_at)}</span>
              </div>
              {item.movie.duration_minutes && (
                <div className="mt-2">
                  <div className="h-1 bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-netflix-red"
                      style={{
                        width: `${Math.min(
                          100,
                          (item.watch_duration / (item.movie.duration_minutes * 60)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Link>
        ))
      ) : (
        <div className="col-span-full text-center py-8 text-muted-foreground">
          No watch history yet
        </div>
      )}
    </div>
  );
};
