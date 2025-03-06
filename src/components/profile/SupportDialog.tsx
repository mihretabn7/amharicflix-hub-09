
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
      
      // In a real implementation, we would:
      // 1. Call a Supabase edge function to create a Stripe payment intent
      // 2. Redirect to the Stripe checkout or show a Stripe Elements form
      // 3. Handle the payment confirmation callback
      
      // For now, we'll simulate a successful payment
      const { error } = await supabase
        .from('user_donations')
        .insert({
          user_id: session.session.user.id,
          amount: parseFloat(amount),
          donation_type: donationType,
          payment_status: 'completed', // In a real implementation, this would initially be 'pending'
          payment_processor: 'stripe',
          transaction_id: `sim_${Math.random().toString(36).substring(2, 15)}`,
          completed_at: new Date().toISOString() // In a real implementation, this would be updated after payment confirmation
        });
      
      if (error) throw error;
      
      toast({
        title: "Thank you for your support!",
        description: "Your donation has been processed. We greatly appreciate your generosity.",
      });
      
      setAmount("");
      setDonationType("one-time");
      setPaymentStep("amount");
      setOpen(false);
      
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
                
                {/* In a real implementation, we would render a Stripe Elements card form here */}
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input id="cardNumber" placeholder="4242 4242 4242 4242" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input id="expiry" placeholder="MM/YY" />
                    </div>
                    <div>
                      <Label htmlFor="cvc">CVC</Label>
                      <Input id="cvc" placeholder="123" />
                    </div>
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
