
import { Movie } from "@/types/movie";
import MovieRating from "@/components/MovieRating";
import MovieReportModal from "@/components/MovieReportModal";

interface MoviePlayerProps {
  movie: Movie;
  userId?: string;
  onRatingSubmit: () => void;
}

const MoviePlayer = ({ movie, userId, onRatingSubmit }: MoviePlayerProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow bg-black">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${movie.youtube_id}?autoplay=1`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
      {userId && (
        <div className="bg-card p-4 border-t border-border space-y-6">
          <MovieRating
            movieId={movie.id}
            userId={userId}
            onRatingSubmit={onRatingSubmit}
          />
          <div className="flex justify-end">
            <MovieReportModal
              movieId={movie.id}
              userId={userId}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MoviePlayer;
