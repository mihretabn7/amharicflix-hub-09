
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, customRpcs } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Clock, DollarSign, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export function DonationsAndFeedbackSummary() {
  const { data: donations, isLoading: isLoadingDonations } = useQuery({
    queryKey: ['dashboard-donations'],
    queryFn: async () => {
      const { data, error } = await customRpcs.getAllDonationsWithUsers();
      if (error) {
        console.error("Error fetching donations:", error);
        return [];
      }
      return data || [];
    }
  });

  const { data: feedback, isLoading: isLoadingFeedback } = useQuery({
    queryKey: ['dashboard-feedback'],
    queryFn: async () => {
      const { data, error } = await customRpcs.getAllFeedbackWithUsers();
      if (error) {
        console.error("Error fetching feedback:", error);
        return [];
      }
      return data || [];
    }
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'resolved':
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case 'pending':
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case 'rejected':
      case 'failed':
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="donations">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="donations">
              <DollarSign className="mr-2 h-4 w-4" />
              Donations
            </TabsTrigger>
            <TabsTrigger value="feedback">
              <MessageSquare className="mr-2 h-4 w-4" />
              Feedback
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="donations" className="space-y-4">
            {isLoadingDonations ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              ))
            ) : (
              <>
                {(donations || []).slice(0, 5).map((donation: any) => (
                  <div key={donation.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                    <Avatar className="h-12 w-12 border">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {donation.user.username?.charAt(0) || donation.user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">
                        {donation.user.username || donation.user.email || 'Anonymous'}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>${donation.amount}</span>
                        <span className="text-xs">•</span>
                        <span>{formatDate(donation.created_at)}</span>
                      </div>
                    </div>
                    <Badge className={getStatusColor(donation.payment_status)}>
                      {donation.payment_status === 'completed' ? (
                        <CheckCircle className="mr-1 h-3 w-3" />
                      ) : (
                        <Clock className="mr-1 h-3 w-3" />
                      )}
                      {donation.payment_status}
                    </Badge>
                  </div>
                ))}
                
                {(donations || []).length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    No donations found
                  </div>
                )}
                
                <Button asChild variant="outline" className="w-full mt-2">
                  <Link to="/admin/donations">
                    View All Donations
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="feedback" className="space-y-4">
            {isLoadingFeedback ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              ))
            ) : (
              <>
                {(feedback || []).slice(0, 5).map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                    <Avatar className="h-12 w-12 border">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {item.user.username?.charAt(0) || item.user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">
                        {item.user.username || item.user.email || 'Anonymous'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.feedback_text.length > 50 
                          ? `${item.feedback_text.substring(0, 50)}...` 
                          : item.feedback_text}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDate(item.created_at)}
                      </div>
                    </div>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
                
                {(feedback || []).length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    No feedback found
                  </div>
                )}
                
                <Button asChild variant="outline" className="w-full mt-2">
                  <Link to="/admin/feedback">
                    View All Feedback
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
