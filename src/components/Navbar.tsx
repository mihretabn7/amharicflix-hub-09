import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { User, Menu, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/utils/auth";
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
import { toast } from "sonner";

const Navbar = () => {
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleLinkClick = (path: string) => {
    navigate(path);
    setIsOpen(false); // Close the menu immediately after navigation
  };

  const NavLinks = () => (
    <>
      <button onClick={() => handleLinkClick("/movies")} className="text-sm font-medium text-gray-300 hover:text-white">
        Movies
      </button>
      <button onClick={() => handleLinkClick("/series")} className="text-sm font-medium text-gray-300 hover:text-white">
        Series
      </button>
      <button onClick={() => handleLinkClick("/categories")} className="text-sm font-medium text-gray-300 hover:text-white">
        Categories
      </button>
      {isAdmin && (
        <button onClick={() => handleLinkClick("/admin")} className="text-sm font-medium text-gray-300 hover:text-white">
          Admin
        </button>
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
          <button onClick={() => handleLinkClick("/profile")}>
            <Button variant="ghost" className="text-gray-300 hover:text-white">
              <User className="h-5 w-5 mr-2" />
              {!isMobile && "Profile"}
            </Button>
          </button>
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
          <button onClick={() => handleLinkClick("/login")}>
            <Button variant="ghost" className="text-gray-300 hover:text-white">
              Sign In
            </Button>
          </button>
          <button onClick={() => handleLinkClick("/register")}>
            <Button className="bg-netflix-red hover:bg-netflix-red/90">
              Sign Up
            </Button>
          </button>
        </>
      )}
    </>
  );

  return (
    <nav className="absolute top-0 z-50 w-full px-4 py-4 bg-transparent">
      <div className="container mx-auto flex items-center justify-between">
        <button onClick={() => handleLinkClick("/")} className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-netflix-red">አማርኛFlix</span>
        </button>

        <div className="hidden md:flex items-center space-x-6">
          <NavLinks />
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-4">
            <AuthButtons />
          </div>

          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
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
    </nav>
  );
};

export default Navbar;
