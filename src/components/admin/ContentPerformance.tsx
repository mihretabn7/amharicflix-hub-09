import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

interface ContentPerformanceProps {
  timeRange: "daily" | "weekly" | "monthly" | "yearly";
}

function getStartDate(timeRange: "daily" | "weekly" | "monthly" | "yearly"): Date {
  const now = new Date();
  switch (timeRange) {
    case "daily":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    case "weekly":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    case "monthly":
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case "yearly":
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    default:
      return now;
  }
}

export default function ContentPerformance({ timeRange }: ContentPerformanceProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<"daily" | "weekly" | "monthly" | "yearly">(timeRange);

  const startDate = getStartDate(selectedTimeRange);

  const { data: contentStats, isLoading, error } = useQuery({
    queryKey: ["content-performance", selectedTimeRange],
    queryFn: async () => {
      const startDateStr = startDate.toISOString();
      const endDateStr = new Date().toISOString();

      // Fetch watch and share counts from the movies table
      const { data: moviesData, error: moviesError } = await supabase
        .from("movies")
        .select("id, title, watch_count, share_count");

      if (moviesError) throw moviesError;

      // Fetch time-related data from user_movie_history and movie_ratings tables
      const { data: historyData, error: historyError } = await supabase
        .from("user_movie_history")
        .select("movie_id, watched_at")
        .gte("watched_at", startDateStr)
        .lte("watched_at", endDateStr);

      if (historyError) throw historyError;

      const { data: ratingsData, error: ratingsError } = await supabase
        .from("movie_ratings")
        .select("movie_id, created_at")
        .gte("created_at", startDateStr)
        .lte("created_at", endDateStr);

      if (ratingsError) throw ratingsError;

      // Aggregate data
      const movieStats = moviesData.map((movie) => {
        const watchCount = historyData.filter((h) => h.movie_id === movie.id).length;
        const ratingCount = ratingsData.filter((r) => r.movie_id === movie.id).length;

        return {
          movie_title: movie.title,
          total_views: movie.watch_count + watchCount,
          total_shares: movie.share_count,
          total_ratings: ratingCount,
        };
      });

      // Filter top-performing movies based on engagement
      return movieStats
        .filter((movie) => movie.total_views > 0 || movie.total_shares > 0 || movie.total_ratings > 0)
        .sort((a, b) => b.total_views - a.total_views)
        .slice(0, 10); // Limit to top 10 movies
    },
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500">
            Failed to load content performance data. Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={selectedTimeRange} onValueChange={(value) => setSelectedTimeRange(value as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
        {isLoading ? (
          <div className="flex justify-center py-8">Loading content performance data...</div>
        ) : contentStats && contentStats.length > 0 ? (
          <>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contentStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="movie_title" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total_views" fill="#8884d8" name="Views" />
                  <Bar dataKey="total_shares" fill="#82ca9d" name="Shares" />
                  <Bar dataKey="total_ratings" fill="#ffc658" name="Ratings" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Movie Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Views</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Shares</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Ratings</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contentStats.map((movie, index) => (
                    <tr key={index} className="hover:bg-gray-100">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{movie.movie_title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{movie.total_views}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{movie.total_shares}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{movie.total_ratings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No data available for the selected time range.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
