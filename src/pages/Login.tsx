import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    rememberMe: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRememberMeChange = (checked: boolean) => {
    setFormData({
      ...formData,
      rememberMe: checked,
    });
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove any spaces or special characters except + and numbers
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +
    if (!cleaned.startsWith('+')) {
      return `+${cleaned}`;
    }
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Determine if the identifier is a phone number or email
      const isPhone = formData.identifier.includes('+') || /^\d+$/.test(formData.identifier);
      let email;
      
      if (isPhone) {
        const formattedPhone = formatPhoneNumber(formData.identifier);
        email = `${formattedPhone}@placeholder.com`;
      } else {
        email = formData.identifier;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: formData.password,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Successfully logged in!",
      });
      navigate("/");
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to login. Please check your credentials.",
      });
    } finally {
      setLoading(false);
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
                placeholder="Phone number (e.g., +251912345678) or email"
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
    </div>
  );
};

export default Login;