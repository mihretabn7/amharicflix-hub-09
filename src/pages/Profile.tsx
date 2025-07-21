import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { UserStats } from "@/components/profile/UserStats";
import { WatchHistory } from "@/components/profile/WatchHistory";
import { MovieRatings } from "@/components/profile/MovieRatings";
import { MovieReports } from "@/components/profile/MovieReports";
import { FeedbackDialog } from "@/components/profile/FeedbackDialog";
import { SupportDialog } from "@/components/profile/SupportDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import MovieRow from "@/components/movie/MovieRow";

const Profile = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login');
        return;
      }
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['profile', session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user?.id)
        .single();

      if (error) throw error;
      return data;
    }
  });

  const { data: ratedMovies } = useQuery({
    queryKey: ['rated-movies', session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movie_ratings')
        .select(`
          rating,
          created_at,
          movies (
            id,
            title,
            thumbnail_url,
            created_at
          )
        `)
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((item) => ({
        ...item.movies,
        movie_ratings: [{
          rating: item.rating,
          created_at: item.created_at
        }]
      }));
    }
  });

  const { data: reportedMovies } = useQuery({
    queryKey: ['reported-movies', session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movie_reports')
        .select(`
          id,
          reason,
          created_at,
          status,
          movie:movies (
            id,
            title,
            thumbnail_url
          )
        `)
        .eq('reporter_id', session?.user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const { data: userStats } = useQuery({
    queryKey: ['user-stats', session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const [ratingsResponse, reportsResponse, watchHistoryResponse] = await Promise.all([
        supabase
          .from('movie_ratings')
          .select('rating')
          .eq('user_id', session?.user?.id),
        supabase
          .from('movie_reports')
          .select('id')
          .eq('reporter_id', session?.user?.id),
        supabase
          .from('user_movie_history')
          .select('watch_duration, movie:movies(duration_minutes, id)')
          .eq('user_id', session?.user?.id)
      ]);

      if (ratingsResponse.error) throw ratingsResponse.error;
      if (reportsResponse.error) throw reportsResponse.error;
      if (watchHistoryResponse.error) throw watchHistoryResponse.error;

      const averageRating = ratingsResponse.data.length > 0
        ? ratingsResponse.data.reduce((acc, curr) => acc + curr.rating, 0) / ratingsResponse.data.length
        : 0;

      const totalWatchTime = watchHistoryResponse.data.reduce((acc, curr) => acc + (curr.watch_duration || 0), 0);
      
      const uniqueMovieIds = new Set();
      watchHistoryResponse.data.forEach(item => {
        if (item.movie?.id) {
          uniqueMovieIds.add(item.movie.id);
        }
      });
      
      let totalCompletionPercentage = 0;
      let validMovieCount = 0;
      
      watchHistoryResponse.data.forEach(item => {
        const movieDuration = (item.movie?.duration_minutes || 0) * 60;
        if (movieDuration > 0) {
          const watchPercentage = Math.min(((item.watch_duration || 0) / movieDuration) * 100, 100);
          totalCompletionPercentage += watchPercentage;
          validMovieCount++;
        }
      });
      
      const averageCompletionRate = validMovieCount > 0 
        ? totalCompletionPercentage / validMovieCount 
        : 0;

      return {
        totalRatings: ratingsResponse.data.length,
        averageRating,
        totalReports: reportsResponse.data.length,
        totalWatches: uniqueMovieIds.size,
        totalWatchTime: totalWatchTime / 60,
        completionRate: averageCompletionRate
      };
    }
  });

  const { data: watchHistory } = useQuery({
    queryKey: ['watch-history', session?.user?.id],
    queryFn: async () => {
      const { data: historyData, error } = await supabase
        .from('user_movie_history')
        .select(`
          id,
          watch_duration,
          watched_at,
          movie:movies(
            id,
            title,
            thumbnail_url,
            duration_minutes
          )
        `)
        .eq('user_id', session?.user?.id)
        .order('watched_at', { ascending: false });

      if (error) {
        console.error('Watch history error:', error);
        return [];
      }

      const validHistory = historyData?.filter(item => item.movie) || [];
      
      const uniqueMovies = new Map();
      
      validHistory.forEach(item => {
        if (!uniqueMovies.has(item.movie.id) || 
            new Date(item.watched_at) > new Date(uniqueMovies.get(item.movie.id).watched_at)) {
          uniqueMovies.set(item.movie.id, item);
        }
      });
      
      return Array.from(uniqueMovies.values());
    },
    enabled: !!session?.user?.id
  });

  if (!session) return null;

  return (
    <div className={`min-h-screen ${isMobile ? 'pt-16 pb-20' : 'pt-24'} bg-background`}>
      <div className={`container mx-auto ${isMobile ? 'px-3' : 'px-4'}`}>
        <div className="grid gap-4">
          <ProfileHeader
            profile={profile}
            session={session}
            onProfileUpdate={refetchProfile}
          />

          <div className={`flex items-center ${isMobile ? 'justify-center flex-wrap' : 'justify-end'} gap-2 mb-2`}>
            <FeedbackDialog />
            <SupportDialog />
          </div>

          <UserStats
            stats={{
              averageRating: userStats?.averageRating || 0,
              totalRatings: userStats?.totalRatings || 0,
              totalReports: userStats?.totalReports || 0,
              totalWatches: userStats?.totalWatches || 0,
              totalWatchTime: userStats?.totalWatchTime || 0,
              completionRate: userStats?.completionRate || 0,
            }}
          />

          <Card className={isMobile ? 'shadow-sm' : ''}>
            <CardContent className={`${isMobile ? 'pt-4 px-3' : 'pt-6 px-6'}`}>
              <Tabs defaultValue="history" className="w-full">
                <TabsList className={`${isMobile ? 'w-full grid grid-cols-3 h-10' : 'grid w-full grid-cols-3'}`}>
                  <TabsTrigger value="history" className={isMobile ? 'text-xs px-2 py-2' : ''}>
                    {isMobile ? 'History' : 'Watch History'}
                  </TabsTrigger>
                  <TabsTrigger value="ratings" className={isMobile ? 'text-xs px-2 py-2' : ''}>
                    {isMobile ? 'Ratings' : 'Movie Ratings'}
                  </TabsTrigger>
                  <TabsTrigger value="reports" className={isMobile ? 'text-xs px-2 py-2' : ''}>
                    {isMobile ? 'Reports' : 'Movie Reports'}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="history" className={isMobile ? 'mt-3' : 'mt-6'}>
                  <div className={isMobile ? 'space-y-2' : ''}>
                    <MovieRow movies={(watchHistory || []).map(h => ({
                      id: h.movie.id,
                      title: h.movie.title,
                      thumbnail_url: h.movie.thumbnail_url,
                      duration_minutes: h.movie.duration_minutes
                    }))} />
                  </div>
                </TabsContent>
                <TabsContent value="ratings" className={isMobile ? 'mt-3' : 'mt-6'}>
                  <MovieRatings movies={ratedMovies || []} />
                </TabsContent>
                <TabsContent value="reports" className={isMobile ? 'mt-3' : 'mt-6'}>
                  <MovieReports reports={reportedMovies || []} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
