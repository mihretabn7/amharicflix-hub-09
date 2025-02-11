import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Line,
    Bar,
    Doughnut
} from "react-chartjs-2";
import {
    Users,
    PlayCircle,
    Star,
    TrendingUp,
    Clock,
    Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const AnalyticsDashboard = () => {
    const { data: analytics, isLoading } = useQuery({
        queryKey: ['admin-analytics'],
        queryFn: async () => {
            const [
                usersResponse,
                watchHistoryResponse,
                ratingsResponse,
                moviesResponse
            ] = await Promise.all([
                // User analytics
                supabase
                    .from('profiles')
                    .select('created_at, last_sign_in_at')
                    .order('created_at', { ascending: false }),

                // Watch history analytics
                supabase
                    .from('user_movie_history')
                    .select(`
            id,
            watch_duration,
            watched_at,
            movies(
              title,
              duration_minutes
            )
          `),

                // Ratings analytics
                supabase
                    .from('movie_ratings')
                    .select('rating, created_at'),

                // Movies analytics
                supabase
                    .from('movies')
                    .select('created_at, watch_count, genre')
            ]);

            // Process data for charts
            const last30Days = Array.from({ length: 30 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                return date.toISOString().split('T')[0];
            }).reverse();

            // User growth data
            const userGrowth = last30Days.map(date => ({
                date,
                count: usersResponse.data?.filter(u =>
                    u.created_at.split('T')[0] === date
                ).length || 0
            }));

            // Watch time data
            const watchTimeByDay = last30Days.map(date => ({
                date,
                minutes: watchHistoryResponse.data?.reduce((acc, curr) => {
                    if (curr.watched_at.split('T')[0] === date) {
                        return acc + (curr.watch_duration / 60);
                    }
                    return acc;
                }, 0) || 0
            }));

            // Rating distribution
            const ratingDistribution = Array.from({ length: 5 }, (_, i) => ({
                rating: i + 1,
                count: ratingsResponse.data?.filter(r => Math.round(r.rating) === i + 1).length || 0
            }));

            // Genre distribution
            const genreDistribution = moviesResponse.data?.reduce((acc: any, curr) => {
                acc[curr.genre] = (acc[curr.genre] || 0) + 1;
                return acc;
            }, {});

            return {
                userGrowth,
                watchTimeByDay,
                ratingDistribution,
                genreDistribution,
                totalUsers: usersResponse.data?.length || 0,
                totalWatches: watchHistoryResponse.data?.length || 0,
                averageRating: ratingsResponse.data?.reduce((acc, curr) => acc + curr.rating, 0) /
                    (ratingsResponse.data?.length || 1),
                totalMovies: moviesResponse.data?.length || 0
            };
        },
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        staleTime: 0
    });

    if (isLoading) {
        return <AnalyticsLoadingSkeleton />;
    }

    return (
        <div className="space-y-8">
            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Users"
                    value={analytics?.totalUsers.toString() || "0"}
                    icon={<Users className="h-4 w-4" />}
                    description="Total registered users"
                />
                <StatCard
                    title="Total Watches"
                    value={analytics?.totalWatches.toString() || "0"}
                    icon={<PlayCircle className="h-4 w-4" />}
                    description="Total movie plays"
                />
                <StatCard
                    title="Average Rating"
                    value={(analytics?.averageRating || 0).toFixed(1)}
                    icon={<Star className="h-4 w-4" />}
                    description="Average movie rating"
                />
                <StatCard
                    title="Total Movies"
                    value={analytics?.totalMovies.toString() || "0"}
                    icon={<TrendingUp className="h-4 w-4" />}
                    description="Available movies"
                />
            </div>

            {/* Charts */}
            <Tabs defaultValue="growth" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="growth">User Growth</TabsTrigger>
                    <TabsTrigger value="engagement">Engagement</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                </TabsList>

                <TabsContent value="growth" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Growth Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Line
                                data={{
                                    labels: analytics?.userGrowth.map(d => d.date),
                                    datasets: [{
                                        label: 'New Users',
                                        data: analytics?.userGrowth.map(d => d.count),
                                        borderColor: 'rgb(75, 192, 192)',
                                        tension: 0.4
                                    }]
                                }}
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: {
                                            position: 'top' as const,
                                        }
                                    }
                                }}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="engagement" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Watch Time Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Bar
                                data={{
                                    labels: analytics?.watchTimeByDay.map(d => d.date),
                                    datasets: [{
                                        label: 'Minutes Watched',
                                        data: analytics?.watchTimeByDay.map(d => d.minutes),
                                        backgroundColor: 'rgba(75, 192, 192, 0.5)'
                                    }]
                                }}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="content" className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Rating Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Doughnut
                                data={{
                                    labels: analytics?.ratingDistribution.map(d => `${d.rating} Stars`),
                                    datasets: [{
                                        data: analytics?.ratingDistribution.map(d => d.count),
                                        backgroundColor: [
                                            '#FF6384',
                                            '#36A2EB',
                                            '#FFCE56',
                                            '#4BC0C0',
                                            '#9966FF'
                                        ]
                                    }]
                                }}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Genre Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Doughnut
                                data={{
                                    labels: Object.keys(analytics?.genreDistribution || {}),
                                    datasets: [{
                                        data: Object.values(analytics?.genreDistribution || {}),
                                        backgroundColor: [
                                            '#FF6384',
                                            '#36A2EB',
                                            '#FFCE56',
                                            '#4BC0C0',
                                            '#9966FF'
                                        ]
                                    }]
                                }}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

const StatCard = ({ title, value, icon, description }: {
    title: string;
    value: string;
    icon: React.ReactNode;
    description: string;
}) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const AnalyticsLoadingSkeleton = () => (
    <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-[60px] mb-2" />
                        <Skeleton className="h-3 w-[120px]" />
                    </CardContent>
                </Card>
            ))}
        </div>
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-[200px]" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-[300px] w-full" />
            </CardContent>
        </Card>
    </div>
);

export default AnalyticsDashboard; 