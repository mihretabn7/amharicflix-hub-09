
import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";

interface DonationItem {
  id: string;
  amount: number;
  donation_type: string;
  created_at: string;
  payment_status: string;
  payment_processor: string | null;
  transaction_id: string | null;
  completed_at: string | null;
  user: {
    username: string;
    email: string;
  };
}

export default function DonationsManagement() {
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState<DonationItem | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    fetchDonations();
  }, []);
  
  const fetchDonations = async () => {
    setIsLoading(true);
    try {
      // Using custom RPC function to get donations with user details
      const { data, error } = await supabase.rpc('get_all_donations_with_users');
      
      if (error) throw error;
      
      setDonations(data || []);
    } catch (error: any) {
      console.error("Error fetching donations:", error);
      toast({
        title: "Failed to load donations",
        description: error.message || "There was an error loading the donation data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleViewDetails = (donation: DonationItem) => {
    setSelectedDonation(donation);
  };
  
  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedDonation) return;
    
    setIsUpdating(true);
    
    try {
      // Using custom RPC to update donation status
      const { error } = await supabase.rpc('update_donation_status', {
        donation_id_param: selectedDonation.id,
        status_param: newStatus,
        completed_at_param: newStatus === 'completed' ? new Date().toISOString() : null
      });
      
      if (error) throw error;
      
      toast({
        title: "Status updated",
        description: `Donation status has been updated to ${newStatus}`,
        variant: "default",
      });
      
      // Update local state to reflect the changes
      setDonations(donations.map(item => 
        item.id === selectedDonation.id 
          ? { 
              ...item, 
              payment_status: newStatus,
              completed_at: newStatus === 'completed' ? new Date().toISOString() : null
            } 
          : item
      ));
      
      setSelectedDonation(null);
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "There was an error updating the donation status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Donations</CardTitle>
        <CardDescription>Track and manage user donations</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading donations...</div>
        ) : donations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No donations have been made yet.
          </div>
        ) : (
          <div className="space-y-4">
            {donations.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{item.user?.username || item.user?.email || 'Anonymous'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(item.created_at))} ago
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(item.payment_status)}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewDetails(item)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-semibold">{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span>
                      {item.donation_type === 'one-time' ? 'One-time donation' : 
                        item.donation_type === 'monthly' ? 'Monthly support' : 
                        item.donation_type === 'yearly' ? 'Yearly support' : 
                        item.donation_type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {selectedDonation && (
          <Dialog open={!!selectedDonation} onOpenChange={(open) => !open && setSelectedDonation(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Donation Details</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium">User:</span>
                  <span>{selectedDonation.user?.username || selectedDonation.user?.email || 'Anonymous'}</span>
                  
                  <span className="text-sm font-medium">Amount:</span>
                  <span>{formatCurrency(selectedDonation.amount)}</span>
                  
                  <span className="text-sm font-medium">Donation Type:</span>
                  <span>
                    {selectedDonation.donation_type === 'one-time' ? 'One-time donation' : 
                      selectedDonation.donation_type === 'monthly' ? 'Monthly support' : 
                      selectedDonation.donation_type === 'yearly' ? 'Yearly support' : 
                      selectedDonation.donation_type}
                  </span>
                  
                  <span className="text-sm font-medium">Status:</span>
                  <span>{getStatusBadge(selectedDonation.payment_status)}</span>
                  
                  <span className="text-sm font-medium">Date:</span>
                  <span>{new Date(selectedDonation.created_at).toLocaleString()}</span>
                  
                  {selectedDonation.completed_at && (
                    <>
                      <span className="text-sm font-medium">Completed At:</span>
                      <span>{new Date(selectedDonation.completed_at).toLocaleString()}</span>
                    </>
                  )}
                  
                  {selectedDonation.payment_processor && (
                    <>
                      <span className="text-sm font-medium">Payment Processor:</span>
                      <span>{selectedDonation.payment_processor}</span>
                    </>
                  )}
                  
                  {selectedDonation.transaction_id && (
                    <>
                      <span className="text-sm font-medium">Transaction ID:</span>
                      <span className="break-all">{selectedDonation.transaction_id}</span>
                    </>
                  )}
                </div>
                
                {selectedDonation.payment_status === 'pending' && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Update Payment Status:</h4>
                    <div className="flex gap-2">
                      <Button 
                        variant="default" 
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => handleUpdateStatus('completed')}
                        disabled={isUpdating}
                      >
                        Mark as Completed
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => handleUpdateStatus('cancelled')}
                        disabled={isUpdating}
                      >
                        Cancel Donation
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedDonation(null)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
