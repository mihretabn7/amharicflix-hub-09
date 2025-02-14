import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { DateRange } from "react-day-picker";
import { DetailedListModal } from "@/components/admin/DetailedListModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface MovieStats {
    id: string;
    title: string;
    thumbnail_url: string;
    count: number;
    rating?: number;
    ratings?: number[];
}

export default function Analytics() {
    const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'alltime'>('monthly');
    const [dateRange, setDateRange] = useState<DateRange>({
        from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        to: new Date()
    });

    // Add state for modal
    const [selectedList, setSelectedList] = useState<{
        type: 'views' | 'ratings' | 'reviews' | 'reports';
        data: any[];
        title: string;
    } | null>(null);

    const { data: stats, isLoading, refetch } = useQuery({
        queryKey: ['dashboard-stats', timeRange],
        queryFn: async () => {
            const timeAgo = new Date();
            if (timeRange !== 'alltime') {
                switch (timeRange) {
                    case 'yearly': timeAgo.setFullYear(timeAgo.getFullYear() - 1); break;
                    case 'monthly': timeAgo.setMonth(timeAgo.getMonth() - 1); break;
                    case 'weekly': timeAgo.setDate(timeAgo.getDate() - 7); break;
                    case 'daily': timeAgo.setDate(timeAgo.getDate() - 1); break;
                }
            }

            const [reports, views, ratings] = await Promise.all([
                // Reports stats
                supabase
                    .from('movie_reports')
                    .select(`
                        *,
                        movie:movies(
                            id,
                            title,
                            thumbnail_url
                        )
                    `)
                    .gte('created_at', timeAgo.toISOString()),

                // Views stats
                supabase
                    .from('user_movie_history')
                    .select(`
                        *,
                        movie:movies(
                            id,
                            title,
                            thumbnail_url
                        )
                    `)
                    .gte('watched_at', timeRange !== 'alltime' ? timeAgo.toISOString() : '1970-01-01'),

                // Ratings stats
                supabase
                    .from('movie_ratings')
                    .select(`
                        *,
                        movie:movies(
                            id,
                            title,
                            thumbnail_url
                        )
                    `)
                    .gte('created_at', timeRange !== 'alltime' ? timeAgo.toISOString() : '1970-01-01')
            ]);

            // Process stats
            const topViewedMovies = views.data?.reduce((acc: any, view) => {
                if (!view.movie_id || !view.movie?.title) return acc;
                acc[view.movie_id] = acc[view.movie_id] || {
                    id: view.movie_id,
                    title: view.movie.title,
                    thumbnail_url: view.movie.thumbnail_url,
                    count: 0
                };
                acc[view.movie_id].count++;
                return acc;
            }, {});

            const topRatedMovies = ratings.data?.reduce((acc: any, rating) => {
                if (!rating.movie_id || !rating.movie?.title) return acc;
                acc[rating.movie_id] = acc[rating.movie_id] || {
                    id: rating.movie_id,
                    title: rating.movie.title,
                    thumbnail_url: rating.movie.thumbnail_url,
                    ratings: [],
                    count: 0
                };
                acc[rating.movie_id].ratings.push(rating.rating);
                acc[rating.movie_id].count++;
                return acc;
            }, {});

            const topReportedMovies = reports.data?.reduce((acc: any, report) => {
                if (!report.movie_id || !report.movie?.title) return acc;
                acc[report.movie_id] = acc[report.movie_id] || {
                    id: report.movie_id,
                    title: report.movie.title,
                    thumbnail_url: report.movie.thumbnail_url,
                    count: 0
                };
                acc[report.movie_id].count++;
                return acc;
            }, {});

            return {
                topMovies: {
                    viewed: Object.values(topViewedMovies || {})
                        .sort((a: any, b: any) => b.count - a.count)
                        .slice(0, 5),
                    rated: Object.values(topRatedMovies || {})
                        .map((movie: any) => ({
                            ...movie,
                            rating: movie.ratings.reduce((a: number, b: number) => a + b, 0) / movie.ratings.length
                        }))
                        .sort((a: any, b: any) => b.rating - a.rating)
                        .slice(0, 5),
                    reported: Object.values(topReportedMovies || {})
                        .sort((a: any, b: any) => b.count - a.count)
                        .slice(0, 5)
                }
            };
        }
    });

    const handleExport = () => {
        if (!stats) return;

        const csvData = prepareExportData(stats);

        downloadCSV(csvData, `analytics_${dateRange.from?.toISOString()}_${dateRange.to?.toISOString()}`);
    };

    // Add real-time updates with useEffect
    useEffect(() => {
        const channel = supabase.channel('analytics-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'movie_reports'
                },
                () => refetch()
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_movie_history'
                },
                () => refetch()
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'movie_ratings'
                },
                () => refetch()
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'movies'
                },
                () => refetch()
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'profiles'
                },
                () => refetch()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [refetch]);

    const totalViews = stats?.topMovies.viewed.reduce((sum, c) => sum + c.count, 0) || 1;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Analytics</h1>
                <div className="flex items-center gap-4">
                    <Tabs value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
                        <TabsList>
                            <TabsTrigger value="daily">Daily</TabsTrigger>
                            <TabsTrigger value="weekly">Weekly</TabsTrigger>
                            <TabsTrigger value="monthly">Monthly</TabsTrigger>
                            <TabsTrigger value="yearly">Yearly</TabsTrigger>
                            <TabsTrigger value="alltime">All Time</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <DateRangePicker value={dateRange} onChange={setDateRange} />
                    <Button onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export Report
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Most Viewed Movies */}
                <Card className="cursor-pointer hover:bg-accent/50" onClick={() => setSelectedList({
                    type: 'views',
                    data: stats?.topMovies.viewed.map(movie => ({
                        id: movie.id,
                        title: movie.title,
                        thumbnail_url: movie.thumbnail_url,
                        count: movie.count,
                        suffix: 'views'
                    })) || [],
                    title: 'Most Viewed Movies'
                })}>
                    <CardHeader>
                        <CardTitle>Most Viewed Movies</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.topMovies.viewed.map((movie: MovieStats, index: number) => (
                                <div key={movie.id} className="flex items-center gap-4">
                                    <img
                                        src={movie.thumbnail_url}
                                        alt={movie.title}
                                        className="w-16 h-9 object-cover rounded-md"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium">{movie.title}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {movie.count} views
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Rated Movies */}
                <Card className="cursor-pointer hover:bg-accent/50" onClick={() => setSelectedList({
                    type: 'ratings',
                    data: stats?.topMovies.rated.map((movie: MovieStats) => ({
                        id: movie.id,
                        title: movie.title,
                        thumbnail_url: movie.thumbnail_url,
                        count: movie.rating || 0,
                        suffix: '★'
                    })) || [],
                    title: 'Top Rated Movies'
                })}>
                    <CardHeader>
                        <CardTitle>Top Rated Movies</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.topMovies.rated.map((movie: MovieStats, index: number) => (
                                <div key={movie.id} className="flex items-center gap-4">
                                    <img
                                        src={movie.thumbnail_url}
                                        alt={movie.title}
                                        className="w-16 h-9 object-cover rounded-md"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium">{movie.title}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {movie.rating?.toFixed(1) || 'N/A'} ★
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Most Reported Movies */}
                <Card className="cursor-pointer hover:bg-accent/50" onClick={() => setSelectedList({
                    type: 'reports',
                    data: stats?.topMovies.reported.map(movie => ({
                        ...movie,
                        suffix: 'reports'
                    })) || [],
                    title: 'Most Reported Movies'
                })}>
                    <CardHeader>
                        <CardTitle>Most Reported Movies</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.topMovies.reported.map((movie: MovieStats, index: number) => (
                                <div key={movie.id} className="flex items-center gap-4">
                                    <img
                                        src={movie.thumbnail_url}
                                        alt={movie.title}
                                        className="w-16 h-9 object-cover rounded-md"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium">{movie.title}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {movie.count} reports
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed List Modal */}
            <DetailedListModal
                open={!!selectedList}
                onOpenChange={(open) => !open && setSelectedList(null)}
                title={selectedList?.title || ''}
                data={selectedList?.data || []}
                renderItem={(item, index) => (
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-accent/50">
                        <img
                            src={item.thumbnail_url}
                            alt={item.title}
                            className="w-24 h-16 object-cover rounded-md"
                        />
                        <div className="flex-1">
                            <h3 className="font-medium">{item.title}</h3>
                            <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm text-muted-foreground">
                                    {item.count} {item.suffix}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            />

            {/* Views by Country */}
            <div className="bg-card rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Views by Country</h3>
                <div className="h-[400px] overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Country</TableHead>
                                <TableHead>Views</TableHead>
                                <TableHead>Percentage</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats?.topMovies.viewed.map((country: MovieStats) => (
                                <TableRow key={country.id}>
                                    <TableCell>{country.title || 'Unknown'}</TableCell>
                                    <TableCell>{country.count}</TableCell>
                                    <TableCell>
                                        <div
                                            className="bg-blue-100 h-2 rounded-full"
                                            style={{ width: `${(country.count / totalViews) * 100}%` }}
                                        />
                                        {((country.count / totalViews) * 100).toFixed(1)}%
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}

// Helper functions
function calculateGrowth(prevData: any[], currentData: any[], field: string) {
    const prevCount = prevData?.reduce((sum, item) => sum + (item[field]?.length || 0), 0) || 0;
    const currentCount = currentData?.reduce((sum, item) => sum + (item[field]?.length || 0), 0) || 0;
    return ((currentCount - prevCount) / (prevCount || 1)) * 100;
}

function generateDailyTrends(data: any[], dateRange: any) {
    // Generate daily points between date range
    const days = [];
    let currentDate = new Date(dateRange.from);
    while (currentDate <= dateRange.to) {
        days.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
        movies: days.map(date => ({
            date: date.toISOString().split('T')[0],
            value: data?.filter(item =>
                new Date(item.created_at).toISOString().split('T')[0] === date.toISOString().split('T')[0]
            ).length || 0
        }))
        // Similar for views and ratings
    };
}

function prepareExportData(data: any) {
    const formatDate = (date: string) => new Date(date).toLocaleDateString();
    const formatPercent = (num: number) => `${num.toFixed(1)}%`;

    return {
        summary: {
            headers: ['Metric', 'Current Value', 'Growth Rate'],
            data: [
                {
                    'Metric': 'Total Movies',
                    'Current Value': data.topMovies.viewed.length,
                    'Growth Rate': formatPercent(calculateGrowth(data.topMovies.viewed, data.topMovies.viewed, 'count'))
                },
                {
                    'Metric': 'Total Views',
                    'Current Value': sumArray(data.topMovies.viewed.map((m: any) => m.count)),
                    'Growth Rate': formatPercent(calculateGrowth(data.topMovies.viewed, data.topMovies.viewed, 'count'))
                },
                {
                    'Metric': 'Total Ratings',
                    'Current Value': sumArray(data.topMovies.rated.map((m: any) => m.rating)),
                    'Growth Rate': formatPercent(calculateGrowth(data.topMovies.rated, data.topMovies.rated, 'ratings'))
                },
                {
                    'Metric': 'Total Reports',
                    'Current Value': sumArray(data.topMovies.reported.map((m: any) => m.count)),
                    'Growth Rate': formatPercent(calculateGrowth(data.topMovies.reported, data.topMovies.reported, 'count'))
                }
            ]
        },
        topMovies: {
            headers: ['Rank', 'Title', 'Views', 'Rating', 'Reports', 'Created Date'],
            data: data.topMovies.viewed.map((movie: any, index: number) => ({
                'Rank': index + 1,
                'Title': movie.title,
                'Views': movie.count,
                'Rating': calculateAvgRating(data.topMovies.rated.map((m: any) => m.ratings)),
                'Reports': data.topMovies.reported.find((m: any) => m.id === movie.id)?.count || 0,
                'Created Date': formatDate(movie.created_at)
            }))
        },
        dailyStats: {
            headers: ['Date', 'Views', 'Ratings', 'Reports', 'New Users'],
            data: generateDailyTrends(data.topMovies.viewed, dateRange).movies.map((trend: any) => ({
                'Date': trend.date,
                'Views': trend.value,
                'Ratings': generateDailyTrends(data.topMovies.rated, dateRange).movies.find((t: any) => t.date === trend.date)?.value || 0,
                'Reports': generateDailyTrends(data.topMovies.reported, dateRange).movies.find((t: any) => t.date === trend.date)?.value || 0,
                'New Users': 0 // Assuming no new users are added
            }))
        },
        countryStats: {
            headers: ['Country Code', 'Views'],
            data: data.topMovies.viewed.map((c: any) => ({
                'Country Code': c.title,
                'Views': c.count
            }))
        }
    };
}

function convertToCSV(data: any) {
    let csv = '';

    Object.entries(data).forEach(([section, content]: [string, any]) => {
        // Add section header with timestamp
        csv += `\n${section.toUpperCase()} - Generated at ${new Date().toLocaleString()}\n`;
        csv += '='.repeat(50) + '\n\n';

        // Add headers
        csv += content.headers.join(',') + '\n';

        // Add data rows
        content.data.forEach((row: any) => {
            csv += content.headers.map((header: string) =>
                JSON.stringify(row[header] || '')
            ).join(',') + '\n';
        });

        // Add spacing between sections
        csv += '\n\n';
    });

    return csv;
}

function downloadCSV(data: any, filename: string) {
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Helper function to group data by date
function groupByDate(data: any[], dateField: string) {
    return data.reduce((acc: any, item) => {
        const date = new Date(item[dateField]).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});
}

function calculateAvgRating(ratings: any[]) {
    if (!ratings?.length) return 0;
    return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
}

function sumArray(arr: number[]): number {
    return arr.reduce((sum, val) => sum + val, 0);
} 