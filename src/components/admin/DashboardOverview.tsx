import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, BarChart, PieChart, Line, Bar, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MovieUpload } from "@/components/admin/MovieUpload";
import { AddMovieModal } from "@/components/admin/AddMovieModal";

const COLORS = ['#4B56D2', '#82ca9d', '#F7D060', '#FF6B6B'];

export function DashboardOverview() {
    const { data: stats } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const [movies, users, history] = await Promise.all([
                supabase.from('movies').select('*', { count: 'exact' }),
                supabase.from('profiles').select('*', { count: 'exact' }),
                supabase.from('user_movie_history').select('*')
            ]);

            return {
                revenue: 24583,
                profitShare: 1046,
                dailySales: 342,
                totalIncome: 3567.56,
                monthlyAvg: 769.08,
                totalSales: 5489,
                moviesCount: movies.count || 0,
                usersCount: users.count || 0,
                viewsCount: history.data?.length || 0
            };
        }
    });

    const locationData = [
        { name: "Saint Lucia", value: 845 },
        { name: "Liberia", value: 548 },
        { name: "Saint Helena", value: 624 },
        { name: "Kenya", value: 624 },
        { name: "Christmas Island", value: 412 }
    ];

    const salesData = [
        { name: "Germany", value: 25 },
        { name: "Australia", value: 45 },
        { name: "United Kingdom", value: 10 },
        { name: "Brazil", value: 5 },
        { name: "Romania", value: 15 }
    ];

    const usStatesData = [
        { name: "Florida", value: 153 },
        { name: "Hawaii", value: 86.2 },
        { name: "New York", value: 123 },
        { name: "Texas", value: 155 },
        { name: "Georgia", value: 68 }
    ];

    return (
        <div className="space-y-6 p-8 bg-[#1a1f37] text-white">
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-[#1a1f37] border-[#2d3250]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-200">Revenue</CardTitle>
                        <span className="text-red-500 text-sm">-15%</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats?.revenue}</div>
                        <p className="text-xs text-gray-400">May 20 - Jun 20 2019</p>
                        <Button variant="link" className="text-blue-400 p-0 h-auto text-xs">
                            Read more
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-[#1a1f37] border-[#2d3250]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-200">Profit Share</CardTitle>
                        <span className="text-green-500 text-sm">+51%</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats?.profitShare}</div>
                        <p className="text-xs text-gray-400">May 20 - Jun 20 2019</p>
                        <Button variant="link" className="text-blue-400 p-0 h-auto text-xs">
                            Read more
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-[#1a1f37] border-[#2d3250]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-200">Daily Sales</CardTitle>
                        <span className="text-green-500 text-sm">+24%</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats?.dailySales}</div>
                        <p className="text-xs text-gray-400">May 20 - Jun 20 2019</p>
                        <Button variant="link" className="text-blue-400 p-0 h-auto text-xs">
                            Read more
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Sales Status Section */}
            <Card className="bg-[#1a1f37] border-[#2d3250]">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg text-gray-200">
                            Sales Status
                            <span className="block text-sm font-normal text-gray-400">
                                Performance For Online Revenue
                            </span>
                        </CardTitle>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="text-gray-400">Week</Button>
                            <Button variant="ghost" size="sm" className="text-gray-400">Month</Button>
                            <Button variant="ghost" size="sm" className="text-gray-400">Year</Button>
                            <Button variant="ghost" size="sm" className="text-gray-400">All</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Orders by Location */}
                        <div>
                            <h3 className="text-sm font-medium mb-4 text-gray-200">Orders by Location</h3>
                            <div className="space-y-2">
                                {locationData.map((item, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <span className="text-gray-400">{item.name}</span>
                                        <span className="text-gray-200">${item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sales by Location */}
                        <div>
                            <h3 className="text-sm font-medium mb-4 text-gray-200">Sales by Location</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={salesData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {salesData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2 mt-4">
                                {salesData.map((item, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <span className="text-gray-400">{item.name}</span>
                                        <span className="text-gray-200">{item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Revenue Trend */}
                        <div>
                            <h3 className="text-sm font-medium mb-4 text-gray-200">Revenue for Last Month</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={revenueTrend}>
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#00C49F"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                    <Tooltip />
                                </LineChart>
                            </ResponsiveContainer>
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <div>
                                    <div className="text-gray-400 text-sm">Total Income</div>
                                    <div className="text-gray-200 font-bold">${stats?.totalIncome}</div>
                                </div>
                                <div>
                                    <div className="text-gray-400 text-sm">Monthly Avg</div>
                                    <div className="text-gray-200 font-bold">${stats?.monthlyAvg}</div>
                                </div>
                                <div>
                                    <div className="text-gray-400 text-sm">Total Sales</div>
                                    <div className="text-gray-200 font-bold">{stats?.totalSales}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* US States Section */}
            <Card className="bg-[#1a1f37] border-[#2d3250]">
                <CardHeader>
                    <CardTitle className="text-lg text-gray-200">Users From United States</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {usStatesData.map((item, index) => (
                            <div key={index} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">{item.name}</span>
                                    <span className="text-gray-200">{item.value}%</span>
                                </div>
                                <div className="w-full bg-[#2d3250] rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full"
                                        style={{ width: `${item.value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <AddMovieModal />
        </div>
    );
}

export function AddMovieModal() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="bg-netflix-red hover:bg-netflix-red/90">
                    Add New Movie
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg mx-auto">
                <DialogHeader>
                    <DialogTitle>Add New Movie</DialogTitle>
                </DialogHeader>
                <MovieUpload />
            </DialogContent>
        </Dialog>
    );
} 