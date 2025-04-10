
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
import { Notification } from '@/types/notification';

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

    const { data: userEmail } = useQuery({
        queryKey: ['user-email'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from('profiles')
                .select('email')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            return data?.email;
        },
        enabled: !!userRole
    });

    useEffect(() => {
        setUnreadCount(notifications?.filter(n => !n.read).length || 0);
    }, [notifications]);

    const sendEmailNotification = async (notification: Notification) => {
        if (!userEmail) return;
        
        try {
            await fetch(`${window.location.origin}/functions/v1/send-notification-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({
                    to: userEmail,
                    subject: notification.title,
                    body: notification.message,
                    notificationId: notification.id,
                    userId: notification.user_id,
                }),
            });
        } catch (error) {
            console.error('Error sending email notification:', error);
        }
    };

    useEffect(() => {
        const reportsChannel = userRole === 'admin'
            ? supabase.channel('reports')
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
                            .single();

                        if (report) {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (user) {
                                const { data: notification } = await supabase.from('notifications').insert({
                                    user_id: user.id,
                                    title: 'New Report',
                                    message: `New report for "${report.movie.title}"`,
                                    type: 'report',
                                    read: false,
                                    link: '/admin/dashboard'
                                }).select().single();
                                
                                refetchNotifications();
                                
                                if (notification) {
                                    sendEmailNotification(notification);
                                }
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
                .subscribe()
            : null;

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
                        .single();

                    if (movie && !movie.is_hidden) {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) {
                            const { data: notification } = await supabase.from('notifications').insert({
                                user_id: user.id,
                                title: 'New Movie',
                                message: `New movie added: ${movie.title}`,
                                type: 'new_movie',
                                read: false,
                                link: `/movie/${movie.id}`
                            }).select().single();
                            
                            refetchNotifications();
                            
                            if (notification) {
                                sendEmailNotification(notification);
                            }
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

        // Listen for anonymous views - admin only
        const anonymousViewsChannel = userRole === 'admin'
            ? supabase.channel('anonymous-views')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'anonymous_views'
                    },
                    async (payload) => {
                        // Get movie information
                        const { data: movie } = await supabase
                            .from('movies')
                            .select('title')
                            .eq('id', payload.new.movie_id)
                            .single();
                        
                        if (movie) {
                            toast.info(
                                'New Anonymous View',
                                {
                                    description: `${movie.title} viewed from ${payload.new.country_code || 'Unknown'}`,
                                }
                            );
                        }
                    }
                )
                .subscribe()
            : null;

        // Listen for registered user views - admin only
        const userViewsChannel = userRole === 'admin'
            ? supabase.channel('user-views')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'user_movie_history'
                    },
                    async (payload) => {
                        // Get movie and user information
                        const { data: viewInfo } = await supabase
                            .from('user_movie_history')
                            .select(`
                                movie:movies(title),
                                user:profiles(email, phone_number),
                                country_code
                            `)
                            .eq('id', payload.new.id)
                            .single();
                        
                        if (viewInfo) {
                            toast.info(
                                'New User View',
                                {
                                    description: `${viewInfo.movie.title} viewed by ${viewInfo.user.email || viewInfo.user.phone_number} from ${viewInfo.country_code || 'Unknown'}`,
                                }
                            );
                        }
                    }
                )
                .subscribe()
            : null;

        return () => {
            if (reportsChannel) reportsChannel.unsubscribe();
            if (moviesChannel) moviesChannel.unsubscribe();
            if (anonymousViewsChannel) anonymousViewsChannel.unsubscribe();
            if (userViewsChannel) userViewsChannel.unsubscribe();
        };
    }, [userRole, refetchNotifications, userEmail]);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notification.id);
            refetchNotifications();
        }

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
