
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { DollarSign, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface DonationItem {
  id: string;
  amount: number;
  created_at: string;
  payment_status: string;
  donation_type: string;
  user: {
    id: string;
    username?: string;
    email?: string;
  }
}

export const DonationsManagement = () => {
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const { data, error } = await supabase
        .from('user_donations')
        .select(`
          id,
          amount,
          created_at,
          payment_status,
          donation_type,
          user:profiles(id, username, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDonations(data || []);
    } catch (error: any) {
      console.error('Error fetching donations:', error.message);
      toast({
        title: "Error fetching donations",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDonationStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('user_donations')
        .update({ payment_status: status })
        .eq('id', id);

      if (error) throw error;
      
      setDonations(prev => 
        prev.map(item => 
          item.id === id ? { ...item, payment_status: status } : item
        )
      );
      
      toast({
        title: "Donation updated",
        description: `Donation has been marked as ${status}`
      });
      
    } catch (error: any) {
      console.error('Error updating donation:', error.message);
      toast({
        title: "Error updating donation",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading donations...</div>;
  }

  // Calculate total donations
  const totalDonations = donations
    .filter(d => d.payment_status === 'completed')
    .reduce((sum, donation) => sum + donation.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          User Donations
        </CardTitle>
        <CardDescription>
          Track and manage financial support from users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 bg-muted p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-1">Total Donations</h3>
          <div className="text-2xl font-bold">${totalDonations.toFixed(2)}</div>
        </div>
        
        {donations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No donations have been received yet.
          </div>
        ) : (
          <div className="space-y-4">
            {donations.map((donation) => (
              <div 
                key={donation.id} 
                className="p-4 border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">${donation.amount.toFixed(2)}</span>
                    <Badge variant={
                      donation.payment_status === 'completed' ? 'success' : 
                      donation.payment_status === 'failed' ? 'destructive' : 
                      'outline'
                    }>
                      {donation.payment_status}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mt-1">
                    From: {donation.user?.username || donation.user?.email || 'Anonymous'}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(donation.created_at))} ago 
                    · Type: {donation.donation_type}
                  </div>
                </div>
                
                {donation.payment_status === 'pending' && (
                  <div className="flex gap-2 sm:self-end">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-1"
                      onClick={() => updateDonationStatus(donation.id, 'failed')}
                    >
                      <XCircle className="h-4 w-4" />
                      Failed
                    </Button>
                    <Button 
                      size="sm" 
                      className="gap-1"
                      onClick={() => updateDonationStatus(donation.id, 'completed')}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Complete
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
