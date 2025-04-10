
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { customRpcs, supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Laptop, Smartphone, Tablet, Monitor, Info } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import CountryViewsDisplay from "./CountryViewsDisplay";
import UserActivityStats from "./UserActivityStats";

const DEVICE_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A569BD"];

const getMostViewedMovies = async (startDate: string, endDate: string) => {
  const { data: anonymousViews } = await supabase
    .from('anonymous_views')
    .select('movie_id')
    .gte('viewed_at', startDate)
    .lte('viewed_at', endDate);

  const { data: userHistory } = await supabase
    .from('user_movie_history')
    .select('movie_id')
    .gte('watched_at', startDate)
    .lte('watched_at', endDate);

  const allViews = [...(anonymousViews || []), ...(userHistory || [])];
  const viewCounts = allViews.reduce((acc, view) => {
    acc[view.movie_id] = (acc[view.movie_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const { data: movies } = await supabase
    .from('movies')
    .select('id, title, thumbnail_url')
    .in('id', Object.keys(viewCounts));

  return movies?.map(movie => ({
    ...movie,
    views: viewCounts[movie.id]
  })).sort((a, b) => b.views - a.views) || [];
};

const getTopRatedMovies = async (startDate: string, endDate: string) => {
  const { data: ratings } = await supabase
    .from('movie_ratings')
    .select(`
      rating,
      movie:movies(
        id, 
        title, 
        thumbnail_url
      )
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  // Group by movie and calculate average rating
  const movieRatings = ratings?.reduce((acc: Record<string, any>, rating) => {
    if (!rating.movie || !rating.rating) return acc;
    
    const movieId = rating.movie.id;
    if (!acc[movieId]) {
      acc[movieId] = {
        ...rating.movie,
        ratings: [],
        avgRating: 0
      };
    }
    
    acc[movieId].ratings.push(rating.rating);
    acc[movieId].avgRating = acc[movieId].ratings.reduce((sum: number, r: number) => sum + r, 0) / acc[movieId].ratings.length;
    
    return acc;
  }, {});

  return Object.values(movieRatings || {})
    .sort((a: any, b: any) => b.avgRating - a.avgRating) || [];
};

const getMostReportedMovies = async (startDate: string, endDate: string) => {
  const { data: reports } = await supabase
    .from('movie_reports')
    .select(`
      created_at,
      movie:movies(
        id, 
        title, 
        thumbnail_url
      )
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  // Group by movie and count reports
  const movieReports = reports?.reduce((acc: Record<string, any>, report) => {
    if (!report.movie) return acc;
    
    const movieId = report.movie.id;
    if (!acc[movieId]) {
      acc[movieId] = {
        ...report.movie,
        count: 0
      };
    }
    
    acc[movieId].count++;
    return acc;
  }, {});

  return Object.values(movieReports || {})
    .sort((a: any, b: any) => b.count - a.count) || [];
};

export default function AnalyticsSection() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const startDate = dateRange?.from ? dateRange.from.toISOString() : new Date().toISOString();
  const endDate = dateRange?.to ? dateRange.to.toISOString() : new Date().toISOString();

  // Fetch most viewed movies
  const { data: mostViewedMovies } = useQuery({
    queryKey: ['most-viewed-movies', startDate, endDate],
    queryFn: async () => getMostViewedMovies(startDate, endDate)
  });

  // Fetch top rated movies
  const { data: topRatedMovies } = useQuery({
    queryKey: ['top-rated-movies', startDate, endDate],
    queryFn: async () => getTopRatedMovies(startDate, endDate)
  });

  // Fetch most reported movies
  const { data: mostReportedMovies } = useQuery({
    queryKey: ['most-reported-movies', startDate, endDate],
    queryFn: async () => getMostReportedMovies(startDate, endDate)
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </CardContent>
        </Card>
      </div>

      {/* User Activity Stats - New component */}
      <UserActivityStats dateRange={dateRange} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Most Viewed Movies</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Movie</th>
                  <th className="text-right p-2">Views</th>
                </tr>
              </thead>
              <tbody>
                {mostViewedMovies?.slice(0, 5).map((movie: any, i: number) => (
                  <tr key={i} className="border-b hover:bg-muted/50">
                    <td className="p-2">{movie.title}</td>
                    <td className="p-2 text-right">{movie.views}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Rated Movies</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Movie</th>
                  <th className="text-right p-2">Average Rating</th>
                </tr>
              </thead>
              <tbody>
                {topRatedMovies?.slice(0, 5).map((movie: any, i: number) => (
                  <tr key={i} className="border-b hover:bg-muted/50">
                    <td className="p-2">{movie.title}</td>
                    <td className="p-2 text-right">{movie.avgRating.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most Reported Movies</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Movie</th>
                  <th className="text-right p-2">Reports</th>
                </tr>
              </thead>
              <tbody>
                {mostReportedMovies?.slice(0, 5).map((movie: any, i: number) => (
                  <tr key={i} className="border-b hover:bg-muted/50">
                    <td className="p-2">{movie.title}</td>
                    <td className="p-2 text-right">{movie.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
