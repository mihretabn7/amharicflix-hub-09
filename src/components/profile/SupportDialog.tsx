
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
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function SupportDialog() {
  const [amount, setAmount] = useState("");
  const [donationType, setDonationType] = useState("one-time");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimal point
    const value = e.target.value.replace(/[^0-9.]/g, "");
    
    // Ensure only valid decimal format
    if (value === "" || /^\d+(\.\d{0,2})?$/.test(value)) {
      setAmount(value);
    }
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid donation amount",
        variant: "destructive",
      });
      return;
    }
    
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
      
      // Using direct insert instead of RPC
      const { error } = await supabase
        .from('user_donations')
        .insert({
          user_id: session.session.user.id,
          amount: parseFloat(amount),
          donation_type: donationType,
          payment_status: 'pending',
          payment_processor: 'stripe',
          transaction_id: null
        });
      
      if (error) throw error;
      
      toast({
        title: "Thank you for your support!",
        description: "Your donation is being processed. We greatly appreciate your generosity.",
      });
      
      setAmount("");
      setDonationType("one-time");
      setOpen(false);
      
      // Here you would normally redirect to a payment processor
      console.log("Would redirect to payment processor");
      
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "There was an error processing your donation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Donation Amount ($)</Label>
            <Input
              id="amount"
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="10.00"
            />
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
            type="submit" 
            onClick={handleSubmit}
            disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
          >
            {isSubmitting ? "Processing..." : "Donate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
