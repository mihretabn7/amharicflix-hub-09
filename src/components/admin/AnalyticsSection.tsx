
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, PieChart, ResponsiveContainer, Bar, Pie, Cell, LineChart, Line } from "recharts";

export const AnalyticsSection = () => {
    const { data: watchStats } = useQuery({
        queryKey: ['watch-stats'],
        queryFn: async () => {
            const { data: history } = await supabase
                .from('user_movie_history')
                .select('watched_at')
                .order('watched_at', { ascending: true });

            if (!history) return [];

            // Group by day and count
            const grouped = history.reduce((acc: any, curr) => {
                const date = new Date(curr.watched_at).toLocaleDateString();
                acc[date] = (acc[date] || 0) + 1;
                return acc;
            }, {});

            return Object.entries(grouped).map(([date, value]) => ({
                date,
                value
            }));
        }
    });

    const { data: locationStats } = useQuery({
        queryKey: ['location-stats'],
        queryFn: async () => {
            // This is a placeholder. In a real app, you'd track user locations
            return [
                { name: "USA", value: 45 },
                { name: "Europe", value: 25 },
                { name: "Asia", value: 20 },
                { name: "Others", value: 10 }
            ];
        }
    });

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Watch Time Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={watchStats}>
                                <Line 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="#00C49F" 
                                    strokeWidth={2} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">User Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={locationStats}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {locationStats?.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={COLORS[index % COLORS.length]} 
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
