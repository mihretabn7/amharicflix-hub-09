import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Search, User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/utils/auth";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const Navbar = () => {
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        checkIsAdmin(session.user.id).then(setIsAdmin);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        checkIsAdmin(session.user.id).then(setIsAdmin);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSearch = async (value: string) => {
    const { data, error } = await supabase
      .from("movies")
      .select("*")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order("title", { ascending: true })
      .limit(10);

    if (!error && data) {
      setSearchResults(data);
    }
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
          {isAdmin && (
            <Link to="/admin" className="text-sm font-medium text-gray-300 hover:text-white">
              Admin
            </Link>
          )}
          <button 
            className="text-sm font-medium text-gray-300 hover:text-white"
            onClick={() => setOpen(true)}
          >
            <Search className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          {session ? (
            <>
              <Link to="/profile">
                <Button variant="ghost" className="text-gray-300 hover:text-white">
                  <User className="h-5 w-5 mr-2" />
                  Profile
                </Button>
              </Link>
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

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search movies..." 
          onValueChange={handleSearch}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Movies">
            {searchResults.map((movie) => (
              <CommandItem
                key={movie.id}
                onSelect={() => {
                  navigate(`/movie/${movie.id}`);
                  setOpen(false);
                }}
              >
                <div className="flex items-center">
                  <img 
                    src={movie.thumbnail_url} 
                    alt={movie.title} 
                    className="w-8 h-8 object-cover rounded mr-2"
                  />
                  {movie.title}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </nav>
  );
};

export default Navbar;