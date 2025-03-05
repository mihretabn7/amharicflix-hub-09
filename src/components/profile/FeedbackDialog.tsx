
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function FeedbackDialog() {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!feedback.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.user?.id) {
        toast({
          title: "Authentication required",
          description: "Please sign in to submit feedback",
          variant: "destructive",
        });
        return;
      }
      
      // Using direct insert instead of RPC
      const { error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: session.session.user.id,
          feedback_text: feedback,
          status: 'pending'
        });
      
      if (error) throw error;
      
      toast({
        title: "Feedback received",
        description: "Thank you for your feedback. We value your input!",
      });
      
      setFeedback("");
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "There was an error submitting your feedback",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          <span>Send Feedback</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share your feedback</DialogTitle>
          <DialogDescription>
            Help us improve AmharicFlix by sharing your thoughts and suggestions.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="What's on your mind?"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="min-h-[120px]"
        />
        <DialogFooter>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={isSubmitting || !feedback.trim()}
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
