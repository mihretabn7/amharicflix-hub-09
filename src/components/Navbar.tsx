import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Search, User, Menu, Bell } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { DialogTitle } from "./ui/dialog";
import { toast } from "sonner";

const Navbar = () => {
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        checkIsAdmin(session.user.id).then(setIsAdmin);
        fetchNotifications(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        checkIsAdmin(session.user.id).then(setIsAdmin);
        fetchNotifications(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${session.user.id}`,
          },
          () => {
            fetchNotifications(session.user.id);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session?.user?.id]);

  const fetchNotifications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter((n: any) => !n.read).length || 0);
    } catch (error: any) {
      toast.error('Failed to fetch notifications');
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleSearch = async (value: string) => {
    if (!value) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .ilike('title', `%${value.trim()}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSearchResults(data || []);
    } catch (error: any) {
      toast.error('Search failed');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const NavLinks = () => (
    <>
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
    </>
  );

  const AuthButtons = () => (
    <>
      {session ? (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-gray-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-netflix-red text-[10px] flex items-center justify-center text-white">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              {notifications.length === 0 ? (
                <DropdownMenuItem>No notifications</DropdownMenuItem>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="p-4 cursor-pointer"
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className={`space-y-1 ${!notification.read ? 'font-medium' : ''}`}>
                      <p className="text-sm">{notification.title}</p>
                      <p className="text-xs text-gray-500">{notification.message}</p>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to="/profile">
            <Button variant="ghost" className="text-gray-300 hover:text-white">
              <User className="h-5 w-5 mr-2" />
              {!isMobile && "Profile"}
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
    </>
  );

  return (
    <nav className="fixed top-0 z-50 w-full bg-gradient-to-b from-background to-background/0 px-4 py-4">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-netflix-red">አማርኛFlix</span>
        </Link>
        
        <div className="hidden md:flex items-center space-x-6">
          <NavLinks />
        </div>

        <div className="flex items-center space-x-4">
          <button 
            className="text-sm font-medium text-gray-300 hover:text-white"
            onClick={() => setOpen(true)}
          >
            <Search className="h-5 w-5" />
          </button>

          <div className="hidden md:flex items-center space-x-4">
            <AuthButtons />
          </div>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-4 mt-4">
                  <NavLinks />
                  <div className="pt-4 border-t">
                    <AuthButtons />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="sr-only">Search movies</DialogTitle>
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