import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "lucide-react";

interface AuthButtonsProps {
    session: any;
    isAdmin: boolean;
    handleSignOut: () => void;
}

const AuthButtons = ({ session, isAdmin, handleSignOut }: AuthButtonsProps) => {
    const navigate = useNavigate();

    if (session) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <div className="flex items-center space-x-2 hover:bg-accent rounded-md px-3 py-2 cursor-pointer">
                        <User className="h-5 w-5" />
                        <span className="text-sm">
                            {session.user.email || session.user.phone}
                        </span>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                        Profile
                    </DropdownMenuItem>
                    {isAdmin && (
                        <DropdownMenuItem onClick={() => navigate("/admin")}>
                            Admin Dashboard
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleSignOut}>
                        Sign Out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <div className="flex items-center space-x-4">
            <div
                onClick={() => navigate("/login")}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                role="button"
                tabIndex={0}
            >
                Sign In
            </div>
            <div
                onClick={() => navigate("/register")}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                role="button"
                tabIndex={0}
            >
                Sign Up
            </div>
        </div>
    );
};

export default AuthButtons; 