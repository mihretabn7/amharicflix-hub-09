import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

const NotificationSystem = () => {
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

    useEffect(() => {
        // Subscribe to new reports (admin only)
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
                        // Fetch report details
                        const { data: report } = await supabase
                            .from('movie_reports')
                            .select(`
                *,
                movie:movies(title),
                reporter:profiles(email, phone_number)
              `)
                            .eq('id', payload.new.id)
                            .single();

                        if (report) {
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

        // Subscribe to new movies (all users)
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
                        .select('*')
                        .eq('id', payload.new.id)
                        .single();

                    if (movie && !movie.is_hidden) {
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

        // Cleanup subscriptions
        return () => {
            if (reportsChannel) reportsChannel.unsubscribe();
            moviesChannel.unsubscribe();
        };
    }, [userRole]);

    return null; // This component doesn't render anything
};

export default NotificationSystem; 