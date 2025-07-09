
import { Link } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Movie {
  id: string;
  title: string;
  thumbnail_url: string;
  averageRating?: number;
  duration_minutes?: number;
}

interface MovieRowProps {
  movies: Movie[];
  className?: string;
  itemClassName?: string;
}

export default function MovieRow({ movies, className = "", itemClassName = "" }: MovieRowProps) {
  if (!movies || movies.length === 0) {
    return null;
  }
  
  return (
    <ScrollArea className={cn("w-full overflow-x-auto", className)}>
      <div className="flex gap-3 py-1">
        {movies.map((movie) => (
          <Link to={`/movie/${movie.id}`} key={movie.id} className={cn("min-w-[130px] max-w-[180px] transition-transform duration-300 hover:scale-105", itemClassName, "group")}>
            <div className="relative rounded-lg overflow-hidden bg-card">
              <img
                src={movie.thumbnail_url}
                alt={movie.title}
                className="w-full aspect-[2/3] object-cover"
              />
              <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-2">
                <h3 className="text-xs font-medium line-clamp-2 text-white">{movie.title}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-3 w-3 text-netflix-gold" />
                  <span className="text-xs text-white">
                    {movie.averageRating !== undefined ? movie.averageRating.toFixed(1) : movie.duration_minutes ? `${movie.duration_minutes} min` : "-"}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {/* Invisible scroll bar */}
      <ScrollBar className="opacity-0 h-1" orientation="horizontal" />
    </ScrollArea>
  );
}
