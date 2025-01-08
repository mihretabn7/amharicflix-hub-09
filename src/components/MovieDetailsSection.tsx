import { Movie } from "@/types/movie";

interface MovieDetailsSectionProps {
  movie: Movie;
}

const MovieDetailsSection = ({ movie }: MovieDetailsSectionProps) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Movie Details</h2>
      <div className="space-y-4">
        <div>
          <h3 className="font-medium">Suggested Genres</h3>
          <GenreSuggestionsDisplay movieId={movie.id} />
        </div>
        <div>
          <h3 className="font-medium">Language</h3>
          <p className="text-gray-300">{movie.language}</p>
        </div>
        <div>
          <h3 className="font-medium">Added on</h3>
          <p className="text-gray-300">{new Date(movie.created_at).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailsSection;