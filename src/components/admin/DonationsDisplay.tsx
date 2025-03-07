
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { customRpcs } from "@/integrations/supabase/client";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { formatDateTime } from "@/utils/date-utils";
import { Check, X } from "lucide-react";

interface Donation {
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

export function DonationsDisplay() {
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  
  const { data: donations, isLoading, refetch } = useQuery({
    queryKey: ["donations"],
    queryFn: async () => {
      const { data, error } = await customRpcs.getAllDonationsWithUsers();
      
      if (error) {
        console.error("Error fetching donations:", error);
        toast({
          title: "Error",
          description: "Failed to load donations. Please try again.",
          variant: "destructive",
        });
        return [];
      }
      
      return data || [];
    },
  });

  const handleUpdateStatus = async (status: string) => {
    if (!selectedDonation) return;
    
    try {
      const completedAt = status === "completed" ? new Date().toISOString() : null;
      
      const { error } = await customRpcs.updateDonationStatus(
        selectedDonation.id,
        status,
        completedAt
      );
      
      if (error) throw error;
      
      toast({
        title: "Status Updated",
        description: `Donation status updated to ${status}`,
      });
      
      setIsUpdateDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "There was an error updating the donation status",
        variant: "destructive",
      });
    }
  };

  const columns: ColumnDef<Donation>[] = [
    {
      accessorKey: "user",
      header: "User",
      cell: ({ row }) => {
        const user = row.original.user;
        return <div>{user.email || user.username || "Anonymous"}</div>;
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        return <div>${row.original.amount.toFixed(2)}</div>;
      },
    },
    {
      accessorKey: "donation_type",
      header: "Type",
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => {
        return <div>{formatDateTime(row.original.created_at)}</div>;
      },
    },
    {
      accessorKey: "payment_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.payment_status;
        return (
          <Badge
            variant={
              status === "completed" ? "default" :
              status === "pending" ? "secondary" :
              status === "failed" ? "destructive" : "outline"
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const donation = row.original;
        
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedDonation(donation);
              setIsUpdateDialogOpen(true);
            }}
          >
            Update
          </Button>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={donations || []}
        isLoading={isLoading}
      />
      
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Donation Status</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="font-medium">Donation Details</div>
              <div className="text-sm text-muted-foreground">
                <p><strong>User:</strong> {selectedDonation?.user.email || selectedDonation?.user.username || "Anonymous"}</p>
                <p><strong>Amount:</strong> ${selectedDonation?.amount.toFixed(2)}</p>
                <p><strong>Date:</strong> {formatDateTime(selectedDonation?.created_at)}</p>
                <p><strong>Current Status:</strong> {selectedDonation?.payment_status}</p>
              </div>
            </div>
            
            <div className="font-medium">Update Status</div>
            <div className="flex space-x-2">
              <Button 
                variant="default" 
                onClick={() => handleUpdateStatus("completed")}
                className="flex items-center gap-1"
              >
                <Check className="h-4 w-4" />
                Mark as Completed
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleUpdateStatus("pending")}
              >
                Mark as Pending
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleUpdateStatus("failed")}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Mark as Failed
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
