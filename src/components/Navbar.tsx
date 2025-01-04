import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="fixed top-0 z-50 w-full bg-gradient-to-b from-background to-background/0 px-4 py-4">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-netflix-red">አማርኛFlix</span>
        </Link>
        
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/movies" className="text-sm font-medium text-gray-300 hover:text-white">
            Movies
          </Link>
          <Link to="/categories" className="text-sm font-medium text-gray-300 hover:text-white">
            Categories
          </Link>
          <button className="text-sm font-medium text-gray-300 hover:text-white">
            <Search className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          {session ? (
            <>
              <Button 
                variant="ghost" 
                className="text-gray-300 hover:text-white"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="text-gray-300 hover:text-white">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-netflix-red hover:bg-netflix-red/90">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;