
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { customRpcs } from "@/integrations/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { formatDateTime } from "@/utils/date-utils";
import { Textarea } from "@/components/ui/textarea";

interface Feedback {
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

export function FeedbackDisplay() {
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [adminResponse, setAdminResponse] = useState("");
  
  const { data: feedbacks, isLoading, refetch } = useQuery({
    queryKey: ["feedbacks"],
    queryFn: async () => {
      const { data, error } = await customRpcs.getAllFeedbackWithUsers();
      
      if (error) {
        console.error("Error fetching feedback:", error);
        toast({
          title: "Error",
          description: "Failed to load feedback. Please try again.",
          variant: "destructive",
        });
        return [];
      }
      
      return data || [];
    },
  });

  const handleSubmitResponse = async () => {
    if (!selectedFeedback || !adminResponse.trim()) return;
    
    try {
      const { error } = await customRpcs.updateFeedbackResponse(
        selectedFeedback.id,
        adminResponse,
        "resolved"
      );
      
      if (error) throw error;
      
      toast({
        title: "Response Submitted",
        description: "Feedback has been marked as resolved with your response.",
      });
      
      setIsResponseDialogOpen(false);
      setAdminResponse("");
      refetch();
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error submitting your response",
        variant: "destructive",
      });
    }
  };

  const columns: ColumnDef<Feedback>[] = [
    {
      accessorKey: "user",
      header: "User",
      cell: ({ row }) => {
        const user = row.original.user;
        return <div>{user.email || user.username || "Anonymous"}</div>;
      },
    },
    {
      accessorKey: "feedback_text",
      header: "Feedback",
      cell: ({ row }) => {
        const text = row.original.feedback_text;
        return (
          <div className="max-w-md truncate" title={text}>
            {text}
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => {
        return <div>{formatDateTime(row.original.created_at)}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant={status === "resolved" ? "default" : "secondary"}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const feedback = row.original;
        
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedFeedback(feedback);
              setAdminResponse(feedback.admin_response || "");
              setIsResponseDialogOpen(true);
            }}
          >
            {feedback.status === "pending" ? "Respond" : "View"}
          </Button>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={feedbacks || []}
        isLoading={isLoading}
      />
      
      <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedFeedback?.status === "pending" ? "Respond to Feedback" : "Feedback Response"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="font-medium">User Feedback</div>
              <div className="p-4 bg-muted rounded-md text-sm">
                {selectedFeedback?.feedback_text}
              </div>
              <div className="text-xs text-muted-foreground">
                From: {selectedFeedback?.user.email || selectedFeedback?.user.username || "Anonymous"} • 
                {formatDateTime(selectedFeedback?.created_at)}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium">
                {selectedFeedback?.status === "pending" ? "Your Response" : "Admin Response"}
              </div>
              <Textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Enter your response here..."
                disabled={selectedFeedback?.status === "resolved"}
                className="min-h-[120px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResponseDialogOpen(false)}>
              Close
            </Button>
            {selectedFeedback?.status === "pending" && (
              <Button 
                onClick={handleSubmitResponse}
                disabled={!adminResponse.trim()}
              >
                Submit Response
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
