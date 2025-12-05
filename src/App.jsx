import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Auth from "./pages/Auth";
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
import CoachDetails from "./pages/CoachDetails";

const queryClient = new QueryClient();

const IndexRouter = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="p-10 text-center text-xl font-bold">Loading App...</div>
    );
  }

  if (user && user.role) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <Navigate to="/auth" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<IndexRouter />} />
            <Route path="/auth" element={<Auth />} />            
            <Route path="/parent" element={<ParentDashboard />} />
            <Route path="/coach" element={<CoachDashboard />} />
            <Route path="/staff" element={<StaffDashboard />} />
            <Route path="/add-players" element={<AddPlayers />} />
            <Route
              path="/edit-player/:academyId/:playerId"
              element={<EditPlayers />}
            />
            <Route path="/venues" element={<Venues />} />
            <Route path="/assign-students" element={<AssignStudents />} />

            <Route path="/coach-old/:coachId" element={<CoachDetails />} />
       
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-canceled" element={<PaymentCanceled />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
