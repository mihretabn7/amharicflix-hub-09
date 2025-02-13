import { useState } from "react";
import { Link, useLocation, Navigate, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import {
    LayoutDashboard,
    Film,
    Users,
    AlertTriangle,
    Settings,
    Bell,
    Shield,
    Menu,
    X,
    LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ReportNotifications from './ReportNotifications';

const sidebarItems = [
    {
        title: "Dashboard",
        icon: LayoutDashboard,
        path: "/admin"
    },
    {
        title: "Movies",
        icon: Film,
        path: "/admin/movies"
    },
    {
        title: "Users",
        icon: Users,
        path: "/admin/users"
    },
    {
        title: "Reports",
        icon: AlertTriangle,
        path: "/admin/reports"
    },
    {
        title: "Notifications",
        icon: Bell,
        path: "/admin/notifications"
    },
    {
        title: "Security",
        icon: Shield,
        path: "/admin/security"
    },
    {
        title: "Settings",
        icon: Settings,
        path: "/admin/settings"
    }
];

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();

    // Check if user is authenticated as admin
    const isAdmin = true; // Replace with your actual admin check

    if (!isAdmin) {
        return <Navigate to="/login" />;
    }

    return (
        <div className="min-h-screen bg-black">
            <Navbar />
            <ReportNotifications />
            {/* Admin Sidebar */}
            <div
                className={cn(
                    "fixed left-0 top-[64px] h-[calc(100vh-64px)] bg-[#0F0F0F] transition-all duration-300 ease-in-out z-40",
                    isSidebarOpen ? "w-64" : "w-16"
                )}
            >
                <div className="flex items-center justify-between p-4">
                    {isSidebarOpen && (
                        <span className="text-xl font-semibold text-white">Admin</span>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="text-gray-400 hover:text-white"
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </Button>
                </div>

                <div className="py-4">
                    {sidebarItems.map((item) => (
                        <Link key={item.path} to={item.path}>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/10",
                                    location.pathname === item.path && "bg-white/10 text-white",
                                    !isSidebarOpen && "justify-center px-0"
                                )}
                            >
                                <item.icon size={20} className="min-w-[20px]" />
                                {isSidebarOpen && (
                                    <span className="text-sm">{item.title}</span>
                                )}
                            </Button>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <main
                className={cn(
                    "transition-all duration-300 ease-in-out pt-[64px]",
                    isSidebarOpen ? "ml-64" : "ml-16"
                )}
            >
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
} 