
import { Link, useLocation } from "react-router-dom";
import { Clock, ClipboardList, LineChart, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Clock className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">OrderTimer</span>
            </Link>
          </div>
          <div className="flex items-center space-x-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md ${
                isActive("/")
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/70 hover:bg-accent hover:text-foreground"
              } transition-colors`}
            >
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Calculator</span>
              </div>
            </Link>
            <Link
              to="/order-management"
              className={`px-3 py-2 rounded-md ${
                isActive("/order-management")
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/70 hover:bg-accent hover:text-foreground"
              } transition-colors`}
            >
              <div className="flex items-center space-x-2">
                <ClipboardList className="h-4 w-4" />
                <span>Orders</span>
              </div>
            </Link>
            <Link
              to="/dashboard"
              className={`px-3 py-2 rounded-md ${
                isActive("/dashboard")
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/70 hover:bg-accent hover:text-foreground"
              } transition-colors`}
            >
              <div className="flex items-center space-x-2">
                <LineChart className="h-4 w-4" />
                <span>Dashboard</span>
              </div>
            </Link>
            
            {user && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => signOut()}
                className="ml-2"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
