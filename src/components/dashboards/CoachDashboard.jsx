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
import Footer from "../../components/Footer";
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

    const SMS_API_KEY =
      "p4vdCWRoDUlwfyZ3hqrL1gGIeQxP2akFmA9T7uSMz6bXtJnNicV1oPuNiCUZwzLmsbH5phOvTY3Bgxd6";

    if (!coachIdToSend || !token) {
      toast({
        title: "Error",
        description: "Authentication missing.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    let locationData = { lat: null, lon: null, addr: "Location not shared" };

    try {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });

        const { latitude, longitude } = position.coords;
        locationData.lat = latitude;
        locationData.lon = longitude;

        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          locationData.addr = geoData.display_name || "Address not found";
        }
      } catch (locErr) {
        console.warn("Location capture failed:", locErr.message);
      }

      const promises = assignedPlayers.map((player) => {
        const isPresent =
          (localAttendance[player.id] || "present") === "present";

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

      // Refresh records after submission
      const updatedRecords = await GetAttendanceRecords(user.id);
      setRecords(
        Array.isArray(updatedRecords)
          ? updatedRecords
          : updatedRecords?.records || []
      );

      const presentPlayersPhoneNumbers = assignedPlayers
        .filter(
          (p) => (localAttendance[p.id] || "present") === "present" && p.phone
        )
        .map((p) => p.phone)
        .join(",");

      if (presentPlayersPhoneNumbers) {
        try {
          const message = `Attendance recorded for ${dateString}. Your child was present for the session.`;
          const encodedMessage = encodeURIComponent(message);
          const smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${SMS_API_KEY}&route=q&numbers=${presentPlayersPhoneNumbers}&message=${encodedMessage}`;

          await fetch(smsUrl, { method: "GET" });
        } catch (smsErr) {
          console.error("SMS Gateway Error:", smsErr);
        }
      }

      toast({
        title: "Success",
        description: "Attendance saved and notifications sent!",
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

  const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? null : format(parsed, "yyyy-MM-dd");
    } catch {
      return null;
    }
  };

  // FIXED: Normalized "Marked By" logic to handle multiple possible field names from API
  const allRecordsUnified = useMemo(() => {
    return records.map((r) => ({
      id: r.id || `${r.player_id}-${r.attendance_date}`,
      name: r.player_name || r.name || "Unknown Player",
      date: normalizeDate(r.attendance_date || r.date),
      status: r.attendance_status || (r.is_present ? "Present" : "Absent"),
      markedBy:
        r.recorded_by_coach_name ||
        r.coach_name ||
        r.marked_by ||
        user?.name ||
        "Coach",
      time: r.created_at || r.created_time || "—",
    }));
  }, [records, user?.name]);

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
        setIsLoadingPlayers(true);
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
          setTodaysSchedule(processed.todaysSchedule);
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoadingRecords(false);
          setIsLoadingPlayers(false);
          setIsLoadingSchedule(false);
        }
      };
      loadData();
    }
  }, [user?.id, token]);

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
    <div className="space-y-6 pb-10">
      <div className="w-full bg-[#1A9CFF] animate-fade-in p-6 flex items-center justify-between border-b border-white/10 shadow-none">
        <div className="flex-grow">
          <h1 className="text-white/90 text-sm font-medium uppercase tracking-wider">
            Coach Dashboard
          </h1>
          <p className="text-white text-2xl mt-1">
            Welcome back,{" "}
            <span className="font-bold">{user?.name || "Coach"}</span>
          </p>
        </div>

        <div className="ml-8 text-right self-center">
          <div className="text-sm text-white/80 space-y-1">
            <p className="font-semibold flex items-center justify-end gap-2">
              <span className="opacity-70 font-normal">Email:</span>{" "}
              {user?.email || "—"}
            </p>

            <Button
              variant="secondary"
              className="ml-7 bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        <Card className="group relative overflow-hidden border-none bg-white rounded-2xl transition-all duration-300 shadow-md hover:-translate-y-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight">
                  {isLoadingPlayers ? "..." : assignedPlayers.length}
                </p>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Assigned students
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-none bg-white rounded-2xl transition-all duration-300 shadow-md hover:-translate-y-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
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

        <Card className="group relative overflow-hidden border-none bg-white rounded-2xl transition-all duration-300 shadow-md hover:-translate-y-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
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

        <Card className="group relative overflow-hidden border-none bg-white rounded-2xl transition-all duration-300 shadow-md hover:-translate-y-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
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

      <Tabs defaultValue="players" className="space-y-4 px-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="players">Assigned Students</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assigned Students
              </CardTitle>
              <CardDescription>
                Manage your assigned students and track their progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPlayers ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading students...
                </div>
              ) : assignedPlayers.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No students assigned.
                </div>
              ) : (
                <div className="space-y-3">
                  {assignedPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: "#1A9CFF" }}
                        >
                          {player.name ? player.name.charAt(0) : "?"}
                        </div>
                        <div>
                          <p className="font-medium">
                            {player.name || "Unnamed Player"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {player.id || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {player.attendance || 0}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Attendance
                          </p>
                        </div>
                        <Badge
                          variant={
                            player.status === "Active" ? "default" : "secondary"
                          }
                          className={
                            player.status === "Active"
                              ? "bg-[#1A9CFF] hover:bg-[#1580d1]"
                              : ""
                          }
                        >
                          {player.status || "Unknown"}
                        </Badge>
                      </div>
                    </div>
                  ))}
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
                  <div className="p-2.5 rounded-xl bg-[#1A9CFF]">
                    <ClipboardList className="h-5 w-5 text-white" />
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
                    </SelectContent>
                  </Select>

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
                    className="gap-2 border-[#1A9CFF] text-[#1A9CFF] hover:bg-[#1A9CFF] hover:text-white"
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
                      <TableHead>Student</TableHead>
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
                      paginatedRecords.map((record) => {
                        let statusClass =
                          record.status === "Present"
                            ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                            : "text-red-600 bg-red-50 border-red-200";

                        return (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">
                              {record.name}
                            </TableCell>
                            <TableCell>{formatDate(record.date)}</TableCell>
                            <TableCell>
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusClass}`}
                              >
                                {record.status}
                              </span>
                            </TableCell>
                            <TableCell>{record.markedBy}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {formatTime(record.time)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {indexOfFirstRecord + 1} to{" "}
                    {Math.min(indexOfLastRecord, filteredRecords.length)} of{" "}
                    {filteredRecords.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(p + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
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
                  Mark Student attendance for the selected date:- &nbsp;
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
                          {/* Changed to #1A9CFF */}
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                            style={{ backgroundColor: "#1A9CFF" }}
                          >
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
                            {/* Updated Toggle Colors: peer-checked:bg-[#1A9CFF] and focus ring */}
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-[#1A9CFF]/30 dark:peer-focus:ring-[#1A9CFF]/50 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#1A9CFF]"></div>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Updated Button Background to #1A9CFF */}
                <Button
                  className="w-full mt-4 text-white hover:opacity-90"
                  style={{ backgroundColor: "#1A9CFF" }}
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
              <CardContent className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border p-3"
                  // Style logic to apply the specific Blue color
                  modifiersStyles={{
                    selected: {
                      backgroundColor: "#1A9CFF",
                      color: "white",
                      borderRadius: "50%", // Ensures it is a circle
                    },
                  }}
                  // Tailwind logic to fix the box shape and selection circle
                  classNames={{
                    day_selected:
                      "bg-[#1A9CFF] text-white hover:bg-[#1A9CFF] focus:bg-[#1A9CFF] rounded-full w-9 h-9 flex items-center justify-center p-0",
                    day_today: "bg-accent text-accent-foreground rounded-full",
                    day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:rounded-full",
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      <Footer />
    </div>
  );
};

export default CoachDashboard;
