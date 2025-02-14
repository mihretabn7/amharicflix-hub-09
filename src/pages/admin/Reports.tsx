import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Check, X, AlertTriangle } from "lucide-react";

export default function Reports() {
    const { data: reports, refetch } = useQuery({
        queryKey: ['reports'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('movie_reports')
                .select(`
                    *,
                    movie:movies!movie_id(
                        id,
                        title,
                        thumbnail_url,
                        youtube_id
                    ),
                    reporter:profiles!reporter_id(
                        username,
                        email
                    ),
                    resolver:profiles!resolved_by(
                        username
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Reports query error:', error);
                throw error;
            }

            return data || [];
        }
    });

    const handlePreviewVideo = (youtubeId: string) => {
        window.open(`https://www.youtube.com/watch?v=${youtubeId}`, '_blank');
    };

    const handleResolveReport = async (reportId: string, action: 'resolve' | 'reject') => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // First get the current report
            const { data: report, error: queryError } = await supabase
                .from('movie_reports')
                .select('*')
                .eq('id', reportId)
                .single();

            console.log('Current report:', report);

            if (queryError) throw queryError;
            if (!report) throw new Error('Report not found');
            if (report.status !== 'pending') throw new Error('Report already processed');

            // Use the exact values from the database
            const { error } = await supabase
                .from('movie_reports')
                .update({
                    status: action === 'resolve' ? 'done' : 'cancel',  // Using actual values from DB
                    resolved_by: user.id
                })
                .eq('id', reportId);

            if (error) {
                console.error('Update error:', error);
                throw error;
            }

            toast.success(`Report ${action === 'resolve' ? 'resolved' : 'cancelled'} successfully`);
            refetch();
        } catch (error: any) {
            console.error('Resolution error details:', error);
            toast.error(error.message || 'Failed to update report status');
        }
    };

    const pendingReports = reports?.filter(report => report.status === 'pending') || [];
    const resolvedReports = reports?.filter(report => report.status !== 'pending') || [];

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Content Reports</h1>

            <Tabs defaultValue="pending" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="pending" className="relative">
                        Pending
                        {pendingReports.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {pendingReports.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="resolved">Resolved ({resolvedReports.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                    <div className="grid gap-4">
                        {pendingReports.map((report) => (
                            <Card key={report.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <img
                                            src={report.movie?.thumbnail_url}
                                            alt={report.movie?.title}
                                            className="w-32 h-20 object-cover rounded-md cursor-pointer"
                                            onClick={() => handlePreviewVideo(report.movie?.youtube_id)}
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-medium">{report.movie?.title}</h3>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Reported by: {report.reporter?.username}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-green-500 hover:text-green-600"
                                                        onClick={() => handleResolveReport(report.id, 'resolve')}
                                                    >
                                                        <Check className="h-4 w-4 mr-1" />
                                                        Resolve
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-600"
                                                        onClick={() => handleResolveReport(report.id, 'reject')}
                                                    >
                                                        <X className="h-4 w-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="mt-4 p-3 bg-muted rounded-md">
                                                <div className="flex items-start gap-2 text-sm">
                                                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                                                    <p>{report.reason}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Reported on: {new Date(report.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {pendingReports.length === 0 && (
                            <Card>
                                <CardContent className="p-6 text-center text-muted-foreground">
                                    No pending reports
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="resolved">
                    <div className="grid gap-4">
                        {resolvedReports.map((report) => (
                            <Card key={report.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <img
                                            src={report.movie?.thumbnail_url}
                                            alt={report.movie?.title}
                                            className="w-32 h-20 object-cover rounded-md"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-medium">{report.movie?.title}</h3>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Reported by: {report.reporter?.username}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs ${report.status === 'done'
                                                    ? 'bg-green-500/10 text-green-500'
                                                    : 'bg-red-500/10 text-red-500'
                                                    }`}>
                                                    {report.status === 'done' ? 'Resolved' : 'Rejected'}
                                                </span>
                                            </div>
                                            <div className="mt-4 p-3 bg-muted rounded-md">
                                                <div className="flex items-start gap-2 text-sm">
                                                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                                                    <p>{report.reason}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Resolved on: {new Date(report.resolved_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {resolvedReports.length === 0 && (
                            <Card>
                                <CardContent className="p-6 text-center text-muted-foreground">
                                    No resolved reports
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
