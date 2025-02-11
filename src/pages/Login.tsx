
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthError } from "@supabase/supabase-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    rememberMe: false,
  });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRememberMeChange = async (checked: boolean) => {
    setFormData({
      ...formData,
      rememberMe: checked,
    });
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
      return `+251${cleaned.startsWith('0') ? cleaned.slice(1) : cleaned}`;
    }
    return cleaned;
  };

  const isValidPhoneNumber = (phone: string) => {
    const phoneRegex = /^\+251[0-9]{9}$/;
    return phoneRegex.test(phone);
  };

  const getErrorMessage = (error: AuthError) => {
    switch (error.message) {
      case "Invalid login credentials":
        return "Invalid phone number/email or password. Please check your credentials and try again.";
      case "Email not confirmed":
        return "Please verify your email address before signing in.";
      default:
        return error.message;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isPhone = formData.identifier.includes('+') || /^\d+$/.test(formData.identifier);
      let email = formData.identifier;
      
      if (isPhone) {
        const formattedPhone = formatPhoneNumber(formData.identifier);
        
        if (!isValidPhoneNumber(formattedPhone)) {
          throw new Error("Invalid phone number format. Please use format: +251912345678");
        }
        
        email = `${formattedPhone}@placeholder.com`;
        console.log('Attempting login with phone:', formattedPhone);
      } else {
        console.log('Attempting login with email:', email);
      }

      // Sign in with remember me option
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: formData.password,
        options: {
          data: {
            remember_me: formData.rememberMe
          }
        }
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      // Update the remember_me preference in the profiles table
      if (data.user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ remember_me: formData.rememberMe })
          .eq('id', data.user.id);

        if (updateError) {
          console.error('Error updating remember_me:', updateError);
        }
      }

      toast({
        title: "Success",
        description: "Successfully logged in!",
        duration: 2000,
      });
      navigate("/");
    } catch (error: any) {
      console.error('Login error:', error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: getErrorMessage(error),
      });
      
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password reset instructions have been sent to your email.",
        duration: 5000,
      });
      setShowForgotPassword(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-netflix-red">Sign In</h2>
          <p className="mt-2 text-gray-300">Welcome back to አማርኛFlix</p>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <Input
                type="text"
                name="identifier"
                placeholder="Email"
                className="bg-secondary"
                value={formData.identifier}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                name="password"
                placeholder="Password"
                className="bg-secondary"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={handleRememberMeChange}
                />
                <label
                  htmlFor="rememberMe"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-netflix-red hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-netflix-red hover:bg-netflix-red/90"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="text-center text-sm">
          <p className="text-gray-300">
            New to አማርኛFlix?{" "}
            <Link to="/register" className="text-netflix-red hover:underline">
              Sign up now
            </Link>
          </p>
        </div>
      </div>

      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you instructions to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <Input
              type="email"
              placeholder="Email address"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />
            <Button
              type="submit"
              className="w-full bg-netflix-red hover:bg-netflix-red/90"
              disabled={resetLoading}
            >
              {resetLoading ? "Sending..." : "Send Reset Instructions"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
