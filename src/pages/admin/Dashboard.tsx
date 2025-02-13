import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/admin/DashboardHeader";
import { StatCard } from "@/components/admin/StatCard";
import { AnalyticsSection } from "@/components/admin/AnalyticsSection";
import SecuritySettings from "@/components/admin/SecuritySettings";
import { Film, Users, PlayCircle, Wallet } from "lucide-react";
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

const Dashboard = () => {
    const { data: stats, refetch } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const [
                { count: totalMovies },
                { count: totalUsers },
                { count: totalViews }
            ] = await Promise.all([
                supabase.from('movies').select('*', { count: 'exact', head: true }),
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('user_movie_history').select('*', { count: 'exact', head: true })
            ]);

            return {
                totalMovies: totalMovies || 0,
                totalUsers: totalUsers || 0,
                totalViews: totalViews || 0,
                revenue: 0 // Placeholder for future implementation
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

    useEffect(() => {
        // Set up real-time listeners
        const channel = supabase.channel('dashboard-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public' },
                () => {
                    refetch();
                }
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
                        title="Total Revenue"
                        value={`$${stats?.revenue || 0}`}
                        change={15}
                        icon={<Wallet className="h-8 w-8 text-green-500" />}
                        date="May 20 - Jun 20 2024"
                    />
                    <StatCard
                        title="Total Movies"
                        value={stats?.totalMovies || 0}
                        change={5}
                        icon={<Film className="h-8 w-8 text-blue-500" />}
                        date="May 20 - Jun 20 2024"
                    />
                    <StatCard
                        title="Total Users"
                        value={stats?.totalUsers || 0}
                        change={12}
                        icon={<Users className="h-8 w-8 text-purple-500" />}
                        date="May 20 - Jun 20 2024"
                    />
                    <StatCard
                        title="Total Views"
                        value={stats?.totalViews || 0}
                        change={8}
                        icon={<PlayCircle className="h-8 w-8 text-orange-500" />}
                        date="May 20 - Jun 20 2024"
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
                                            data={[
                                                { name: 'Pending', value: reportsStats?.statusCount.pending || 0 },
                                                { name: 'Resolved', value: reportsStats?.statusCount.resolved || 0 },
                                                { name: 'Rejected', value: reportsStats?.statusCount.rejected || 0 }
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            <Cell fill="#f59e0b" /> {/* Pending - Amber */}
                                            <Cell fill="#22c55e" /> {/* Resolved - Green */}
                                            <Cell fill="#ef4444" /> {/* Rejected - Red */}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex justify-center gap-4 mt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                                        <span className="text-sm">Pending ({reportsStats?.statusCount.pending})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-green-500" />
                                        <span className="text-sm">Resolved ({reportsStats?.statusCount.resolved})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                        <span className="text-sm">Rejected ({reportsStats?.statusCount.rejected})</span>
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
            </main>
        </div>
    );
};

export default Dashboard;
