import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { Film, Users, Play, Share2, AlertTriangle } from "lucide-react";

const DashboardOverview = () => {
    // Fetch overview statistics
    const { data: stats, isLoading } = useQuery({
        queryKey: ['admin-overview'],
        queryFn: async () => {
            const [
                moviesCount,
                usersCount,
                watchData,
                shareData,
                recentMovies,
                systemAlerts
            ] = await Promise.all([
                // Total Movies
                supabase.from('movies').select('*', { count: 'exact', head: true }),
                // Total Users
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                // Watch Count
                supabase.from('user_movie_history').select('*', { count: 'exact', head: true }),
                // Share Count
                supabase.from('movies').select('share_count').not('share_count', 'is', null),
                // Recent Movies
                supabase
                    .from('movies')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(5),
                // System Alerts
                supabase
                    .from('system_alerts')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(5)
            ]);

            return {
                totalMovies: moviesCount.count || 0,
                totalUsers: usersCount.count || 0,
                totalWatches: watchData.count || 0,
                totalShares: shareData.data?.reduce((acc, curr) => acc + (curr.share_count || 0), 0) || 0,
                recentMovies: recentMovies.data || [],
                systemAlerts: systemAlerts.data || []
            };
        }
    });

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Movies</CardTitle>
                        <Film className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalMovies}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalUsers}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Watches</CardTitle>
                        <Play className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalWatches}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
                        <Share2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalShares}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Movies */}
            <Card>
                <CardHeader>
                    <CardTitle>Recently Added Movies</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {stats?.recentMovies.map((movie) => (
                            <div key={movie.id} className="flex items-center space-x-4">
                                <img
                                    src={movie.thumbnail_url}
                                    alt={movie.title}
                                    className="h-12 w-20 object-cover rounded-md"
                                />
                                <div>
                                    <div className="font-medium">{movie.title}</div>
                                    <div className="text-sm text-muted-foreground">
                                        Added {new Date(movie.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* System Alerts */}
            <Card>
                <CardHeader>
                    <CardTitle>System Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {stats?.systemAlerts.length === 0 ? (
                            <div className="text-muted-foreground">No active alerts</div>
                        ) : (
                            stats?.systemAlerts.map((alert) => (
                                <Alert key={alert.id} variant={alert.severity as any}>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>{alert.title}</AlertTitle>
                                    <AlertDescription>{alert.message}</AlertDescription>
                                </Alert>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DashboardOverview; 