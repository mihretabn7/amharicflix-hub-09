import { useEffect, useState } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];
const REFETCH_INTERVAL = 30000; // 30 seconds

const Analytics = () => {
    const [dateRange, setDateRange] = useState({ from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() });
    const [selectedGenre, setSelectedGenre] = useState<string>("all");
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

    const { data: topMovies, isLoading: isLoadingTopMovies } = useQuery({
        queryKey: ['analytics-top-movies', selectedGenre, dateRange],
        queryFn: async () => {
            let query = supabase
                .from('movies')
                .select('id, title, genre, watch_count, share_count, rating')
                .order('watch_count', { ascending: false })
                .limit(10);

            if (selectedGenre !== 'all') {
                query = query.eq('genre', selectedGenre);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        },
        refetchInterval: REFETCH_INTERVAL
    });

    const { data: shareStats, isLoading: isLoadingShares } = useQuery({
        queryKey: ['analytics-shares', dateRange],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('movies')
                .select('id, title, share_count')
                .order('share_count', { ascending: false })
                .limit(5);

            if (error) throw error;
            return data;
        },
        refetchInterval: REFETCH_INTERVAL
    });

    if (isLoadingViews || isLoadingGenres || isLoadingUsers || isLoadingTopMovies || isLoadingShares) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="movies">Movies</TabsTrigger>
                <TabsTrigger value="engagement">Engagement</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-4 mb-6">
                <DateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                />
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Genres</SelectItem>
                        <SelectItem value="action">Action</SelectItem>
                        <SelectItem value="comedy">Comedy</SelectItem>
                        <SelectItem value="drama">Drama</SelectItem>
                        <SelectItem value="documentary">Documentary</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <TabsContent value="overview">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Most Viewed Movies</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={topMovies}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="watch_count" fill="#8884d8" name="Views" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Most Shared Movies</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={shareStats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="share_count" fill="#82ca9d" name="Shares" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Genre Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={genreData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label
                                    >
                                        {genreData?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Views Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={viewsData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="views" stroke="#8884d8" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>New Users Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={userStats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="users" stroke="#82ca9d" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Top Rated Movies</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={topMovies?.sort((a, b) => b.rating - a.rating)}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
                                    <YAxis domain={[0, 5]} />
                                    <Tooltip />
                                    <Bar dataKey="rating" fill="#ffc658" name="Rating" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="movies">
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

            <TabsContent value="engagement">
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
        </Tabs>
    );
};

export default Analytics; 