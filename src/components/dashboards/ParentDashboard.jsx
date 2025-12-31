import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { getPlayerDetailsByGuardianEmail } from "../../../api";

import {
  User,
  LogOut,
  Calendar,
  TrendingUp,
  CreditCard,
  MapPin,
  Clock,
  Trophy,
  Activity,
  Loader2,
} from "lucide-react";

// --- Dashboard Component ---

const ParentDashboard = () => {
  const [childData, setChildData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const { user, logout, isLoading: isAuthLoading, session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
const extractToken = () => {
    return (
      session?.token ||                     // custom backend
      session?.access_token ||              // supabase
      session?.accessToken ||               // ADDED to match debug log
      session?.user?.access_token ||        // other auth systems
      user?.accessToken ||                  // firebase
      localStorage.getItem("token") ||      // JWT stored manually
      null
    );
  };


  const extractEmail = () => {
    return (
      user?.email ||
      session?.user?.email ||
      session?.email ||
      localStorage.getItem("email") ||
      null
    );
  };


  // Fetch data on component mount
useEffect(() => {
    const loadData = async () => {
      if (isAuthLoading) return;

      console.log("AUTH DEBUG:", { user, session });

      const parentEmail = extractEmail();
      const token = extractToken();

      if (!parentEmail) {
        console.warn("Email missing from AuthContext. Check useAuth source.");
        setIsLoading(false);
        return;
      }

      if (!token) {
        console.warn("Token missing from AuthContext. Check useAuth source.");
        setIsLoading(false);
        return;
      }

      try {
        // FIX 2: Ensure token is passed as the second argument
        const playersArray = await getPlayerDetailsByGuardianEmail(
          parentEmail,
          token 
        );
        
        // Handling single or multiple children (assuming a parent can have multiple)
        if (playersArray && playersArray.length > 0) {
            // For a Parent Dashboard, you might want to show the first child or an array
            // Assuming this dashboard is currently designed to show one child (the first in the list)
            setChildData(playersArray[0]); 
        } else {
             // Handle case with no players found
             toast({
                title: "No Player Found",
                description: "No registered players found for this guardian email.",
                variant: "default",
            });
            setChildData({});
        }

      } catch (error) {
        console.error("Error loading child data:", error);
        toast({
          title: "API Error",
          description: error.message || "Failed to load child data.",
          variant: "destructive",
        });
        setChildData({});
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user, isAuthLoading, session, toast, navigate]);

  const handleSignOut = () => {
    logout();
    toast({
      title: "Signed Out",
      description:
        "You have been securely logged out and redirected to the login page.",
      variant: "default",
    });
    navigate("/auth");
  };

  // --- Render Logic ---
  if (isLoading || isAuthLoading) {
    return (
      <div className="flex justify-center items-center h-screen-1/2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">
          Loading Player Data...
        </p>
      </div>
    );
  }

  // Data parsing (Using optional chaining for safety)
  const attendance = Math.round(
    parseFloat(childData?.attendance_percentage) || 0
  );
  const recentActivities =
    typeof childData?.recent_activities_json === "string"
      ? JSON.parse(childData.recent_activities_json) || []
      : childData?.recent_activities_json || [];

  const progressData = childData?.progressData || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="gradient-header w-full flex items-center gap-6 p-6 shadow-lg shadow-glow animate-fade-in rounded-xl">
        <div className="flex-grow">
          <h1 className="text-primary-foreground/80 font-semibold">Parent Dashboard</h1>
          <p className="text-primary-foreground/80">
            Welcome{" "}
            <span className="font-semibold">{user?.name || "Parent"}</span>
          </p>
        </div>

        {/* User details displayed on the right side */}
        <div className="ml-8 text-right self-center">
          <div className="mt-2 text-sm text-primary-foreground/70 space-y-1">
            <p>Email: {user?.email || "—"}</p>
            <p>Role: {user?.role || "—"}</p>
          </div>
        </div>

        {/* Sign Out Button */}
        {/* <Button
          variant="secondary"
          className="ml-7 bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button> */}
      </div>

      {/* Child Profile Card */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
              {/* <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {childData?.name}
                </CardTitle>
                <CardDescription>
                  Player ID: {childData?.player_id}
                </CardDescription>
              </div> */}
            <Badge
              variant="secondary"
              className="bg-success text-success-foreground"
            >
              Active Player
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
           <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium"> {childData?.name}</p>
                <p className="font-medium"> Player ID: {childData?.player_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Age</p>
                <p className="font-medium">{childData?.age} years</p>
              </div>
            </div>
            {/* <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Position</p>
                <p className="font-medium">{childData?.position}</p>
              </div>
            </div> */}
            {/* <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Center</p>
                <p className="font-medium">{childData?.center}</p>
              </div>
            </div> */}
            {/* <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Batch</p>
                <p className="font-medium text-xs">{childData?.batch}</p>
              </div>
            </div> */}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Attendance Card - Uses fetched attendance_percentage */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Attendance
            </CardTitle>
            <CardDescription>Overall attendance rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{attendance}%</span>
                <Badge variant={attendance >= 80 ? "default" : "destructive"}>
                  {attendance >= 80 ? "Good" : "Needs Improvement"}
                </Badge>
              </div>
              <Progress value={attendance} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Coach: {childData?.coach}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Card */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Status
            </CardTitle>
            <CardDescription>Next payment due</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Next Payment</p>
                <p className="text-lg font-semibold">
                  {childData?.nextPayment}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-2xl font-bold text-primary">
                  {childData?.paymentAmount}
                </p>
              </div>
              <Button className="w-full" variant="outline">
                View Payment History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Chart - Uses fetched progressData */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Skill Progress
          </CardTitle>
          <CardDescription>
            Development across all key skills
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {progressData.map((skill) => (
              <div key={skill.skill} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{skill.skill}</span>
                  <span className="font-medium">{skill.progress}%</span>
                </div>
                <Progress value={skill.progress} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities - Uses fetched recentActivities */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Latest training sessions and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-muted-foreground">
                No recent attendance recorded.
              </p>
            ) : (
              recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">{activity.activity}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.date}
                    </p>
                  </div>
                  <Badge
                    variant={
                      activity.status === "Present" ||
                      activity.status === "Played" ||
                      activity.status === "Completed"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {activity.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentDashboard;
