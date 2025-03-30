import { Link, useLocation } from "react-router-dom";
import {
  Clock,
  ClipboardList,
  LineChart,
  LogOut,
  Menu,
  Settings,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const Navbar = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const isMobile = useIsMobile();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const NavLinks = () => (
    <>
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
      {/* <Link
        to="/calendar"
        className={`px-3 py-2 rounded-md ${
          isActive("/calendar")
            ? "bg-primary/10 text-primary"
            : "text-foreground/70 hover:bg-accent hover:text-foreground"
        } transition-colors`}
      >
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <span>Calendar</span>
        </div>
      </Link> */}
      <Link
        to="/settings"
        className={`px-3 py-2 rounded-md ${
          isActive("/settings")
            ? "bg-primary/10 text-primary"
            : "text-foreground/70 hover:bg-accent hover:text-foreground"
        } transition-colors`}
      >
        <div className="flex items-center space-x-2">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </div>
      </Link>
    </>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Clock className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                OrderTimer
              </span>
            </Link>
          </div>

          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="mt-6 flex flex-col space-y-3">
                  <NavLinks />
                  {user && (
                    <Button
                      variant="ghost"
                      onClick={() => signOut()}
                      className="justify-start mt-4"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <div className="flex items-center space-x-1">
              <NavLinks />
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
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
