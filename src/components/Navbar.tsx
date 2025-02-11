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
import AuthButtons from "./AuthButtons";

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
      <Link
        to="/movies"
        className="text-sm font-medium text-gray-300 hover:text-white"
        onClick={() => setIsOpen(false)}
      >
        Movies
      </Link>
      <Link
        to="/series"
        className="text-sm font-medium text-gray-300 hover:text-white"
        onClick={() => setIsOpen(false)}
      >
        Series
      </Link>
      <Link
        to="/categories"
        className="text-sm font-medium text-gray-300 hover:text-white"
        onClick={() => setIsOpen(false)}
      >
        Categories
      </Link>
      {isAdmin && (
        <Link
          to="/admin"
          className="text-sm font-medium text-gray-300 hover:text-white"
          onClick={() => setIsOpen(false)}
        >
          Admin
        </Link>
      )}
    </>
  );

  return (
    <nav className="fixed top-0 z-50 w-full bg-gradient-to-b from-background to-background/0 px-4 py-4">
      <div className="container mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center space-x-2"
        >
          <span className="text-2xl font-bold text-netflix-red">አማርኛFlix</span>
        </Link>

        <div className="hidden md:flex items-center space-x-6">
          <NavLinks />
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-4">
            <AuthButtons
              session={session}
              isAdmin={isAdmin}
              handleSignOut={handleSignOut}
            />
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
                    <AuthButtons
                      session={session}
                      isAdmin={isAdmin}
                      handleSignOut={handleSignOut}
                    />
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
