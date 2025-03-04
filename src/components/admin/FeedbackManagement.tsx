
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface FeedbackItem {
  id: string;
  feedback_text: string;
  created_at: string;
  status: string;
  admin_response?: string;
  user: {
    id: string;
    username?: string;
    email?: string;
  }
}

export const FeedbackManagement = () => {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('user_feedback')
        .select(`
          id,
          feedback_text,
          created_at,
          status,
          admin_response,
          user:profiles(id, username, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setFeedbackItems(data || []);
      
      // Initialize responses state
      const initialResponses: Record<string, string> = {};
      data?.forEach(item => {
        if (item.admin_response) {
          initialResponses[item.id] = item.admin_response;
        }
      });
      setResponses(initialResponses);
      
    } catch (error: any) {
      console.error('Error fetching feedback:', error.message);
      toast({
        title: "Error fetching feedback",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFeedbackStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('user_feedback')
        .update({ 
          status,
          admin_response: responses[id] || null
        })
        .eq('id', id);

      if (error) throw error;
      
      setFeedbackItems(prev => 
        prev.map(item => 
          item.id === id ? { ...item, status, admin_response: responses[id] } : item
        )
      );
      
      toast({
        title: "Feedback updated",
        description: `Feedback has been marked as ${status}`
      });
      
    } catch (error: any) {
      console.error('Error updating feedback:', error.message);
      toast({
        title: "Error updating feedback",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleResponseChange = (id: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [id]: value
    }));
  };

  if (loading) {
    return <div className="text-center p-8">Loading feedback...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          User Feedback
        </CardTitle>
        <CardDescription>
          View and respond to user feedback submissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {feedbackItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No feedback has been submitted yet.
          </div>
        ) : (
          <div className="space-y-6">
            {feedbackItems.map((item) => (
              <div 
                key={item.id} 
                className="p-4 border rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    From: {item.user?.username || item.user?.email || 'Anonymous'}
                  </div>
                  <Badge variant={item.status === 'resolved' ? 'success' : (item.status === 'dismissed' ? 'destructive' : 'default')}>
                    {item.status === 'pending' ? 'Pending' : 
                     item.status === 'resolved' ? 'Resolved' : 'Dismissed'}
                  </Badge>
                </div>
                
                <div className="text-sm bg-muted p-3 rounded">
                  {item.feedback_text}
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Submitted {formatDistanceToNow(new Date(item.created_at))} ago
                </div>
                
                <div className="pt-2">
                  <Textarea
                    placeholder="Add your response (optional)"
                    value={responses[item.id] || ''}
                    onChange={(e) => handleResponseChange(item.id, e.target.value)}
                    className="text-sm mb-3"
                    disabled={item.status !== 'pending'}
                  />
                  
                  {item.status === 'pending' && (
                    <div className="flex gap-2 justify-end">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-1"
                        onClick={() => updateFeedbackStatus(item.id, 'dismissed')}
                      >
                        <XCircle className="h-4 w-4" />
                        Dismiss
                      </Button>
                      <Button 
                        size="sm" 
                        className="gap-1"
                        onClick={() => updateFeedbackStatus(item.id, 'resolved')}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
