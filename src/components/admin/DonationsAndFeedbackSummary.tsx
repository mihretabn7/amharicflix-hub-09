
import { useQuery } from "@tanstack/react-query";
import { customRpcs } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/utils/date-utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { HeartHandshake, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function DonationsAndFeedbackSummary() {
  const navigate = useNavigate();

  const { data: donations } = useQuery({
    queryKey: ["dashboard-donations"],
    queryFn: async () => {
      const { data, error } = await customRpcs.getAllDonationsWithUsers();
      
      if (error) {
        console.error("Error fetching donations:", error);
        return [];
      }
      
      return data?.slice(0, 5) || [];
    }
  });

  const { data: feedbacks } = useQuery({
    queryKey: ["dashboard-feedbacks"],
    queryFn: async () => {
      const { data, error } = await customRpcs.getAllFeedbackWithUsers();
      
      if (error) {
        console.error("Error fetching feedback:", error);
        return [];
      }
      
      return data?.slice(0, 5) || [];
    }
  });

  const totalDonations = donations?.reduce((total, donation) => {
    if (donation.payment_status === "completed") {
      return total + donation.amount;
    }
    return total;
  }, 0) || 0;

  const pendingFeedbacks = feedbacks?.filter(f => f.status === "pending").length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Donations & Feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Recent Donations</h3>
            </div>
            <div className="text-sm text-muted-foreground">
              Total: ${totalDonations.toFixed(2)}
            </div>
          </div>
          
          <ScrollArea className="h-[150px]">
            {donations?.length ? (
              <div className="space-y-3">
                {donations.map((donation) => (
                  <div key={donation.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {donation.user.email || donation.user.username || "Anonymous"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDateTime(donation.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">${donation.amount.toFixed(2)}</span>
                      <Badge variant={
                        donation.payment_status === "completed" ? "default" :
                        donation.payment_status === "pending" ? "secondary" : "outline"
                      }>
                        {donation.payment_status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No recent donations
              </div>
            )}
          </ScrollArea>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-4"
            onClick={() => navigate("/admin/donations")}
          >
            View All Donations
          </Button>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Recent Feedback</h3>
            </div>
            <div className="text-sm text-muted-foreground">
              Pending: {pendingFeedbacks}
            </div>
          </div>
          
          <ScrollArea className="h-[150px]">
            {feedbacks?.length ? (
              <div className="space-y-3">
                {feedbacks.map((feedback) => (
                  <div key={feedback.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        {feedback.user.email || feedback.user.username || "Anonymous"}
                      </div>
                      <Badge variant={feedback.status === "resolved" ? "default" : "secondary"}>
                        {feedback.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDateTime(feedback.created_at)}
                    </div>
                    <div className="text-sm truncate max-w-full">
                      {feedback.feedback_text}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No recent feedback
              </div>
            )}
          </ScrollArea>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-4"
            onClick={() => navigate("/admin/feedback")}
          >
            View All Feedback
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
