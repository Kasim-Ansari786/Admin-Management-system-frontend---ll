import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React from 'react';

// ✅ CORRECT: Import AuthProvider using the consistent alias path
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Ensure path is correct, assuming your Auth.jsx is in a 'pages' folder 
import Auth from "./pages/Auth"; 
// The other pages imports remain the same:
import Index from "./pages/Index";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import NotFound from "./pages/NotFound";
import ParentDashboard from "@/components/dashboards/ParentDashboard";
import CoachDashboard from "@/components/dashboards/CoachDashboard";
import StaffDashboard from "@/components/dashboards/StaffDashboard";
import AddPlayers from "@/components/dashboards/AddPlayers"; 
import EditPlayers from "./components/dashboards/EditPlayers";
import Venues from "@/components/dashboards/Venues";
import { AssignStudents } from "@/components/dashboards/AssignStudents";


const queryClient = new QueryClient();

// Component to handle redirection from the root path (/)
const IndexRouter = () => {
    const { user, isLoading } = useAuth();
    
    if (isLoading) {
        return <div className="p-10 text-center text-xl font-bold">Loading App...</div>;
    }

    if (user && user.role) {
        // Redirect to the role-specific dashboard
        return <Navigate to={`/${user.role}`} replace />;
    }
    
    // If not logged in, redirect to the login page
    return <Navigate to="/auth" replace />;
};


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* 🏆 The AuthProvider component correctly wraps the entire application */}
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* The Index component handles ALL role-based dashboard rendering at the root path */}
            {/* 🔑 FIXED: Use the IndexRouter component to handle redirect logic */}
            <Route path="/" element={<IndexRouter />} /> 
            <Route path="/auth" element={<Auth />} />
            {/* <Route path="/login" element={<Login />} /> */}

            {/* Dashboard Routes (Protected by AuthGuard in a real app, but rendered directly here) */}
            <Route path="/parent" element={<ParentDashboard />} />
            <Route path="/coach" element={<CoachDashboard />} />
            <Route path="/staff" element={<StaffDashboard />} />
            <Route path="/add-players" element={<AddPlayers />} />
            <Route path="/edit-player/:academyId/:playerId" element={<EditPlayers/>} />
            <Route path="/venues" element={<Venues/>} />
            <Route path="/assign-students" element={<AssignStudents/>} />

            {/* Payment Routes */}
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-canceled" element={<PaymentCanceled />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;