
import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

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
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    fetchFeedback();
  }, []);
  
  const fetchFeedback = async () => {
    setIsLoading(true);
    try {
      // Use the RPC function defined in the migrations
      const { data, error } = await supabase
        .rpc('get_all_feedback_with_users');
      
      if (error) throw error;
      
      setFeedback(data || []);
      
    } catch (error: any) {
      console.error("Error fetching feedback:", error);
      toast.error("Failed to load feedback", {
        description: error.message || "There was an error loading the feedback items"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRespond = (item: FeedbackItem) => {
    setSelectedFeedback(item);
    setResponse(item.admin_response || "");
  };
  
  const handleSubmitResponse = async () => {
    if (!selectedFeedback || !response.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Use the RPC function defined in the migrations
      const { error } = await supabase
        .rpc('update_feedback_response', {
          feedback_id_param: selectedFeedback.id,
          admin_response_param: response,
          status_param: 'resolved'
        });
      
      if (error) throw error;
      
      toast.success("Response submitted", {
        description: "Your response has been sent to the user"
      });
      
      // Update local state to reflect the changes
      setFeedback(feedback.map(item => 
        item.id === selectedFeedback.id 
          ? { ...item, admin_response: response, status: 'resolved' } 
          : item
      ));
      
      setSelectedFeedback(null);
      
    } catch (error: any) {
      toast.error("Submission failed", {
        description: error.message || "There was an error submitting your response"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'resolved':
        return <Badge>Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Feedback</CardTitle>
        <CardDescription>Manage and respond to user feedback</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading feedback...</div>
        ) : feedback.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No feedback has been submitted yet.
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{item.user?.username || item.user?.email || 'Anonymous'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(item.created_at))} ago
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(item.status)}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRespond(item)}
                    >
                      {item.admin_response ? "View Response" : "Respond"}
                    </Button>
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap">{item.feedback_text}</p>
                {item.admin_response && (
                  <div className="mt-4 bg-muted p-3 rounded-md">
                    <p className="text-sm font-medium">Admin Response:</p>
                    <p className="text-sm whitespace-pre-wrap">{item.admin_response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {selectedFeedback && (
          <Dialog open={!!selectedFeedback} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedFeedback.admin_response ? "View Response" : "Respond to Feedback"}
                </DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-1">User Feedback:</h4>
                  <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                    {selectedFeedback.feedback_text}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Your Response:</h4>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Type your response here..."
                    className="min-h-[100px] mt-1"
                    disabled={!!selectedFeedback.admin_response}
                  />
                </div>
              </div>
              <DialogFooter>
                {!selectedFeedback.admin_response && (
                  <Button 
                    onClick={handleSubmitResponse} 
                    disabled={isSubmitting || !response.trim()}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Response"}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
