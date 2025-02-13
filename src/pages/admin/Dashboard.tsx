
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/admin/DashboardHeader";
import { StatCard } from "@/components/admin/StatCard";
import { AnalyticsSection } from "@/components/admin/AnalyticsSection";
import { Film, Users, PlayCircle, Wallet } from "lucide-react";

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
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            
            <main className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Revenue"
                        value={`$${stats?.revenue || 0}`}
                        change={15}
                        icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
                        date="May 20 - Jun 20 2024"
                    />
                    <StatCard
                        title="Total Movies"
                        value={stats?.totalMovies || 0}
                        change={5}
                        icon={<Film className="h-4 w-4 text-muted-foreground" />}
                        date="May 20 - Jun 20 2024"
                    />
                    <StatCard
                        title="Total Users"
                        value={stats?.totalUsers || 0}
                        change={12}
                        icon={<Users className="h-4 w-4 text-muted-foreground" />}
                        date="May 20 - Jun 20 2024"
                    />
                    <StatCard
                        title="Total Views"
                        value={stats?.totalViews || 0}
                        change={8}
                        icon={<PlayCircle className="h-4 w-4 text-muted-foreground" />}
                        date="May 20 - Jun 20 2024"
                    />
                </div>

                <AnalyticsSection />
            </main>
        </div>
    );
};

export default Dashboard;
