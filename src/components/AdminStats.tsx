import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
    Users,
    Film,
    AlertTriangle,
    Star,
    Eye,
    TrendingUp,
    Activity,
    Clapperboard,
    Clock,
    MessageSquare
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const AdminStats = () => {
    const { data: stats } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const [
                usersResponse,
                moviesResponse,
                reportsResponse,
                ratingsResponse,
                viewsResponse,
                activeUsersResponse
            ] = await Promise.all([
                supabase.from('profiles').select('count').single(),
                supabase.from('movies').select('count').is('series_id', null).single(),
                supabase.from('movie_reports').select('count').eq('status', 'pending').single(),
                supabase.from('movie_ratings').select('rating'),
                supabase.from('user_movie_history').select('count').gte('watch_duration', 120).single(),
                supabase
                    .from('user_movie_history')
                    .select('count')
                    .gte('watched_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                    .single()
            ]);

            // Get unique series count
            const { count: seriesCount } = await supabase
                .from('movies')
                .select('id', { count: 'exact', head: true })
                .not('series_id', 'is', null);

            const averageRating = ratingsResponse.data?.length
                ? ratingsResponse.data.reduce((acc: number, curr: any) => acc + curr.rating, 0) / ratingsResponse.data.length
                : 0;

            return {
                totalUsers: usersResponse.data?.count || 0,
                totalMovies: moviesResponse.data?.count || 0,
                totalSeries: seriesCount || 0,
                pendingReports: reportsResponse.data?.count || 0,
                averageRating: averageRating.toFixed(1),
                totalViews: viewsResponse.data?.count || 0,
                activeUsers: activeUsersResponse.data?.count || 0,
                totalComments: 0 // Placeholder until we implement comments
            };
        }
    });

    const { data: recentActivity } = useQuery({
        queryKey: ['admin-recent-activity'],
        queryFn: async () => {
            const [recentReports, recentRatings, recentViews] = await Promise.all([
                supabase
                    .from('movie_reports')
                    .select(`
                        id,
                        reason,
                        created_at,
                        status,
                        reporter:profiles!movie_reports_reporter_id_fkey(email, phone_number),
                        movie:movies(title)
                    `)
                    .order('created_at', { ascending: false })
                    .limit(5),
                supabase
                    .from('movie_ratings')
                    .select(`
                        id,
                        rating,
                        created_at,
                        user:profiles!movie_ratings_user_id_fkey(email, phone_number),
                        movie:movies(title)
                    `)
                    .order('created_at', { ascending: false })
                    .limit(5),
                supabase
                    .from('user_movie_history')
                    .select(`
                        id,
                        watch_duration,
                        watched_at,
                        user:profiles!user_movie_history_user_id_fkey(email, phone_number),
                        movie:movies(title)
                    `)
                    .order('watched_at', { ascending: false })
                    .limit(5)
            ]);

            return {
                reports: recentReports.data || [],
                ratings: recentRatings.data || [],
                views: recentViews.data || []
            };
        }
    });

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalUsers}</div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Activity className="h-3 w-3" />
                            <span>{stats?.activeUsers} active in last 7 days</span>
                        </div>
                        <Progress value={(stats?.activeUsers / stats?.totalUsers) * 100} className="mt-3 h-1" />
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Content Stats</CardTitle>
                        <Film className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalMovies + stats?.totalSeries}</div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                            <div className="flex items-center space-x-1">
                                <Film className="h-3 w-3" />
                                <span>{stats?.totalMovies} Movies</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Clapperboard className="h-3 w-3" />
                                <span>{stats?.totalSeries} Series</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalViews}</div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                            <div className="flex items-center space-x-1">
                                <MessageSquare className="h-3 w-3" />
                                <span>{stats?.totalComments} Comments</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3" />
                                <span>{stats?.averageRating} Avg Rating</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reports</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.pendingReports}</div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Pending reports to review</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="reports" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="reports">Reports</TabsTrigger>
                            <TabsTrigger value="ratings">Ratings</TabsTrigger>
                            <TabsTrigger value="views">Views</TabsTrigger>
                        </TabsList>

                        <TabsContent value="reports" className="space-y-4">
                            <ScrollArea className="h-[300px]">
                                {recentActivity?.reports.map((report) => (
                                    <div key={report.id} className="flex items-center justify-between py-3">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {report.movie?.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {report.reason}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Badge variant={report.status === 'pending' ? 'secondary' : 'default'}>
                                                {report.status}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(report.created_at), 'MMM d, h:mm a')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="ratings" className="space-y-4">
                            <ScrollArea className="h-[300px]">
                                {recentActivity?.ratings.map((rating) => (
                                    <div key={rating.id} className="flex items-center justify-between py-3">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {rating.movie?.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {rating.user?.email || rating.user?.phone_number}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="flex items-center">
                                                <Star className="h-4 w-4 text-netflix-gold mr-1" />
                                                <span>{rating.rating}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(rating.created_at), 'MMM d, h:mm a')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="views" className="space-y-4">
                            <ScrollArea className="h-[300px]">
                                {recentActivity?.views.map((view) => (
                                    <div key={view.id} className="flex items-center justify-between py-3">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {view.movie?.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {view.user?.email || view.user?.phone_number}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="flex items-center">
                                                <Clock className="h-4 w-4 mr-1" />
                                                <span>{Math.round(view.watch_duration / 60)}m</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(view.watched_at), 'MMM d, h:mm a')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminStats; 