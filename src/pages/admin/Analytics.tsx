import { useState, useEffect, useMemo } from "react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AnalyticsSection from "@/components/admin/AnalyticsSection";
import { toast } from "sonner";

interface MovieData {
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

interface CountryView {
    country_code: string;
    view_count: number;
    registered_views?: number;
    anonymous_views?: number;
    total_views?: number;
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

            const [reports, views, ratings, countryViewsResponse] = await Promise.all([
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

            const topViewedMovies = views.data
                ? [...new Map(views.data
                    .filter(movie => movie && movie.id && movie.title)
                    .map(movie => [movie.id, {
                        id: movie.id,
                        title: movie.title,
                        thumbnail_url: movie.thumbnail_url,
                        count: movie.watch_count || 0
                    }]))
                    .values()]
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5)
                : [];

            const ratingsByMovie = new Map();
            ratings.data?.forEach(rating => {
                if (!rating.movie_id || !rating.movie?.title) return;
                
                if (!ratingsByMovie.has(rating.movie_id)) {
                    ratingsByMovie.set(rating.movie_id, {
                        id: rating.movie_id,
                        title: rating.movie.title,
                        thumbnail_url: rating.movie.thumbnail_url,
                        ratings: [],
                        count: 0
                    });
                }
                
                const movieData = ratingsByMovie.get(rating.movie_id);
                movieData.ratings.push(rating.rating);
                movieData.count++;
                ratingsByMovie.set(rating.movie_id, movieData);
            });

            const topRatedMovies = Array.from(ratingsByMovie.values())
                .map(movie => ({
                    ...movie,
                    rating: movie.ratings.reduce((a, b) => a + b, 0) / movie.ratings.length
                }))
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 5);

            const reportsByMovie = new Map();
            reports.data?.forEach(report => {
                if (!report.movie_id || !report.movie?.title) return;
                
                if (!reportsByMovie.has(report.movie_id)) {
                    reportsByMovie.set(report.movie_id, {
                        id: report.movie_id,
                        title: report.movie.title,
                        thumbnail_url: report.movie.thumbnail_url,
                        count: 0
                    });
                }
                
                const movieData = reportsByMovie.get(report.movie_id);
                movieData.count++;
                reportsByMovie.set(report.movie_id, movieData);
            });

            const topReportedMovies = Array.from(reportsByMovie.values())
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            const countryViews: CountryView[] = (countryViewsResponse.data || []).map(view => ({
                country_code: view.country_code,
                view_count: view.total_views || 0,
                registered_views: view.registered_views,
                anonymous_views: view.anonymous_views,
                total_views: view.total_views
            }));

            return {
                topMovies: {
                    viewed: topViewedMovies,
                    rated: topRatedMovies,
                    reported: topReportedMovies
                },
                countryViews
            };
        }
    });

    const dailyTrendData = useMemo(() => {
        if (!stats) return [];
        
        const days = [];
        const currentDate = new Date(dateRange.from || new Date());
        const endDate = new Date(dateRange.to || new Date());
        
        while (currentDate <= endDate) {
            days.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return days.map(date => {
            const dateStr = date.toISOString().split('T')[0];
            const viewCount = Math.floor(Math.random() * 100); // Replace with actual data
            return {
                date: dateStr,
                views: viewCount,
                ratings: Math.floor(viewCount * 0.4), // Example calculation, replace with actual data
                reports: Math.floor(viewCount * 0.05), // Example calculation, replace with actual data
            };
        });
    }, [stats, dateRange]);

    const handleExport = (format: 'csv' | 'pdf' | 'docx') => {
        if (!stats) return;

        switch (format) {
            case 'csv':
                const csvData = prepareExportData(stats, dateRange);
                downloadCSV(csvData, `analytics_${dateRange.from?.toISOString()}_${dateRange.to?.toISOString()}`);
                break;
            case 'pdf':
                toast.info("PDF export would be implemented here");
                break;
            case 'docx':
                toast.info("DOCX export would be implemented here");
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

    const renderDailyTrendChart = () => (
        <Card className="col-span-1 md:col-span-3 lg:col-span-2">
            <CardHeader>
                <CardTitle>Daily Trends</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={dailyTrendData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="views" stroke="#E50914" activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="ratings" stroke="#0070f3" />
                            <Line type="monotone" dataKey="reports" stroke="#ffb400" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );

    const renderCategoryDistributionChart = () => {
        const categoryData = [
            { name: 'Drama', value: 35 },
            { name: 'Comedy', value: 25 },
            { name: 'Romance', value: 15 },
            { name: 'Action', value: 10 },
            { name: 'Other', value: 15 }
        ];
        
        const COLORS = ['#E50914', '#ff8c00', '#ffb400', '#0070f3', '#8884d8'];
        
        return (
            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle>Genre Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        );
    };

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            {stats?.topMovies.viewed.map((movie: MovieData, index: number) => (
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
                    data: stats?.topMovies.rated.map((movie: MovieData) => ({
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
                            {stats?.topMovies.rated.map((movie: MovieData, index: number) => (
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderDailyTrendChart()}
                {renderCategoryDistributionChart()}
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

function prepareExportData(data: any, dateRange: DateRange) {
    const formatDate = (date: string) => new Date(date).toLocaleDateString();
    
    return {
        topMoviesViewed: {
            headers: ['Rank', 'Movie Title', 'Views'],
            data: data.topMovies.viewed.map((movie: any, index: number) => ({
                'Rank': index + 1,
                'Movie Title': movie.title,
                'Views': movie.count
            }))
        },
        topMoviesRated: {
            headers: ['Rank', 'Movie Title', 'Average Rating'],
            data: data.topMovies.rated.map((movie: any, index: number) => ({
                'Rank': index + 1,
                'Movie Title': movie.title,
                'Average Rating': movie.rating?.toFixed(1) || 'N/A'
            }))
        },
        topMoviesReported: {
            headers: ['Rank', 'Movie Title', 'Reports'],
            data: data.topMovies.reported.map((movie: any, index: number) => ({
                'Rank': index + 1,
                'Movie Title': movie.title,
                'Reports': movie.count
            }))
        },
        countryViews: {
            headers: ['Country Code', 'Views'],
            data: data.countryViews.map((country: any) => ({
                'Country Code': country.country_code,
                'Views': country.view_count
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
