
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Heart, CreditCard, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const getDonationFrequencyText = (type: string) => {
  switch (type) {
    case "monthly": return "per month";
    case "yearly": return "per year";
    default: return "one time";
  }
};

export function SupportDialog() {
  const [amount, setAmount] = useState("");
  const [donationType, setDonationType] = useState("one-time");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"amount" | "payment">("amount");
  const { toast } = useToast();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimal point
    const value = e.target.value.replace(/[^0-9.]/g, "");
    
    // Ensure only valid decimal format
    if (value === "" || /^\d+(\.\d{0,2})?$/.test(value)) {
      setAmount(value);
    }
  };

  const handleProceedToPayment = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid donation amount",
        variant: "destructive",
      });
      return;
    }
    
    setPaymentStep("payment");
  };

  const handleProcessPayment = async () => {
    setIsSubmitting(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.user?.id) {
        toast({
          title: "Authentication required",
          description: "Please sign in to make a donation",
          variant: "destructive",
        });
        return;
      }

      // Get user profile for name and email
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, email')
        .eq('id', session.session.user.id)
        .single();

      // Create Chapa payment
      const { data, error } = await supabase.functions.invoke('create-chapa-payment', {
        body: {
          amount: parseFloat(amount),
          donationType,
          email: profile?.email || session.session.user.email,
          first_name: profile?.username?.split(' ')[0] || 'User',
          last_name: profile?.username?.split(' ')[1] || 'Support'
        }
      });

      if (error) throw error;

      if (data.success) {
        // Record the donation attempt in database
        await supabase
          .from('user_donations')
          .insert({
            user_id: session.session.user.id,
            amount: parseFloat(amount),
            donation_type: donationType,
            payment_status: 'pending',
            payment_processor: 'chapa',
            transaction_id: data.tx_ref
          });

        // Redirect to Chapa checkout
        window.open(data.checkout_url, '_blank');
        
        toast({
          title: "Redirecting to payment",
          description: "You will be redirected to Chapa to complete your donation.",
        });
        
        setAmount("");
        setDonationType("one-time");
        setPaymentStep("amount");
        setOpen(false);
      } else {
        throw new Error(data.error || "Failed to create payment");
      }
      
    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error.message || "There was an error processing your payment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset to initial state when closing
      setPaymentStep("amount");
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Heart className="h-4 w-4 text-red-500" />
          <span>Support Us</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Support AmharicFlix</DialogTitle>
          <DialogDescription>
            Your contribution helps us maintain and improve the platform for everyone.
          </DialogDescription>
        </DialogHeader>
        
        {paymentStep === "amount" ? (
          <>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Donation Amount ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="10.00"
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="type">Donation Type</Label>
                <Select value={donationType} onValueChange={setDonationType}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select donation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-time">One-time donation</SelectItem>
                    <SelectItem value="monthly">Monthly support</SelectItem>
                    <SelectItem value="yearly">Yearly support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                onClick={handleProceedToPayment}
                disabled={!amount || parseFloat(amount) <= 0}
              >
                Proceed to Payment
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="grid gap-4 py-4">
              <div className="bg-secondary/30 p-4 rounded-md text-center">
                <h3 className="font-medium text-lg">Donation Summary</h3>
                <p className="text-2xl font-bold mt-2">${parseFloat(amount).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">
                  {getDonationFrequencyText(donationType)}
                </p>
              </div>
              
              <div className="border rounded-md p-4">
                <div className="flex items-center mb-4">
                  <CreditCard className="h-5 w-5 mr-2" />
                  <h3 className="font-medium">Payment Method</h3>
                </div>
                
                {/* Chapa payment information */}
                <div className="grid gap-4">
                  <div className="text-center p-4 bg-secondary/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      You will be redirected to Chapa's secure payment gateway to complete your donation.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Supported payment methods: Bank transfer, Mobile money, and Cards
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setPaymentStep("amount")}
              >
                Back
              </Button>
              <Button 
                type="submit" 
                onClick={handleProcessPayment}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? "Processing..." : `Donate $${parseFloat(amount).toFixed(2)}`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
