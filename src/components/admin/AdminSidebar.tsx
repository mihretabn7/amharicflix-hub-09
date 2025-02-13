
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    Grid,
    Film,
    Users,
    FileText,
    Bell,
    Shield,
    Settings,
    Menu
} from "lucide-react";

interface SidebarItemProps {
    icon: React.ReactNode;
    title: string;
    path: string;
    isCollapsed: boolean;
    isActive: boolean;
}

const SidebarItem = ({ icon, title, path, isCollapsed, isActive }: SidebarItemProps) => {
    const navigate = useNavigate();

    return (
        <Button
            variant="ghost"
            className={cn(
                "w-full justify-start gap-2",
                isActive && "bg-secondary"
            )}
            onClick={() => navigate(path)}
        >
            {icon}
            {!isCollapsed && <span>{title}</span>}
        </Button>
    );
};

export const AdminSidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();

    const sidebarItems = [
        { icon: <Grid size={20} />, title: "Dashboard", path: "/admin" },
        { icon: <Film size={20} />, title: "Movies", path: "/admin/movies" },
        { icon: <Users size={20} />, title: "Users", path: "/admin/users" },
        { icon: <FileText size={20} />, title: "Reports", path: "/admin/reports" },
        { icon: <Bell size={20} />, title: "Notifications", path: "/admin/notifications" },
        { icon: <Shield size={20} />, title: "Security", path: "/admin/security" },
        { icon: <Settings size={20} />, title: "Settings", path: "/admin/settings" },
    ];

    return (
        <div
            className={cn(
                "flex flex-col h-screen border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
                isCollapsed ? "w-16" : "w-64",
                "transition-all duration-300"
            )}
        >
            <div className="flex items-center justify-between p-4">
                {!isCollapsed && (
                    <span className="text-xl font-bold">Admin</span>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
                </Button>
            </div>

            <nav className="flex-1 p-2 space-y-2">
                {sidebarItems.map((item) => (
                    <SidebarItem
                        key={item.path}
                        {...item}
                        isCollapsed={isCollapsed}
                        isActive={location.pathname === item.path}
                    />
                ))}
            </nav>
        </div>
    );
};
