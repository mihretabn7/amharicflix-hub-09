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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-t border-gray-800 md:hidden">
      <div className="flex items-center justify-around py-3 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-2 rounded-xl transition-all duration-300",
                "min-w-[64px] min-h-[60px] relative group",
                isActive
                  ? "text-white"
                  : "text-gray-400 hover:text-white active:scale-95"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-primary/20 rounded-xl backdrop-blur-sm animate-fade-in" />
              )}
              <Icon 
                className={cn(
                  "h-6 w-6 transition-all duration-300 relative z-10",
                  isActive && "scale-110 text-primary drop-shadow-lg",
                  !isActive && "group-hover:scale-105"
                )} 
              />
              <span 
                className={cn(
                  "text-xs font-medium transition-all duration-300 relative z-10",
                  isActive ? "text-primary font-semibold" : "text-gray-400 group-hover:text-white"
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-fade-in" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;