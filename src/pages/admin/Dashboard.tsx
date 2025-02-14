import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/admin/DashboardHeader";
import { StatCard } from "@/components/admin/StatCard";
import { AnalyticsSection } from "@/components/admin/AnalyticsSection";
import SecuritySettings from "@/components/admin/SecuritySettings";
import { Film, Users, PlayCircle, Wallet, AlertTriangle } from "lucide-react";
import NotificationCenter from "@/components/admin/NotificationCenter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import MovieUploadForm from "@/components/MovieUploadForm";
import CsvMovieUpload from "@/components/CsvMovieUpload";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TimeRange = 'daily' | 'weekly' | 'monthly' | 'yearly';

// Add these interfaces at the top
interface MovieView {
    movie_id: string;
    movie: { title: string };
}

interface MovieRating {
    movie_id: string;
    movie: { title: string };
    rating: number;
}

const Dashboard = () => {
    const [timeRange, setTimeRange] = useState<TimeRange>('daily');

    // Stats query with time range
    const { data: stats, refetch } = useQuery({
        queryKey: ['dashboard-stats', timeRange],
        queryFn: async () => {
            const timeAgo = new Date();
            switch (timeRange) {
                case 'yearly':
                    timeAgo.setFullYear(timeAgo.getFullYear() - 1);
                    break;
                case 'monthly':
                    timeAgo.setMonth(timeAgo.getMonth() - 1);
                    break;
                case 'weekly':
                    timeAgo.setDate(timeAgo.getDate() - 7);
                    break;
                case 'daily':
                    timeAgo.setDate(timeAgo.getDate() - 1);
                    break;
            }

            const [reports, views, ratings] = await Promise.all([
                // Reports stats
                supabase
                    .from('movie_reports')
                    .select('*')
                    .gte('created_at', timeAgo.toISOString()),

                // Views stats
                supabase
                    .from('user_movie_history')
                    .select(`
                        *,
                        movie:movies(title)
                    `)
                    .gte('watched_at', timeAgo.toISOString()),

                // Ratings stats
                supabase
                    .from('movie_ratings')
                    .select(`
                        *,
                        movie:movies(title)
                    `)
                    .gte('created_at', timeAgo.toISOString())
            ]);

            // Process stats
            const topViewedMovies = (views.data as MovieView[])?.reduce((acc: any, view) => {
                acc[view.movie_id] = acc[view.movie_id] || {
                    title: view.movie.title,
                    count: 0
                };
                acc[view.movie_id].count++;
                return acc;
            }, {});

            const topRatedMovies = (ratings.data as MovieRating[])?.reduce((acc: any, rating) => {
                acc[rating.movie_id] = acc[rating.movie_id] || {
                    title: rating.movie.title,
                    ratings: [],
                    avgRating: 0
                };
                acc[rating.movie_id].ratings.push(rating.rating);
                acc[rating.movie_id].avgRating =
                    acc[rating.movie_id].ratings.reduce((a: number, b: number) => a + b, 0) /
                    acc[rating.movie_id].ratings.length;
                return acc;
            }, {});

            const { data: moviesCount } = await supabase
                .from('movies')
                .select('id', { count: 'exact', head: true }) as { data: any, count: number };

            const { data: usersCount } = await supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true }) as { data: any, count: number };

            // In the queryFn, add status distribution data
            const reportsStatusData = [
                { name: 'Pending', value: reports.data?.filter(r => r.status === 'pending').length || 0 },
                { name: 'Done', value: reports.data?.filter(r => r.status === 'done').length || 0 },
                { name: 'Cancelled', value: reports.data?.filter(r => r.status === 'cancel').length || 0 }
            ];

            return {
                reportsCount: reports.data?.length || 0,
                viewsCount: views.data?.length || 0,
                ratingsCount: ratings.data?.length || 0,
                totalMovies: moviesCount?.count || 0,
                totalUsers: usersCount?.count || 0,
                topViewed: Object.entries(topViewedMovies || {})
                    .sort(([, a]: any, [, b]: any) => b.count - a.count)
                    .slice(0, 5),
                topRated: Object.entries(topRatedMovies || {})
                    .sort(([, a]: any, [, b]: any) => b.avgRating - a.avgRating)
                    .slice(0, 5),
                reportsStatusData
            };
        }
    });

    // Query system alerts
    const { data: systemAlerts } = useQuery({
        queryKey: ['system-alerts'],
        queryFn: async () => {
            const { data } = await supabase
                .from('system_alerts')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);
            return data;
        }
    });

    // Add this new query for reports stats
    const { data: reportsStats } = useQuery({
        queryKey: ['reports-stats'],
        queryFn: async () => {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Get all reports from last 30 days
            const { data: reports } = await supabase
                .from('movie_reports')
                .select('*')
                .gte('created_at', thirtyDaysAgo.toISOString());

            // Get reports by status
            const statusCount = {
                pending: reports?.filter(r => r.status === 'pending').length || 0,
                resolved: reports?.filter(r => r.status === 'resolved').length || 0,
                rejected: reports?.filter(r => r.status === 'rejected').length || 0
            };

            // Group reports by date
            const dailyReports = reports?.reduce((acc: any, report) => {
                const date = new Date(report.created_at).toLocaleDateString();
                acc[date] = (acc[date] || 0) + 1;
                return acc;
            }, {});

            return {
                statusCount,
                dailyReports: Object.entries(dailyReports || {}).map(([date, count]) => ({
                    date,
                    reports: count
                })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            };
        }
    });

    // Real-time updates
    useEffect(() => {
        const channel = supabase.channel('dashboard-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'movie_reports'
                },
                () => refetch()
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_movie_history'
                },
                () => refetch()
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'movie_ratings'
                },
                () => refetch()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [refetch]);

    return (
        <div className="flex-1 min-h-screen bg-background">
            <DashboardHeader />

            <main className="p-4 space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Dashboard Overview
                    </h2>
                    <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                        <TabsList>
                            <TabsTrigger value="daily">Daily</TabsTrigger>
                            <TabsTrigger value="weekly">Weekly</TabsTrigger>
                            <TabsTrigger value="monthly">Monthly</TabsTrigger>
                            <TabsTrigger value="yearly">Yearly</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button
                                className="bg-netflix-red hover:bg-netflix-red/90 shadow-lg hover:shadow-xl transition-all duration-200"
                                size="lg"
                            >
                                Add New Movie
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Add New Movie</DialogTitle>
                            </DialogHeader>
                            <MovieUploadForm onSuccess={refetch} />
                            <div className="mt-4">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">
                                            Or upload multiple movies
                                        </span>
                                    </div>
                                </div>
                                <CsvMovieUpload />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Movies"
                        value={stats?.totalMovies || 0}
                        icon={<Film className="h-8 w-8 text-blue-500" />}
                    />
                    <StatCard
                        title="Total Users"
                        value={stats?.totalUsers || 0}
                        icon={<Users className="h-8 w-8 text-purple-500" />}
                    />
                    <StatCard
                        title="Total Views"
                        value={stats?.viewsCount || 0}
                        icon={<PlayCircle className="h-8 w-8 text-orange-500" />}
                    />
                    <StatCard
                        title="Total Reports"
                        value={stats?.reportsCount || 0}
                        icon={<AlertTriangle className="h-8 w-8 text-red-500" />}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <SecuritySettings />
                        <AnalyticsSection />
                    </div>

                    <div className="space-y-6">
                        <NotificationCenter />

                        <Card className="hover:shadow-lg transition-all duration-200">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">System Alerts</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[300px]">
                                    <div className="space-y-4">
                                        {systemAlerts?.map((alert) => (
                                            <div
                                                key={alert.id}
                                                className={`p-4 rounded-lg border backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] ${alert.severity === 'warning'
                                                    ? 'bg-yellow-500/10 border-yellow-500/20'
                                                    : alert.severity === 'error'
                                                        ? 'bg-red-500/10 border-red-500/20'
                                                        : 'bg-blue-500/10 border-blue-500/20'
                                                    }`}
                                            >
                                                <h4 className="font-medium">{alert.title}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {alert.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    {new Date(alert.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Reports Overview Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Reports Status Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats?.reportsStatusData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            label
                                        >
                                            <Cell fill="#fbbf24" /> {/* Pending - Amber */}
                                            <Cell fill="#22c55e" /> {/* Done - Green */}
                                            <Cell fill="#ef4444" /> {/* Cancelled - Red */}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex justify-center gap-4 mt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                                        <span className="text-sm">Pending</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-green-500" />
                                        <span className="text-sm">Done</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                        <span className="text-sm">Cancelled</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Reports Trend (Last 30 Days)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={reportsStats?.dailyReports}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="reports" fill="#4b5563" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Top Viewed */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Most Viewed Movies</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {stats?.topViewed.map(([id, data]: any) => (
                                    <div key={id} className="flex items-center justify-between p-2 rounded-lg bg-accent/50">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{data.title}</span>
                                            <span className="text-sm text-muted-foreground">
                                                {data.count} views
                                            </span>
                                        </div>
                                        <div className="text-xl font-bold">
                                            #{stats.topViewed.findIndex((item: any) => item[0] === id) + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Rated */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Rated Movies</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {stats?.topRated.map(([id, data]: any) => (
                                    <div key={id} className="flex justify-between">
                                        <span className="truncate">{data.title}</span>
                                        <span className="font-bold">
                                            {data.avgRating.toFixed(1)}★
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
