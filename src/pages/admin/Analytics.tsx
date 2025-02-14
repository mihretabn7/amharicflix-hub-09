import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TimeRange = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function Analytics() {
    const [timeRange, setTimeRange] = useState<TimeRange>('monthly');

    const { data: analyticsData } = useQuery({
        queryKey: ['analytics', timeRange],
        queryFn: async () => {
            // Similar to Dashboard stats but more detailed
            const { data: reports } = await supabase
                .from('movie_reports')
                .select('*')
                .order('created_at', { ascending: true });

            const { data: views } = await supabase
                .from('user_movie_history')
                .select(`
                    *,
                    movie:movies(title)
                `)
                .order('watched_at', { ascending: true });

            const { data: reviews } = await supabase
                .from('movie_ratings')
                .select(`
                    *,
                    movie:movies(title)
                `)
                .order('created_at', { ascending: true });

            // Process data for charts
            const reportsByDate = groupByDate(reports || [], 'created_at');
            const viewsByDate = groupByDate(views || [], 'watched_at');
            const reviewsByDate = groupByDate(reviews || [], 'created_at');

            // Add detailed movie stats
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

            const { data: movieStats } = await supabase
                .from('movies')
                .select(`
                    id,
                    title,
                    thumbnail_url,
                    user_movie_history!inner(
                        watched_at
                    ),
                    movie_ratings!inner(
                        rating,
                        created_at
                    )
                `)
                .gte('user_movie_history.watched_at', timeAgo.toISOString())
                .gte('movie_ratings.created_at', timeAgo.toISOString());

            const processedMovies = movieStats?.map(movie => ({
                id: movie.id,
                title: movie.title,
                thumbnail: movie.thumbnail_url,
                views: movie.user_movie_history.length,
                avgRating: movie.movie_ratings.length > 0
                    ? movie.movie_ratings.reduce((acc: number, curr: any) => acc + curr.rating, 0) / movie.movie_ratings.length
                    : 0,
                reviewCount: movie.movie_ratings.length
            })) || [];

            return {
                reportsTrend: Object.entries(reportsByDate).map(([date, count]) => ({
                    date,
                    count
                })),
                viewsTrend: Object.entries(viewsByDate).map(([date, count]) => ({
                    date,
                    count
                })),
                reviewsTrend: Object.entries(reviewsByDate).map(([date, count]) => ({
                    date,
                    count
                })),
                topMovies: {
                    byViews: [...processedMovies].sort((a, b) => b.views - a.views).slice(0, 10),
                    byRating: [...processedMovies].sort((a, b) => b.avgRating - a.avgRating).slice(0, 10),
                    byReviews: [...processedMovies].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 10)
                }
            };
        }
    });

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Analytics</h1>
                <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                    <TabsList>
                        <TabsTrigger value="daily">Daily</TabsTrigger>
                        <TabsTrigger value="weekly">Weekly</TabsTrigger>
                        <TabsTrigger value="monthly">Monthly</TabsTrigger>
                        <TabsTrigger value="yearly">Yearly</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Reports Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle>Reports Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analyticsData?.reportsTrend}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#ef4444" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Views Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle>Views Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analyticsData?.viewsTrend}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#3b82f6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Most Viewed Movies */}
                <Card>
                    <CardHeader>
                        <CardTitle>Most Viewed Movies</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analyticsData?.topMovies.byViews.map((movie, index) => (
                                <div key={movie.id} className="flex items-center gap-4 p-2 rounded-lg bg-accent/50">
                                    <div className="text-2xl font-bold text-muted-foreground w-8">
                                        #{index + 1}
                                    </div>
                                    <img
                                        src={movie.thumbnail}
                                        alt={movie.title}
                                        className="w-12 h-12 rounded object-cover"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium truncate">{movie.title}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {movie.views.toLocaleString()} views
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Rated Movies */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Rated Movies</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analyticsData?.topMovies.byRating.map((movie, index) => (
                                <div key={movie.id} className="flex items-center gap-4 p-2 rounded-lg bg-accent/50">
                                    <div className="text-2xl font-bold text-muted-foreground w-8">
                                        #{index + 1}
                                    </div>
                                    <img
                                        src={movie.thumbnail}
                                        alt={movie.title}
                                        className="w-12 h-12 rounded object-cover"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium truncate">{movie.title}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {movie.avgRating.toFixed(1)} ★
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Most Reviewed Movies */}
                <Card>
                    <CardHeader>
                        <CardTitle>Most Reviewed Movies</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analyticsData?.topMovies.byReviews.map((movie, index) => (
                                <div key={movie.id} className="flex items-center gap-4 p-2 rounded-lg bg-accent/50">
                                    <div className="text-2xl font-bold text-muted-foreground w-8">
                                        #{index + 1}
                                    </div>
                                    <img
                                        src={movie.thumbnail}
                                        alt={movie.title}
                                        className="w-12 h-12 rounded object-cover"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium truncate">{movie.title}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {movie.reviewCount} reviews
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Helper function to group data by date
function groupByDate(data: any[], dateField: string) {
    return data.reduce((acc: any, item) => {
        const date = new Date(item[dateField]).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});
} 