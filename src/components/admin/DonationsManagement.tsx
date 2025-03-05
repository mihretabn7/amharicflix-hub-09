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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow, format } from "date-fns";

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
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    fetchDonations();
  }, []);
  
  const fetchDonations = async () => {
    setIsLoading(true);
    try {
      // Using direct SQL query with proper join syntax
      const { data, error } = await supabase
        .from('user_donations')
        .select(`
          id,
          amount,
          donation_type,
          created_at,
          payment_status,
          payment_processor,
          transaction_id,
          completed_at,
          user_id,
          profiles(
            username,
            email
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Convert to expected format with proper null handling
      const formattedData = data?.map(item => ({
        id: item.id,
        amount: item.amount,
        donation_type: item.donation_type,
        created_at: item.created_at,
        payment_status: item.payment_status,
        payment_processor: item.payment_processor,
        transaction_id: item.transaction_id,
        completed_at: item.completed_at,
        user: {
          username: item.profiles?.[0]?.username || 'Unknown',
          email: item.profiles?.[0]?.email || 'Unknown'
        }
      })) || [];
      
      setDonations(formattedData);
      
    } catch (error: any) {
      console.error("Error fetching donations:", error);
      toast({
        title: "Failed to load donations",
        description: error.message || "There was an error loading the donation records",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateStatus = (donation: DonationItem) => {
    setSelectedDonation(donation);
    setSelectedStatus(donation.payment_status);
  };
  
  const handleSubmitStatusUpdate = async () => {
    if (!selectedDonation || !selectedStatus) return;
    
    setIsSubmitting(true);
    
    try {
      // Calculate completed_at timestamp if status is 'completed'
      const completedAt = selectedStatus === 'completed' ? new Date().toISOString() : null;
      
      // Using direct update
      const { error } = await supabase
        .from('user_donations')
        .update({
          payment_status: selectedStatus,
          completed_at: completedAt
        })
        .eq('id', selectedDonation.id);
      
      if (error) throw error;
      
      toast({
        title: "Status updated",
        description: "The donation status has been updated successfully",
        variant: "default",
      });
      
      // Update local state to reflect the changes
      setDonations(donations.map(item => 
        item.id === selectedDonation.id 
          ? { ...item, payment_status: selectedStatus, completed_at: completedAt } 
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
      setIsSubmitting(false);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 text-white">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'refunded':
        return <Badge variant="default">Refunded</Badge>;
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
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Donation Management</CardTitle>
        <CardDescription>Review and manage user donations</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading donations...</div>
        ) : donations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No donations have been received yet.
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
                      onClick={() => handleUpdateStatus(item)}
                    >
                      Update Status
                    </Button>
                  </div>
                </div>
                
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Amount:</span> {formatAmount(item.amount)}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {item.donation_type}
                  </div>
                  {item.payment_processor && (
                    <div>
                      <span className="font-medium">Processor:</span> {item.payment_processor}
                    </div>
                  )}
                  {item.transaction_id && (
                    <div>
                      <span className="font-medium">Transaction ID:</span> {item.transaction_id}
                    </div>
                  )}
                  {item.completed_at && (
                    <div className="col-span-2">
                      <span className="font-medium">Completed:</span> {format(new Date(item.completed_at), 'PPP p')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {selectedDonation && (
          <Dialog open={!!selectedDonation} onOpenChange={(open) => !open && setSelectedDonation(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Donation Status</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <div className="mb-4">
                  <p><span className="font-medium">User:</span> {selectedDonation.user?.username || selectedDonation.user?.email}</p>
                  <p><span className="font-medium">Amount:</span> {formatAmount(selectedDonation.amount)}</p>
                  <p><span className="font-medium">Date:</span> {format(new Date(selectedDonation.created_at), 'PPP')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleSubmitStatusUpdate} 
                  disabled={isSubmitting || !selectedStatus || selectedStatus === selectedDonation.payment_status}
                >
                  {isSubmitting ? "Updating..." : "Update Status"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
