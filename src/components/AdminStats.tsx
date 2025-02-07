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
    Clock
} from "lucide-react";

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
                supabase.from('movies').select('count').single(),
                supabase.from('movie_reports').select('count').eq('status', 'pending').single(),
                supabase.from('movie_ratings').select('rating'),
                supabase.from('user_movie_history').select('count').gte('watch_duration', 120).single(),
                supabase
                    .from('user_movie_history')
                    .select('user_id')
                    .gte('watched_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                    .distinct()
            ]);

            const averageRating = ratingsResponse.data?.length
                ? ratingsResponse.data.reduce((acc: number, curr: any) => acc + curr.rating, 0) / ratingsResponse.data.length
                : 0;

            return {
                totalUsers: usersResponse.data?.count || 0,
                totalMovies: moviesResponse.data?.count || 0,
                pendingReports: reportsResponse.data?.count || 0,
                averageRating: averageRating.toFixed(1),
                totalViews: viewsResponse.data?.count || 0,
                activeUsers: activeUsersResponse.data?.length || 0
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.activeUsers} active in last 7 days
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Movies</CardTitle>
                        <Film className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalMovies}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.pendingReports} pending reports
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Platform Stats</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalViews}</div>
                        <p className="text-xs text-muted-foreground">
                            Total views • {stats?.averageRating} avg rating
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="reports">
                        <TabsList>
                            <TabsTrigger value="reports">Reports</TabsTrigger>
                            <TabsTrigger value="ratings">Ratings</TabsTrigger>
                            <TabsTrigger value="views">Views</TabsTrigger>
                        </TabsList>
                        <TabsContent value="reports" className="space-y-4">
                            {recentActivity?.reports.map((report) => (
                                <div key={report.id} className="flex items-center justify-between py-2">
                                    <div>
                                        <p className="font-medium">{report.movie.title}</p>
                                        <p className="text-sm text-muted-foreground">{report.reason}</p>
                                        <p className="text-xs text-muted-foreground">
                                            by {report.reporter.email || report.reporter.phone_number}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xs px-2 py-1 rounded-full ${report.status === 'resolved'
                                                ? 'bg-green-500/10 text-green-500'
                                                : 'bg-yellow-500/10 text-yellow-500'
                                            }`}>
                                            {report.status}
                                        </span>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {format(new Date(report.created_at), 'PPp')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </TabsContent>
                        <TabsContent value="ratings" className="space-y-4">
                            {recentActivity?.ratings.map((rating) => (
                                <div key={rating.id} className="flex items-center justify-between py-2">
                                    <div>
                                        <p className="font-medium">{rating.movie.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            by {rating.user.email || rating.user.phone_number}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1">
                                            <Star className="h-4 w-4 text-yellow-400" />
                                            <span>{rating.rating}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {format(new Date(rating.created_at), 'PPp')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </TabsContent>
                        <TabsContent value="views" className="space-y-4">
                            {recentActivity?.views.map((view) => (
                                <div key={view.id} className="flex items-center justify-between py-2">
                                    <div>
                                        <p className="font-medium">{view.movie.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            by {view.user.email || view.user.phone_number}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            <span>{Math.floor(view.watch_duration / 60)}m</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {format(new Date(view.watched_at), 'PPp')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminStats; 