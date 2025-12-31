import React, { useState, useEffect, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Schedule from "../../pages/Schedule";
import {
  Users,
  Calendar as CalendarIcon,
  LogOut,
  CheckCircle,
  UserCheck,
  Target,
  ClipboardList,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  fetchCoachAssignedPlayers,
  recordAttendance,
  fetchSessionData,
  GetAttendanceRecords,
} from "../../../api";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { format } from "date-fns";

const processScheduleData = (sessions) => {
  if (!Array.isArray(sessions) || sessions.length === 0)
    return { todaysSchedule: [], weeklySchedule: [] };

  const today = new Date();
  const todayDayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" });

  const todaysSchedule = sessions
    .filter((s) => s.day_of_week === todayDayOfWeek)
    .map((s) => ({
      time: `${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)}`,
      group: s.group_category,
      location: s.location || "N/A",
      status: s.status || "Scheduled",
    }));

  const daysOrder = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const groupedByDay = sessions.reduce((acc, session) => {
    const day = session.day_of_week;
    if (!day) return acc;

    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(
      `${session.start_time.substring(0, 5)} - ${session.end_time.substring(
        0,
        5
      )} (${session.group_category})`
    );
    return acc;
  }, {});

  const weeklySchedule = daysOrder
    .filter((day) => groupedByDay[day] && groupedByDay[day].length > 0)
    .map((day) => ({
      day: day,
      sessions: groupedByDay[day],
    }));

  return { todaysSchedule, weeklySchedule };
};

const CoachDashboard = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { user, session, isLoading: isAuthLoading, logout } = useAuth();
  const [assignedPlayers, setAssignedPlayers] = useState([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [schedule, setSchedule] = useState({ today: [], weekly: [] });
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [localAttendance, setLocalAttendance] = useState({});
  const [todaysSchedule, setTodaysSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const token = session?.accessToken;

  // Attendance records state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [records, setRecords] = useState([]);
  const [mockAttendanceRecords, setMockAttendanceRecords] = useState([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 8;

  const handleAttendanceChange = (playerId, status) => {
    setLocalAttendance((prev) => ({ ...prev, [playerId]: status }));
  };

  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleSubmitAttendance = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const dateString = format(selectedDate, "yyyy-MM-dd");
    const coachIdToSend = user?.id;
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (!coachIdToSend || !token) {
      toast({
        title: "Error",
        description: "Authentication missing.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Initialize with nulls to ensure the keys exist
    let locationData = { lat: null, lon: null, addr: "Location not shared" };

    try {
      // Wrap geolocation in a try-catch to ensure we still submit attendance even if GPS fails
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000, // Increased to 10s for better reliability
          });
        });

        const { latitude, longitude } = position.coords;
        locationData.lat = latitude;
        locationData.lon = longitude;

        // Reverse Geocode
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          locationData.addr = geoData.display_name || "Address not found";
        }
      } catch (locErr) {
        console.warn("Location capture failed or timed out:", locErr.message);
      }

      // Map through players and call recordAttendance
      const promises = assignedPlayers.map((player) => {
        const isPresent =
          (localAttendance[player.id] || "present") === "present";

        // Explicitly pass the gathered location data
        return recordAttendance(
          {
            playerId: player.id,
            attendanceDate: dateString,
            isPresent,
            coachId: coachIdToSend,
            latitude: locationData.lat,
            longitude: locationData.lon,
            locationAddress: locationData.addr,
            timezone: userTimeZone,
          },
          token
        );
      });

      await Promise.all(promises);
      toast({
        title: "Success",
        description: "Attendance and location saved!",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = () => {
    logout();
    navigate("/auth");
  };

  // Logic for filtering and data normalization
  const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? null : format(parsed, "yyyy-MM-dd");
    } catch {
      return null;
    }
  };

  const allRecordsUnified = useMemo(() => {
    return records.map((r) => ({
      id: r.id || `${r.player_id}-${r.attendance_date}`,
      name: r.player_name || r.name || "Unknown Player",
      date: normalizeDate(r.attendance_date || r.date),
      status: r.attendance_status || (r.is_present ? "Present" : "Absent"),
      markedBy: r.recorded_by_coach_name || r.marked_by || "Coach",
      time: r.created_at || r.created_time || "—",
    }));
  }, [records]);

  const filteredRecords = useMemo(() => {
    return allRecordsUnified.filter((r) => {
      const matchesSearch = r.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || r.status === filterStatus;
      const matchesDate = filterDate === "all" || r.date === filterDate;
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [allRecordsUnified, searchTerm, filterStatus, filterDate]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const paginatedRecords = filteredRecords.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );

  const uniqueDates = useMemo(() => {
    const dates = Array.from(
      new Set(allRecordsUnified.map((r) => r.date).filter(Boolean))
    );
    return dates.sort((a, b) => b.localeCompare(a));
  }, [allRecordsUnified]);

  const averageAttendance = useMemo(() => {
    if (!assignedPlayers.length) return 0;
    const total = assignedPlayers.reduce(
      (sum, p) => sum + (parseFloat(p.attendance) || 0),
      0
    );
    return Math.round(total / assignedPlayers.length);
  }, [assignedPlayers]);

  useEffect(() => {
    if (user?.id && token) {
      const loadData = async () => {
        setIsLoadingRecords(true);
        try {
          const data = await GetAttendanceRecords(user.id);
          setRecords(Array.isArray(data) ? data : data?.records || []);
          const players = await fetchCoachAssignedPlayers(token);
          setAssignedPlayers(players || []);
          const scheduleData = await fetchSessionData(user.id, token);
          const processed = processScheduleData(scheduleData);
          setSchedule({
            today: processed.todaysSchedule,
            weekly: processed.weeklySchedule,
          });
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoadingRecords(false);
          setIsLoadingSchedule(false);
        }
      };
      loadData();
    }
  }, [user?.id, token]);

  const getStatusBadge = (status) => (
    <Badge variant={status === "Present" ? "default" : "secondary"}>
      {status}
    </Badge>
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? dateStr : format(parsed, "MMM dd, yyyy");
  };

  const formatTime = (timeStr) => {
    if (!timeStr || timeStr === "—") return "—";
    try {
      const parsed = new Date(timeStr);
      return isNaN(parsed.getTime()) ? timeStr : format(parsed, "hh:mm a");
    } catch {
      return timeStr;
    }
  };

  const handleExport = () => {
    const rows = [
      ["Player", "Date", "Status", "Marked By"],
      ...filteredRecords.map((r) => [r.name, r.date, r.status, r.markedBy]),
    ];
    const csvContent = rows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance.csv";
    a.click();
  };

  if (isAuthLoading)
    return <div className="p-10 text-center">Loading session...</div>;
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="gradient-header w-full flex items-center gap-6 p-6 shadow-lg shadow-glow animate-fade-in rounded-xl">
        <div className="flex-grow">
          <h1 className="text-primary-foreground/80">Coach Dashboard</h1>
          <p className="text-primary-foreground/80">
            Welcome back,{" "}
            <span className="font-semibold">{user?.name || "Coach"}</span>
          </p>
        </div>

        <div className="ml-8 text-right self-center">
          <div className="mt-2 text-sm text-primary-foreground/70 space-y-1">
            <p className="font-bold">Email: {user?.email || "—"}</p>
            <p>Role: {user?.role || "—"}</p>
          </div>
        </div>

        {/* <Button
          variant="secondary"
          className="ml-7 bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button> */}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Assigned Players */}
        <Card className="group relative overflow-hidden border-none bg-white rounded-2xl transition-all duration-300 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] hover:-translate-y-2">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight">
                  {isLoadingPlayers ? "..." : assignedPlayers.length}
                </p>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Assigned Players
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Today's Sessions */}
        <Card className="group relative overflow-hidden border-none bg-white rounded-2xl transition-all duration-300 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] hover:-translate-y-2">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform duration-300">
                <CalendarIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight">
                  {isLoadingSchedule ? "..." : todaysSchedule.length}
                </p>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Today's Sessions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Completed Today */}
        <Card className="group relative overflow-hidden border-none bg-white rounded-2xl transition-all duration-300 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] hover:-translate-y-2">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight">
                  {isLoadingSchedule
                    ? "..."
                    : todaysSchedule.filter((s) => s.status === "Completed")
                        .length}
                </p>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Completed Today
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Avg Attendance */}
        <Card className="group relative overflow-hidden border-none bg-white rounded-2xl transition-all duration-300 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] hover:-translate-y-2">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform duration-300">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight">
                  {averageAttendance}%
                </p>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Avg Attendance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="players" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="players">Assigned Players</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assigned Players
              </CardTitle>
              <CardDescription>
                Manage your assigned players and track their progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPlayers ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading players...
                </div>
              ) : assignedPlayers.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No players assigned to coach {user.email} or failed to fetch.
                </div>
              ) : (
                <div className="space-y-3">
                  {assignedPlayers.map((player) => {
                    return (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-4 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                            {player.name ? player.name.charAt(0) : "?"}
                          </div>
                          <div>
                            <p className="font-medium">
                              {player.name || "Unnamed Player"}
                            </p>
                            <p className="text-xs text-muted-foreground mb-1">
                              ID: {player.id || "—"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Age {player.age ?? "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {typeof player.attendance === "number"
                                ? `${player.attendance}%`
                                : player.attendance
                                ? `${player.attendance}%`
                                : "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Attendance
                            </p>
                          </div>
                          <Badge
                            variant={
                              player.status === "Active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {player.status || "Unknown"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="schedule" className="space-y-4">
          <Schedule />
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <Card className="shadow-sm border-0">
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary">
                    <ClipboardList className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      Attendance Records
                    </CardTitle>
                    <CardDescription>
                      View and manage attendance history
                    </CardDescription>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search players..."
                      value={searchTerm}
                      onChange={(e) =>
                        handleFilterChange(setSearchTerm, e.target.value)
                      }
                      className="pl-10 w-full sm:w-[180px]"
                    />
                  </div>

                  <Select
                    value={filterStatus}
                    onValueChange={(v) =>
                      handleFilterChange(setFilterStatus, v)
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[120px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Present">Present</SelectItem>
                      <SelectItem value="Absent">Absent</SelectItem>
                      <SelectItem value="Late">Late</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filterDate}
                    onValueChange={(v) => handleFilterChange(setFilterDate, v)}
                  >
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue placeholder="Date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      {uniqueDates.map((date) => (
                        <SelectItem key={date} value={date}>
                          {format(new Date(date), "MMM dd, yyyy")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={handleExport}
                    variant="outline"
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Marked By</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingRecords ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : paginatedRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10">
                          No records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {record.name}
                          </TableCell>
                          <TableCell>
                            {formatDate(record.date || record.attendance_date)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(
                              record.status || record.attendance_status
                            )}
                          </TableCell>
                          <TableCell>
                            {record.markedBy || record.coach_name}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {formatTime(record.time || record.created_time)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium">{indexOfFirstRecord + 1}</span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(indexOfLastRecord, filteredRecords.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">{filteredRecords.length}</span>{" "}
                  records
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm font-medium">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Mark Attendance
                </CardTitle>
                <CardDescription>
                  Mark players' attendance for the selected date:- &nbsp;
                  {selectedDate.toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-scroll pr-2">
                  {assignedPlayers.map((player) => {
                    const isPresent =
                      (localAttendance[player.id] || "present") === "present";

                    return (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                            {player.name ? player.name.charAt(0) : "?"}
                          </div>
                          <span className="font-medium">
                            {player.name || "Unnamed"}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span
                            className={`font-medium min-w-[55px] text-right ${
                              isPresent ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {isPresent ? "Present" : "Absent"}
                          </span>

                          <label
                            htmlFor={`attendance-switch-${player.id}`}
                            className="relative inline-flex items-center cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              id={`attendance-switch-${player.id}`}
                              className="sr-only peer"
                              checked={isPresent}
                              onChange={(e) => {
                                const newStatus = e.target.checked
                                  ? "present"
                                  : "absent";
                                handleAttendanceChange(player.id, newStatus);
                              }}
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button
                  className="w-full mt-4"
                  onClick={handleSubmitAttendance}
                  disabled={isSubmitting || assignedPlayers.length === 0}
                >
                  {isSubmitting ? "Submitting..." : "Submit Attendance"}
                </Button>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>
                  Select date to view/mark attendance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const StatCard = ({ icon, label, value }) => (
  <Card className="shadow-sm">
    <CardContent className="p-4 flex items-center gap-3">
      <div className="text-primary">{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

export default CoachDashboard;
