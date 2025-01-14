import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Film, Users, MessageSquare, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalMovies: 0,
    totalUsers: 0,
    totalWatches: 0,
    totalShares: 0
  });

  useEffect(() => {
    // Initial load of stats
    fetchStats();

    // Subscribe to real-time updates
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
    // Get total movies
    const { count: moviesCount } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true });

    // Get total users
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get total watches
    const { data: watchData } = await supabase
      .from('movies')
      .select('watch_count')
      .not('watch_count', 'is', null);
    
    const totalWatches = watchData?.reduce((acc, curr) => acc + (curr.watch_count || 0), 0) || 0;

    // Get total shares
    const { data: shareData } = await supabase
      .from('movies')
      .select('share_count')
      .not('share_count', 'is', null);
    
    const totalShares = shareData?.reduce((acc, curr) => acc + (curr.share_count || 0), 0) || 0;

    setStats({
      totalMovies: moviesCount || 0,
      totalUsers: usersCount || 0,
      totalWatches,
      totalShares
    });
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button className="bg-netflix-red hover:bg-netflix-red/90">
            Add New Movie
          </Button>
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

        <div className="bg-card p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-6">Add New Movie</h2>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input className="bg-secondary" placeholder="Movie title" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">YouTube URL</label>
                <Input className="bg-secondary" placeholder="https://youtube.com/..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                <Input className="bg-secondary" type="number" placeholder="60" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Input className="bg-secondary" placeholder="Drama, Comedy, etc." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea className="bg-secondary" placeholder="Movie description..." />
              </div>
            </div>
            <Button className="bg-netflix-red hover:bg-netflix-red/90">
              Add Movie
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;