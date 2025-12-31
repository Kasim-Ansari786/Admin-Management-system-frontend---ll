import React from "react";
import { Moon, Sun, LogOut, User, Mail, Shield, LayoutDashboard } from "lucide-react";
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
    <header className="gradient-header w-full flex items-center justify-between p-6 shadow-xl shadow-glow/20 animate-fade-in rounded-xl border border-white/10">
      {/* Left Side: 3D Styled Title */}
      <div className="space-y-1 animate-fade-in">
        <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] filter">
          {title}
        </h1>
        <p className="text-slate-200/80 font-medium">{subtitle}</p>
      </div>

      {/* Right Side Actions: Fixed to the right */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Staff Dashboard Button */}
        <Button
          variant="secondary"
          size="sm"
          className="hidden md:flex gap-2 items-center bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md transition-all shadow-sm"
          onClick={() => (window.location.href = "/staff")}
        >
          <LayoutDashboard className="h-4 w-4" />
          Staff Dashboard
        </Button>

        {/* Theme Toggle */}
        {/* <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-white hover:bg-white/10 transition-transform hover:scale-110"
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button> */}

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-11 w-11 rounded-full p-0 hover:ring-2 hover:ring-white/50 transition-all">
              <Avatar className="h-11 w-11 border-2 border-white/30 shadow-md">
                <AvatarImage src={user?.avatar} alt={user?.name || "User"} />
                <AvatarFallback className="bg-white text-black font-bold">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent className="w-72 mt-2" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-3 p-1">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border border-primary/10">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-bold leading-none">{user?.name || "User Name"}</p>
                    <p className="text-xs text-muted-foreground mt-1 capitalize tracking-wide bg-secondary px-2 py-0.5 rounded-full w-fit">
                      {user?.role || "Staff"}
                    </p>
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <div className="p-1">
              <DropdownMenuItem className="gap-3 py-2.5 cursor-pointer">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm truncate">{user?.email || "No email provided"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 py-2.5 cursor-pointer">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Account Security</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-3 py-2.5 cursor-pointer">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Profile Settings</span>
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              className="gap-3 py-3 text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer m-1 rounded-md"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-bold">Logout System</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};