import { useState } from "react";
import { useParams } from "react-router-dom";
import { Play, Star, MessageSquare, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const MovieDetail = () => {
  const { id } = useParams();
  const [isPlaying, setIsPlaying] = useState(false);

  const { data: movie, isLoading, error } = useQuery({
    queryKey: ['movie', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="min-h-screen pt-16 flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    toast.error("Error loading movie details");
    return <div className="min-h-screen pt-16">Error loading movie details</div>;
  }

  if (!movie) {
    return <div className="min-h-screen pt-16">Movie not found</div>;
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="relative h-[70vh]">
        {isPlaying ? (
          <div className="absolute inset-0 bg-black">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${movie.youtube_id}?autoplay=1`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        ) : (
          <>
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${movie.thumbnail_url})`
              }}
            >
              <div className="hero-gradient" />
            </div>
            <div className="relative h-full flex items-center">
              <div className="container mx-auto px-4">
                <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">
                  {movie.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-300 mb-6">
                  <span>{new Date(movie.created_at).getFullYear()}</span>
                  <span>{movie.genre || 'Drama'}</span>
                  <span>{movie.language || 'Amharic'}</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-netflix-gold mr-1" />
                    <span>New</span>
                  </div>
                </div>
                <p className="text-lg text-gray-300 mb-8 max-w-xl">
                  {movie.description || 'No description available.'}
                </p>
                <div className="flex space-x-4">
                  <Button 
                    size="lg" 
                    className="bg-netflix-red hover:bg-netflix-red/90"
                    onClick={() => setIsPlaying(true)}
                  >
                    <Play className="mr-2 h-5 w-5" /> Play Now
                  </Button>
                  <Button size="lg" variant="outline">
                    <MessageSquare className="mr-2 h-5 w-5" /> Comments
                  </Button>
                  <Button size="lg" variant="outline">
                    <Share2 className="mr-2 h-5 w-5" /> Share
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold mb-4">About the Movie</h2>
            <p className="text-gray-300">
              {movie.description || 'No description available.'}
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-4">Movie Details</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Genre</h3>
                <p className="text-gray-300">{movie.genre || 'Not specified'}</p>
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
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;