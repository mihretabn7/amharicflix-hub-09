import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, Star, Share2, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import MovieRating from "@/components/MovieRating";
import MovieDetailsSection from "@/components/MovieDetailsSection";
import MovieReportModal from "@/components/MovieReportModal";

const NETFLIX_VIEW_THRESHOLD = 120; // 2 minutes in seconds
const WATCH_TIME_UPDATE_INTERVAL = 10; // Update watch time every 10 seconds

const isValidUUID = (uuid: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [viewStartTime, setViewStartTime] = useState<Date | null>(null);
  const [currentWatchDuration, setCurrentWatchDuration] = useState(0);
  const watchTimeInterval = useRef<NodeJS.Timeout | null>(null);
  const viewCounted = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle watch time tracking
  useEffect(() => {
    const updateWatchTime = async () => {
      if (!session?.user?.id || !id || !isPlaying) {
        console.log('Watch time update skipped:', {
          hasSession: !!session?.user?.id,
          hasId: !!id,
          isPlaying
        });
        return;
      }

      const currentDuration = Math.floor((new Date().getTime() - (viewStartTime?.getTime() || 0)) / 1000);
      setCurrentWatchDuration(currentDuration);

      // Update watch history every WATCH_TIME_UPDATE_INTERVAL seconds
      if (currentDuration % WATCH_TIME_UPDATE_INTERVAL === 0) {
        console.log('Updating watch history:', {
          userId: session.user.id,
          movieId: id,
          watchDuration: currentDuration,
          watchedAt: new Date().toISOString()
        });

        try {
          // First check if a record exists
          const { data: existingRecord, error: fetchError } = await supabase
            .from('user_movie_history')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('movie_id', id)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no record found
            console.error('Error checking existing record:', fetchError);
            return;
          }

          const watchData = {
            user_id: session.user.id,
            movie_id: id,
            watch_duration: currentDuration,
            watched_at: new Date().toISOString()
          };

          let result;
          if (existingRecord) {
            // Update existing record
            result = await supabase
              .from('user_movie_history')
              .update(watchData)
              .eq('id', existingRecord.id);
          } else {
            // Insert new record
            result = await supabase
              .from('user_movie_history')
              .insert(watchData);
          }

          if (result.error) {
            console.error('Error updating watch history:', result.error);
            console.error('Error details:', {
              code: result.error.code,
              message: result.error.message,
              details: result.error.details,
              hint: result.error.hint
            });
          } else {
            console.log('Watch history updated successfully:', result.data);
          }
        } catch (error) {
          console.error('Exception updating watch time:', error);
        }
      }

      // Count view after NETFLIX_VIEW_THRESHOLD seconds (if not already counted)
      if (currentDuration >= NETFLIX_VIEW_THRESHOLD && !viewCounted.current) {
        console.log('Incrementing view count for movie:', id);
        try {
          const { error } = await supabase.rpc('increment_movie_watch_count', { movie_id: id });
          if (error) {
            console.error('Error incrementing view count:', error);
          } else {
            console.log('View count incremented successfully');
            viewCounted.current = true;
          }
        } catch (error) {
          console.error('Exception incrementing view count:', error);
        }
      }
    };

    if (isPlaying) {
      // Start tracking when video starts playing
      if (!viewStartTime) {
        setViewStartTime(new Date());
      }

      // Set up interval for watch time updates
      watchTimeInterval.current = setInterval(updateWatchTime, 1000);
    } else {
      // Clear interval when video stops playing
      if (watchTimeInterval.current) {
        clearInterval(watchTimeInterval.current);
      }
    }

    // Cleanup on unmount or when video stops
    return () => {
      if (watchTimeInterval.current) {
        clearInterval(watchTimeInterval.current);
      }
    };
  }, [isPlaying, viewStartTime, session, id]);

  // Add logging for isPlaying changes
  useEffect(() => {
    console.log('isPlaying state changed:', isPlaying);
    console.log('viewStartTime:', viewStartTime);
  }, [isPlaying, viewStartTime]);

  const { data: movieData, isLoading, error, refetch } = useQuery({
    queryKey: ['movie', id],
    queryFn: async () => {
      if (!id || !isValidUUID(id)) {
        toast.error("Invalid movie ID");
        navigate('/movies');
        throw new Error("Invalid movie ID");
      }

      const [movieResponse, ratingsResponse, historyResponse] = await Promise.all([
        supabase
          .from('movies')
          .select('*')
          .eq('id', id)
          .maybeSingle(),
        supabase
          .from('movie_ratings')
          .select('*')
          .eq('movie_id', id),
        session?.user?.id ? supabase
          .from('user_movie_history')
          .select('*')
          .eq('movie_id', id)
          .eq('user_id', session.user.id)
          .order('watched_at', { ascending: false })
          .limit(1)
          .maybeSingle() : null
      ]);

      if (movieResponse.error) throw movieResponse.error;
      if (!movieResponse.data) {
        toast.error("Movie not found");
        navigate('/movies');
        throw new Error("Movie not found");
      }

      if (movieResponse.data.verified_report_count >= 5) {
        toast.error("This movie is currently unavailable");
        navigate('/movies');
        throw new Error("Movie unavailable");
      }

      return {
        movie: movieResponse.data,
        ratings: ratingsResponse.data || [],
        history: historyResponse?.data ? [historyResponse.data] : []
      };
    },
  });

  const handleShare = async () => {
    try {
      if (id) {
        await supabase.rpc('increment_movie_share_count', { movie_id: id });
      }

      const shareData = {
        title: movieData?.movie.title || 'Movie',
        text: movieData?.movie.description || 'Check out this Ethiopian movie!',
        url: window.location.href
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('Shared successfully!');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      } catch (clipboardError) {
        toast.error('Failed to share or copy link');
      }
    }
  };

  if (isLoading) {
    return <div className="min-h-screen pt-16 flex items-center justify-center">Loading...</div>;
  }

  if (error || !movieData) {
    return <div className="min-h-screen pt-16">Error loading movie details</div>;
  }

  const { movie, ratings, history } = movieData;
  const averageRating = ratings.length > 0
    ? ratings.reduce((acc: number, curr: any) => acc + curr.rating, 0) / ratings.length
    : 0;

  // Get the total watch time from history plus current session
  const totalWatchTime = (history[0]?.watch_duration || 0) + (isPlaying ? currentWatchDuration : 0);
  const watchCount = movie.watch_count || 0;
  const shareCount = movie.share_count || 0;

  return (
    <div className="min-h-screen pt-16">
      <div className="relative h-[70vh]">
        {isPlaying ? (
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
            {session && (
              <div className="bg-card p-4 border-t border-border space-y-6">
                <MovieRating
                  movieId={movie.id}
                  userId={session.user.id}
                  onRatingSubmit={refetch}
                />
                <div className="flex justify-end">
                  <MovieReportModal
                    movieId={movie.id}
                    userId={session.user.id}
                  />
                </div>
              </div>
            )}
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
                  <span>{movie.genre || 'Genre pending'}</span>
                  <span>{movie.language || 'Amharic'}</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span>{averageRating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Button
                    size="lg"
                    className="bg-netflix-red hover:bg-netflix-red/90"
                    onClick={() => {
                      console.log('Play button clicked, setting isPlaying to true');
                      setIsPlaying(true);
                    }}
                  >
                    <Play className="mr-2 h-5 w-5" /> Play Now
                  </Button>
                  <Button size="lg" variant="outline" onClick={handleShare}>
                    <Share2 className="mr-2 h-5 w-5" /> Share
                  </Button>
                  {session && (
                    <MovieReportModal
                      movieId={movie.id}
                      userId={session.user.id}
                    />
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            {!isPlaying && session && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-card p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-netflix-gold">
                      <Eye className="w-5 h-5" />
                      <span>{watchCount} views</span>
                    </div>
                  </div>
                  <div className="bg-card p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-netflix-gold">
                      <Share2 className="w-5 h-5" />
                      <span>{shareCount} shares</span>
                    </div>
                  </div>
                  <div className="bg-card p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-netflix-gold">
                      <Star className="w-5 h-5" />
                      <span>{averageRating.toFixed(1)} rating</span>
                    </div>
                  </div>
                  <div className="bg-card p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-netflix-gold">
                      <Clock className="w-5 h-5" />
                      <span>{Math.floor(totalWatchTime / 60)}m watched</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div>
            <MovieDetailsSection movie={movie} userId={session?.user?.id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
