import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { IndianRupee } from "lucide-react";

import {
  Users,
  Calendar as CalendarIcon,
  Clock,
  ArrowLeft,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Plus,
  Trash2,
  Pencil,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  getCoachDetails,
  getCoachPlayers,
  insertSessionData,
  updateSession,
  fetchSessionData,
  deleteSession,
} from "../../api";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

const CATEGORY_COLORS = {
  "U12 Beginners": "hsl(142, 71%, 45%)",
  "U13 Intermediate": "hsl(217, 91%, 60%)",
  "U14 Advanced": "hsl(262, 83%, 58%)",
  Unknown: "hsl(215, 20%, 55%)",
};

const ATTENDANCE_RANGES = {
  High: { min: 80.01, max: 100, color: "hsl(142, 71%, 45%)" },
  Medium: { min: 50.01, max: 80, color: "hsl(48, 96%, 53%)" },
  Low: { min: 0, max: 50, color: "hsl(0, 84%, 60%)" },
};

const CoachDetails = () => {
  const { coachId } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [coachData, setCoachData] = useState(null);
  const [assignedPlayers, setAssignedPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [localAttendance, setLocalAttendance] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    day: "",
    startTime: "",
    endTime: "",
    group: "",
    location: "",
    status: "Upcoming",
  });

  const weekdays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const timeSlots = [
    "6:00 AM",
    "7:00 AM",
    "8:00 AM",
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
    "6:00 PM",
    "7:00 PM",
    "8:00 PM",
    "9:00 PM",
  ];
  const averageAttendance = useMemo(() => {
    if (!assignedPlayers.length) return 0;
    const total = assignedPlayers.reduce((sum, p) => sum + p.attendance, 0);
    return Math.round(total / assignedPlayers.length);
  }, [assignedPlayers]);

  const attendanceDistributionData = useMemo(() => {
    const distribution = { High: 0, Medium: 0, Low: 0 };
    let total = 0;

    assignedPlayers.forEach((player) => {
      const percentage = parseFloat(player.attendance) || 0;
      total++;

      if (percentage > 80) {
        distribution.High++;
      } else if (percentage > 50) {
        distribution.Medium++;
      } else {
        distribution.Low++;
      }
    });

    const data = [
      {
        name: "High Attendance (>80%)",
        value: distribution.High,
        color: ATTENDANCE_RANGES.High.color,
      },
      {
        name: "Medium Attendance (50-80%)",
        value: distribution.Medium,
        color: ATTENDANCE_RANGES.Medium.color,
      },
      {
        name: "Low Attendance (<50%)",
        value: distribution.Low,
        color: ATTENDANCE_RANGES.Low.color,
      },
    ].filter((d) => d.value > 0);

    return { data, totalPlayers: total };
  }, [assignedPlayers]);

  const { data: pieChartData, totalPlayers } = attendanceDistributionData;

  const playersByCategoryChartData = useMemo(() => {
    if (!assignedPlayers.length) return [];

    const categoryCounts = assignedPlayers.reduce((acc, player) => {
      const category = player.category || "Unknown";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(categoryCounts)
      .sort()
      .map((category) => ({
        category: category,
        players: categoryCounts[category],
        color: CATEGORY_COLORS[category] || CATEGORY_COLORS["Unknown"],
      }));
  }, [assignedPlayers]);

  useEffect(() => {
    let cancelled = false;

    const loadCoachAndPlayers = async () => {
      setError(null);

      if (!coachId) {
        console.error("Coach ID is missing from URL parameters.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [coachDetailsRaw, playersListRaw] = await Promise.all([
          getCoachDetails(coachId),
          getCoachPlayers(coachId),
        ]);

        if (cancelled) return;
        const coachDetails =
          coachDetailsRaw === null
            ? null
            : typeof coachDetailsRaw === "object" &&
              Object.keys(coachDetailsRaw).length > 0
            ? coachDetailsRaw
            : null;

        if (cancelled) return;

        if (coachDetails) {
          setCoachData({
            coach_id: coachDetails.coach_id ?? coachDetails.coachId ?? coachId,
            coach_name: coachDetails.coach_name ?? coachDetails.name,
            phone_numbers:
              coachDetails.phone_numbers ?? coachDetails.phoneNumbers ?? "",
            email: coachDetails.email ?? "",
            address: coachDetails.address ?? "",
            salary: coachDetails.salary ?? null,
            week_salary:
              coachDetails.week_salary ?? coachDetails.weekSalary ?? null,
            status: coachDetails.status ?? "Active",
          });
        } else {
          setCoachData(null);
        }

        const playersArray = playersListRaw?.players
          ? playersListRaw.players
          : playersListRaw;
        const validPlayers = Array.isArray(playersArray) ? playersArray : [];

        const playersWithRealData = validPlayers.map((player, idx) => ({
          player_id: player.player_id ?? player.id ?? `p-${idx}`,
          name: player.name ?? "Unknown",
          category: player.category ?? "Unknown",
          active:
            typeof player.active === "boolean"
              ? player.active
              : !!player.active,
          attendance: player.attendance_percentage
            ? parseFloat(player.attendance_percentage)
            : 0,
          age: player.age ?? Math.floor(Math.random() * 5) + 12,
          ...player,
        }));

        if (cancelled) return;
        setAssignedPlayers(playersWithRealData);
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to load coach details or players", err);
        const message =
          err?.response?.data?.error ??
          err?.response?.data?.message ??
          err?.message ??
          "An unexpected error occurred while fetching coach details.";

        setError(message);
        toast({
          title: "Error Loading Coach Data",
          description: message,
          variant: "destructive",
        });
        setCoachData(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadCoachAndPlayers();

    return () => {
      cancelled = true;
    };
  }, [coachId]);

  useEffect(() => {
    let cancelled = false;

    const loadSchedules = async () => {
      if (!coachId) {
        console.warn("Coach ID not yet available for fetching schedules.");
        return;
      }

      try {
        const fetchedSessions = await fetchSessionData(coachId);

        if (cancelled) return;

        const transformedSessions = fetchedSessions.map((session, index) => ({
          id: session.session_id || `s-${index}-${Date.now() + index}`,
          time: `${session.start_time} - ${session.end_time}`,
          group: session.group_category,
          location: session.location,
          status: session.status,
          day: session.day_of_week,
          startTime: session.start_time,
          endTime: session.end_time,
        }));

        setSchedules(transformedSessions);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load schedules", err);
        toast({
          title: "Error Loading Schedules",
          description: "Could not fetch the training schedule from the server.",
          variant: "destructive",
        });
      }
    };

    loadSchedules();

    return () => {
      cancelled = true;
    };
  }, [coachId]);

  const handleAttendanceChange = (playerId, status) => {
    setLocalAttendance((prev) => ({
      ...prev,
      [playerId]: status,
    }));
  };

  const handleSubmitAttendance = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const dateString = selectedDate.toISOString().split("T")[0];

    try {
      await new Promise((r) => setTimeout(r, 800));

      toast({
        title: "Attendance Submitted",
        description: `Attendance recorded for ${assignedPlayers.length} players on ${dateString}.`,
      });
      setLocalAttendance({});
    } catch (error) {
      console.error(error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit attendance",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditScheduleClick = (session) => {
    setIsEditing(true);
    setEditingScheduleId(session.id);

    setNewSchedule({
      day: session.day,
      startTime: session.startTime || "",
      endTime: session.endTime || "",
      group: session.group,
      location: session.location,
      status: session.status,
    });
    setIsScheduleDialogOpen(true);
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingScheduleId(null);
    setNewSchedule({
      day: "",
      startTime: "",
      endTime: "",
      group: "",
      location: "",
      status: "Upcoming",
    });
    setIsScheduleDialogOpen(false);
  };

  const handleSaveSchedule = async () => {
    if (isSubmitting || !coachData) return;

    if (
      !newSchedule.group ||
      !newSchedule.startTime ||
      !newSchedule.endTime ||
      !newSchedule.location ||
      !newSchedule.day
    ) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields for the schedule.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const sessionData = {
      coach_id: coachData.coach_id,
      coach_name: coachData.coach_name,
      day_of_week: newSchedule.day,
      start_time: newSchedule.startTime,
      end_time: newSchedule.endTime,
      group_category: newSchedule.group,
      location: newSchedule.location,
      status: newSchedule.status,
      active: true,
    };

    try {
      const isRealId =
        isEditing &&
        editingScheduleId &&
        !String(editingScheduleId).includes("-");

      if (isRealId) {
        const idToUpdate = isNaN(Number(editingScheduleId))
          ? editingScheduleId
          : Number(editingScheduleId);

        const result = await updateSession(idToUpdate, sessionData);

        setSchedules((prev) =>
          prev.map((s) => {
            if (String(s.id) === String(editingScheduleId)) {
              const newStartTime = result.start_time || sessionData.start_time;
              const newEndTime = result.end_time || sessionData.end_time;

              return {
                ...s,
                id: result.session_id || s.id,
                time: `${newStartTime} - ${newEndTime}`,
                group: result.group_category || sessionData.group_category,
                location: result.location || sessionData.location,
                status: result.status || sessionData.status,
                day: result.day_of_week || sessionData.day_of_week,
                startTime: newStartTime,
                endTime: newEndTime,
              };
            }
            return s;
          })
        );

        toast({
          title: "Schedule Updated ✅",
          description: `Session for ${sessionData.group_category} on ${sessionData.day_of_week} updated successfully.`,
        });
      } else {
        const result = await insertSessionData(sessionData);
        const newSession = {
          id: result.session_id || result.id || `s-${Date.now()}`,
          startTime: result.start_time || sessionData.start_time,
          endTime: result.end_time || sessionData.end_time,
          time: `${result.start_time || sessionData.start_time} - ${
            result.end_time || sessionData.end_time
          }`,
          group: result.group_category || sessionData.group_category,
          location: result.location || sessionData.location,
          status: result.status || sessionData.status,
          day: result.day_of_week || sessionData.day_of_week,
        };
        setSchedules((prev) => [...prev, newSession]);
        toast({
          title: "Schedule Added ✨",
          description: `New session for ${sessionData.group_category} added on ${sessionData.day_of_week}.`,
        });

        if (isEditing) {
          toast({
            title: "Temporary ID Warning ⚠️",
            description:
              "The ID was temporary, so the session was saved as a *new* entry.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error saving training session:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        "Failed to save the schedule to the database.";
      toast({
        title: isEditing ? "Update Failed ❌" : "Add Failed ❌",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      resetForm();
    }
  };

  const handleDeleteSchedule = async (session_id) => {
    if (session_id === undefined || session_id === null) {
      console.error("Attempted to delete schedule with no ID.");
      toast({ title: "Invalid schedule ID.", variant: "destructive" });
      return;
    }
    const confirmed = window.confirm(
      "Delete this schedule? This action cannot be undone."
    );
    if (!confirmed) return;

    const numericId = Number(session_id);
    const isPersisted = Number.isInteger(numericId) && numericId > 0;

    setIsSubmitting(true);
    try {
      if (isPersisted) {
        const status = await deleteSession(session_id);
        if (status !== 204 && status !== 200) {
          throw new Error(`Unexpected response from server: ${status}`);
        }
      }
      setSchedules((prev) =>
        prev.filter((s) => String(s.id) !== String(session_id))
      );
      toast({
        title: "Schedule Deleted",
        description: isPersisted
          ? "Schedule deleted from database."
          : "Unsaved schedule removed from the list.",
      });
    } catch (error) {
      console.error("Error deleting session:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete the schedule.";
      toast({
        title: "Deletion Failed ❌",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading coach details...</p>
      </div>
    );
  }

  // const handleSignOut = () => {
  //   logout();
  //   toast({
  //     title: "Signed Out",
  //     description:
  //       "You have been securely logged out and redirected to the login page.",
  //     variant: "success",
  //   });
  //   navigate("/staff?tab=coaches");
  // };

  if (!coachData) {
    return (
      <div className="p-8">
        <div className="flex items-center mb-6">        
          {/* <Button
            variant="secondary"
            className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button> */}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Coach Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The coach you are looking for with ID **{coachId}** does not exist
              or an error occurred while loading.
            </p>
            {error && (
              <p className="mt-4 text-red-500 text-sm">
                Error Details: {error}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="gradient-header w-full flex items-center gap-6 p-6 shadow-lg shadow-glow animate-fade-in rounded-xl">
        <div className="flex items-center">
          <Button
            variant="secondary"
            className="text-primary hover:bg-white/90"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <div className="flex-grow">
          <div>
            <h1 className="text-primary-foreground font-bold mb-2">
              {coachData.coach_name} Coach Dashboard
            </h1>
          </div>

          <p className="text-primary-foreground/80">
            Manage training sessions and track player attendance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={coachData.status === "Active" ? "default" : "secondary"}
            className="text-sm px-3 py-2"
          >
            {coachData.status}
          </Badge>
        </div>
      </div>
      &nbsp;&nbsp;&nbsp;
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Coach Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{coachData.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{coachData.phone_numbers}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{coachData.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <IndianRupee className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Monthly Salary</p>
                <p className="font-medium">₹{coachData.salary}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <IndianRupee className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Session Salary</p>
                <p className="font-medium mb-1">₹{coachData.week_salary}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Tabs defaultValue="players">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="players" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Assigned Players ({assignedPlayers.length})
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Training Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="mt-4">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1 space-y-6">
              <Card className="glass-card animate-fade-up">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold font-display">
                    Players by Category
                  </CardTitle>
                  <CardDescription>
                    Distribution of {assignedPlayers.length} players across
                    training groups
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={playersByCategoryChartData}
                        layout="vertical"
                        margin={{ left: 30 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(222, 47%, 16%)"
                          horizontal={true}
                          vertical={false}
                        />
                        <XAxis
                          type="number"
                          tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
                          axisLine={{ stroke: "hsl(222, 47%, 16%)" }}
                        />
                        <YAxis
                          type="category"
                          dataKey="category"
                          tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
                          axisLine={{ stroke: "hsl(222, 47%, 16%)" }}
                          width={110}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(222, 47%, 9%)",
                            border: "1px solid hsl(222, 47%, 16%)",
                            borderRadius: "8px",
                            color: "hsl(210, 40%, 98%)",
                          }}
                          cursor={{ fill: "hsl(222, 47%, 14%)" }}
                          formatter={(value) => [`${value} players`, "Count"]}
                        />
                        <Bar dataKey="players" radius={[0, 6, 6, 0]}>
                          {playersByCategoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card animate-fade-up">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold font-display">
                    Attendance Distribution
                  </CardTitle>
                  <CardDescription>
                    Player attendance performance breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
                          paddingAngle={4}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(222, 47%, 9%)",
                            border: "1px solid hsl(222, 47%, 16%)",
                            borderRadius: "8px",
                            color: "hsl(210, 40%, 98%)",
                          }}
                          formatter={(value) => [`${value} players`, ""]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-2xl font-bold font-display text-foreground">
                          {totalPlayers}
                        </p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {pieChartData.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Assigned Players</CardTitle>
                <CardDescription>
                  List of all players currently assigned to{" "}
                  {coachData.coach_name || "this coach"}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assignedPlayers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No players are currently assigned to this coach.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignedPlayers.map((player) => (
                      <div
                        key={player.player_id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary text-white font-semibold text-sm">
                            {player.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{player.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {player.category} - Age {player.age}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="text-sm">
                            {player.attendance}% Attendance
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Schedule</CardTitle>
                <CardDescription>Manage your training sessions</CardDescription>
              </div>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  resetForm();
                  setIsScheduleDialogOpen(true);
                }}
                disabled={isSubmitting}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Schedule
              </Button>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No training sessions scheduled yet. Click "Add Schedule" to
                  create one.
                </div>
              ) : (
                <div className="space-y-3">
                  {schedules.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{session.time}</p>
                          <p className="text-sm text-muted-foreground">
                            {session.group} @ {session.location} ({session.day})
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            session.status === "Upcoming"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {session.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditScheduleClick(session)}
                          disabled={isSubmitting}
                        >
                          <Pencil className="h-4 w-4 text-primary" />
                        </Button>
                        <button
                          className="btn-ghost btn-icon"
                          onClick={() => handleDeleteSchedule(session.id)}
                          disabled={isSubmitting}
                          title="Delete schedule"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog
        open={isScheduleDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetForm();
          }
          setIsScheduleDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[425px] bg-card">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Training Session" : "Add New Training Session"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modify the schedule details below."
                : "Create a recurring schedule for this coach."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="day">Day of Week</Label>
              <Select
                value={newSchedule.day}
                onValueChange={(value) =>
                  setNewSchedule({ ...newSchedule, day: value })
                }
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {weekdays.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Select
                  value={newSchedule.startTime}
                  onValueChange={(value) =>
                    setNewSchedule({ ...newSchedule, startTime: value })
                  }
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Start" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50 max-h-48 overflow-y-auto">
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Select
                  value={newSchedule.endTime}
                  onValueChange={(value) =>
                    setNewSchedule({ ...newSchedule, endTime: value })
                  }
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="End" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50 max-h-48 overflow-y-auto">
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group">Group/Category</Label>
              <Input
                id="group"
                placeholder="e.g., U14 Advanced"
                value={newSchedule.group}
                onChange={(e) =>
                  setNewSchedule({ ...newSchedule, group: e.target.value })
                }
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Field A"
                value={newSchedule.location}
                onChange={(e) =>
                  setNewSchedule({ ...newSchedule, location: e.target.value })
                }
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={newSchedule.status}
                onValueChange={(value) =>
                  setNewSchedule({ ...newSchedule, status: value })
                }
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="Upcoming">Upcoming</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetForm}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveSchedule} disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : isEditing
                ? "Save Changes"
                : "Add Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoachDetails;
