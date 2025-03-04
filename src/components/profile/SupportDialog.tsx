
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
import { Heart, CreditCard, Coffee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const SUPPORT_OPTIONS = [
  { value: "coffee", label: "Buy us a coffee", amount: 5, icon: Coffee },
  { value: "basic", label: "Basic support", amount: 10, icon: Heart },
  { value: "premium", label: "Premium support", amount: 25, icon: CreditCard },
  { value: "custom", label: "Custom amount", amount: null, icon: CreditCard },
];

export function SupportDialog() {
  const [selectedOption, setSelectedOption] = useState("coffee");
  const [customAmount, setCustomAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSupport = async () => {
    setIsSubmitting(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.user?.id) {
        toast({
          title: "Authentication required",
          description: "Please sign in to support us",
          variant: "destructive",
        });
        return;
      }
      
      const selectedItem = SUPPORT_OPTIONS.find(option => option.value === selectedOption);
      const amount = selectedOption === "custom" 
        ? parseFloat(customAmount) 
        : (selectedItem?.amount || 0);
      
      if (amount <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid amount",
          variant: "destructive",
        });
        return;
      }

      // In a real implementation, this would connect to a payment processor
      // For now, we'll just record the donation intent
      const { error } = await supabase.from("user_donations").insert({
        user_id: session.session.user.id,
        amount: amount,
        payment_status: "pending",
        donation_type: selectedOption
      });
      
      if (error) throw error;
      
      toast({
        title: "Thank you for your support!",
        description: "We'll redirect you to the payment page shortly.",
      });
      
      setOpen(false);
      
      // Simulate redirect to payment page
      setTimeout(() => {
        toast({
          title: "This is a demo",
          description: "In a production app, you would be redirected to a payment processor.",
        });
      }, 2000);
      
    } catch (error: any) {
      toast({
        title: "Process failed",
        description: error.message || "There was an error processing your support",
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
          <Heart className="h-4 w-4" />
          <span>Support Us</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Support AmharicFlix</DialogTitle>
          <DialogDescription>
            Your support helps us maintain and improve the platform for everyone.
          </DialogDescription>
        </DialogHeader>
        
        <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="gap-3">
          {SUPPORT_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="flex flex-1 items-center gap-2 cursor-pointer">
                  <Icon className="h-4 w-4" />
                  <span>{option.label}</span>
                  {option.amount && <span className="ml-auto">${option.amount}</span>}
                </Label>
              </div>
            );
          })}
        </RadioGroup>
        
        {selectedOption === "custom" && (
          <div className="flex items-center gap-2 mt-2">
            <span>$</span>
            <Input
              type="number"
              min="1"
              placeholder="Enter amount"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
            />
          </div>
        )}
        
        <DialogFooter className="mt-4">
          <Button 
            onClick={handleSupport}
            disabled={isSubmitting || (selectedOption === "custom" && !customAmount)}
          >
            {isSubmitting ? "Processing..." : "Continue to Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
