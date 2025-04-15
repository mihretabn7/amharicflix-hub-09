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
import { getStartDate } from "@/utils/date-utils";

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

interface CountryAnalyticsProps {
  timeRange: "daily" | "weekly" | "monthly" | "yearly";
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

const CountryAnalytics = ({ timeRange }: CountryAnalyticsProps) => {
  const [timeRangeState, setTimeRangeState] = useState<"daily" | "weekly" | "monthly" | "yearly">(timeRange);
  const startDate = getStartDate(timeRangeState);

  // Fetch and aggregate country data
  const { data: countryStats, isLoading } = useQuery({
    queryKey: ["country-analytics", timeRangeState],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_analytics")
        .select("country, timestamp")
        .not("country", "is", null)
        .gte("timestamp", startDate.toISOString());

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
    queryKey: ["city-analytics", timeRangeState],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_analytics")
        .select("city, timestamp")
        .not("city", "is", null)
        .gte("timestamp", startDate.toISOString());

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
        <Tabs defaultValue={timeRange} onValueChange={(value) => setTimeRangeState(value as any)}>
          <TabsList className="grid grid-cols-4 md:w-[400px]">
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="daily">Daily</TabsTrigger>
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
            <table className="min-w-full divide-y divide-gray-200 border border-gray-300 mt-4">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitors</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {countryStats?.map((country, index) => (
                  <tr key={index} className="hover:bg-gray-100">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{country.country}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{String(country.count)}</td>
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
            <table className="min-w-full divide-y divide-gray-200 border border-gray-300 mt-4">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitors</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cityStats?.map((city, index) => (
                  <tr key={index} className="hover:bg-gray-100">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{city.city}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{Number(city.count)}</td>
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