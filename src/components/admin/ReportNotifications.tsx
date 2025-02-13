import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function ReportNotifications() {
    const navigate = useNavigate();

    useEffect(() => {
        // Subscribe to new reports
        const channel = supabase
            .channel('report-notifications')
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
                            movie:movies!movie_id(title),
                            reporter:profiles!reporter_id(username)
                        `)
                        .eq('id', payload.new.id)
                        .single();

                    if (report) {
                        toast("New Content Report", {
                            description: `${report.reporter.username} reported "${report.movie.title}"`,
                            action: {
                                label: "View",
                                onClick: () => navigate('/admin/reports')
                            },
                            duration: 5000
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [navigate]);

    return null; // This is a background component
} 