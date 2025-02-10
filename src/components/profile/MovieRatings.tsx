
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { formatDateTime } from "@/utils/date-utils";

interface MovieWithRating {
  id: string;
  title: string;
  thumbnail_url: string;
  created_at: string;
  movie_ratings: {
    rating: number;
    created_at: string;
  }[];
}

export const MovieRatings = ({ movies }: { movies: MovieWithRating[] }) => {
  return (
    <div className="grid gap-4 mt-4">
      {movies?.map((movie) => (
        <Link to={`/movie/${movie.id}`} key={movie.id}>
          <Card className="transition-colors hover:bg-accent">
            <CardContent className="pt-4">
              <div className="flex gap-4">
                <img
                  src={movie.thumbnail_url}
                  alt={movie.title}
                  className="w-32 h-20 object-cover rounded-md"
                />
                <div>
                  <h3 className="font-medium">{movie.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span>{movie.movie_ratings[0]?.rating || 0}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Rated on {formatDateTime(movie.movie_ratings[0]?.created_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};
