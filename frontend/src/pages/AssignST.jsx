import React, { useState, useEffect, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Users, UserPlus, UserCheck, UserX, Check } from "lucide-react";
// Assuming these are imports from a file that contains the API calls
import {
  GetagssignDetails,
  GetCoachDetailslist,
  AssignCoachupdated,
} from "../../api";

const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const initialTimeSlot = { startTime: "", endTime: "" };
const initialOperatingHours = weekDays.map((day) => ({
  day: day,
  status: "Enter Hours",
  slots: [{ ...initialTimeSlot }],
}));

const initialVenueForm = {
  name: "",
  centerHead: "",
  address: "",
  googleMapsUrl: "",
  operatingHours: initialOperatingHours,
};

const VENUES_PER_PAGE = 5;

export default function StaffDashboard() {
  const { toast = console.log } = useToast(); // Added fallback for toast
  const [venues, setVenues] = useState([]);
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [venueForm, setVenueForm] = useState(initialVenueForm);
  const [players, setPlayers] = useState([]);
  const [coaches, setCoaches] = useState([]);
  // `Select` expects a scalar value (string/null) when `multiple` is false.
  const [selectedCoachId, setSelectedCoachId] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [isPlayerPopoverOpen, setIsPlayerPopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermVenue, setSearchTermVenue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const playersData = await GetagssignDetails();
        // Use playersData.data which contains the array of players
        setPlayers(playersData?.data || []);
      } catch (error) {
        console.error("Failed to load players data:", error);
        toast({
          title: "Player Data Load Error",
          description: "Failed to load player data from API.",
          variant: "destructive",
        });
      }

      try {
        const coachData = await GetCoachDetailslist();
        let fetchedCoaches = [];
        if (coachData) {
          // Coach API returns data: { status: "success", count: ..., data: [...] }
          fetchedCoaches = coachData.data;
          if (!fetchedCoaches && Array.isArray(coachData)) {
            fetchedCoaches = coachData;
          }
        }
        setCoaches(fetchedCoaches || []);
      } catch (error) {
        console.error(
          "Failed to load coaches data (Possible 404 on API):",
          error
        );
        toast({
          title: "Coach Data Load Error",
          description:
            "Failed to load coach data from API. Please check the API endpoint.",
          variant: "destructive",
        });
        setCoaches([]);
      }
    };
    fetchData();
  }, []);

  // --- Venue Management Logic (Omitted for brevity, assumed correct) ---
  const handleDayStatusChange = (dayIndex, status) => {
    setVenueForm((prev) => {
      const newOperatingHours = [...prev.operatingHours];
      newOperatingHours[dayIndex].status = status;

      if (status === "Closed") {
        newOperatingHours[dayIndex].slots = [];
      } else if (
        status === "Open Day" &&
        newOperatingHours[dayIndex].slots.length === 0
      ) {
        newOperatingHours[dayIndex].slots.push({ ...initialTimeSlot });
      }

      return { ...prev, operatingHours: newOperatingHours };
    });
  };

  const handleAddTimeSlot = (dayIndex) => {
    setVenueForm((prev) => {
      const newOperatingHours = [...prev.operatingHours];
      if (newOperatingHours[dayIndex].status === "Enter Hours") {
        newOperatingHours[dayIndex].status = "Open Day";
      }
      newOperatingHours[dayIndex].slots.push({ ...initialTimeSlot });
      return { ...prev, operatingHours: newOperatingHours };
    });
  };

  const handleRemoveTimeSlot = (dayIndex, slotIndex) => {
    setVenueForm((prev) => {
      const newOperatingHours = [...prev.operatingHours];
      newOperatingHours[dayIndex].slots = newOperatingHours[
        dayIndex
      ].slots.filter((_, i) => i !== slotIndex);

      if (newOperatingHours[dayIndex].slots.length === 0) {
        newOperatingHours[dayIndex].status = "Closed";
      }

      return { ...prev, operatingHours: newOperatingHours };
    });
  };

  const handleTimeSlotChange = (dayIndex, slotIndex, field, value) => {
    setVenueForm((prev) => {
      const newOperatingHours = [...prev.operatingHours];
      if (newOperatingHours[dayIndex].slots[slotIndex]) {
        if (newOperatingHours[dayIndex].status === "Enter Hours") {
          newOperatingHours[dayIndex].status = "Open Day";
        }
        newOperatingHours[dayIndex].slots[slotIndex][field] = value;
      }
      return { ...prev, operatingHours: newOperatingHours };
    });
  };

  const handleSubmitVenue = async (e) => {
    e.preventDefault();
    if (
      !venueForm.name ||
      !venueForm.centerHead ||
      !venueForm.address ||
      !venueForm.googleMapsUrl
    ) {
      toast({
        title: "Validation Error",
        description:
          "Please fill in all required fields (Name, Head, Address, Google Maps URL).",
        variant: "destructive",
      });
      return;
    }

    let hasValidSlots = false;
    let hasIncompleteSlot = false;
    let hasOpenDayWithNoSlots = false;
    const submissionSlots = [];

    venueForm.operatingHours.forEach((dayEntry) => {
      const isDayOpenStatus =
        dayEntry.status === "Open Day" || dayEntry.status === "Enter Hours";

      if (isDayOpenStatus) {
        if (dayEntry.slots.length === 0) {
          hasOpenDayWithNoSlots = true;
        }

        dayEntry.slots.forEach((slot) => {
          if (
            (slot.startTime && !slot.endTime) ||
            (!slot.startTime && slot.endTime)
          ) {
            hasIncompleteSlot = true;
          }
          if (slot.startTime && slot.endTime) {
            hasValidSlots = true;
            submissionSlots.push({
              day: dayEntry.day,
              startTime: slot.startTime,
              endTime: slot.endTime,
            });
          }
        });
      }
    });

    if (hasIncompleteSlot) {
      toast({
        title: "Validation Error",
        description:
          "All time slots must have both a start time and an end time.",
        variant: "destructive",
      });
      return;
    }

    if (
      hasOpenDayWithNoSlots &&
      venueForm.operatingHours.some((d) => d.status === "Open Day")
    ) {
      toast({
        title: "Validation Error",
        description: "An 'Open Day' must have at least one valid time slot.",
        variant: "destructive",
      });
      return;
    }

    if (submissionSlots.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please enter at least one valid time slot for the venue.",
        variant: "destructive",
      });
      return;
    }

    try {
      const dataToSubmit = {
        name: venueForm.name,
        centerHead: venueForm.centerHead,
        address: venueForm.address,
        googleUrl: venueForm.googleMapsUrl,
        timeSlots: submissionSlots,
      };

      // Assume API call here (e.g., const apiResponse = await AddVenue(dataToSubmit);)
      // Since AddVenue is not provided, we mock apiResponse for successful state update
      const apiResponse = { venue_id: Date.now() };

      const newVenue = {
        id: apiResponse.venue_id?.toString() || Date.now().toString(),
        name: venueForm.name,
        centerHead: venueForm.centerHead,
        address: venueForm.address,
        googleMapsUrl: venueForm.googleMapsUrl,
        operatingHours: submissionSlots,
      };

      setVenues((prevVenues) => [...prevVenues, newVenue]);
      toast({
        title: "Success",
        description: "Venue added successfully.",
      });

      setVenueForm(initialVenueForm);
      setShowVenueForm(false);
      setCurrentPage(1);
      setSearchTermVenue("");
    } catch (error) {
      console.error("Venue submission failed:", error);
      toast({
        title: "Submission Failed",
        description:
          error.message || "Could not add venue due to a server error.",
        variant: "destructive",
      });
    }
  };

  const { paginatedVenues, totalPages } = useMemo(() => {
    const lowercasedSearchTerm = searchTermVenue.toLowerCase();
    const filtered = venues.filter(
      (v) =>
        v.name.toLowerCase().includes(lowercasedSearchTerm) ||
        v.centerHead.toLowerCase().includes(lowercasedSearchTerm) ||
        v.address.toLowerCase().includes(lowercasedSearchTerm)
    );

    const total = filtered.length;
    const pages = Math.ceil(total / VENUES_PER_PAGE);
    const pageIndex = Math.max(0, currentPage - 1);
    const start = pageIndex * VENUES_PER_PAGE;
    const end = start + VENUES_PER_PAGE;
    const paginated = filtered.slice(start, end);
    if (paginated.length === 0 && currentPage > 1) {
      setCurrentPage(Math.max(1, currentPage - 1));
    }

    return { paginatedVenues: paginated, totalPages: pages };
  }, [venues, searchTermVenue, currentPage]);
  // --- End Venue Management Logic ---

  const unassignedPlayers = players.filter((p) => !p.coach_id); // Use coach_id as returned by API
  const assignedPlayers = players.filter((p) => p.coach_id); // Use coach_id as returned by API

  const getCoachName = (coachId) => {
    if (coachId === null || coachId === undefined) return "N/A";

    // Use Number() for comparison robustness
    const coach = coaches.find((c) => Number(c.coach_id) === Number(coachId));
    return coach ? coach.coach_name : "N/A";
  };

  /**
   * FIX: Helper function to get the selected coach object based on ID,
   * converting the coach_id from the list to a number for reliable comparison.
   */
  const getSelectedCoach = () => {
    // If we have a numeric selectedCoach, prefer numeric match
    if (selectedCoach !== null && selectedCoach !== undefined) {
      return coaches.find((c) => Number(c.coach_id) === selectedCoach);
    }

    // Fallback: if selectedCoach is not numeric but we have a string id from Select, match by string
    if (selectedCoachId) {
      return coaches.find((c) => String(c.coach_id) === String(selectedCoachId));
    }

    return null;
  };

  // Get the coach object for use in SelectValue rendering
  const selectedCoachDisplay = getSelectedCoach();

  const handlePlayerCheckboxChange = (playerId) => {
    setSelectedPlayers((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });
  };

  const handleClearAllPlayers = () => {
    setSelectedPlayers([]);
  };

  const handleApplyPlayers = () => {
    setSearchTerm("");
    setIsPlayerPopoverOpen(false);
  };

  const getSelectedPlayerDisplay = () => {
    const selectedNames = selectedPlayers
      .map((id) => {
        // Find player by 'id' which is used in the Popover/Checkbox
        const player = players.find((p) => p.id === id);
        return player ? player.name : null;
      })
      .filter((name) => name !== null);

    if (selectedNames.length === 0) {
      return "Choose player(s)...";
    }

    if (selectedNames.length <= 2) {
      return selectedNames.join(", ");
    }

    return `${selectedNames[0]}... (+${selectedNames.length - 1} more)`;
  };

  const filteredPlayers = useMemo(() => {
    if (!searchTerm) {
      // Show ALL players for filtering, as per component use
      return players;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();

    return players.filter((player) => {
      const nameMatch = player.name
        .toLowerCase()
        .includes(lowercasedSearchTerm);
      // 'id' is the primary key used in the UI for tracking/checkboxes
      const idMatch = player.id
        ?.toString()
        .toLowerCase()
        .includes(lowercasedSearchTerm);
      const playerIdMatch = player.player_id // 'player_id' is the domain ID
        ?.toString()
        .toLowerCase()
        .includes(lowercasedSearchTerm);

      return nameMatch || idMatch || playerIdMatch;
    });
  }, [players, searchTerm]);

 const handleAssign = async () => {
    if (selectedPlayers.length === 0 || (selectedCoach === null && !selectedCoachId)) {
      toast({
        title: "Error",
        description: "Please select at least one player and one coach.",
        variant: "destructive",
      });
      return;
    }

    // Resolve the coach identifier from either the numeric `selectedCoach` or the Select string `selectedCoachId`.
    const coachIdRaw = selectedCoach !== null && selectedCoach !== undefined ? selectedCoach : selectedCoachId;

    // Find coach robustly by matching numeric or string forms (handles 'CO33' style ids or numeric ids)
    const coachToAssign = coaches.find((c) => {
      if (!c) return false;
      const coachIdStr = c.coach_id !== undefined && c.coach_id !== null ? String(c.coach_id) : "";
      // direct string match
      if (String(coachIdRaw) === coachIdStr) return true;
      // numeric match when possible
      const rawNum = Number(coachIdRaw);
      const cNum = Number(c.coach_id);
      if (!isNaN(rawNum) && !isNaN(cNum) && rawNum === cNum) return true;
      return false;
    });

    if (!coachToAssign) {
      console.error("Coach lookup failed. coaches list:", coaches, "selectedCoachId:", selectedCoachId, "selectedCoach:", selectedCoach);
      toast({
        title: "Error",
        description: "Coach data inconsistency found. Please reload the coaches list and try again.",
        variant: "destructive",
      });
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    for (const playerId of selectedPlayers) {
      const player = players.find((p) => p.id === playerId);

      if (!player || !player.player_id) {
        console.error(
          `Player with ID ${playerId} not found or missing player_id.`
        );
        failureCount++;
        continue;
      }

      try {
        // Use the resolved coach id value to send to the API. Prefer coachToAssign.coach_id (as stored in DB).
        const coachIdToSend = coachToAssign.coach_id;

        await AssignCoachupdated(
          coachToAssign.coach_name,
          coachIdToSend,
          player.player_id,
          player.id
        );

        setPlayers((prevPlayers) =>
          prevPlayers.map((p) =>
            p.id === playerId
              ? {
                  ...p,
                  coach_id: coachIdToSend,
                  coach_name: coachToAssign.coach_name,
                }
              : p
          )
        );
        successCount++;
      } catch (error) {
        console.error(
          `Assignment API failed for player ${player.name}:`,
          error
        );
        failureCount++;
      }
    }

    if (successCount > 0) {
      toast({
        title: "Assignment Complete",
        description: `${successCount} player(s) successfully assigned to coach ${
          coachToAssign.coach_name
        }. ${failureCount > 0 ? `(${failureCount} failed)` : ""}`,
      });
    } else {
      toast({
        title: "Assignment Failed",
        description: "Could not assign any player due to server errors.",
        variant: "destructive",
      });
    }

    // Reset selection and search term after attempts
    setSelectedPlayers([]);
    setSelectedCoach(null);
    setSelectedCoachId("");
    setSearchTerm("");
  };// <-- This is the required closing bracket for the function

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Tabs defaultValue="Assigned" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Assign Teacher to Player</CardTitle>
            <CardDescription>
              Select a teacher and one or more student to make an assignment.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Select Teacher
                </Label>

                <Select
                  value={selectedCoachId}
                  onValueChange={(value) => {
                    // Keep the raw string id for the Select control
                    setSelectedCoachId(value);
                    // Also set numeric selectedCoach used by assignment logic
                    // If the value isn't a valid number (e.g., 'CO33'), keep selectedCoach as null
                    const numeric = value === "" ? null : Number(value);
                    setSelectedCoach(Number.isNaN(numeric) ? null : numeric);
                    console.log("Selected coach id:", value);
                  }}
                >
                  <SelectTrigger className="border-border">
                    <SelectValue placeholder="Choose a coach" />
                  </SelectTrigger>

                  <SelectContent>
                    {coaches.length > 0 ? (
                      coaches.map((coach) => (
                        <SelectItem
                          key={coach.coach_id}
                          value={String(coach.coach_id)} // MUST match the Select value
                        >
                          {coach.coach_name} - {coach.category}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-coaches" disabled>
                        No teacher found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Select Student
                </Label>

                <Popover
                  open={isPlayerPopoverOpen}
                  onOpenChange={(open) => {
                    setIsPlayerPopoverOpen(open);
                    if (!open) setSearchTerm("");
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isPlayerPopoverOpen}
                      className="w-full justify-between border-border"
                    >
                      <span className="truncate">
                        {getSelectedPlayerDisplay()}
                      </span>
                      <Check className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-[450px] p-0">
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Search player name or ID..."
                        className="border-0 focus-visible:ring-0"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <ScrollArea className="h-[300px] p-4">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {filteredPlayers.length === 0 ? (
                          <div className="col-span-2 text-center text-sm opacity-70 py-4">
                            {searchTerm
                              ? `No players found matching "${searchTerm}".`
                              : "No players found."}
                          </div>
                        ) : (
                          filteredPlayers.map((player) => (
                            <div
                              // Ensure player.id exists (it's the internal DB key)
                              key={player.id}
                              className="flex items-center space-x-2 py-1"
                            >
                              <Checkbox
                                id={`player-${player.id}`}
                                checked={selectedPlayers.includes(player.id)}
                                onCheckedChange={() =>
                                  handlePlayerCheckboxChange(player.id)
                                }
                              />
                              <Label
                                htmlFor={`player-${player.id}`}
                                className="text-sm font-normal cursor-pointer flex-1"
                              >
                                {player.name} (Coach:{" "}
                                {player.coach_name || "Unassigned"}){" "}
                              </Label>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>

                    <div className="flex justify-between items-center p-2 border-t">
                      <Button
                        variant="ghost"
                        onClick={handleClearAllPlayers}
                        className="text-sm text-muted-foreground"
                        disabled={selectedPlayers.length === 0}
                      >
                        CLEAR ALL
                      </Button>
                      <Button
                        onClick={handleApplyPlayers}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        Done Selecting
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button
              onClick={handleAssign}
              disabled={
                // The button is disabled when no players selected, no coach selected (either numeric or string), or no players loaded
                selectedPlayers.length === 0 ||
                (selectedCoach === null && (!selectedCoachId || selectedCoachId === "")) ||
                players.length === 0
              }
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Assign student
            </Button>

            <div className="flex justify-between text-sm pt-4 border-t">
              <p>
                Unassigned student:{" "}
                <span className="font-bold text-red-500">
                  {unassignedPlayers.length}
                </span>
              </p>
              <p>
                Assigned student:{" "}
                <span className="font-bold text-green-600">
                  {assignedPlayers.length}
                </span>
              </p>
              <p>
                Total Student's:{" "}
                <span className="font-bold">{players.length}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Student Details</CardTitle>
            <CardDescription>
              A complete list of all student and their current teacher
              assignments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {players.length === 0 ? (
                <div className="text-center p-6 opacity-70 border rounded">
                  <Users className="mx-auto mb-2 h-6 w-6" />
                  No student data loaded. Please check API connection.
                </div>
              ) : (
                players.map((player) => {
                  // Use coach_id for checking assignment status
                  const isAssigned =
                    player.coach_id !== null && player.coach_id !== undefined;
                  // Use coach_id to get coach name
                  const coachName = getCoachName(player.coach_id);

                  return (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-full ${
                            isAssigned
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {isAssigned ? (
                            <UserCheck className="h-5 w-5" />
                          ) : (
                            <UserX className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-base">
                            {player.name}
                          </p>
                          <p className="text-sm opacity-70">
                            Student ID: {player.player_id || "N/A"} | Category:{" "}
                            {player.category || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {isAssigned ? (
                          <>
                            <Badge className="bg-green-500 hover:bg-green-500/90">
                              Assigned
                            </Badge>
                            <p className="text-sm font-medium mt-1">
                              Teacher: {coachName}
                            </p>
                          </>
                        ) : (
                          <>
                            <Badge variant="destructive">Unassigned</Badge>
                            <p className="text-sm opacity-50 mt-1">
                              Ready for assignment
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
