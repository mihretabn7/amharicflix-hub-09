
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { customRpcs } from "@/integrations/supabase/client";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
  const [newStatus, setNewStatus] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchDonations = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await customRpcs.getAllDonationsWithUsers();
      
      if (error) {
        throw error;
      }
      
      setDonations(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching donations",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedDonation || !newStatus) return;
    
    try {
      const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;
      
      const { error } = await customRpcs.updateDonationStatus(
        selectedDonation.id,
        newStatus,
        completedAt
      );
      
      if (error) throw error;
      
      toast({
        title: "Status updated",
        description: "The donation status has been updated successfully.",
      });
      
      fetchDonations();
      setDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openStatusDialog = (donation: DonationItem) => {
    setSelectedDonation(donation);
    setNewStatus(donation.payment_status);
    setDialogOpen(true);
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Donation Management</h2>
        <Button onClick={fetchDonations} disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh Data"}
        </Button>
      </div>
      
      <Separator />
      
      <Card>
        <CardHeader>
          <CardTitle>All Donations</CardTitle>
        </CardHeader>
        <CardContent>
          {donations.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No donations found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell>
                        {format(new Date(donation.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{donation.user?.username || "Anonymous"}</div>
                        <div className="text-sm text-muted-foreground">{donation.user?.email || "No email"}</div>
                      </TableCell>
                      <TableCell>${donation.amount.toFixed(2)}</TableCell>
                      <TableCell>{donation.donation_type}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            donation.payment_status === "completed" ? "default" :
                            donation.payment_status === "pending" ? "outline" :
                            "destructive"
                          }
                        >
                          {donation.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openStatusDialog(donation)}
                        >
                          Update Status
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Donation Status</DialogTitle>
            <DialogDescription>
              Change the status of this donation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
