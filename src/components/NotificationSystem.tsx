import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Notification {
    id: string;
    title: string;
    message: string;
    created_at: string;
    read: boolean;
    type: 'report' | 'new_movie';
    link?: string;
}

interface MovieReport {
    id: string;
    movie: {
        id: string;
        title: string;
    };
    reporter_id: string;
    reporter: {
        email: string | null;
        phone_number: string | null;
    };
}

interface MovieData {
    id: string;
    title: string;
    is_hidden: boolean;
}

const NotificationSystem = () => {
    const [unreadCount, setUnreadCount] = useState(0);

    const { data: userRole } = useQuery({
        queryKey: ['user-role'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from('admin_users')
                .select('id')
                .eq('id', user.id)
                .single();

            return data ? 'admin' : 'user';
        }
    });

    const { data: notifications, refetch: refetchNotifications } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            return data as Notification[];
        },
        enabled: !!userRole
    });

    useEffect(() => {
        setUnreadCount(notifications?.filter(n => !n.read).length || 0);
    }, [notifications]);

    useEffect(() => {
        if (userRole === 'admin') {
            // Subscribe to new reports (admin only)
            const reportsChannel = supabase.channel('reports')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'movie_reports'
                    },
                    async (payload) => {
                        const { data: report } = await supabase
                            .from('movie_reports')
                            .select(`
                                id,
                                movie:movies(id, title),
                                reporter:profiles!movie_reports_reporter_id_fkey(email, phone_number)
                            `)
                            .eq('id', payload.new.id)
                            .single() as { data: MovieReport | null };

                        if (report) {
                            // Create notification
                            const { data: { user } } = await supabase.auth.getUser();
                            if (user) {
                                await supabase.from('notifications').insert({
                                    user_id: user.id,
                                    title: 'New Report',
                                    message: `New report for "${report.movie.title}"`,
                                    type: 'report',
                                    is_sent: true,
                                    link: '/admin/dashboard'
                                });
                                refetchNotifications();
                            }

                            toast.warning(
                                `New report for "${report.movie.title}"`,
                                {
                                    description: `Reported by ${report.reporter.email || report.reporter.phone_number}`,
                                    action: {
                                        label: 'View',
                                        onClick: () => window.location.href = '/admin/dashboard'
                                    }
                                }
                            );
                        }
                    }
                )
                .subscribe();

            return () => {
                reportsChannel.unsubscribe();
            };
        } else {
            // Subscribe to new movies (regular users)
            const moviesChannel = supabase.channel('movies')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'movies'
                    },
                    async (payload) => {
                        const { data: movie } = await supabase
                            .from('movies')
                            .select('id, title, is_hidden')
                            .eq('id', payload.new.id)
                            .single() as { data: MovieData | null };

                        if (movie && !movie.is_hidden) {
                            // Create notification
                            const { data: { user } } = await supabase.auth.getUser();
                            if (user) {
                                await supabase.from('notifications').insert({
                                    user_id: user.id,
                                    title: 'New Movie',
                                    message: `New movie added: ${movie.title}`,
                                    type: 'new_movie',
                                    is_sent: true,
                                    link: `/movie/${movie.id}`
                                });
                                refetchNotifications();
                            }

                            toast.info(
                                'New Movie Added!',
                                {
                                    description: movie.title,
                                    action: {
                                        label: 'Watch',
                                        onClick: () => window.location.href = `/movie/${movie.id}`
                                    }
                                }
                            );
                        }
                    }
                )
                .subscribe();

            // Subscribe to report status changes (for the reporter)
            const reportStatusChannel = supabase.channel('report-status')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'movie_reports'
                    },
                    async (payload) => {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user && payload.new.reporter_id === user.id && payload.new.status === 'resolved') {
                            const { data: movie } = await supabase
                                .from('movies')
                                .select('title')
                                .eq('id', payload.new.movie_id)
                                .single();

                            if (movie) {
                                toast.success(
                                    'Report Status Updated',
                                    {
                                        description: `Your report for "${movie.title}" has been reviewed.`,
                                        action: {
                                            label: 'View',
                                            onClick: () => window.location.href = '/profile'
                                        }
                                    }
                                );
                            }
                        }
                    }
                )
                .subscribe();

            return () => {
                moviesChannel.unsubscribe();
                reportStatusChannel.unsubscribe();
            };
        }
    }, [userRole, refetchNotifications]);

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read
        if (!notification.read) {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notification.id);
            refetchNotifications();
        }

        // Navigate to link if present
        if (notification.link) {
            window.location.href = notification.link;
        }
    };

    if (!userRole) return null;

    return (
        <div className="fixed top-3 right-4 z-50">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-xs text-white">
                                {unreadCount}
                            </span>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                    {notifications?.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No notifications
                        </div>
                    ) : (
                        notifications?.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={`p-4 cursor-pointer ${!notification.read ? 'bg-muted' : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div>
                                    <div className="font-medium">{notification.title}</div>
                                    <div className="text-sm text-muted-foreground">{notification.message}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {new Date(notification.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default NotificationSystem; 