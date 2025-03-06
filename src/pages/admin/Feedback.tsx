
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { customRpcs } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format, subDays, isWithinInterval } from "date-fns";
import { formatDateTime } from "@/utils/date-utils";
import { toast } from "@/components/ui/use-toast";

export default function FeedbackPage() {
    const [dateRange, setDateRange] = useState<DateRange>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });
    const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
    const [response, setResponse] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: feedbacks, isLoading, refetch } = useQuery({
        queryKey: ["admin-feedbacks"],
        queryFn: async () => {
            const { data, error } = await customRpcs.getAllFeedbackWithUsers();
            
            if (error) {
                console.error("Error fetching feedback:", error);
                toast({
                    title: "Error fetching feedback",
                    description: error.message,
                    variant: "destructive",
                });
                return [];
            }
            
            return data || [];
        },
    });

    const handleSubmitResponse = async () => {
        if (!selectedFeedback || !response.trim()) return;
        
        setIsSubmitting(true);
        
        try {
            const { error } = await customRpcs.updateFeedbackResponse(
                selectedFeedback.id,
                response,
                "resolved"
            );
            
            if (error) throw error;
            
            toast({
                title: "Response submitted",
                description: "Feedback has been marked as resolved",
            });
            
            setResponse("");
            setSelectedFeedback(null);
            refetch();
        } catch (error: any) {
            toast({
                title: "Submission failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredFeedbacks = feedbacks?.filter(feedback => {
        if (!dateRange.from || !dateRange.to) return true;
        
        const feedbackDate = new Date(feedback.created_at);
        return isWithinInterval(feedbackDate, {
            start: dateRange.from,
            end: dateRange.to
        });
    });

    const pendingCount = filteredFeedbacks?.filter(f => f.status === "pending").length || 0;
    const resolvedCount = filteredFeedbacks?.filter(f => f.status === "resolved").length || 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h1 className="text-2xl font-bold">Feedback Management</h1>
                <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Pending Feedback</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingCount}</div>
                        <p className="text-sm text-muted-foreground">
                            Awaiting response
                        </p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Resolved Feedback</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{resolvedCount}</div>
                        <p className="text-sm text-muted-foreground">
                            Successfully addressed
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>User Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">Loading feedback...</div>
                    ) : filteredFeedbacks?.length ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Feedback</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredFeedbacks.map((feedback) => (
                                    <TableRow key={feedback.id}>
                                        <TableCell>
                                            {feedback.user.email || feedback.user.username || "Anonymous"}
                                        </TableCell>
                                        <TableCell>{formatDateTime(feedback.created_at)}</TableCell>
                                        <TableCell className="max-w-md">
                                            <div className="truncate">
                                                {feedback.feedback_text}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={feedback.status === "resolved" ? "default" : "secondary"}>
                                                {feedback.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button 
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedFeedback(feedback);
                                                    setResponse(feedback.admin_response || "");
                                                }}
                                                disabled={feedback.status === "resolved"}
                                            >
                                                {feedback.status === "resolved" ? "View Response" : "Respond"}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8">
                            No feedback found for the selected date range.
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!selectedFeedback} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedFeedback?.status === "resolved" ? "Feedback Response" : "Respond to Feedback"}
                        </DialogTitle>
                        <DialogDescription>
                            Feedback from {selectedFeedback?.user?.email || "Anonymous"} on {selectedFeedback && formatDateTime(selectedFeedback.created_at)}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-medium mb-2">Feedback:</h3>
                            <div className="p-4 bg-secondary/30 rounded-md whitespace-pre-wrap">
                                {selectedFeedback?.feedback_text}
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="font-medium mb-2">Your Response:</h3>
                            <Textarea
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                                rows={5}
                                disabled={selectedFeedback?.status === "resolved" || isSubmitting}
                                placeholder="Write your response to this feedback..."
                            />
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button
                            type="button"
                            onClick={() => setSelectedFeedback(null)}
                            variant="outline"
                        >
                            Close
                        </Button>
                        
                        {selectedFeedback?.status !== "resolved" && (
                            <Button
                                type="submit"
                                onClick={handleSubmitResponse}
                                disabled={!response.trim() || isSubmitting}
                            >
                                {isSubmitting ? "Submitting..." : "Submit Response"}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
