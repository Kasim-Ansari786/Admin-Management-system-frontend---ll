import React from "react";
import { Moon, Sun, Bell, LogOut, User, Mail, Shield, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";

export const DashboardHeader = ({
  title = "Admin Dashboard",
  subtitle = "Welcome back! Here's your academy overview.",
}) => {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  
  // Pulling real user data and logout function from AuthContext
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      if (logout) await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <header className="flex items-center justify-between py-6 px-2">
      <div className="space-y-1 animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3"> 
        {/* Staff Dashboard Redirect Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="hidden md:flex gap-2 items-center"
          onClick={() => window.location.href = '/staff'}
        >
          <LayoutDashboard className="h-4 w-4" />
          Staff Dashboard
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="transition-transform hover:scale-105"
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={user?.avatar} alt={user?.name || "User"} />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{user?.name || "User Name"}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role || "Staff"}</p>
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-3 py-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm truncate">{user?.email || "No email provided"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-3 py-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm capitalize">Role: {user?.role || "User"}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-3 py-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-3 py-2 text-destructive focus:text-destructive cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};