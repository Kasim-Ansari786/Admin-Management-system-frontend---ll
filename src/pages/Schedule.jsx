import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  addScheduleEvent,
  GetScheduleRecords,
  updateScheduleEvent,
  deleteScheduleEvent,
  fetchSessionData,
} from "../../api";
import { useAuth } from "@/contexts/AuthContext";

const eventTypeColors = {
  training: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  match: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  meeting: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  tournament: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const eventTypeBgColors = {
  training: "border-l-blue-500",
  match: "border-l-emerald-500",
  meeting: "border-l-amber-500",
  tournament: "border-l-purple-500",
};

const eventTypeDotColors = {
  training: "bg-blue-500",
  match: "bg-emerald-500",
  meeting: "bg-amber-500",
  tournament: "bg-purple-500",
};

const eventTypeGlowColors = {
  training: "shadow-blue-500/30",
  match: "shadow-emerald-500/30",
  meeting: "shadow-amber-500/30",
  tournament: "shadow-purple-500/30",
};

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function Schedule() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState("calendar");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [upcomingsession, setUpcomingsession] = useState([]);

  // Form states for add/edit
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    date: "",
    time: "",
    duration: "",
    location: "",
    team: "",
    description: "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      type: "",
      date: "",
      time: "",
      duration: "",
      location: "",
      team: "",
      description: "",
    });
  };

  const openEditDialog = (event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      type: event.type,
      date: event.date,
      time: event.time,
      duration: event.duration,
      location: event.location,
      team: event.team,
      description: event.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (event) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await fetchEvents();
      setEvents(data);
    } catch (error) {
      console.error("Failed to load events", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    if (!user?.tenant_id || !user?.id) return;

    try {
      setIsLoading(true);
      const data = await GetScheduleRecords(user.tenant_id, user.id);
      const mappedData = (Array.isArray(data) ? data : []).map((event) => ({
        ...event,
        type: event.event_type,
        date: (event.event_date || "").split("T")[0],
        time: event.event_time,
      }));

      setEvents(mappedData);
    } catch (error) {
      toast.error("Could not load schedule");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [user]);

  useEffect(() => {
    const getSessions = async () => {
      const coachId = user?.id;
      if (!coachId) return;

      try {
        setLoading(true);
        const data = await fetchSessionData(coachId);
        const formattedData = Array.isArray(data)
          ? data.map((session) => ({
              id: session.session_id,
              title: `${session.group_category} Training`,
              date: session.day_of_week,
              time: session.start_time,
              location: session.location,
              type: session.group_category || "Default",
            }))
          : [];

        setUpcomingsession(formattedData);
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    getSessions();
  }, [user?.id]);

  const handleAddEvent = async () => {
    if (!formData.title || !formData.type || !formData.date || !formData.time) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const eventPayload = {
        tenant_id: user?.tenant_id || 1,
        title: formData.title,
        event_type: formData.type,
        event_date: formData.date,
        event_time: formData.time,
        duration: formData.duration || "1h",
        location: formData.location || "TBD",
        team: formData.team || "All Teams",
        description: formData.description,
      };

      const savedEvent = await addScheduleEvent(eventPayload);
      setEvents((prevEvents) => [...prevEvents, savedEvent]);
      toast.success("Event added successfully to database");
      setIsAddDialogOpen(false);
      resetForm();
      loadEvents();
    } catch (error) {
      console.error("Failed to add event:", error);
      toast.error(error.message || "Failed to save event. Please try again.");
    }
    setTimeout(() => {
      window.location.reload(true);
    }, 20000);
  };

  const handleEditEvent = async () => {
    if (
      !selectedEvent ||
      !formData.title ||
      !formData.type ||
      !formData.date ||
      !formData.time
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const storedUser = (() => {
        try {
          return JSON.parse(localStorage.getItem("user") || "null");
        } catch (e) {
          return null;
        }
      })();

      const tenantId =
        user?.tenant_id ||
        storedUser?.tenant_id ||
        storedUser?.id ||
        user?.id ||
        null;

      if (!tenantId) {
        toast.error(
          "Cannot update event: missing tenant information. Please sign out and sign in again."
        );
        return;
      }

      if (!selectedEvent || !selectedEvent.id) {
        toast.error("Cannot update event: invalid event selected.");
        return;
      }

      const updatePayload = {
        title: formData.title,
        event_type: formData.type,
        team: formData.team || "All Teams",
        event_date: formData.date,
        event_time: formData.time,
        duration: formData.duration || "1h",
        location: formData.location || "TBD",
        description: formData.description,
        tenant_id: tenantId,
      };

      await updateScheduleEvent(selectedEvent.id, updatePayload);
      await fetchSchedule();
      toast.success("Event updated successfully");
      setIsEditDialogOpen(false);
      setSelectedEvent(null);
      resetForm();
    } catch (error) {
      console.error("Update failed:", error);
      toast.error(error.message || "Failed to update event");
    }
    setTimeout(() => {
      window.location.reload(true);
    }, 20000);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getEventsForDate = (date) => {
    return events.filter((event) => event.date === date);
  };

  const formatDate = (day) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) {
      toast.error("No event selected to delete.");
      return;
    }

    const storedUser = (() => {
      try {
        return JSON.parse(localStorage.getItem("user") || "null");
      } catch (e) {
        return null;
      }
    })();

    const tenantId =
      user?.tenant_id ||
      storedUser?.tenant_id ||
      storedUser?.id ||
      user?.id ||
      null;

    if (!tenantId) {
      toast.error(
        "Cannot delete event: missing tenant information. Please sign out and sign in again."
      );
      return;
    }

    try {
      await deleteScheduleEvent(selectedEvent.id, tenantId);
      await fetchSchedule();
      toast.success("Event deleted successfully");
      setIsDeleteDialogOpen(false);
      // window.location.reload(true);
      setSelectedEvent(null);
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(error.message || "Failed to delete event");
    }
    setTimeout(() => {
      window.location.reload(true);
    }, 20000);
  };

  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="space-y-5">
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Schedule</h1>
            <p className="text-muted-foreground mt-1">
              Manage training sessions, matches, and events
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-card rounded-lg border border-border p-1">
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("calendar")}
              >
                Calendar
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                List
              </Button>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Add New Event</DialogTitle>
                  <DialogDescription>
                    Create a new event for your schedule.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Event Title *</Label>
                    <Input
                      placeholder="Enter event title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Event Type *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) =>
                          setFormData({ ...formData, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="training">Training</SelectItem>
                          <SelectItem value="match">Match</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="tournament">Tournament</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Team</Label>
                      <Select
                        value={formData.team}
                        onValueChange={(value) =>
                          setFormData({ ...formData, team: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Team Alpha">Team Alpha</SelectItem>
                          <SelectItem value="Team Beta">Team Beta</SelectItem>
                          <SelectItem value="Team Gamma">Team Gamma</SelectItem>
                          <SelectItem value="All Teams">All Teams</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Date *</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Time *</Label>
                      <Input
                        type="time"
                        value={formData.time}
                        onChange={(e) =>
                          setFormData({ ...formData, time: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input
                        placeholder="e.g., 2h"
                        value={formData.duration}
                        onChange={(e) =>
                          setFormData({ ...formData, duration: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      placeholder="Enter location"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Textarea
                      placeholder="Enter event description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddEvent}>Add Event</Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog
              open={isEditDialogOpen}
              onOpenChange={(open) => {
                setIsEditDialogOpen(open);
                if (!open) {
                  setSelectedEvent(null);
                  resetForm();
                }
              }}
            >
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Edit Event</DialogTitle>
                  <DialogDescription>
                    Update the event details.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Event Title *</Label>
                    <Input
                      placeholder="Enter event title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Event Type *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="training">Training</SelectItem>
                          <SelectItem value="match">Match</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="tournament">Tournament</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Team</Label>
                      <Select
                        value={formData.team}
                        onValueChange={(value) =>
                          setFormData({ ...formData, team: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Team Alpha">Team Alpha</SelectItem>
                          <SelectItem value="Team Beta">Team Beta</SelectItem>
                          <SelectItem value="Team Gamma">Team Gamma</SelectItem>
                          <SelectItem value="All Teams">All Teams</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Date *</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Time *</Label>
                      <Input
                        type="time"
                        value={formData.time}
                        onChange={(e) =>
                          setFormData({ ...formData, time: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input
                        placeholder="e.g., 2h"
                        value={formData.duration}
                        onChange={(e) =>
                          setFormData({ ...formData, duration: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      placeholder="Enter location"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Textarea
                      placeholder="Enter event description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditDialogOpen(false);
                        setSelectedEvent(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleEditEvent}>Save Changes</Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>

            <AlertDialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Event</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{selectedEvent?.title}"?
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setSelectedEvent(null)}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteEvent}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 p-3 bg-card rounded-lg border border-border">
          {Object.entries(eventTypeDotColors).map(([type, color]) => (
            <div
              key={type}
              className="flex items-center gap-2 group cursor-pointer"
            >
              <div
                className={`w-3 h-3 rounded-full ${color} shadow-lg ${eventTypeGlowColors} group-hover:scale-125 transition-transform`}
              />
              <span className="text-sm text-muted-foreground capitalize group-hover:text-foreground transition-colors">
                {type}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {viewMode === "calendar" ? (
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    {months[month]} {year}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {daysOfWeek.map((day, idx) => (
                    <div
                      key={day}
                      className={`text-center text-sm font-semibold py-2 rounded-md ${
                        idx === 0
                          ? "text-red-400 bg-red-500/10"
                          : idx === 6
                          ? "text-orange-400 bg-orange-500/10"
                          : "text-muted-foreground"
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => {
                    const dateStr = day ? formatDate(day) : "";
                    const dayEvents = day ? getEventsForDate(dateStr) : [];
                    const isToday =
                      day && dateStr === new Date().toISOString().split("T")[0];
                    const isSelected = dateStr === selectedDate;
                    const isWeekend = index % 7 === 0 || index % 7 === 6;
                    const hasEvents = dayEvents.length > 0;

                    const dominantType =
                      dayEvents.length > 0 ? dayEvents[0].type : null;

                    return (
                      <div
                        key={index}
                        className={`min-h-28 p-1.5 rounded-xl border-2 transition-all duration-300 cursor-pointer relative overflow-hidden ${
                          day
                            ? isSelected
                              ? "border-primary bg-primary/15 shadow-lg shadow-primary/20"
                              : hasEvents
                              ? `border-border hover:border-primary/50 ${
                                  dominantType
                                    ? `bg-gradient-to-br from-transparent to-${eventTypeDotColors[
                                        dominantType
                                      ].replace("bg-", "")}/5`
                                    : ""
                                }`
                              : isWeekend
                              ? "border-border/50 bg-muted/30 hover:border-primary/50"
                              : "border-border hover:border-primary/50 hover:bg-muted/20"
                            : "border-transparent"
                        }`}
                        onClick={() => day && setSelectedDate(dateStr)}
                      >
                        {day && (
                          <>
                            {hasEvents && (
                              <div
                                className={`absolute inset-0 opacity-10 ${eventTypeDotColors}`}
                                style={{ filter: "blur(20px)" }}
                              />
                            )}

                            <div className="relative z-10">
                              <div
                                className={`text-sm font-bold mb-1.5 w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                                  isToday
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/40 animate-pulse"
                                    : isWeekend
                                    ? "text-muted-foreground"
                                    : "text-foreground"
                                }`}
                              >
                                {day}
                              </div>

                              {dayEvents.length > 0 && (
                                <div className="flex gap-0.5 mb-1 flex-wrap">
                                  {dayEvents.slice(0, 4).map((event) => (
                                    <div
                                      key={event.id}
                                      className={`w-2 h-2 rounded-full ${
                                        eventTypeDotColors[event.type]
                                      } shadow-sm`}
                                      title={event.title}
                                    />
                                  ))}
                                  {dayEvents.length > 4 && (
                                    <span className="text-[10px] text-muted-foreground ml-0.5">
                                      +{dayEvents.length - 4}
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="space-y-0.5">
                                {dayEvents.slice(0, 2).map((event) => (
                                  <div
                                    key={event.id}
                                    className={`text-[10px] px-1.5 py-0.5 rounded-md truncate font-medium border ${
                                      eventTypeColors[event.type]
                                    } backdrop-blur-sm`}
                                  >
                                    {event.title}
                                  </div>
                                ))}
                                {dayEvents.length > 2 && (
                                  <div className="text-[10px] text-primary font-medium px-1.5">
                                    +{dayEvents.length - 2} more
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  All Events
                </h2>
                {events
                  .sort(
                    (a, b) =>
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                  )
                  .map((event) => (
                    <div
                      key={event.id}
                      className={`p-4 rounded-lg border border-border border-l-4 ${
                        eventTypeBgColors[event.type]
                      } hover:bg-muted/50 transition-colors`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-foreground">
                              {event.title}
                            </h3>
                            <Badge className={eventTypeColors[event.type]}>
                              {event.type}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {event.date} at {event.event_time} (
                              {event.duration})
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {event.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {event.team}
                            </span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openEditDialog(event)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => openDeleteDialog(event)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="font-semibold text-foreground mb-4">
                Upcoming Events
              </h3>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`p-3 rounded-lg border border-border border-l-4 ${
                      eventTypeBgColors[event.type]
                    }`}
                  >
                    <h4 className="font-medium text-foreground text-sm">
                      {event.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {event.date} at {event.time}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {event.location}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedDate && (
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="font-semibold text-foreground mb-4">
                  Events on {selectedDate}
                </h3>
                <div className="space-y-3">
                  {getEventsForDate(selectedDate).length > 0 ? (
                    getEventsForDate(selectedDate).map((event) => (
                      <div
                        key={event.id}
                        className={`p-3 rounded-lg border border-border border-l-4 ${
                          eventTypeBgColors[event.type]
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground text-sm">
                            {event.title}
                          </h4>
                          <Badge
                            className={`text-xs ${eventTypeColors[event.type]}`}
                          >
                            {event.type}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {event.time} • {event.duration} • {event.location}
                        </div>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No events scheduled
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="font-semibold text-foreground mb-4">
                Schedule coach training sessions
              </h3>

              <div className="space-y-3">
                {upcomingsession.length > 0 ? (
                  upcomingsession.map((event) => (
                    <div
                      key={event.id}
                      className={`p-3 rounded-lg border border-border border-l-4 ${
                        eventTypeBgColors[event.type] ||
                        eventTypeBgColors["Default"]
                      }`}
                    >
                      <h4 className="font-medium text-foreground text-sm">
                        {event.title}
                      </h4>

                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {event.date} at {event.time}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground italic text-center py-4">
                    No sessions scheduled.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
