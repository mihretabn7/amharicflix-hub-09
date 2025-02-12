import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import MovieDetailsSection from "@/components/MovieDetailsSection";
import MovieHero from "@/components/movie/MovieHero";
import MoviePlayer from "@/components/movie/MoviePlayer";
import MovieStats from "@/components/movie/MovieStats";
import MovieRating from "@/components/MovieRating";
import MovieReviews from "@/components/MovieReviews";
import { format } from "date-fns";

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

      if (currentDuration % WATCH_TIME_UPDATE_INTERVAL === 0) {
        console.log('Updating watch history:', {
          userId: session.user.id,
          movieId: id,
          watchDuration: currentDuration,
          watchedAt: new Date().toISOString()
        });

        try {
          const { data: existingRecord, error: fetchError } = await supabase
            .from('user_movie_history')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('movie_id', id)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
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
            result = await supabase
              .from('user_movie_history')
              .update(watchData)
              .eq('id', existingRecord.id);
          } else {
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
      if (!viewStartTime) {
        setViewStartTime(new Date());
      }

      watchTimeInterval.current = setInterval(updateWatchTime, 1000);
    } else {
      if (watchTimeInterval.current) {
        clearInterval(watchTimeInterval.current);
      }
    }

    return () => {
      if (watchTimeInterval.current) {
        clearInterval(watchTimeInterval.current);
      }
    };
  }, [isPlaying, viewStartTime, session, id]);

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

  const totalWatchTime = (history[0]?.watch_duration || 0) + (isPlaying ? currentWatchDuration : 0);
  const watchCount = movie.watch_count || 0;
  const shareCount = movie.share_count || 0;

  const stats = {
    watchCount,
    shareCount,
    averageRating,
    totalWatchTime
  };

  return (
    <div className="min-h-screen pt-16">
      <div className="relative h-[70vh]">
        {isPlaying ? (
          <MoviePlayer
            movie={movie}
            userId={session?.user?.id}
            onRatingSubmit={refetch}
          />
        ) : (
          <MovieHero
            movie={movie}
            onPlay={() => {
              console.log('Play button clicked, setting isPlaying to true');
              setIsPlaying(true);
            }}
            onShare={handleShare}
            userId={session?.user?.id}
          />
        )}
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="space-y-8">
              <MovieStats {...stats} />
              <MovieRating
                movieId={movie.id}
                userId={session?.user?.id}
                onRatingSubmit={refetch}
              />
              <MovieReviews movieId={movie.id} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Movie Details</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm text-gray-400">Description</h3>
                  <p>{movie.description || 'No description available.'}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-400">Language</h3>
                  <p>{movie.language}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-400">Added on</h3>
                  <p>{format(new Date(movie.created_at), 'M/d/yyyy')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
