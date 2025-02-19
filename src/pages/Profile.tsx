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

const Profile = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);

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
          .select('watch_duration, movie:movies(duration_minutes)')
          .eq('user_id', session?.user?.id)
      ]);

      if (ratingsResponse.error) throw ratingsResponse.error;
      if (reportsResponse.error) throw reportsResponse.error;
      if (watchHistoryResponse.error) throw watchHistoryResponse.error;

      const averageRating = ratingsResponse.data.length > 0
        ? ratingsResponse.data.reduce((acc, curr) => acc + curr.rating, 0) / ratingsResponse.data.length
        : 0;

      // Calculate total watch time and completion rate
      const totalWatchTime = watchHistoryResponse.data.reduce((acc, curr) => acc + (curr.watch_duration || 0), 0);
      const completionRate = watchHistoryResponse.data.reduce((acc, curr) => {
        const movieDuration = curr.movie?.duration_minutes || 0;
        if (movieDuration === 0) return acc;
        return acc + ((curr.watch_duration || 0) / (movieDuration * 60)) * 100;
      }, 0) / (watchHistoryResponse.data.length || 1);

      return {
        totalRatings: ratingsResponse.data.length,
        averageRating,
        totalReports: reportsResponse.data.length,
        totalWatches: watchHistoryResponse.data.length,
        totalWatchTime: totalWatchTime / 60, // Convert seconds to minutes
        completionRate
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
      return validHistory;
    },
    enabled: !!session?.user?.id
  });

  if (!session) return null;

  return (
    <div className="min-h-screen pt-24">
      <div className="container mx-auto px-4">
        <div className="grid gap-8">
          <ProfileHeader
            profile={profile}
            session={session}
            onProfileUpdate={refetchProfile}
          />

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

          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="history">
                <TabsList>
                  <TabsTrigger value="history">Watch History</TabsTrigger>
                  <TabsTrigger value="ratings">Movie Ratings</TabsTrigger>
                  <TabsTrigger value="reports">Movie Reports</TabsTrigger>
                </TabsList>
                <TabsContent value="history">
                  <WatchHistory items={watchHistory || []} />
                </TabsContent>
                <TabsContent value="ratings">
                  <MovieRatings movies={ratedMovies || []} />
                </TabsContent>
                <TabsContent value="reports">
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
