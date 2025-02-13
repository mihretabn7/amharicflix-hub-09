import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, PieChart, ResponsiveContainer, Bar, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

export const AnalyticsSection = () => {
    // Query for watch duration stats
    const { data: watchStats } = useQuery({
        queryKey: ['watch-stats'],
        queryFn: async () => {
            const { data: history } = await supabase
                .from('user_movie_history')
                .select('watch_duration, watched_at')
                .order('watched_at', { ascending: true });

            if (!history) return [];

            // Calculate average watch duration and group by day
            const grouped = history.reduce((acc: any, curr) => {
                const date = new Date(curr.watched_at).toLocaleDateString();
                if (!acc[date]) {
                    acc[date] = { total: 0, count: 0 };
                }
                acc[date].total += curr.watch_duration || 0;
                acc[date].count += 1;
                return acc;
            }, {});

            return Object.entries(grouped).map(([date, stats]: [string, any]) => ({
                date,
                avgDuration: Math.round(stats.total / stats.count / 60), // Convert to minutes
                views: stats.count
            }));
        }
    });

    // Query for user growth
    const { data: userGrowth } = useQuery({
        queryKey: ['user-growth'],
        queryFn: async () => {
            const { data: users } = await supabase
                .from('profiles')
                .select('created_at')
                .order('created_at', { ascending: true });

            if (!users) return [];

            // Group by week
            const grouped = users.reduce((acc: any, curr) => {
                const week = new Date(curr.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
                acc[week] = (acc[week] || 0) + 1;
                return acc;
            }, {});

            return Object.entries(grouped).map(([date, count]) => ({
                date,
                users: count
            }));
        }
    });

    // Query for genre popularity
    const { data: genreStats } = useQuery({
        queryKey: ['genre-stats'],
        queryFn: async () => {
            const { data: movies } = await supabase
                .from('movies')
                .select('genre, watch_count');

            if (!movies) return [];

            const genreCounts = movies.reduce((acc: any, movie) => {
                if (movie.genre) {
                    acc[movie.genre] = (acc[movie.genre] || 0) + (movie.watch_count || 0);
                }
                return acc;
            }, {});

            return Object.entries(genreCounts)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => (b.value as number) - (a.value as number))
                .slice(0, 5);
        }
    });

    const COLORS = [
        '#FF6B6B',
        '#4ECDC4',
        '#45B7D1',
        '#96CEB4',
        '#FFEEAD'
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="hover:shadow-lg transition-all duration-200">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Watch Duration & Views</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={watchStats}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '12px'
                                    }}
                                />
                                <Legend />
                                <Line 
                                    yAxisId="left"
                                    type="monotone" 
                                    dataKey="avgDuration" 
                                    stroke="#4ECDC4" 
                                    strokeWidth={2}
                                    name="Avg Duration (min)"
                                    dot={false}
                                />
                                <Line 
                                    yAxisId="right"
                                    type="monotone" 
                                    dataKey="views" 
                                    stroke="#FF6B6B" 
                                    strokeWidth={2}
                                    name="Views"
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Top Genres</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={genreStats}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${value}`}
                                >
                                    {genreStats?.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={COLORS[index % COLORS.length]} 
                                        />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '12px'
                                    }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2 hover:shadow-lg transition-all duration-200">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">User Growth</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={userGrowth}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '12px'
                                    }}
                                />
                                <Legend />
                                <Bar 
                                    dataKey="users" 
                                    fill="#45B7D1"
                                    name="New Users"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
