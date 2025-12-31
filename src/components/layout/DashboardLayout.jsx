import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-header w-full flex items-center gap-6 p-6 shadow-lg shadow-glow animate-fade-in rounded-xl">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📚</span>
            <h1 className="text-primary-foreground font-extrabold text-2xl">
              Admin Management System
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-white font-medium">
                {user?.name} <span className="opacity-80">({user?.role})</span>
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className=" hover:bg-primary-foreground hover:text-primary"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
};

export default DashboardLayout;
