
import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
    username: string | null;
    email: string | null;
  };
}

export default function DonationsManagement() {
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState<DonationItem | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  useEffect(() => {
    fetchDonations();
  }, []);
  
  const fetchDonations = async () => {
    setIsLoading(true);
    try {
      // Use the RPC function defined in the migrations
      const { data, error } = await supabase
        .rpc('get_all_donations_with_users');
      
      if (error) throw error;
      
      setDonations(data || []);
    } catch (error: any) {
      console.error("Error fetching donations:", error);
      toast.error("Failed to load donations", {
        description: error.message || "There was an error loading the donations"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateStatus = async (id: string, status: string) => {
    setIsUpdating(true);
    
    try {
      // Use the RPC function defined in the migrations
      const { error } = await supabase
        .rpc('update_donation_status', { 
          donation_id_param: id,
          status_param: status,
          completed_at_param: status === 'completed' ? new Date().toISOString() : null
        });
      
      if (error) throw error;
      
      toast.success("Donation status updated", {
        description: `Status has been changed to ${status}`
      });
      
      // Update local state
      setDonations(donations.map(item => 
        item.id === id 
          ? { 
              ...item, 
              payment_status: status,
              completed_at: status === 'completed' ? new Date().toISOString() : null
            } 
          : item
      ));
      
      if (selectedDonation?.id === id) {
        setSelectedDonation({
          ...selectedDonation,
          payment_status: status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        });
      }
    } catch (error: any) {
      toast.error("Failed to update status", {
        description: error.message || "There was an error updating the donation status"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'refunded':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  const viewDetails = (donation: DonationItem) => {
    setSelectedDonation(donation);
    setIsDetailsOpen(true);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Donation Management</CardTitle>
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
            {donations.map((donation) => (
              <div 
                key={donation.id} 
                className="border rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{formatAmount(donation.amount)}</span>
                    {getStatusBadge(donation.payment_status)}
                  </div>
                  
                  <div className="mt-1 text-sm text-muted-foreground">
                    From: {donation.user.username || donation.user.email || 'Anonymous'}
                  </div>
                  
                  <div className="mt-1 text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(donation.created_at))} ago
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewDetails(donation)}
                  >
                    Details
                  </Button>
                  
                  {donation.payment_status !== 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(donation.id, 'completed')}
                      disabled={isUpdating}
                      className="text-green-500 border-green-500 hover:bg-green-50"
                    >
                      Mark Completed
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {selectedDonation && (
          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Donation Details</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="font-medium">Amount:</dt>
                    <dd>{formatAmount(selectedDonation.amount)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Status:</dt>
                    <dd>{getStatusBadge(selectedDonation.payment_status)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">From:</dt>
                    <dd>{selectedDonation.user.username || selectedDonation.user.email || 'Anonymous'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Date:</dt>
                    <dd>{new Date(selectedDonation.created_at).toLocaleDateString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Type:</dt>
                    <dd className="capitalize">{selectedDonation.donation_type}</dd>
                  </div>
                  {selectedDonation.payment_processor && (
                    <div className="flex justify-between">
                      <dt className="font-medium">Processor:</dt>
                      <dd>{selectedDonation.payment_processor}</dd>
                    </div>
                  )}
                  {selectedDonation.transaction_id && (
                    <div className="flex justify-between">
                      <dt className="font-medium">Transaction ID:</dt>
                      <dd className="truncate max-w-[200px]">{selectedDonation.transaction_id}</dd>
                    </div>
                  )}
                  {selectedDonation.completed_at && (
                    <div className="flex justify-between">
                      <dt className="font-medium">Completed:</dt>
                      <dd>{new Date(selectedDonation.completed_at).toLocaleDateString()}</dd>
                    </div>
                  )}
                </dl>
              </div>
              <DialogFooter>
                {selectedDonation.payment_status !== 'completed' && (
                  <Button
                    onClick={() => {
                      handleUpdateStatus(selectedDonation.id, 'completed');
                      setIsDetailsOpen(false);
                    }}
                    disabled={isUpdating}
                  >
                    Mark as Completed
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
