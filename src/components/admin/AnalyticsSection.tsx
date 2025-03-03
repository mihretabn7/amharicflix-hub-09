
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, PieChart, ResponsiveContainer, Bar, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// GeoJSON file with world countries
const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

interface CountryData {
  country_code: string;
  total_views: number;
  registered_views: number;
  anonymous_views: number;
}

export const AnalyticsSection = () => {
  const [countriesData, setCountriesData] = useState<CountryData[]>([]);
  
  // Query for country views data
  const { data: countryViews, isLoading: isLoadingCountries } = useQuery({
    queryKey: ['country-views'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_views_by_country');
      
      if (error) {
        console.error("Error fetching country views:", error);
        return [];
      }
      
      setCountriesData(data || []);
      return data || [];
    }
  });

  // Query for watch duration stats
  const { data: watchStats } = useQuery({
    queryKey: ['watch-stats'],
    queryFn: async () => {
      const { data: history } = await supabase
        .from('user_movie_history')
        .select('watch_duration, watched_at')
        .order('watched_at', { ascending: true });

      if (!history) return [];

      // Calculate average watch duration and group by day
      const grouped = history.reduce((acc: any, curr) => {
        const date = new Date(curr.watched_at).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = { total: 0, count: 0 };
        }
        acc[date].total += curr.watch_duration || 0;
        acc[date].count += 1;
        return acc;
      }, {});

      return Object.entries(grouped).map(([date, stats]: [string, any]) => ({
        date,
        avgDuration: Math.round(stats.total / stats.count / 60), // Convert to minutes
        views: stats.count
      }));
    }
  });

  // Registered vs Anonymous users views
  const registeredVsAnonymous = countriesData.reduce(
    (acc, country) => {
      acc.registered += country.registered_views;
      acc.anonymous += country.anonymous_views;
      return acc;
    },
    { registered: 0, anonymous: 0 }
  );

  const userTypeData = [
    { name: "Registered Users", value: registeredVsAnonymous.registered },
    { name: "Anonymous Users", value: registeredVsAnonymous.anonymous }
  ];

  // Query for user growth
  const { data: userGrowth } = useQuery({
    queryKey: ['user-growth'],
    queryFn: async () => {
      const { data: users } = await supabase
        .from('profiles')
        .select('created_at')
        .order('created_at', { ascending: true });

      if (!users) return [];

      // Group by week
      const grouped = users.reduce((acc: any, curr) => {
        const week = new Date(curr.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
        acc[week] = (acc[week] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(grouped).map(([date, count]) => ({
        date,
        users: count
      }));
    }
  });

  // Query for genre popularity
  const { data: genreStats } = useQuery({
    queryKey: ['genre-stats'],
    queryFn: async () => {
      const { data: movies } = await supabase
        .from('movies')
        .select('genre, watch_count');

      if (!movies) return [];

      const genreCounts = movies.reduce((acc: any, movie) => {
        if (movie.genre) {
          acc[movie.genre] = (acc[movie.genre] || 0) + (movie.watch_count || 0);
        }
        return acc;
      }, {});

      return Object.entries(genreCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => (b.value as number) - (a.value as number))
        .slice(0, 5);
    }
  });

  const COLORS = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEEAD'
  ];

  const getCountryFill = (geo: any) => {
    const country = countriesData.find(c => c.country_code === geo.properties.ISO_A2);
    if (!country) return "#EEE";
    
    // Compute heat based on total views
    const maxViews = Math.max(...countriesData.map(c => c.total_views));
    const intensity = country.total_views / maxViews;
    return `rgba(255, 107, 107, ${Math.max(0.1, intensity)})`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* World Map Visualization of Views */}
      <Card className="lg:col-span-2 overflow-hidden hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Global View Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingCountries ? (
            <Skeleton className="w-full h-[400px]" />
          ) : (
            <div className="h-[400px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <ComposableMap>
                  <ZoomableGroup center={[0, 0]} zoom={1}>
                    <Geographies geography={geoUrl}>
                      {({ geographies }) =>
                        geographies.map(geo => (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={getCountryFill(geo)}
                            stroke="#FFF"
                            style={{
                              default: { outline: "none" },
                              hover: { fill: "#FF8A80", outline: "none" },
                              pressed: { outline: "none" },
                            }}
                          />
                        ))
                      }
                    </Geographies>
                  </ZoomableGroup>
                </ComposableMap>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Country Data Table */}
      <Card className="overflow-auto max-h-[500px] hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Views by Country</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Country</th>
                  <th className="text-right p-2">Total</th>
                  <th className="text-right p-2">Registered</th>
                  <th className="text-right p-2">Anonymous</th>
                </tr>
              </thead>
              <tbody>
                {countriesData.map((country, index) => (
                  <tr key={index} className="border-b hover:bg-accent/50">
                    <td className="p-2">{country.country_code}</td>
                    <td className="text-right p-2">{country.total_views}</td>
                    <td className="text-right p-2">{country.registered_views}</td>
                    <td className="text-right p-2">{country.anonymous_views}</td>
                  </tr>
                ))}
                {countriesData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center p-4 text-muted-foreground">
                      No country data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Registered vs Anonymous Users */}
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Registered vs Anonymous Views</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userTypeData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                >
                  <Cell fill="#4ECDC4" />
                  <Cell fill="#FF6B6B" />
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Watch Duration & Views</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={watchStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px'
                  }}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="avgDuration" 
                  stroke="#4ECDC4" 
                  strokeWidth={2}
                  name="Avg Duration (min)"
                  dot={false}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="views" 
                  stroke="#FF6B6B" 
                  strokeWidth={2}
                  name="Views"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Top Genres & User Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="genres">
            <TabsList className="mb-4">
              <TabsTrigger value="genres">Top Genres</TabsTrigger>
              <TabsTrigger value="users">User Growth</TabsTrigger>
            </TabsList>
            
            <TabsContent value="genres">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genreStats}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {genreStats?.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="users">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="users" 
                      fill="#45B7D1"
                      name="New Users"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
