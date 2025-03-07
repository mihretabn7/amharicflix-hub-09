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
import { Download, File, FileText } from "lucide-react";
import { DateRange } from "react-day-picker";
import { DetailedListModal } from "@/components/admin/DetailedListModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AnalyticsSection } from "@/components/admin/AnalyticsSection";

interface MovieData {
    id: string;
    title: string;
    thumbnail_url: string;
    count: number;
    rating?: number;
    ratings?: number[];
}

interface MovieStats {
    id: string;
    title: string;
    thumbnail_url: string;
    count: number;
    rating?: number;
    ratings?: number[];
}

interface ListItem {
    id: string;
    title: string;
    thumbnail_url: string;
    count: number;
    suffix?: string;
}

export default function Analytics() {
    const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'alltime'>('monthly');
    const [dateRange, setDateRange] = useState<DateRange>({
        from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        to: new Date()
    });

    const [selectedList, setSelectedList] = useState<{
        type: 'views' | 'ratings' | 'reviews' | 'reports';
        data: ListItem[];
        title: string;
    } | null>(null);

    const { data: stats, isLoading, refetch } = useQuery({
        queryKey: ['dashboard-stats', timeRange, dateRange],
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

            const [reports, views, ratings, countryViews] = await Promise.all([
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
                    .gte('created_at', timeRange !== 'alltime' ? timeAgo.toISOString() : '1970-01-01'),

                supabase
                    .from('movies')
                    .select(`
                        id,
                        title,
                        thumbnail_url,
                        watch_count
                    `)
                    .gte('created_at', timeRange !== 'alltime' ? timeAgo.toISOString() : '1970-01-01'),

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
                    .gte('created_at', timeRange !== 'alltime' ? timeAgo.toISOString() : '1970-01-01'),
                
                supabase.rpc('get_views_by_country')
            ]);

            const topViewedMovies = views.data?.map(movie => ({
                id: movie.id,
                title: movie.title,
                thumbnail_url: movie.thumbnail_url,
                count: movie.watch_count || 0
            })).sort((a, b) => b.count - a.count).slice(0, 5) || [];

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
                    viewed: topViewedMovies,
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
                },
                countryViews: countryViews.data || []
            };
        }
    });

    const handleExport = (format: 'csv' | 'pdf' | 'docx') => {
        if (!stats) return;

        switch (format) {
            case 'csv':
                const csvData = prepareExportData(stats, dateRange);
                downloadCSV(csvData, `analytics_${dateRange.from?.toISOString()}_${dateRange.to?.toISOString()}`);
                break;
            case 'pdf':
                alert("PDF export would be implemented here using libraries like jsPDF");
                break;
            case 'docx':
                alert("DOCX export would be implemented here using libraries like docx");
                break;
        }
    };

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

    const totalViews = stats?.topMovies.viewed.reduce((sum: number, c: MovieData) => sum + c.count, 0) || 1;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold">Analytics</h1>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                    <Tabs value={timeRange} onValueChange={(v: any) => setTimeRange(v)} className="w-full md:w-auto">
                        <TabsList className="w-full grid-cols-5 grid">
                            <TabsTrigger value="daily">Daily</TabsTrigger>
                            <TabsTrigger value="weekly">Weekly</TabsTrigger>
                            <TabsTrigger value="monthly">Monthly</TabsTrigger>
                            <TabsTrigger value="yearly">Yearly</TabsTrigger>
                            <TabsTrigger value="alltime">All Time</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <DateRangePicker value={dateRange} onChange={setDateRange} />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button>
                                <Download className="mr-2 h-4 w-4" />
                                Export Report
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleExport('csv')}>
                                <FileText className="mr-2 h-4 w-4" />
                                CSV Format
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('pdf')}>
                                <File className="mr-2 h-4 w-4" />
                                PDF Format
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('docx')}>
                                <File className="mr-2 h-4 w-4" />
                                Word Document
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:bg-accent/50" onClick={() => setSelectedList({
                    type: 'views',
                    data: stats?.topMovies.viewed.map((movie: MovieData) => ({
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

                <Card className="cursor-pointer hover:bg-accent/50" onClick={() => setSelectedList({
                    type: 'reports',
                    data: stats?.topMovies.reported.map((movie: MovieData) => ({
                        id: movie.id,
                        title: movie.title,
                        thumbnail_url: movie.thumbnail_url,
                        count: movie.count,
                        suffix: 'reports'
                    })) || [],
                    title: 'Most Reported Movies'
                })}>
                    <CardHeader>
                        <CardTitle>Most Reported Movies</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.topMovies.reported.map((movie: MovieData, index: number) => (
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

            <DetailedListModal
                open={!!selectedList}
                onOpenChange={(open) => !open && setSelectedList(null)}
                title={selectedList?.title || ''}
                data={selectedList?.data || []}
                renderItem={(item: ListItem, index) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 rounded-lg bg-accent/50">
                        <img
                            src={item.thumbnail_url}
                            alt={item.title}
                            className="w-24 h-16 object-cover rounded-md"
                        />
                        <div className="flex-1">
                            <h3 className="font-medium">{item.title}</h3>
                            <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm text-muted-foreground">
                                    {item.count} {item.suffix || selectedList?.type || ''}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            />

            <AnalyticsSection />
        </div>
    );
}

function calculateGrowth(prevData: any[], currentData: any[], field: string) {
    const prevCount = prevData?.reduce((sum, item) => sum + (item[field]?.length || 0), 0) || 0;
    const currentCount = currentData?.reduce((sum, item) => sum + (item[field]?.length || 0), 0) || 0;
    return ((currentCount - prevCount) / (prevCount || 1)) * 100;
}

function generateDailyTrends(data: any[], dateRange: any) {
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
    };
}

function prepareExportData(data: any, dateRange: DateRange) {
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
                'New Users': 0
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
        csv += `\n${section.toUpperCase()} - Generated at ${new Date().toLocaleString()}\n`;
        csv += '='.repeat(50) + '\n\n';

        csv += content.headers.join(',') + '\n';

        content.data.forEach((row: any) => {
            csv += content.headers.map((header: string) =>
                JSON.stringify(row[header] || '')
            ).join(',') + '\n';
        });

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
