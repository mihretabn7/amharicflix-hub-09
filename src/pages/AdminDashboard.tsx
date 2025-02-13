import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Film, Users, MessageSquare, Settings, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import MovieUploadForm from "@/components/MovieUploadForm";
import CsvMovieUpload from "@/components/CsvMovieUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import MovieTable from "@/components/MovieTable";
import ReportManagement from "@/components/ReportManagement";
import type { Movie } from "@/types/movie";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'movies' | 'reports'>('movies');
  const [stats, setStats] = useState({
    totalMovies: 0,
    totalUsers: 0,
    totalWatches: 0,
    totalShares: 0
  });

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel('admin-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'movies'
        },
        () => {
          fetchStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_movie_history'
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    const [moviesCount, usersCount, watchData, shareData] = await Promise.all([
      supabase.from('movies').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('movies').select('watch_count').not('watch_count', 'is', null),
      supabase.from('movies').select('share_count').not('share_count', 'is', null)
    ]);

    const totalWatches = watchData.data?.reduce((acc, curr) => acc + (curr.watch_count || 0), 0) || 0;
    const totalShares = shareData.data?.reduce((acc, curr) => acc + (curr.share_count || 0), 0) || 0;

    setStats({
      totalMovies: moviesCount.count || 0,
      totalUsers: usersCount.count || 0,
      totalWatches,
      totalShares
    });
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          {activeTab === 'movies' && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-netflix-red hover:bg-netflix-red/90">
                  Add New Movie
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Movie</DialogTitle>
                </DialogHeader>
                <MovieUploadForm onSuccess={fetchStats} />
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
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Movies</p>
                <h3 className="text-2xl font-bold">{stats.totalMovies}</h3>
              </div>
              <Film className="h-8 w-8 text-netflix-red" />
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Users</p>
                <h3 className="text-2xl font-bold">{stats.totalUsers}</h3>
              </div>
              <Users className="h-8 w-8 text-netflix-gold" />
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Watches</p>
                <h3 className="text-2xl font-bold">{stats.totalWatches}</h3>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Shares</p>
                <h3 className="text-2xl font-bold">{stats.totalShares}</h3>
              </div>
              <Settings className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex gap-4">
            <Button
              variant={activeTab === 'movies' ? 'default' : 'outline'}
              onClick={() => setActiveTab('movies')}
            >
              <Film className="h-4 w-4 mr-2" />
              Movies
            </Button>
            <Button
              variant={activeTab === 'reports' ? 'default' : 'outline'}
              onClick={() => setActiveTab('reports')}
            >
              <Flag className="h-4 w-4 mr-2" />
              Reports
            </Button>
          </div>
        </div>

        {activeTab === 'movies' ? (
          <MovieTable />
        ) : (
          <ReportManagement />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
