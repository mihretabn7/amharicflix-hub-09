import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import MovieDetailsSection from "@/components/MovieDetailsSection";
import MovieHero from "@/components/movie/MovieHero";
import MoviePlayer from "@/components/movie/MoviePlayer";
import MovieStats from "@/components/movie/MovieStats";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Facebook, Linkedin, Twitter, Link, Mail } from "lucide-react";

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
  const [showShareDialog, setShowShareDialog] = useState(false);
  const watchTimeInterval = useRef<NodeJS.Timeout | null>(null);
  const viewCounted = useRef(false);
  const isMobile = useIsMobile();

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
      if (!id || !isPlaying) {
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
          userId: session?.user?.id,
          movieId: id,
          watchDuration: currentDuration,
          watchedAt: new Date().toISOString()
        });

        try {
          const browserInfo = navigator.userAgent;
          const deviceInfo = {
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            platform: navigator.platform,
            vendor: navigator.vendor,
            isMobile: window.innerWidth < 768
          };

          let ip = null;
          try {
            const response = await fetch('/api/ipinfo');
            if (!response.ok) {
              throw new Error('Failed to fetch IP info');
            }
            const data = await response.json();
            ip = data.ip;
          } catch (ipError) {
            console.error('Failed to get IP:', ipError);
          }

          if (session?.user?.id) {
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
              watched_at: new Date().toISOString(),
              browser_info: browserInfo,
              device_info: JSON.stringify(deviceInfo)
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
            } else {
              console.log('Watch history updated successfully:', result.data);
            }
          } else if (ip) {
            try {
              await supabase.rpc('track_movie_view_with_country', {
                p_movie_id: id,
                p_user_id: null,
                p_user_ip: ip,
                p_browser_info: browserInfo,
                p_device_info: JSON.stringify(deviceInfo)
              });
              console.log('Anonymous view tracked successfully');
            } catch (error) {
              console.error('Error tracking anonymous view:', error);
            }
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

  const handleShare = async (platform?: string) => {
    if (!id) return;
    
    try {
      const browserInfo = navigator.userAgent;
      const deviceInfo = {
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        platform: navigator.platform,
        vendor: navigator.vendor,
        isMobile: window.innerWidth < 768
      };
      
      let ip = null;
      try {
        const response = await fetch('/api/ipinfo');
        if (!response.ok) {
          throw new Error('Failed to fetch IP info');
        }
        const data = await response.json();
        ip = data.ip;
      } catch (ipError) {
        console.error('Failed to get IP:', ipError);
      }
      
      try {
        await supabase.rpc('track_movie_share', { 
          p_movie_id: id,
          p_user_id: session?.user?.id || null,
          p_share_method: platform || 'dialog',
          p_user_ip: ip,
          p_browser_info: browserInfo,
          p_device_info: JSON.stringify(deviceInfo)
        });
      } catch (error) {
        console.error('Error tracking share:', error);
        await supabase.rpc('increment_movie_share_count', { movie_id: id });
      }
      
      const shareUrl = window.location.href;
      const shareTitle = movieData?.movie.title || 'Movie';
      const shareText = movieData?.movie.description || 'Check out this Ethiopian movie!';
      
      if (platform) {
        let shareLink = '';
        
        switch (platform) {
          case 'facebook':
            shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
            break;
          case 'twitter':
            shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
            break;
          case 'linkedin':
            shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
            break;
          case 'whatsapp':
            shareLink = `https://wa.me/?text=${encodeURIComponent(`${shareTitle}: ${shareUrl}`)}`;
            break;
          case 'email':
            shareLink = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
            break;
          case 'copy':
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Link copied to clipboard!');
            return;
          default:
            break;
        }
        
        if (shareLink) {
          window.open(shareLink, '_blank', 'noopener,noreferrer');
          toast.success(`Shared on ${platform}!`);
        }
      } else {
        if (navigator.share && navigator.canShare) {
          try {
            const shareData = {
              title: shareTitle,
              text: shareText,
              url: shareUrl
            };
            
            if (navigator.canShare(shareData)) {
              await navigator.share(shareData);
              toast.success('Shared successfully!');
              setShowShareDialog(false);
              return;
            }
          } catch (error) {
            console.error('Error with navigator.share:', error);
          }
        }
        
        setShowShareDialog(true);
      }
    } catch (error) {
      console.error('Error during share operation:', error);
      toast.error('Failed to share. Please try again.');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
      setShowShareDialog(false);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link. Please try manually.');
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

  return (
    <div className={`min-h-screen ${isMobile ? 'pt-0 netflix-movie-detail' : 'pt-16'}`}>
      <div className={`relative ${isMobile ? 'h-[60vh]' : 'h-[70vh]'}`}>
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

      <div className={`container mx-auto px-4 py-6 ${isMobile ? 'pb-20 netflix-content' : 'py-12'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          <div className="md:col-span-2">
            {!isPlaying && (
              <div className="space-y-4 md:space-y-8">
                <MovieStats
                  watchCount={watchCount}
                  shareCount={shareCount}
                  averageRating={averageRating}
                  totalWatchTime={totalWatchTime}
                />
              </div>
            )}
          </div>
          <div>
            <MovieDetailsSection movie={movie} userId={session?.user?.id} />
          </div>
        </div>
      </div>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className={`${isMobile ? 'w-[90%] netflix-modal' : 'sm:max-w-md'} rounded-xl`}>
          <DialogHeader>
            <DialogTitle>Share this movie</DialogTitle>
            <DialogDescription>
              Choose how you'd like to share "{movie.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 p-4" 
              onClick={() => handleShare('facebook')}
            >
              <Facebook className="h-5 w-5" />
              <span className="text-xs">Facebook</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 p-4" 
              onClick={() => handleShare('twitter')}
            >
              <Twitter className="h-5 w-5" />
              <span className="text-xs">Twitter</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 p-4" 
              onClick={() => handleShare('whatsapp')}
            >
              <Link className="h-5 w-5" />
              <span className="text-xs">WhatsApp</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 p-4" 
              onClick={() => handleShare('linkedin')}
            >
              <Linkedin className="h-5 w-5" />
              <span className="text-xs">LinkedIn</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 p-4" 
              onClick={() => handleShare('email')}
            >
              <Mail className="h-5 w-5" />
              <span className="text-xs">Email</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 p-4" 
              onClick={handleCopyLink}
            >
              <Copy className="h-5 w-5" />
              <span className="text-xs">Copy Link</span>
            </Button>
          </div>
          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MovieDetail;