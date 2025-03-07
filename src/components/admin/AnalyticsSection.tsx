import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { customRpcs, supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
import { CountryViewsDisplay } from "./CountryViewsDisplay";

const countryNames: Record<string, string> = {
  US: "United States",
  ET: "Ethiopia",
  CA: "Canada",
  GB: "United Kingdom",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  IN: "India",
};

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
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title, thumbnail_url, rating')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('rating', { ascending: false });

  return movies || [];
};

const getMostReportedMovies = async (startDate: string, endDate: string) => {
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title, thumbnail_url, verified_report_count')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('verified_report_count', { ascending: false });

  return movies || [];
};

export default function AnalyticsSection() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const startDate = dateRange?.from ? dateRange.from.toISOString() : new Date().toISOString();
  const endDate = dateRange?.to ? dateRange.to.toISOString() : new Date().toISOString();

  const [totalViews, setTotalViews] = useState<number>(0);
  const [viewsOverTime, setViewsOverTime] = useState<Array<{ date: string; count: number }>>([]);

  const { data: countryViewsData } = useQuery({
    queryKey: ["views-by-country", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await customRpcs.getViewsByCountry();
      if (error) {
        console.error("Error fetching country views:", error);
        return [];
      }
      return data || [];
    },
  });

  const { data: browserStatsData } = useQuery({
    queryKey: ["browser-stats", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await customRpcs.getBrowserStats(startDate, endDate);
      if (error) {
        console.error("Error fetching browser stats:", error);
        return [];
      }
      return data || [];
    },
  });

  const { data: deviceStatsData } = useQuery({
    queryKey: ["device-stats", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await customRpcs.getDetailedDeviceStats(startDate, endDate);
      if (error) {
        console.error("Error fetching device stats:", error);
        return [];
      }
      return data || [];
    },
  });

  const { data: viewCounts } = useQuery({
    queryKey: ['view-counts', startDate, endDate],
    queryFn: async () => {
      // Fetch anonymous views
      const { data: anonymousViews, error: errorAnonymous } = await supabase
        .from('anonymous_views')
        .select('movie_id, viewed_at')
        .gte('viewed_at', startDate)
        .lte('viewed_at', endDate);

      // Fetch user movie history
      const { data: userHistory, error: errorHistory } = await supabase
        .from('user_movie_history')
        .select('movie_id, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (errorAnonymous || errorHistory) {
        console.error('Error fetching views:', errorAnonymous || errorHistory);
        return [];
      }

      // Combine and process data
      const allViews = [
        ...(anonymousViews || []).map(v => ({ ...v, date: v.viewed_at })),
        ...(userHistory || []).map(v => ({ ...v, date: v.created_at }))
      ];

      // Calculate total views
      setTotalViews(allViews.length);

      // Group views by date
      const dailyCounts = allViews.reduce((acc, view) => {
        const date = new Date(view.date).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const formattedData = Object.entries(dailyCounts).map(([date, count]) => ({
        date,
        count
      })).sort((a, b) => a.date.localeCompare(b.date));

      setViewsOverTime(formattedData);

      return allViews;
    }
  });

  const { data: mostViewedMovies } = useQuery({
    queryKey: ['most-viewed-movies', startDate, endDate],
    queryFn: async () => getMostViewedMovies(startDate, endDate)
  });

  const { data: topRatedMovies } = useQuery({
    queryKey: ['top-rated-movies', startDate, endDate],
    queryFn: async () => getTopRatedMovies(startDate, endDate)
  });

  const { data: mostReportedMovies } = useQuery({
    queryKey: ['most-reported-movies', startDate, endDate],
    queryFn: async () => getMostReportedMovies(startDate, endDate)
  });

  const deviceBreakdownData = deviceStatsData
    ? deviceStatsData.reduce((acc: any[], curr: any) => {
        const existingDevice = acc.find(
          (d) => d.name.toLowerCase() === curr.device_type.toLowerCase()
        );
        if (existingDevice) {
          existingDevice.value += curr.total_views;
        } else {
          acc.push({
            name: curr.device_type || "Unknown",
            value: curr.total_views,
          });
        }
        return acc;
      }, [])
    : [];

  const countryComparisonData = countryViewsData
    ? countryViewsData.map((country: any) => ({
        country: countryNames[country.country_code] || country.country_code,
        registered: country.registered_views || 0,
        anonymous: country.anonymous_views || 0,
        total: country.total_views || 0,
      }))
    : [];

  const browserMarketShareData = browserStatsData
    ? browserStatsData.map((browser: any) => ({
        name: browser.browser_name || "Unknown",
        value: browser.total_views,
      }))
    : [];

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
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              View Statistics
              <HoverCard>
                <HoverCardTrigger><Info className="h-4 w-4" /></HoverCardTrigger>
                <HoverCardContent>
                  Includes both anonymous and registered user views
                </HoverCardContent>
              </HoverCard>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-2xl font-bold">{totalViews} Total Views</div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={viewsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <CountryViewsDisplay countryViewsData={countryViewsData} />

      <Card>
        <CardHeader>
          <CardTitle>User Type Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chart">
            <TabsList className="mb-4">
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
            </TabsList>
            <TabsContent value="chart">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={countryComparisonData.slice(0, 10)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="country"
                      angle={-45}
                      textAnchor="end"
                      tick={{ fontSize: 12 }}
                      height={70}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="registered" fill="#8884d8" name="Registered" />
                    <Bar dataKey="anonymous" fill="#82ca9d" name="Anonymous" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            <TabsContent value="table">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left">Country</th>
                      <th className="p-2 text-right">Registered Views</th>
                      <th className="p-2 text-right">Anonymous Views</th>
                      <th className="p-2 text-right">Total Views</th>
                      <th className="p-2 text-right">% Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {countryComparisonData.map((country: any, i: number) => (
                      <tr
                        key={i}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="p-2">{country.country}</td>
                        <td className="p-2 text-right">{country.registered}</td>
                        <td className="p-2 text-right">{country.anonymous}</td>
                        <td className="p-2 text-right">{country.total}</td>
                        <td className="p-2 text-right">
                          {country.total > 0
                            ? Math.round(
                                (country.registered / country.total) * 100
                              )
                            : 0}
                          %
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Device Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceBreakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({
                      cx,
                      cy,
                      midAngle,
                      innerRadius,
                      outerRadius,
                      percent,
                      name,
                    }) => {
                      const RADIAN = Math.PI / 180;
                      const radius =
                        innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);

                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#fff"
                          textAnchor={x > cx ? "start" : "end"}
                          dominantBaseline="central"
                        >
                          {`${name} ${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {deviceBreakdownData.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={DEVICE_COLORS[index % DEVICE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-around mt-4">
              <div className="flex flex-col items-center">
                <Smartphone className="h-8 w-8 text-[#0088FE]" />
                <span className="text-sm mt-1">Mobile</span>
              </div>
              <div className="flex flex-col items-center">
                <Tablet className="h-8 w-8 text-[#00C49F]" />
                <span className="text-sm mt-1">Tablet</span>
              </div>
              <div className="flex flex-col items-center">
                <Laptop className="h-8 w-8 text-[#FFBB28]" />
                <span className="text-sm mt-1">Laptop</span>
              </div>
              <div className="flex flex-col items-center">
                <Monitor className="h-8 w-8 text-[#FF8042]" />
                <span className="text-sm mt-1">Desktop</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Browser Market Share</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={browserMarketShareData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({
                      cx,
                      cy,
                      midAngle,
                      innerRadius,
                      outerRadius,
                      percent,
                      name,
                    }) => {
                      const RADIAN = Math.PI / 180;
                      const radius =
                        innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);

                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#fff"
                          textAnchor={x > cx ? "start" : "end"}
                          dominantBaseline="central"
                        >
                          {`${name} ${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {browserMarketShareData.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={DEVICE_COLORS[index % DEVICE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Browser</th>
                    <th className="text-right p-2">Views</th>
                    <th className="text-right p-2">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {browserMarketShareData.slice(0, 5).map((browser: any, i: number) => {
                    const total = browserMarketShareData.reduce(
                      (sum: number, item: any) => sum + item.value,
                      0
                    );
                    const percentage = total > 0 
                      ? Math.round((browser.value / total) * 100) 
                      : 0;
                    
                    return (
                      <tr key={i} className="border-b hover:bg-muted/50">
                        <td className="p-2">{browser.name}</td>
                        <td className="p-2 text-right">{browser.value}</td>
                        <td className="p-2 text-right">{percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

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
                    <td className="p-2 text-right">{movie.rating}</td>
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
                    <td className="p-2 text-right">{movie.verified_report_count}</td>
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
