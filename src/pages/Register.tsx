
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Passwords do not match"
        });
        return;
      }

      if (!formData.phoneNumber.startsWith("+")) {
        toast({
          variant: "destructive",
          title: "Invalid Phone Format",
          description: "Phone number must start with + and country code (e.g., +251)"
        });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: formData.email || `${formData.phoneNumber}@placeholder.com`,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone_number: formData.phoneNumber,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Registration successful!",
        description: "Please check your email for verification.",
        duration: 5000,
      });
      navigate("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-netflix-red">Sign Up</h2>
          <p className="mt-2 text-gray-300">Create your አማርኛFlix account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <Input
                type="text"
                name="fullName"
                placeholder="Full name"
                className="bg-secondary"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Input
                type="tel"
                name="phoneNumber"
                placeholder="Phone number (e.g., +251912345678)"
                className="bg-secondary"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                pattern="^\+[1-9]\d{1,14}$"
              />
            </div>
            <div>
              <Input
                type="email"
                name="email"
                placeholder="Email address"
                className="bg-secondary"
                value={formData.email}
                onChange={handleChange}
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
            <div>
              <Input
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                className="bg-secondary"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-netflix-red hover:bg-netflix-red/90"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="text-center text-sm">
          <p className="text-gray-300">
            Already have an account?{" "}
            <Link to="/login" className="text-netflix-red hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
