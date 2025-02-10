
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Calendar, Mail, Phone, User, MessageSquare, Clock, Edit2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

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

interface WatchHistoryItem {
  id: string;
  movie: {
    id: string;
    title: string;
    thumbnail_url: string;
  };
  watch_duration: number;
  last_watched_at: string;
}

interface ProfileFormData {
  username: string;
  email: string;
  phone_number: string;
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'MMM yyyy');
  } catch (error) {
    return 'N/A';
  }
};

const formatDateTime = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'PPp');
  } catch (error) {
    return 'N/A';
  }
};

const Profile = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    email: '',
    phone_number: ''
  });

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

      // Update form data when profile is fetched
      if (data) {
        setFormData({
          username: data.username || '',
          email: data.email || '',
          phone_number: data.phone_number || ''
        });
      }

      return data;
    }
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          email: formData.email,
          phone_number: formData.phone_number
        })
        .eq('id', session?.user?.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      setIsEditing(false);
      refetchProfile();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const { data: ratedMovies } = useQuery({
    queryKey: ['rated-movies', session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movies')
        .select(`
          id,
          title,
          thumbnail_url,
          created_at,
          movie_ratings (
            rating,
            created_at
          )
        `)
        .eq('movie_ratings.user_id', session?.user?.id)
        .order('movie_ratings.created_at', { ascending: false });

      if (error) throw error;
      return data as MovieWithRating[];
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
      const [ratingsResponse, reportsResponse] = await Promise.all([
        supabase
          .from('movie_ratings')
          .select('rating')
          .eq('user_id', session?.user?.id),
        supabase
          .from('movie_reports')
          .select('id')
          .eq('reporter_id', session?.user?.id)
      ]);

      if (ratingsResponse.error) throw ratingsResponse.error;
      if (reportsResponse.error) throw reportsResponse.error;

      const averageRating = ratingsResponse.data.length > 0
        ? ratingsResponse.data.reduce((acc, curr) => acc + curr.rating, 0) / ratingsResponse.data.length
        : 0;

      return {
        totalRatings: ratingsResponse.data.length,
        averageRating,
        totalReports: reportsResponse.data.length
      };
    }
  });

  const { data: watchHistory } = useQuery({
    queryKey: ['watch-history', session?.user?.id],
    queryFn: async () => {
      console.log('Fetching watch history for user:', session?.user?.id);

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

      console.log('Raw watch history data:', historyData);

      // Filter out any entries where the movie might have been deleted
      const validHistory = historyData?.filter(item => item.movie) || [];
      console.log('Filtered watch history:', validHistory);

      return validHistory;
    },
    enabled: !!session?.user?.id
  });

  // Add a console log to see the watch history data in the render
  console.log('Watch history in render:', watchHistory);

  if (!session) return null;

  return (
    <div className="min-h-screen pt-24">
      <div className="container mx-auto px-4">
        <div className="grid gap-8">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback>
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  {isEditing ? (
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Username</label>
                        <Input
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          className="mt-1"
                          placeholder="Enter username"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="mt-1"
                          placeholder="Enter email"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Phone Number</label>
                        <Input
                          value={formData.phone_number}
                          onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                          className="mt-1"
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">Save Changes</Button>
                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold">
                          {profile?.username || profile?.email || profile?.phone_number}
                        </h1>
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        {profile?.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{profile.email}</span>
                          </div>
                        )}
                        {profile?.phone_number && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{profile.phone_number}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Joined {formatDate(profile?.created_at)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Star className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                    <p className="text-2xl font-bold">{userStats?.averageRating.toFixed(1) || '0.0'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Star className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Movies Rated</p>
                    <p className="text-2xl font-bold">{userStats?.totalRatings || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <MessageSquare className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Reports Made</p>
                    <p className="text-2xl font-bold">{userStats?.totalReports || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Tabs */}
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="history">
                <TabsList>
                  <TabsTrigger value="history">Watch History</TabsTrigger>
                  <TabsTrigger value="ratings">Movie Ratings</TabsTrigger>
                  <TabsTrigger value="reports">Movie Reports</TabsTrigger>
                </TabsList>
                <TabsContent value="history">
                  <div className="grid gap-4 mt-4">
                    {watchHistory && watchHistory.length > 0 ? (
                      watchHistory.map((item) => (
                        <Link
                          key={item.id}
                          to={`/movie/${item.movie.id}`}
                          className="group relative aspect-video overflow-hidden rounded-lg"
                        >
                          <img
                            src={item.movie.thumbnail_url}
                            alt={item.movie.title}
                            className="object-cover w-full h-full transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-0 p-4 w-full">
                            <h3 className="font-medium text-white mb-1">{item.movie.title}</h3>
                            <div className="flex items-center justify-between text-sm text-gray-300">
                              <span>
                                {Math.floor(item.watch_duration / 60)}m watched
                              </span>
                              <span>
                                {formatDateTime(item.watched_at)}
                              </span>
                            </div>
                            {item.movie.duration_minutes && (
                              <div className="mt-2">
                                <div className="h-1 bg-gray-600 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-netflix-red"
                                    style={{
                                      width: `${Math.min(100, (item.watch_duration / (item.movie.duration_minutes * 60)) * 100)}%`
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8 text-muted-foreground">
                        No watch history yet
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="ratings">
                  <div className="grid gap-4 mt-4">
                    {ratedMovies?.map((movie) => (
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
                </TabsContent>
                <TabsContent value="reports">
                  <div className="grid gap-4 mt-4">
                    {reportedMovies?.map((report) => (
                      <Link to={`/movie/${report.movie.id}`} key={report.id}>
                        <Card className="transition-colors hover:bg-accent">
                          <CardContent className="pt-4">
                            <div className="flex gap-4">
                              <img
                                src={report.movie.thumbnail_url}
                                alt={report.movie.title}
                                className="w-32 h-20 object-cover rounded-md"
                              />
                              <div>
                                <h3 className="font-medium">{report.movie.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {report.reason}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${report.status === 'resolved'
                                    ? 'bg-green-500/10 text-green-500'
                                    : 'bg-yellow-500/10 text-yellow-500'
                                    }`}>
                                    {report.status === 'resolved' ? 'Resolved' : 'Pending'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDateTime(report.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
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
