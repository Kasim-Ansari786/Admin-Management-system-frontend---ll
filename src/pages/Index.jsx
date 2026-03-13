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
  Clock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ParentDashboard from "@/components/dashboards/ParentDashboard";
import CoachDashboard from "@/components/dashboards/CoachDashboard";
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
        navigate("/auth");
        // setError("Could not load dashboard data.");
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

  const data = stats || {};
  const brandBlue = "#1A9CFF";

  const DashboardStats = ({ data }) => {
    return (
      <div className="space-y-0">
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            <DashboardHeader />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-6">
              {/* Total Students */}
              <StatCard
                title="Total students"
                value={data.total_players || 0}
                subtitle="Active Students"
                icon={Users}
                iconColor={brandBlue}
                className="h-full border border-gray-200 rounded-xl shadow-sm bg-white p-6"
              />

              {/* Active Teachers */}
              <StatCard
                title="Active Teachers"
                value={data.total_coaches || 0}
                subtitle="Across all Centers"
                iconColor={brandBlue}
                icon={UserPlus}
                className="h-full border border-gray-200 rounded-xl shadow-sm bg-white p-6"
              />

              {/* Centers */}
              <StatCard
                title="Centers"
                value={data.total_venues || 0}
                subtitle="Training locations"
                iconColor={brandBlue}
                icon={MapPin}
                className="h-full border border-gray-200 rounded-xl shadow-sm bg-white p-6"
              />

              {/* Completion Rate */}
              <StatCard
                title="Completion Rate"
                value={`${data?.completionRate || 0}%`}
                subtitle="Training sessions"
                icon={TrendingUp}
                iconColor={brandBlue}
                className="h-full border border-gray-200 rounded-xl shadow-sm bg-white p-6 text-slate-900"
              />

              {/* Pending Registrations */}
              <StatCard
                title="Pending"
                value={data.pendingRegistrations || 0}
                subtitle="Registrations"
                change="3 due today"
                changeType="neutral"
                icon={Clock}
                iconColor={brandBlue}
                className="h-full border border-gray-200 rounded-xl shadow-sm bg-white p-6"
              />
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
                  <div className="relative" style={{ perspective: "1200px" }}>
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

                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-slate-200/50 text-slate-600 shrink-0 border-none"
                          >
                            {new Date(activity.time).toLocaleDateString()}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    {/* 3D BASE / GROUND PLATE */}
                    <div
                      className="absolute bottom-[-20px] left-[-2%] right-[-2%] h-[60px] bg-slate-100/60"
                      style={{
                        transform: "rotateX(75deg)",
                        transformOrigin: "bottom",
                        borderRadius: "24px",
                        zIndex: 0,
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.12)",
                        border: "1px solid rgba(226, 232, 240, 0.8)",
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats Footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {/* Registration Goal */}
              <Card className="p-4 shadow-sm border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Registration Goal
                  </span>
                  <span className="text-sm font-bold text-[#1A9CFF]">
                    {data.totalPlayers} / 400
                  </span>
                </div>
                <Progress
                  value={(data.totalPlayers / 400) * 100}
                  className="h-2"
                />
              </Card>

              {/* Revenue Target */}
              <Card className="p-4 shadow-sm border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Revenue Target
                  </span>
                  <span className="text-sm font-bold text-[#1A9CFF]">
                    ₹{data.monthlyRevenue?.toLocaleString()}
                  </span>
                </div>
                <Progress value={data.revenueProgress || 0} className="h-2" />
              </Card>

              {/* Teacher Utilization */}
              <Card className="p-4 shadow-sm border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Teacher Utilization
                  </span>
                  <span className="text-sm font-bold text-[#1A9CFF]">
                    {data.coachUtilization || 0}%
                  </span>
                </div>
                <Progress value={data.coachUtilization || 0} className="h-2" />
              </Card>

              {/* Center Occupancy */}
              <Card className="p-4 shadow-sm border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Center Occupancy
                  </span>
                  <span className="text-sm font-bold text-[#1A9CFF]">
                    {data.venueOccupancy || 0}%
                  </span>
                </div>
                <Progress value={data.venueOccupancy || 0} className="h-2" />
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  };
  return <DashboardStats data={data} />;
};

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
