import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  MapPin,
  IndianRupee,
  TrendingUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Layout & UI Components
import DashboardLayout from "@/components/layout/DashboardLayout";
import ParentDashboard from "@/components/dashboards/ParentDashboard";
import CoachDashboard from "@/components/dashboards/CoachDashboard";

// Dashboard Specific UI
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { BarChartCard } from "@/components/dashboard/charts/BarChartCard";
import { PieChartCard } from "@/components/dashboard/charts/PieChartCard";
import { LineChartCard } from "@/components/dashboard/charts/LineChartCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { fetchDashboardStats } from "../../api";

const StaffDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getStats = async () => {
      try {
        setLoading(true);
        const data = await fetchDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
        setError("Could not load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    getStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-destructive">
        <AlertCircle className="mr-2" /> {error}
      </div>
    );
  }

  // Fallback values if API is missing specific fields
  const data = stats || {};

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <DashboardHeader />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mt-6">
          <div className="p-6 border border-gray-200 rounded-xl shadow-sm bg-white">
            <StatCard
              title="Total Players"
              value={data.total_players || 0}
              subtitle="Active Players"
              icon={Users}
              trend={data.playersTrend}
            />
          </div>
          <div className="p-6 border border-gray-200 rounded-xl shadow-sm bg-white">
            <StatCard
              title="Active Coaches"
              value={data.total_coaches || 0}
              subtitle="Across all venues"
              icon={UserPlus}
            />
          </div>
          <div className="p-6 border border-gray-200 rounded-xl shadow-sm bg-white">
            <StatCard
              title="Venues"
              value={data.total_venues || 0}
              subtitle="Training locations"
              icon={MapPin}
            />
          </div>
           &nbsp;
          {/* &nbsp;
          <div className="p-6 border border-gray-200 rounded-xl shadow-sm bg-white"> */}
            <div className="p-6 border border-gray-200 rounded-xl shadow-sm bg-white">
              <StatCard
                title="Completion Rate"
                value={`${data?.completionRate || 0}%`}
                subtitle="Training sessions"
                icon={TrendingUp}
                variant="success"
                className="text-slate-900" // Ensures text is dark
              />
            </div>
          {/* </div> */}
          <div className="p-6 border border-gray-200 rounded-xl shadow-sm bg-white">
            <StatCard
              title="Pending"
              value={data.pendingRegistrations || 0}
              subtitle="Registrations"
              icon={AlertCircle}
              variant="warning"
            />
          </div>
        </div>

        {/* Charts Section - Passing data to charts if they accept props */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <BarChartCard data={data.revenueByVenue} />
          <PieChartCard data={data.playerDistribution} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2">
            <LineChartCard data={data.registrationGrowth} />
          </div>

          {/* Recent Activity */}
         <Card className="chart-container overflow-hidden border-none shadow-2xl bg-white">
      <CardHeader className="pb-3 pt-6 px-6">
        <CardTitle className="text-lg font-bold text-slate-800">
          Recent Activity
        </CardTitle>
      </CardHeader>

      <CardContent className="px-6 pb-10">
        {/* 3D Perspective Wrapper */}
        <div className="relative" style={{ perspective: '1200px' }}>
          
          {/* THE LIST CONTENT (Floating Layer) */}
          <div className="relative z-10 space-y-4">
            {(data.recentActivities || []).map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:translate-y-[-2px] hover:shadow-md transition-all duration-200"
              >
                {/* Glowing Activity Indicator */}
                <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] mt-1.5 shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">
                    {activity.action}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {activity.name}
                  </p>
                </div>

                <Badge variant="secondary" className="text-[10px] bg-slate-200/50 text-slate-600 shrink-0 border-none">
                  {new Date(activity.time).toLocaleDateString()}
                </Badge>
              </div>
            ))}
          </div>

          {/* 3D BASE / GROUND PLATE */}
          <div 
            className="absolute bottom-[-20px] left-[-2%] right-[-2%] h-[60px] bg-slate-100/60"
            style={{
              transform: 'rotateX(75deg)',
              transformOrigin: 'bottom',
              borderRadius: '24px',
              zIndex: 0,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
              border: '1px solid rgba(226, 232, 240, 0.8)'
            }}
          />
        </div>
      </CardContent>
    </Card>
        </div>

        {/* Quick Stats Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Registration Goal</span>
              <span className="text-sm text-muted-foreground">
                {data.totalPlayers}
              </span>
            </div>
            <Progress value={(data.totalPlayers / 400) * 100} className="h-2" />
          </Card>
          <Card className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Revenue Target</span>
              <span className="text-sm text-muted-foreground">
                ₹{data.monthlyRevenue}
              </span>
            </div>
            <Progress value={data.revenueProgress || 0} className="h-2" />
          </Card>
          <Card className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Coach Utilization</span>
              <span className="text-sm text-muted-foreground">
                {data.coachUtilization || 0}%
              </span>
            </div>
            <Progress value={data.coachUtilization || 0} className="h-2" />
          </Card>
          <Card className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Venue Occupancy</span>
              <span className="text-sm text-muted-foreground">
                {data.venueOccupancy || 0}%
              </span>
            </div>
            <Progress value={data.venueOccupancy || 0} className="h-2" />
          </Card>
        </div>
      </div>
    </div>
  );
};

// Main Index Component remains the same logic-wise
const Index = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, navigate, authLoading]);

  useEffect(() => {
    const checkOnboardingStatus = () => {
      if (user && user.role === "parent") {
        const onboardingData = localStorage.getItem("dummyOnboarding");
        const completed = onboardingData
          ? JSON.parse(onboardingData)[user.id]
          : false;
        setNeedsOnboarding(!completed);
      }
      setCheckingOnboarding(false);
    };

    if (user) {
      checkOnboardingStatus();
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    setNeedsOnboarding(false);
  };

  if (authLoading || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const renderDashboard = () => {
    switch (user.role) {
      case "parent":
        return <ParentDashboard />;
      case "coach":
        return <CoachDashboard />;
      case "staff":
      case "admin":
        return <StaffDashboard />;
      default:
        return <div className="p-8 text-center">Unknown role: {user.role}</div>;
    }
  };

  return <DashboardLayout>{renderDashboard()}</DashboardLayout>;
};

export default Index;
