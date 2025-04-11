import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface CountryData {
  country: string;
  count: number;
  color: string;
}

interface CityData {
  city: string;
  count: number;
  color: string;
}

// Colors for the charts
const COLORS = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
  "#8CD47E",
  "#EA526F",
  "#23B5D3",
  "#279AF1",
];

const CountryAnalytics = () => {
  const [timeRange, setTimeRange] = useState<"all" | "week" | "month" | "day">("all");

  // Fetch and aggregate country data
  const { data: countryStats, isLoading } = useQuery({
    queryKey: ["country-analytics", timeRange],
    queryFn: async () => {
      let query = supabase
        .from("user_analytics")
        .select("country, timestamp") // Fetch only necessary columns
        .not("country", "is", null);

      // Apply time filter if not "all"
      if (timeRange === "day") {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        query = query.gte("timestamp", oneDayAgo.toISOString());
      } else if (timeRange === "week") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        query = query.gte("timestamp", oneWeekAgo.toISOString());
      } else if (timeRange === "month") {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        query = query.gte("timestamp", oneMonthAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching country stats:", error);
        throw error;
      }

      // Aggregate data in JavaScript
      const aggregatedData = data.reduce((acc, item) => {
        acc[item.country] = (acc[item.country] || 0) + 1;
        return acc;
      }, {});

      // Convert aggregated data into an array and sort
      return Object.entries(aggregatedData)
        .map(([country, count]) => ({
          country,
          count,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        }))
        .sort((a, b) => Number(b.count) - Number(a.count));
    },
  });

  // Fetch and aggregate city data across all countries
  const { data: cityStats } = useQuery({
    queryKey: ["city-analytics", timeRange],
    queryFn: async () => {
      let query = supabase
        .from("user_analytics")
        .select("city, timestamp")
        .not("city", "is", null);

      // Apply time filter if not "all"
      if (timeRange === "day") {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        query = query.gte("timestamp", oneDayAgo.toISOString());
      } else if (timeRange === "week") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        query = query.gte("timestamp", oneWeekAgo.toISOString());
      } else if (timeRange === "month") {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        query = query.gte("timestamp", oneMonthAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching city stats:", error);
        throw error;
      }

      // Aggregate data in JavaScript
      const aggregatedData = data.reduce((acc, item) => {
        acc[item.city] = (acc[item.city] || 0) + 1;
        return acc;
      }, {});

      // Convert aggregated data into an array and sort
      return Object.entries(aggregatedData)
        .map(([city, count]) => ({
          city,
          count,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        }))
        .sort((a, b) => Number(b.count) - Number(a.count))
        .slice(0, 10); // Limit to top 10 cities
    },
    enabled: !!countryStats && countryStats.length > 0,
  });

  // Get total visitor count
  const totalVisitors = countryStats?.reduce(
    (sum: number, item: { count: unknown }) => sum + Number(item.count as number),
    0
  ) || 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Visitor Analytics by Country</CardTitle>
        <Tabs defaultValue={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
          <TabsList className="grid grid-cols-4 md:w-[400px]">
            <TabsTrigger value="all">All Time</TabsTrigger>
            <TabsTrigger value="month">Last Month</TabsTrigger>
            <TabsTrigger value="week">Last Week</TabsTrigger>
            <TabsTrigger value="day">Last 24h</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Country Distribution */}
          <div>
            <h3 className="text-lg font-medium mb-2">Country Distribution</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {totalVisitors} total visitors from {countryStats?.length || 0} countries
            </p>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countryStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="country" type="category" width={60} />
                  <Tooltip formatter={(value) => [`${value} visitors`, "Count"]} />
                  <Bar dataKey="count">
                    {countryStats?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Country Distribution Table */}
            <table className="w-full mt-4 border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-200 px-4 py-2 text-left">Country</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Visitors</th>
                </tr>
              </thead>
              <tbody>
                {countryStats?.map((country, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">{country.country}</td>
                    <td className="border border-gray-200 px-4 py-2">{String(country.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top Cities Across All Countries */}
          <div>
            <h3 className="text-lg font-medium mb-2">Top Cities</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Distribution of visitors across top cities
            </p>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cityStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="city"
                    label={({ city, percent }) =>
                      `${city}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {cityStats?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} visitors`, "Count"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Top Cities Table */}
            <table className="w-full mt-4 border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-200 px-4 py-2 text-left">City</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Visitors</th>
                </tr>
              </thead>
              <tbody>
                {cityStats?.map((city, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">{city.city}</td>
                    <td className="border border-gray-200 px-4 py-2">{Number(city.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CountryAnalytics;