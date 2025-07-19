import { Home, Film, Tv, Grid3X3, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      icon: Home,
      label: "Home",
      path: "/",
    },
    {
      icon: Film,
      label: "Movies",
      path: "/movies",
    },
    {
      icon: Tv,
      label: "Series",
      path: "/series",
    },
    {
      icon: Grid3X3,
      label: "Categories",
      path: "/categories",
    },
    {
      icon: User,
      label: "Profile",
      path: "/profile",
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t md:hidden">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all duration-200",
                "min-w-[60px] min-h-[56px]",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;