import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Users,
  Calendar as CalendarIcon,
  Clock,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Plus,
  Trash2,
  Pencil,
  IndianRupee,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

const CATEGORY_COLORS = {
  "U12 Beginners": "#1A9CFF",
  "U13 Intermediate": "#007acc",
  "U14 Advanced": "#005fa3",
  Unknown: "hsl(215, 20%, 55%)",
};

const ATTENDANCE_RANGES = {
  High: { min: 80.01, max: 100, color: "#1A9CFF" },
  Medium: { min: 50.01, max: 80, color: "#60bfff" },
  Low: { min: 0, max: 50, color: "#b3e0ff" },
};

const CoachDetails = () => {
  const { coachId } = useParams();
  const navigate = useNavigate();

  const [coachData, setCoachData] = useState(null);
  const [assignedPlayers, setAssignedPlayers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
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

  // Helper to map API session data to UI format
  const formatSessions = (sessions) => {
    if (!Array.isArray(sessions)) return [];
    return sessions.map((s, index) => ({
      id: s.session_id || `s-${index}`,
      time: `${s.start_time} - ${s.end_time}`,
      group: s.group_category,
      location: s.location,
      status: s.status,
      day: s.day_of_week,
      startTime: s.start_time,
      endTime: s.end_time,
    }));
  };

  useEffect(() => {
    const loadAllData = async () => {
      if (!coachId) return;
      setIsLoading(true);
      try {
        const [coachDetails, playersList, sessions] = await Promise.all([
          getCoachDetails(coachId),
          getCoachPlayers(coachId), 
          fetchSessionData(coachId),
        ]);

        if (coachDetails) setCoachData(coachDetails);

        if (Array.isArray(playersList)) {
          setAssignedPlayers(
            playersList.map((p, idx) => ({
              player_id: p.player_id || p.id || `p-${idx}`,
              name: p.name || p.player_name || "Unknown",
              age: p.age || p.player_age || null,
              active: !!p.active,
              attendance: p.attendance_percentage || p.attendance || 0,
              category:
                p.category || p.group || p.group_category || p.category_name || p.class || "General",
            }))
          );
        }
        setSchedules(formatSessions(sessions));
      } catch (err) {
        console.error("Error fetching coach players data:", err);
        toast({
          title: "Error loading data",
          description: "Failed to fetch coach or player details.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, [coachId]);

  const attendanceDistributionData = useMemo(() => {
    const distribution = { High: 0, Medium: 0, Low: 0 };
    assignedPlayers.forEach((player) => {
      const percentage = parseFloat(player.attendance) || 0;
      if (percentage > 80) distribution.High++;
      else if (percentage > 50) distribution.Medium++;
      else distribution.Low++;
    });

    return [
      {
        name: "High (>80%)",
        value: distribution.High,
        color: ATTENDANCE_RANGES.High.color,
      },
      {
        name: "Medium (50-80%)",
        value: distribution.Medium,
        color: ATTENDANCE_RANGES.Medium.color,
      },
      {
        name: "Low (<50%)",
        value: distribution.Low,
        color: ATTENDANCE_RANGES.Low.color,
      },
    ].filter((d) => d.value > 0);
  }, [assignedPlayers]);

  const playersByCategoryChartData = useMemo(() => {
    const categoryCounts = assignedPlayers.reduce((acc, player) => {
      const category = player.category || "Unknown";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(categoryCounts).map((category) => ({
      category: category,
      students: categoryCounts[category],
      color: CATEGORY_COLORS[category] || CATEGORY_COLORS["Unknown"],
    }));
  }, [assignedPlayers]);

  const categoryDetails = useMemo(() => {
    return assignedPlayers.reduce((acc, p) => {
      const cat = p.category || "General";
      if (!acc[cat]) acc[cat] = { count: 0, names: [] };
      acc[cat].count += 1;
      acc[cat].names.push(p.name || "Unknown");
      return acc;
    }, {});
  }, [assignedPlayers]);

  const handleSaveSchedule = async () => {
    if (!newSchedule.day || !newSchedule.startTime || !newSchedule.endTime) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const sessionData = {
      coach_id: coachId,
      coach_name: coachData?.coach_name || "Unknown Coach",
      day_of_week: newSchedule.day,
      start_time: newSchedule.startTime,
      end_time: newSchedule.endTime,
      group_category: newSchedule.group,
      location: newSchedule.location,
      status: newSchedule.status,
      active: true,
    };

    try {
      if (isEditing) {
        await updateSession(editingScheduleId, sessionData);
        toast({ title: "Schedule Updated ✅" });
      } else {
        await insertSessionData(sessionData);
        toast({ title: "Schedule Added ✨" });
      }

      const updatedSessions = await fetchSessionData(coachId);
      setSchedules(formatSessions(updatedSessions));
      setIsScheduleDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("API Save Error:", error);
      toast({
        title: "Save Failed",
        description:
          error.response?.data?.message || "Internal Server Error (500)",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm("Delete this session?")) return;
    try {
      await deleteSession(id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Session Deleted" });
    } catch (e) {
      toast({ title: "Delete Failed", variant: "destructive" });
    }
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
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen text-[#1A9CFF] font-bold">
        Loading dashboard...
      </div>
    );

  return (
    <div className="p-0 max-w-8xl mx-auto space-y-9 pb-10">
      <div className="w-full flex items-center gap-6 p-6 shadow-lg shadow-blue-500/20 rounded-xl bg-[#1A9CFF]">
        <Button
          variant="secondary"
          className="text-[#1A9CFF] bg-white hover:bg-white/90 font-semibold"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex-grow">
          <h1 className="text-white text-2xl font-bold">
            {coachData?.coach_name} Dashboard
          </h1>
          <p className="text-white/80 font-medium">Coach ID: {coachId}</p>
        </div>

        <Badge className="bg-white/20 text-white border-none px-4 py-2 uppercase tracking-wide">
          {coachData?.status || "Active"}
        </Badge>
      </div>

      {/* Coach Info Card */}
      <Card className="mt-8 mb-8 border-none shadow-md overflow-hidden">
        <div className="bg-[#1A9CFF]/10 px-6 py-3 border-b border-[#1A9CFF]/20">
          <h3 className="font-bold text-[#1A9CFF]">Coachs Details</h3>
        </div>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Mail className="text-[#1A9CFF] h-5 w-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs text-muted-foreground font-semibold">
                Email
              </p>
              <p className="text-sm truncate" title={coachData?.email}>
                {coachData?.email || "No email"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Phone className="text-[#1A9CFF] h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">
                Phone
              </p>
              <p className="text-sm">
                {coachData?.phone_numbers || "No phone"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <MapPin className="text-[#1A9CFF] h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">
                Location
              </p>
              <p className="text-sm">
                {coachData?.address ||
                  coachData?.location ||
                  coachData?.city ||
                  "Location not provided"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <IndianRupee className="text-[#1A9CFF] h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">
                Monthly Salary
              </p>
              <p className="font-bold text-[#1A9CFF]">
                ₹{coachData?.salary || 0}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <IndianRupee className="text-[#1A9CFF] h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">
                Session Rate
              </p>
              <p className="font-bold text-[#1A9CFF]">
                ₹{coachData?.week_salary || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="players">
        <TabsList className="grid w-full grid-cols-2 bg-blue-50 p-1">
          <TabsTrigger
            value="players"
            className="data-[state=active]:bg-[#1A9CFF] data-[state=active]:text-white"
          >
            <Users className="h-4 w-4 mr-2" /> Assigned Students (
            {assignedPlayers.length})
          </TabsTrigger>
          <TabsTrigger
            value="schedule"
            className="data-[state=active]:bg-[#1A9CFF] data-[state=active]:text-white"
          >
            <CalendarIcon className="h-4 w-4 mr-2" /> Training Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Category Split</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                  {assignedPlayers.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={playersByCategoryChartData}
                        layout="vertical"
                      >
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="category"
                          type="category"
                          width={100}
                          fontSize={10}
                        />
                        <Tooltip />
                        <Bar dataKey="students" radius={[0, 4, 4, 0]}>
                          {playersByCategoryChartData.map((e, i) => (
                            <Cell key={i} fill={e.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      No player data
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Attendance Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  {assignedPlayers.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={attendanceDistributionData}
                          innerRadius={60}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {attendanceDistributionData.map((e, i) => (
                            <Cell key={i} fill={e.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      No attendance records
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Assigned Students</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {assignedPlayers.length > 0 ? (
                  assignedPlayers.map((player) => (
                    <div
                      key={player.player_id}
                      className="flex items-center justify-between p-4 border rounded-xl hover:border-[#1A9CFF]/50 transition-all bg-white shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-[#1A9CFF]/10 text-[#1A9CFF] font-bold border border-[#1A9CFF]/20">
                          {player.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {player.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {player.player_id} • Age: {player.age || "N/A"}{" "}
                            • {player.category}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-[#1A9CFF] text-[#1A9CFF] bg-[#1A9CFF]/5"
                      >
                        {player.attendance}% Attendance
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    No players assigned.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Training Sessions</CardTitle>
                <CardDescription>Weekly training slots</CardDescription>
              </div>
              <Button
                onClick={() => {
                  resetForm();
                  setIsScheduleDialogOpen(true);
                }}
                className="bg-[#1A9CFF] hover:bg-[#1A9CFF]/90"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Schedule
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {schedules.length > 0 ? (
                schedules.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-full shadow-sm text-[#1A9CFF]">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-700">
                          {session.time}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {session.group} • {session.location} ({session.day})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#1A9CFF]">{session.status}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setIsEditing(true);
                          setEditingScheduleId(session.id);
                          setNewSchedule({
                            day: session.day,
                            startTime: session.startTime,
                            endTime: session.endTime,
                            group: session.group,
                            location: session.location,
                            status: session.status,
                          });
                          setIsScheduleDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4 text-[#1A9CFF]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSchedule(session.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">
                  No sessions scheduled yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={isScheduleDialogOpen}
        onOpenChange={(open) => {
          if (!open) resetForm();
          setIsScheduleDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-[#1A9CFF]">
              {isEditing ? "Edit Session" : "New Session"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Day</Label>
              <Select
                value={newSchedule.day}
                onValueChange={(v) =>
                  setNewSchedule({ ...newSchedule, day: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Day" />
                </SelectTrigger>
                <SelectContent>
                  {weekdays.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start</Label>
                <Select
                  value={newSchedule.startTime}
                  onValueChange={(v) =>
                    setNewSchedule({ ...newSchedule, startTime: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Start" />
                  </SelectTrigger>
                  <SelectContent className="max-h-40">
                    {timeSlots.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>End</Label>
                <Select
                  value={newSchedule.endTime}
                  onValueChange={(v) =>
                    setNewSchedule({ ...newSchedule, endTime: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="End" />
                  </SelectTrigger>
                  <SelectContent className="max-h-40">
                    {timeSlots.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Group</Label>
              <Input
                placeholder="e.g. U14 Advanced"
                value={newSchedule.group}
                onChange={(e) =>
                  setNewSchedule({ ...newSchedule, group: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="e.g. Court A"
                value={newSchedule.location}
                onChange={(e) =>
                  setNewSchedule({ ...newSchedule, location: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsScheduleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#1A9CFF] hover:bg-[#1A9CFF]/90"
              onClick={handleSaveSchedule}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col overflow-hidden bg-gray-50">
        <Footer />
      </div>
    </div>
  );
};

export default CoachDetails;
