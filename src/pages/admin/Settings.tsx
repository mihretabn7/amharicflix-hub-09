import { useEffect, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface UserActivity {
    id: string;
    email: string;
    totalWatchTime: number;
    moviesWatched: number;
    lastActive: string;
    joinedAt: string;
}

interface DailyStats {
    date: string;
    newUsers: number;
    activeUsers: number;
    totalWatches: number;
}

export default function Settings() {
    const supabase = useSupabaseClient();
    const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserActivity = async () => {
            try {
                // Fetch user activity data
                const { data: users, error: userError } = await supabase
                    .from("users")
                    .select(`
            id,
            email,
            created_at,
            last_sign_in_at
          `);

                if (userError) throw userError;

                // Fetch watch history stats for each user
                const userStats = await Promise.all(
                    users.map(async (user) => {
                        const { data: watchHistory, error: watchError } = await supabase
                            .from("user_movie_history")
                            .select("watch_duration, watched_at")
                            .eq("user_id", user.id);

                        if (watchError) throw watchError;

                        const totalWatchTime = watchHistory?.reduce(
                            (acc, curr) => acc + (curr.watch_duration || 0),
                            0
                        ) || 0;

                        return {
                            id: user.id,
                            email: user.email,
                            totalWatchTime,
                            moviesWatched: watchHistory?.length || 0,
                            lastActive: user.last_sign_in_at,
                            joinedAt: user.created_at,
                        };
                    })
                );

                setUserActivity(userStats);
            } catch (error) {
                console.error("Error fetching user activity:", error);
            }
        };

        const fetchDailyStats = async () => {
            try {
                // Get the last 7 days
                const dates = Array.from({ length: 7 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    return date.toISOString().split("T")[0];
                }).reverse();

                const stats = await Promise.all(
                    dates.map(async (date) => {
                        const nextDate = new Date(date);
                        nextDate.setDate(nextDate.getDate() + 1);

                        // New users for the day
                        const { count: newUsers } = await supabase
                            .from("users")
                            .select("id", { count: "exact" })
                            .gte("created_at", date)
                            .lt("created_at", nextDate.toISOString());

                        // Active users (users who watched something)
                        const { count: activeUsers } = await supabase
                            .from("user_movie_history")
                            .select("user_id", { count: "exact", distinct: true })
                            .gte("watched_at", date)
                            .lt("watched_at", nextDate.toISOString());

                        // Total watches
                        const { count: totalWatches } = await supabase
                            .from("user_movie_history")
                            .select("id", { count: "exact" })
                            .gte("watched_at", date)
                            .lt("watched_at", nextDate.toISOString());

                        return {
                            date: new Date(date).toLocaleDateString(),
                            newUsers: newUsers || 0,
                            activeUsers: activeUsers || 0,
                            totalWatches: totalWatches || 0,
                        };
                    })
                );

                setDailyStats(stats);
            } catch (error) {
                console.error("Error fetching daily stats:", error);
            }
        };

        fetchUserActivity();
        fetchDailyStats();
        setIsLoading(false);
    }, [supabase]);

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-8">Admin Settings</h1>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="users">User Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Total Users</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {userActivity.length}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Active Today</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {dailyStats[dailyStats.length - 1]?.activeUsers || 0}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Movies Watched Today</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {dailyStats[dailyStats.length - 1]?.totalWatches || 0}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="col-span-full">
                        <CardHeader>
                            <CardTitle>7-Day Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dailyStats}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="activeUsers" name="Active Users" fill="#8884d8" />
                                        <Bar dataKey="totalWatches" name="Total Watches" fill="#82ca9d" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="users">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                columns={columns}
                                data={userActivity}
                                isLoading={isLoading}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 