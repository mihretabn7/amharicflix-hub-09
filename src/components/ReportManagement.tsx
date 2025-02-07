import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, X, Play } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

interface Report {
  id: string;
  movie_id: string;
  reason: string;
  created_at: string;
  status: string;
  reporter: {
    email: string;
    phone_number: string;
  };
  movie: {
    title: string;
    thumbnail_url: string;
    youtube_id: string;
  };
}

const ReportManagement = () => {
  const [filter, setFilter] = useState<'pending' | 'resolved'>('pending');

  const { data: reports = [], refetch } = useQuery({
    queryKey: ['movie-reports', filter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movie_reports')
        .select(`
          *,
          reporter:profiles!movie_reports_reporter_id_fkey(
            email,
            phone_number
          ),
          movie:movies!movie_reports_movie_id_fkey(
            title,
            thumbnail_url,
            youtube_id
          )
        `)
        .eq('status', filter)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Report[];
    },
  });

  const handleVerifyReport = async (reportId: string, movieId: string) => {
    try {
      // Update report status
      const { error: updateError } = await supabase
        .from('movie_reports')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (updateError) throw updateError;

      // Hide the movie
      const { error: movieError } = await supabase
        .from('movies')
        .update({ is_hidden: true })
        .eq('id', movieId);

      if (movieError) throw movieError;

      // Call the RPC function to increment the verified report count
      const { error: rpcError } = await supabase
        .rpc('increment_verified_report_count', { movie_id: movieId });

      if (rpcError) throw rpcError;

      toast.success("Report verified and movie hidden");
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('movie_reports')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      toast.success("Report dismissed");
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openVideoPreview = (youtubeId: string) => {
    window.open(`https://www.youtube.com/watch?v=${youtubeId}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
        >
          Pending
        </Button>
        <Button
          variant={filter === 'resolved' ? 'default' : 'outline'}
          onClick={() => setFilter('resolved')}
        >
          Resolved
        </Button>
      </div>

      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardContent className="pt-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-32 h-24 relative rounded-md overflow-hidden">
                  <img
                    src={report.movie.thumbnail_url}
                    alt={report.movie.title}
                    className="object-cover w-full h-full"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute inset-0 m-auto bg-black/50 hover:bg-black/70 w-8 h-8"
                    onClick={() => openVideoPreview(report.movie.youtube_id)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{report.movie.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Reported by: {report.reporter.email || report.reporter.phone_number}
                      </p>
                      <p className="text-sm mt-2">{report.reason}</p>
                    </div>
                    {filter === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerifyReport(report.id, report.movie_id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Verify
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDismissReport(report.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Reported on: {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReportManagement;