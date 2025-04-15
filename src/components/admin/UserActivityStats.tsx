import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customRpcs } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface UserActivityStatsProps {
  timeRange: "daily" | "weekly" | "monthly" | "yearly";
}

export default function UserActivityStats({ timeRange }: UserActivityStatsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<"daily" | "weekly" | "monthly" | "yearly">(timeRange);

  const startDate = getStartDate(selectedTimeRange);

  const { data: activityStats, isLoading } = useQuery({
    queryKey: ['user-activity-stats', selectedTimeRange],
    queryFn: async () => {
      const { data, error } = await customRpcs.getUserActivityStats(
        startDate.toISOString(),
        new Date().toISOString()
      );

      if (error) {
        console.error("Error fetching user activity stats:", error);
        return [];
      }

      return data || [];
    },
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formattedData = activityStats?.map((item: any) => ({
    date: formatDate(item.date_period),
    views: item.views_count,
    ratings: item.ratings_count,
    reports: item.reports_count,
    users: item.unique_users,
  })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Activity Over Time</CardTitle>
        <Tabs defaultValue={selectedTimeRange} onValueChange={(value) => setSelectedTimeRange(value as any)}>
          <TabsList className="grid grid-cols-4 md:w-[400px]">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">Loading activity data...</div>
        ) : formattedData.length > 0 ? (
          <>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={formattedData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="#8884d8"
                    name="Views"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="ratings"
                    stroke="#82ca9d"
                    name="Ratings"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="reports"
                    stroke="#ff7300"
                    name="Reports"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#0088fe"
                    name="Unique Users"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ratings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reports</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Users</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formattedData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-100">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.views}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.ratings}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.reports}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.users}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {formattedData.length > 0 && (
                <>
                  <div className="bg-accent/50 p-4 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground">Total Views</div>
                    <div className="text-2xl font-bold">
                      {formattedData.reduce((sum, item) => sum + item.views, 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-accent/50 p-4 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground">Total Ratings</div>
                    <div className="text-2xl font-bold">
                      {formattedData.reduce((sum, item) => sum + item.ratings, 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-accent/50 p-4 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground">Total Reports</div>
                    <div className="text-2xl font-bold">
                      {formattedData.reduce((sum, item) => sum + item.reports, 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-accent/50 p-4 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground">Max Daily Users</div>
                    <div className="text-2xl font-bold">
                      {Math.max(...formattedData.map(item => item.users)).toLocaleString()}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No activity data available for the selected time range
          </div>
        )}
      </CardContent>
    </Card>
  );
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