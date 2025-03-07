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

export default function AnalyticsSection() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const startDate = dateRange.from ? dateRange.from.toISOString() : '';
  const endDate = dateRange.to ? dateRange.to.toISOString() : '';

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
    </div>
  );
}
