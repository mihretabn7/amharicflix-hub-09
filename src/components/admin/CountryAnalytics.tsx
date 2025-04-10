
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
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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

interface AnonymousViewsData {
  country: string;
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
  const [viewType, setViewType] = useState<"all" | "registered" | "anonymous">("all");

  // Fetch and aggregate country data for registered users
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

  // Fetch anonymous views country data
  const { data: anonymousCountryStats } = useQuery({
    queryKey: ["anonymous-country-analytics", timeRange],
    queryFn: async () => {
      let query = supabase
        .from("anonymous_views")
        .select("country_code, viewed_at")
        .not("country_code", "is", null);

      // Apply time filter if not "all"
      if (timeRange === "day") {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        query = query.gte("viewed_at", oneDayAgo.toISOString());
      } else if (timeRange === "week") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        query = query.gte("viewed_at", oneWeekAgo.toISOString());
      } else if (timeRange === "month") {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        query = query.gte("viewed_at", oneMonthAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching anonymous country stats:", error);
        throw error;
      }

      // Aggregate data in JavaScript
      const aggregatedData = data.reduce((acc, item) => {
        acc[item.country_code] = (acc[item.country_code] || 0) + 1;
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
    queryKey: ["city-analytics", timeRange, viewType],
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
    enabled: viewType !== "anonymous",
  });

  // Get displayed data based on view type
  const getDisplayedCountryData = () => {
    if (viewType === "registered") return countryStats || [];
    if (viewType === "anonymous") return anonymousCountryStats || [];
    // For "all", combine both datasets
    if (countryStats && anonymousCountryStats) {
      const combinedData = {};
      
      // Merge registered users data
      countryStats.forEach(item => {
        combinedData[item.country] = (combinedData[item.country] || 0) + Number(item.count);
      });
      
      // Merge anonymous users data
      anonymousCountryStats.forEach(item => {
        combinedData[item.country] = (combinedData[item.country] || 0) + Number(item.count);
      });
      
      // Convert to array format
      return Object.entries(combinedData)
        .map(([country, count]) => ({
          country,
          count,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        }))
        .sort((a, b) => Number(b.count) - Number(a.count));
    }
    return countryStats || [];
  };

  const displayedCountryData = getDisplayedCountryData();
  
  // Get total visitor count
  const totalVisitors = displayedCountryData?.reduce(
    (sum, item) => sum + Number(item.count),
    0
  ) || 0;

  // Setup realtime listeners
  useEffect(() => {
    const channel = supabase
      .channel('location-analytics-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_analytics'
        },
        (payload) => {
          toast.info('New visitor detected', {
            description: `New visitor from ${payload.new.country || 'Unknown'}`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'anonymous_views'
        },
        (payload) => {
          toast.info('New anonymous visit', {
            description: `Anonymous visit from ${payload.new.country_code || 'Unknown'}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <Tabs defaultValue={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
            <TabsList className="grid grid-cols-4 md:w-[400px]">
              <TabsTrigger value="all">All Time</TabsTrigger>
              <TabsTrigger value="month">Last Month</TabsTrigger>
              <TabsTrigger value="week">Last Week</TabsTrigger>
              <TabsTrigger value="day">Last 24h</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Tabs defaultValue={viewType} onValueChange={(value) => setViewType(value as any)}>
            <TabsList className="grid grid-cols-3 md:w-[300px]">
              <TabsTrigger value="all">All Users</TabsTrigger>
              <TabsTrigger value="registered">Registered</TabsTrigger>
              <TabsTrigger value="anonymous">Anonymous</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Country Distribution */}
          <div>
            <h3 className="text-lg font-medium mb-2">Country Distribution</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {totalVisitors} total visitors from {displayedCountryData?.length || 0} countries
            </p>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayedCountryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="country" type="category" width={60} />
                  <Tooltip formatter={(value) => [`${value} visitors`, "Count"]} />
                  <Bar dataKey="count">
                    {displayedCountryData?.map((entry, index) => (
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
                {displayedCountryData?.map((country, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">{country.country}</td>
                    <td className="border border-gray-200 px-4 py-2">{String(country.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top Cities or Pie Chart based on view type */}
          <div>
            {viewType !== "anonymous" ? (
              <>
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
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium mb-2">Anonymous Visitors Distribution</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Distribution of anonymous visitors by country
                </p>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={anonymousCountryStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="country"
                        label={({ country, percent }) =>
                          `${country}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {anonymousCountryStats?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} anonymous visitors`, "Count"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Anonymous Visitors Table */}
                <table className="w-full mt-4 border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-200 px-4 py-2 text-left">Country</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">Anonymous Visitors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anonymousCountryStats?.map((country, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-2">{country.country}</td>
                        <td className="border border-gray-200 px-4 py-2">{Number(country.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CountryAnalytics;
