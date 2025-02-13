import { useEffect, useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import MovieTable from "@/components/MovieTable";
import ReportManagement from "@/components/ReportManagement";
import AdminStats from "@/components/AdminStats";
import SeriesManagement from "@/components/SeriesManagement";
import Settings from "@/pages/admin/Settings";
import {
    Film,
    Clapperboard,
    AlertTriangle,
    LayoutDashboard,
    Menu,
    Users,
    Settings as SettingsIcon,
    Bell,
    BarChart3,
    Shield,
    Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import UserManagement from "@/components/admin/UserManagement";
import ContentUpload from "@/components/admin/ContentUpload";
import SecuritySettings from "@/components/admin/SecuritySettings";
import Analytics from "@/components/admin/Analytics";
import NotificationCenter from "@/components/admin/NotificationCenter";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import MovieUploadForm from "@/components/MovieUploadForm";
import CsvMovieUpload from "@/components/CsvMovieUpload";
import {
    LineChart,
    PieChart,
    Line,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip
} from "recharts";

const COLORS = ['#4B56D2', '#82ca9d', '#F7D060', '#FF6B6B'];

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState("overview");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [stats, setStats] = useState({
        revenue: 24583,
        profitShare: 1046,
        dailySales: 342,
        totalIncome: 3567.56,
        monthlyAvg: 769.08,
        totalSales: 5489
    });

    const [locationData] = useState([
        { name: "Saint Lucia", value: 845 },
        { name: "Liberia", value: 548 },
        { name: "Saint Helena", value: 624 },
        { name: "Kenya", value: 624 },
        { name: "Christmas Island", value: 412 }
    ]);

    const [revenueTrend] = useState(Array.from({ length: 30 }, (_, i) => ({
        date: i + 1,
        value: Math.floor(Math.random() * 1000) + 500
    })));

    const tabs = [
        {
            id: "overview",
            label: "Overview",
            icon: LayoutDashboard,
            content: <AdminStats />,
            description: "Platform overview and key metrics"
        },
        {
            id: "movies",
            label: "Movies",
            icon: Film,
            content: <MovieTable />,
            description: "Manage movies and content"
        },
        {
            id: "series",
            label: "Series",
            icon: Clapperboard,
            content: <SeriesManagement />,
            description: "Manage series and episodes"
        },
        {
            id: "reports",
            label: "Reports",
            icon: AlertTriangle,
            content: <ReportManagement />,
            description: "Handle user reports and content flags"
        },
        {
            id: "users",
            label: "Users",
            icon: Users,
            content: <UserManagement />,
            description: "Manage user accounts and permissions"
        },
        {
            id: "upload",
            label: "Upload",
            icon: Upload,
            content: <ContentUpload />,
            description: "Upload and process new content"
        },
        {
            id: "analytics",
            label: "Analytics",
            icon: BarChart3,
            content: <Analytics />,
            description: "View detailed platform analytics"
        },
        {
            id: "notifications",
            label: "Notifications",
            icon: Bell,
            content: <NotificationCenter />,
            description: "Manage system notifications"
        },
        {
            id: "security",
            label: "Security",
            icon: Shield,
            content: <SecuritySettings />,
            description: "Platform security settings"
        },
        {
            id: "settings",
            label: "Settings",
            icon: SettingsIcon,
            content: <Settings />,
            description: "Admin panel settings"
        }
    ];

    const NavItem = ({ tab, onClick }: { tab: typeof tabs[0], onClick?: () => void }) => {
        const Icon = tab.icon;
        return (
            <button
                onClick={() => {
                    setActiveTab(tab.id);
                    onClick?.();
                }}
                className={cn(
                    "flex items-center space-x-3 w-full px-4 py-3 text-sm rounded-lg transition-colors",
                    activeTab === tab.id
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
            >
                <Icon className="h-5 w-5" />
                <div className="flex-1 text-left">
                    <div>{tab.label}</div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                        {tab.description}
                    </p>
                </div>
            </button>
        );
    };

    useEffect(() => {
        const fetchStats = async () => {
            const { data: watchHistory } = await supabase
                .from('user_movie_history')
                .select('*');

            // Calculate stats based on watch history
            // For now using static data as shown in the image
        };

        fetchStats();
    }, []);

    return (
        <div className="p-8 bg-[#1a1f37] min-h-screen">
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-[#1a1f37] border-[#2d3250]">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-400">Revenue</p>
                                <h2 className="text-2xl font-bold text-white">${stats.revenue}</h2>
                            </div>
                            <span className="text-red-500 text-sm">-15%</span>
                        </div>
                        <p className="text-xs text-gray-400">May 20 - Jun 20 2019</p>
                        <Button variant="link" className="text-blue-400 p-0 h-auto text-xs mt-2">
                            Read more
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-[#1a1f37] border-[#2d3250]">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-400">Profit Share</p>
                                <h2 className="text-2xl font-bold text-white">${stats.profitShare}</h2>
                            </div>
                            <span className="text-green-500 text-sm">+51%</span>
                        </div>
                        <p className="text-xs text-gray-400">May 20 - Jun 20 2019</p>
                        <Button variant="link" className="text-blue-400 p-0 h-auto text-xs mt-2">
                            Read more
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-[#1a1f37] border-[#2d3250]">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-400">Daily Sales</p>
                                <h2 className="text-2xl font-bold text-white">${stats.dailySales}</h2>
                            </div>
                            <span className="text-green-500 text-sm">+24%</span>
                        </div>
                        <p className="text-xs text-gray-400">May 20 - Jun 20 2019</p>
                        <Button variant="link" className="text-blue-400 p-0 h-auto text-xs mt-2">
                            Read more
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Sales Status Section */}
            <Card className="bg-[#1a1f37] border-[#2d3250] mb-8">
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-white">Sales Status</h2>
                            <p className="text-sm text-gray-400">Performance For Online Revenue</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="text-gray-400">Week</Button>
                            <Button variant="ghost" size="sm" className="text-gray-400">Month</Button>
                            <Button variant="ghost" size="sm" className="text-gray-400">Year</Button>
                            <Button variant="ghost" size="sm" className="text-gray-400">All</Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Orders by Location */}
                        <div>
                            <h3 className="text-sm font-medium text-white mb-4">Orders by Location</h3>
                            <div className="space-y-2">
                                {locationData.map((item, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <span className="text-gray-400">{item.name}</span>
                                        <span className="text-white">${item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sales by Location */}
                        <div>
                            <h3 className="text-sm font-medium text-white mb-4">Sales by Location</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={locationData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {locationData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Revenue Trend */}
                        <div>
                            <h3 className="text-sm font-medium text-white mb-4">Revenue for Last Month</h3>
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
                                    <p className="text-gray-400 text-sm">Total Income</p>
                                    <p className="text-white font-bold">${stats.totalIncome}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Monthly Avg</p>
                                    <p className="text-white font-bold">${stats.monthlyAvg}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Total Sales</p>
                                    <p className="text-white font-bold">{stats.totalSales}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Dashboard;
