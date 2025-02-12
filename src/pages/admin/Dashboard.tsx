import { useState } from "react";
import {
    Film,
    Menu,
    Users,
    BarChart3,
    Shield,
    X,
    TrendingUp,
    Clock,
    Share2,
    Star,
    Languages,
    LineChart,
    PieChart,
    Activity,
    Bell,
    Settings,
    Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MoviesList } from "@/components/admin/MoviesList";
import { UsersList } from "@/components/admin/UsersList";
import { MovieReports } from "@/components/admin/MovieReports";
import { MovieUpload } from "@/components/admin/MovieUpload";
import { DashboardOverview } from "@/components/admin/DashboardOverview";

const Dashboard = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeSection, setActiveSection] = useState("overview");

    const sidebarItems = [
        {
            title: "Overview",
            icon: BarChart3,
            value: "overview"
        },
        {
            title: "Movie Management",
            icon: Film,
            value: "movies",
            subItems: [
                { title: "All Movies", icon: Film, value: "movies-list" },
                { title: "Upload", icon: Upload, value: "movie-upload" },
                { title: "Ratings", icon: Star, value: "movie-ratings" },
                { title: "Reports", icon: Shield, value: "movie-reports" }
            ]
        },
        {
            title: "User Management",
            icon: Users,
            value: "users",
            subItems: [
                { title: "All Users", icon: Users, value: "users-list" },
                { title: "Watch History", icon: Clock, value: "watch-history" },
                { title: "User Reports", icon: Shield, value: "user-reports" }
            ]
        },
        {
            title: "Analytics",
            icon: Activity,
            value: "analytics",
            subItems: [
                { title: "Content Stats", icon: BarChart3, value: "content-stats" },
                { title: "User Stats", icon: TrendingUp, value: "user-stats" },
                { title: "Watch Patterns", icon: Clock, value: "watch-patterns" },
                { title: "Engagement", icon: Share2, value: "engagement-stats" }
            ]
        },
        {
            title: "System",
            icon: Settings,
            value: "system",
            subItems: [
                { title: "Notifications", icon: Bell, value: "notifications" },
                { title: "Settings", icon: Settings, value: "settings" }
            ]
        }
    ];

    const renderContent = () => {
        console.log("Active section:", activeSection);

        switch (activeSection) {
            case "overview":
                return <DashboardOverview />;
            case "movies-list":
                return <MoviesList />;
            case "movie-upload":
                return <MovieUpload />;
            case "users-list":
                return <UsersList />;
            case "movie-reports":
                return <MovieReports />;
            default:
                return <DashboardOverview />;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar */}
            <div
                className={cn(
                    "fixed top-0 left-0 h-full bg-card border-r transition-all duration-300 z-50",
                    isSidebarOpen ? "w-64" : "w-20"
                )}
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className={cn("font-semibold", !isSidebarOpen && "hidden")}>
                        Admin Dashboard
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </Button>
                </div>

                <div className="py-4">
                    {sidebarItems.map((item) => (
                        <div key={item.value}>
                            <Button
                                variant={activeSection === item.value ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-2 p-2",
                                    !isSidebarOpen && "justify-center"
                                )}
                                onClick={() => setActiveSection(item.value)}
                            >
                                <item.icon className="h-4 w-4" />
                                {isSidebarOpen && <span>{item.title}</span>}
                            </Button>
                            {isSidebarOpen && item.subItems && activeSection === item.value && (
                                <div className="ml-4 space-y-1">
                                    {item.subItems.map((subItem) => (
                                        <Button
                                            key={subItem.value}
                                            variant={activeSection === subItem.value ? "secondary" : "ghost"}
                                            className="w-full justify-start gap-2 p-2"
                                            onClick={() => setActiveSection(subItem.value)}
                                        >
                                            <subItem.icon className="h-4 w-4" />
                                            <span>{subItem.title}</span>
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main content */}
            <div
                className={cn(
                    "transition-all duration-300",
                    isSidebarOpen ? "ml-64" : "ml-20"
                )}
            >
                <div className="p-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
