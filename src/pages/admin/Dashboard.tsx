import { useState } from "react";
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

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState("overview");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Admin Dashboard</h1>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                            <SheetHeader>
                                <SheetTitle>Admin Dashboard</SheetTitle>
                            </SheetHeader>
                            <div className="flex flex-col space-y-2 mt-6">
                                {tabs.map((tab) => (
                                    <NavItem
                                        key={tab.id}
                                        tab={tab}
                                        onClick={() => setIsSidebarOpen(false)}
                                    />
                                ))}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div className="flex h-screen">
                {/* Desktop Sidebar */}
                <div className="hidden lg:flex flex-col w-80 border-r bg-card/50 backdrop-blur-sm fixed left-0 top-0 bottom-0">
                    <div className="p-6 border-b">
                        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage your platform
                        </p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {tabs.map((tab) => (
                            <NavItem key={tab.id} tab={tab} />
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <main className="flex-1 lg:ml-80 overflow-y-auto">
                    <div className="container mx-auto p-4 lg:p-6 mt-16 lg:mt-0">
                        <div className="space-y-6">
                            {/* Desktop Tab Title */}
                            <div className="hidden lg:block">
                                <h2 className="text-2xl font-semibold">
                                    {tabs.find(t => t.id === activeTab)?.label}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {tabs.find(t => t.id === activeTab)?.description}
                                </p>
                            </div>

                            {/* Content */}
                            <Tabs value={activeTab} className="space-y-6">
                                {tabs.map((tab) => (
                                    <TabsContent
                                        key={tab.id}
                                        value={tab.id}
                                        className="m-0 outline-none"
                                    >
                                        {tab.content}
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard; 