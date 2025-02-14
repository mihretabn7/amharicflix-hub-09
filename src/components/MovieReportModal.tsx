
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MovieReportModalProps {
  movieId: string;
  userId: string;
}

const MovieReportModal = ({ movieId, userId }: MovieReportModalProps) => {
  const [reason, setReason] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('movie_reports')
        .insert({
          movie_id: movieId,
          reporter_id: userId,
          reason: reason
        });

      if (error) throw error;

      toast.success("Report submitted successfully");
      setIsOpen(false);
      setReason("");
    } catch (error: any) {
      toast.error("Failed to submit report");
      console.error('Report submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Flag className="h-4 w-4 mr-2" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Movie</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Please describe why you're reporting this movie..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button 
            onClick={handleSubmit}
            disabled={!reason.trim() || isSubmitting}
          >
            Submit Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MovieReportModal;
