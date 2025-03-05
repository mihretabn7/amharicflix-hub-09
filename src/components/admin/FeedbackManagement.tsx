
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { customRpcs } from "@/integrations/supabase/client";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface FeedbackItem {
  id: string;
  feedback_text: string;
  created_at: string;
  status: string;
  admin_response: string | null;
  user: {
    username: string | null;
    email: string | null;
  };
}

export default function FeedbackManagement() {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchFeedback = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await customRpcs.getAllFeedbackWithUsers();
      
      if (error) {
        throw error;
      }
      
      setFeedbackItems(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching feedback",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedFeedback || !adminResponse.trim()) return;
    
    try {
      const { error } = await customRpcs.updateFeedbackResponse(
        selectedFeedback.id,
        adminResponse,
        'resolved'
      );
      
      if (error) throw error;
      
      toast({
        title: "Response submitted",
        description: "Your response has been submitted successfully.",
      });
      
      fetchFeedback();
      setDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error submitting response",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openResponseDialog = (feedback: FeedbackItem) => {
    setSelectedFeedback(feedback);
    setAdminResponse(feedback.admin_response || "");
    setDialogOpen(true);
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Feedback Management</h2>
        <Button onClick={fetchFeedback} disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh Data"}
        </Button>
      </div>
      
      <Separator />
      
      <Card>
        <CardHeader>
          <CardTitle>User Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          {feedbackItems.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No feedback found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Feedback</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbackItems.map((feedback) => (
                    <TableRow key={feedback.id}>
                      <TableCell>
                        {format(new Date(feedback.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{feedback.user?.username || "Anonymous"}</div>
                        <div className="text-sm text-muted-foreground">{feedback.user?.email || "No email"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="line-clamp-2">{feedback.feedback_text}</p>
                          {feedback.admin_response && (
                            <div className="mt-2 border-l-2 border-gray-400 pl-2 text-sm">
                              <span className="font-semibold">Response:</span> {feedback.admin_response}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            feedback.status === "resolved" ? "success" :
                            feedback.status === "pending" ? "outline" :
                            "default"
                          }
                        >
                          {feedback.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openResponseDialog(feedback)}
                        >
                          {feedback.admin_response ? "Edit Response" : "Respond"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Respond to Feedback</DialogTitle>
            <DialogDescription>
              Provide a response to the user's feedback.
            </DialogDescription>
          </DialogHeader>
          
          {selectedFeedback && (
            <div className="grid gap-4 py-4">
              <div>
                <Label className="text-sm text-muted-foreground">User Feedback:</Label>
                <div className="mt-1 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                  {selectedFeedback.feedback_text}
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="response">Your Response</Label>
                <Textarea
                  id="response"
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Type your response here..."
                  rows={5}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSubmitResponse} disabled={!adminResponse.trim()}>
              Submit Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
