import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

const Register = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-netflix-red">Sign Up</h2>
          <p className="mt-2 text-gray-300">Create your አማርኛFlix account</p>
        </div>
        
        <form className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Full name"
                className="bg-secondary"
              />
            </div>
            <div>
              <Input
                type="email"
                placeholder="Email address"
                className="bg-secondary"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                className="bg-secondary"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Confirm password"
                className="bg-secondary"
              />
            </div>
          </div>

          <Button className="w-full bg-netflix-red hover:bg-netflix-red/90">
            Create Account
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