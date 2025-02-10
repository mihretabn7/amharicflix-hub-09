import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    Cell
} from "recharts";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];
const REFETCH_INTERVAL = 30000; // 30 seconds

const Analytics = () => {
    const queryClient = useQueryClient();

    // Set up real-time subscriptions
    useEffect(() => {
        const channels = [
            supabase
                .channel('analytics-views')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'user_movie_history'
                    },
                    () => {
                        queryClient.invalidateQueries({ queryKey: ['analytics-views'] });
                    }
                )
                .subscribe(),

            supabase
                .channel('analytics-genres')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'movies'
                    },
                    () => {
                        queryClient.invalidateQueries({ queryKey: ['analytics-genres'] });
                    }
                )
                .subscribe(),

            supabase
                .channel('analytics-users')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'profiles'
                    },
                    () => {
                        queryClient.invalidateQueries({ queryKey: ['analytics-users'] });
                    }
                )
                .subscribe()
        ];

        return () => {
            channels.forEach(channel => supabase.removeChannel(channel));
        };
    }, [queryClient]);

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
        },
        refetchInterval: REFETCH_INTERVAL
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
        },
        refetchInterval: REFETCH_INTERVAL
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
        },
        refetchInterval: REFETCH_INTERVAL
    });

    if (isLoadingViews || isLoadingGenres || isLoadingUsers) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <Tabs defaultValue="views" className="space-y-4">
            <TabsList>
                <TabsTrigger value="views">Views</TabsTrigger>
                <TabsTrigger value="genres">Genres</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>

            <TabsContent value="views">
                <Card>
                    <CardHeader>
                        <CardTitle>Daily Views (Last 30 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={viewsData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="views"
                                        stroke="#8884d8"
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="genres">
                <Card>
                    <CardHeader>
                        <CardTitle>Views by Genre</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={genreData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) =>
                                            `${name} (${(percent * 100).toFixed(0)}%)`
                                        }
                                        outerRadius={150}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {genreData?.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="users">
                <Card>
                    <CardHeader>
                        <CardTitle>New Users Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={userStats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="users" fill="#82ca9d" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
};

export default Analytics; 