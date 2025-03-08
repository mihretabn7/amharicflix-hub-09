
import { Home, Search, Heart, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const MobileNavigation = () => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="mobile-bottom-nav lg:hidden">
      <Link to="/" className={`mobile-nav-item ${path === "/" ? "active" : ""}`}>
        <Home className="h-5 w-5" />
        <span>Home</span>
      </Link>
      <Link to="/movies" className={`mobile-nav-item ${path.includes("/movies") ? "active" : ""}`}>
        <Search className="h-5 w-5" />
        <span>Search</span>
      </Link>
      <Link to="/profile?tab=watchlist" className={`mobile-nav-item ${path.includes("watchlist") ? "active" : ""}`}>
        <Heart className="h-5 w-5" />
        <span>My List</span>
      </Link>
      <Link to="/profile" className={`mobile-nav-item ${path === "/profile" && !path.includes("watchlist") ? "active" : ""}`}>
        <User className="h-5 w-5" />
        <span>Profile</span>
      </Link>
    </div>
  );
};

export default MobileNavigation;
