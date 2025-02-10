import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, X, Play, AlertTriangle, Flag, MessageSquare, Clock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Report {
  id: string;
  movie_id: string;
  reason: string;
  created_at: string;
  status: string;
  admin_notes?: string;
  resolved_at?: string;
  reporter: {
    id: string;
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
  const [filter, setFilter] = useState<'pending' | 'resolved' | 'all'>('pending');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: reports = [], refetch } = useQuery({
    queryKey: ['movie-reports', filter],
    queryFn: async () => {
      const query = supabase
        .from('movie_reports')
        .select(`
          *,
          reporter:profiles!movie_reports_reporter_id_fkey(
            id,
            email,
            phone_number
          ),
          movie:movies!movie_reports_movie_id_fkey(
            title,
            thumbnail_url,
            youtube_id
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Report[];
    },
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('movie-reports')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'movie_reports'
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const handleVerifyReport = async (reportId: string, movieId: string) => {
    try {
      // Update report status
      const { error: updateError } = await supabase
        .from('movie_reports')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          admin_notes: adminNotes
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

      // Send notification to reporter
      const report = reports.find(r => r.id === reportId);
      if (report) {
        await supabase.from('notifications').insert({
          user_id: report.reporter.id,
          title: 'Report Verified',
          message: `Your report for "${report.movie.title}" has been verified and addressed.`,
          type: 'report_verified',
          is_sent: true
        });
      }

      toast.success("Report verified and movie hidden");
      setSelectedReport(null);
      setAdminNotes("");
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
          resolved_at: new Date().toISOString(),
          admin_notes: adminNotes
        })
        .eq('id', reportId);

      if (error) throw error;

      // Send notification to reporter
      const report = reports.find(r => r.id === reportId);
      if (report) {
        await supabase.from('notifications').insert({
          user_id: report.reporter.id,
          title: 'Report Reviewed',
          message: `Your report for "${report.movie.title}" has been reviewed and dismissed.`,
          type: 'report_dismissed',
          is_sent: true
        });
      }

      toast.success("Report dismissed");
      setSelectedReport(null);
      setAdminNotes("");
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openVideoPreview = (youtubeId: string) => {
    window.open(`https://www.youtube.com/watch?v=${youtubeId}`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'resolved':
        return 'bg-green-500/10 text-green-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Tabs value={filter} className="w-full">
          <TabsList>
            <TabsTrigger
              value="pending"
              onClick={() => setFilter('pending')}
            >
              Pending
              {reports.filter(r => r.status === 'pending').length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {reports.filter(r => r.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="resolved"
              onClick={() => setFilter('resolved')}
            >
              Resolved
            </TabsTrigger>
            <TabsTrigger
              value="all"
              onClick={() => setFilter('all')}
            >
              All Reports
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardContent className="pt-6">
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
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-lg">{report.movie.title}</h3>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Flag className="h-4 w-4" />
                        <span>Reported by: {report.reporter.email || report.reporter.phone_number}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Reported on: {new Date(report.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm mt-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <p>{report.reason}</p>
                      </div>
                      {report.admin_notes && (
                        <div className="flex items-center gap-2 text-sm mt-2">
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                          <p className="text-muted-foreground">{report.admin_notes}</p>
                        </div>
                      )}
                    </div>
                    {report.status === 'pending' && (
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Check className="h-4 w-4 mr-1" />
                              Verify
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Verify Report</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <p>Are you sure you want to verify this report? This will hide the movie from users.</p>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Admin Notes</label>
                                <Textarea
                                  placeholder="Add notes about your decision..."
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedReport(null);
                                  setAdminNotes("");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => handleVerifyReport(report.id, report.movie_id)}
                              >
                                Verify Report
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <X className="h-4 w-4 mr-1" />
                              Dismiss
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Dismiss Report</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <p>Are you sure you want to dismiss this report?</p>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Admin Notes</label>
                                <Textarea
                                  placeholder="Add notes about your decision..."
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedReport(null);
                                  setAdminNotes("");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => handleDismissReport(report.id)}
                              >
                                Dismiss Report
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
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