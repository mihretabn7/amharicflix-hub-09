import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

const ReportManagement = () => {
  const [filter, setFilter] = useState<'pending' | 'resolved'>('pending');

  const { data: reports = [], refetch } = useQuery({
    queryKey: ['movie-reports', filter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movie_reports')
        .select(`
          *,
          movies (title),
          profiles (email, phone_number)
        `)
        .eq('status', filter)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleVerifyReport = async (reportId: string, movieId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('movie_reports')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (updateError) throw updateError;

      const { error: movieError } = await supabase
        .from('movies')
        .update({
          verified_report_count: supabase.rpc('increment_verified_report_count', { movie_id: movieId })
        })
        .eq('id', movieId);

      if (movieError) throw movieError;

      toast.success("Report verified successfully");
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
        {reports.map((report: any) => (
          <div key={report.id} className="bg-card p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{report.movies?.title}</h3>
                <p className="text-sm text-gray-400">
                  Reported by: {report.profiles?.email || report.profiles?.phone_number}
                </p>
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
            <p className="text-sm">{report.reason}</p>
            <p className="text-xs text-gray-400">
              {new Date(report.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportManagement;