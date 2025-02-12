import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    AreaChart,
    Area
} from "recharts";
import { Loader2 } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, parseISO } from "date-fns";
import { processWatchTimeData, processUserRetention, processHeatmapData, processGenreTrends, processLanguageDistribution } from "@/lib/utils/analytics";

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

interface AnalyticsProps {
    activeSection: string;
}

const Analytics = ({ activeSection }: AnalyticsProps) => {
    const [activeTab, setActiveTab] = useState("overview");
    const [data, setData] = useState({
        // Content Analytics
        popularMovies: [],
        ratingDistribution: [],
        languagePreferences: [],
        genreTrends: [],
        contentGrowth: [],

        // User Analytics
        userGrowth: [],
        userEngagement: [],
        watchTimePerUser: [],
        retentionRates: [],
        subscriptionStatus: [],

        // Engagement Metrics
        watchDuration: [],
        ratingPatterns: [],
        shareBehavior: [],
        activityHeatmap: [],
        peakTimes: [],

        // Content Management
        reportStats: [],
        moderationMetrics: [],
        uploadPatterns: [],
        seriesStats: []
    });

    const { data: viewsData, isLoading: isLoadingViews } = useQuery({
        queryKey: ['analytics-views'],
        queryFn: async () => {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data, error } = await supabase
                .from('user_movie_history')
                .select('watched_at')
                .gte('watched_at', thirtyDaysAgo.toISOString());

            if (error) throw error;

            // Group by date
            const groupedData = data.reduce((acc: any, curr) => {
                const date = new Date(curr.watched_at).toLocaleDateString();
                acc[date] = (acc[date] || 0) + 1;
                return acc;
            }, {});

            return Object.entries(groupedData).map(([date, views]) => ({
                date,
                views
            }));
        }
    });

    const { data: genreData, isLoading: isLoadingGenres } = useQuery({
        queryKey: ['analytics-genres'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('movies')
                .select('genre, watch_count');

            if (error) throw error;

            // Group by genre
            const groupedData = data.reduce((acc: any, curr) => {
                if (curr.genre) {
                    acc[curr.genre] = (acc[curr.genre] || 0) + (curr.watch_count || 0);
                }
                return acc;
            }, {});

            return Object.entries(groupedData).map(([name, value]) => ({
                name,
                value
            }));
        }
    });

    const { data: userStats, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['analytics-users'],
        queryFn: async () => {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data, error } = await supabase
                .from('profiles')
                .select('created_at');

            if (error) throw error;

            // Group by date
            const groupedData = data.reduce((acc: any, curr) => {
                const date = new Date(curr.created_at).toLocaleDateString();
                acc[date] = (acc[date] || 0) + 1;
                return acc;
            }, {});

            return Object.entries(groupedData).map(([date, users]) => ({
                date,
                users
            }));
        }
    });

    useEffect(() => {
        const fetchAnalytics = async () => {
            switch (activeSection) {
                case "popularity":
                    const { data: movies } = await supabase
                        .from('movies')
                        .select('title, watch_count')
                        .order('watch_count', { ascending: false })
                        .limit(10);
                    setData(prev => ({ ...prev, popularMovies: movies }));
                    break;

                case "ratings":
                    const { data: ratings } = await supabase
                        .from('movie_ratings')
                        .select('rating');
                    // Process ratings distribution
                    const distribution = Array(5).fill(0);
                    ratings?.forEach(r => distribution[r.rating - 1]++);
                    setData(prev => ({
                        ...prev,
                        ratingDistribution: distribution.map((count, i) => ({
                            rating: i + 1,
                            count
                        }))
                    }));
                    break;

                case "languages":
                    const { data: languages } = await supabase
                        .from('movies')
                        .select('language, watch_count');
                    setData(prev => ({
                        ...prev,
                        languagePreferences: processLanguageDistribution(languages || [])
                    }));
                    break;

                case "genres":
                    const { data: genres } = await supabase
                        .from('movies')
                        .select('genre, watch_count');
                    setData(prev => ({
                        ...prev,
                        genreTrends: processGenreTrends(genres || [])
                    }));
                    break;

                case "user-growth":
                    const { data: users } = await supabase
                        .from('profiles')
                        .select('created_at')
                        .order('created_at', { ascending: true });
                    // Process user growth data
                    break;

                case "watch-time":
                    const { data: watchTime } = await supabase
                        .from('user_movie_history')
                        .select('watch_duration, created_at')
                        .gte('created_at', subDays(new Date(), 30).toISOString());
                    setData(prev => ({
                        ...prev,
                        watchDuration: processWatchTimeData(watchTime || [])
                    }));
                    break;

                case "retention":
                    const { data: retention } = await supabase
                        .from('profiles')
                        .select('last_sign_in');
                    setData(prev => ({
                        ...prev,
                        retentionRates: processUserRetention(retention || [])
                    }));
                    break;

                case "peak-times":
                    const { data: activity } = await supabase
                        .from('user_movie_history')
                        .select('created_at')
                        .gte('created_at', subDays(new Date(), 7).toISOString());
                    setData(prev => ({
                        ...prev,
                        activityHeatmap: processHeatmapData(activity || [])
                    }));
                    break;

                // Add more cases for other sections...
            }
        };

        fetchAnalytics();
    }, [activeSection]);

    if (isLoadingViews || isLoadingGenres || isLoadingUsers) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const renderContent = () => {
        switch (activeSection) {
            case "overview":
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Total Views</CardTitle>
                                <CardDescription>Overall movie views</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={200}>
                                    <AreaChart data={data.watchDuration}>
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="views" fill="#ff0000" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Active Users</CardTitle>
                                <CardDescription>Daily active users</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={200}>
                                    <LineChart data={data.userEngagement}>
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="users" stroke="#ff0000" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Content Growth</CardTitle>
                                <CardDescription>New content added</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={data.contentGrowth}>
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="content" fill="#ff0000" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                );

            case "popularity":
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Most Popular Movies</CardTitle>
                            <CardDescription>By watch count</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={data.popularMovies} layout="vertical">
                                    <XAxis type="number" />
                                    <YAxis dataKey="title" type="category" width={150} />
                                    <Tooltip />
                                    <Bar dataKey="watch_count" fill="#ff0000" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                );

            // Add more cases for other sections...

            default:
                return <div>Select a section to view analytics</div>;
        }
    };

    return (
        <div className="space-y-6">
            {renderContent()}
        </div>
    );
};

export default Analytics;
