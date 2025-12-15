// Venues.jsx (React Component)

"use client";
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
  MapPin,
  Clock,
  X,
  ChevronLeft, // New import for pagination
  ChevronRight, // New import for pagination
} from "lucide-react";
// Ensure all API functions are imported
import {
  addVenueData,
  fetchVenuesdetails,
  deleteVenue,
  GetagssignDetails,
  GetCoachDetailslist,
} from "../../../api";

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
  const { toast } = useToast();
  const [venues, setVenues] = useState([]);
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [venueForm, setVenueForm] = useState(initialVenueForm);
  const [players, setPlayers] = useState([]);
  const [coaches, setCoaches] = useState([]);

  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermVenue, setSearchTermVenue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const playersData = await GetagssignDetails();
        setPlayers(playersData?.players || []);
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
          fetchedCoaches = coachData.coaches;
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
    async function loadVenues() {
      try {
        const fetchedVenues = await fetchVenuesdetails();
        const normalizedVenues = fetchedVenues.map((v) => {
          const rawHours = v.timeSlots || v.operatingHours || [];
          const operatingHours = rawHours
            .map((slot) => ({
              day: slot.day,
              startTime: slot.startTime || slot.start_time || slot.start || "",
              endTime: slot.endTime || slot.end_time || slot.end || "",
            }))
            .filter((slot) => slot.day && (slot.startTime || slot.endTime));

          return {
            ...v,
            operatingHours: operatingHours,
          };
        });

        setVenues(normalizedVenues);
      } catch (e) {
        console.error("Failed to fetch venues from API", e);
        toast({
          title: "Venue Load Error",
          description:
            e.message ||
            "Failed to load venue data from API. Check server console.",
          variant: "destructive",
        });
      }
    }
    loadVenues();
  }, []);

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

      const apiResponse = await addVenueData(dataToSubmit);

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

  const handleDeleteVenue = async (id) => {
    try {
      const result = await deleteVenue(id);
      const updated = venues.filter((v) => v.id !== id);
      setVenues(updated);

      toast({
        title: "Deleted",
        description: result.message || `Venue ID ${id} successfully removed.`,
        variant: "success",
      });
      if (
        (updated.length % VENUES_PER_PAGE === 0) &&
        (currentPage > Math.ceil(updated.length / VENUES_PER_PAGE)) &&
        currentPage > 1
      ) {
        setCurrentPage(prev => prev - 1);
      }
    } catch (error) {
      console.error("Deletion failed:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove venue.",
        variant: "destructive",
      });
    }
  };

  const unassignedPlayers = players.filter((p) => !p.coachId);
  const assignedPlayers = players.filter((p) => p.coachId);

  const getCoachName = (coachId) => {
    if (coachId === null || coachId === undefined) return "N/A";

    const coach = coaches.find((c) => c.coach_id === coachId);
    return coach ? coach.coach_name : "N/A";
  };

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
      return players;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();

    return players.filter((player) => {
      const nameMatch = player.name
        .toLowerCase()
        .includes(lowercasedSearchTerm);
      const idMatch = player.id
        ?.toString()
        .toLowerCase()
        .includes(lowercasedSearchTerm);
      const playerIdMatch = player.player_id
        ?.toString()
        .toLowerCase()
        .includes(lowercasedSearchTerm);

      return nameMatch || idMatch || playerIdMatch;
    });
  }, [players, searchTerm]);


  const handleAssign = async () => {
    if (selectedPlayers.length === 0 || selectedCoach === null) {
      toast({
        title: "Error",
        description: "Please select at least one player and one coach.",
        variant: "destructive",
      });
      return;
    }

    const coachToAssign = coaches.find((c) => c.coach_id === selectedCoach);

    if (!coachToAssign) {
      toast({
        title: "Error",
        description: "Coach data inconsistency found.",
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
        await AssignCoachupdated(
          coachToAssign.coach_name,
          selectedCoach,
          player.player_id,
          player.id
        );

        setPlayers((prevPlayers) =>
          prevPlayers.map((p) =>
            p.id === playerId
              ? {
                  ...p,
                  coachId: selectedCoach,
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

    setSelectedPlayers([]);
    setSelectedCoach(null);
    setSearchTerm("");
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


  return (
    <div className="space-y-6 p-4 md:p-6">     
      <Tabs defaultValue="Assigned" className="space-y-4"> 
          <Card>
            <CardHeader className="flex flex-row justify-between items-start">
              <div>
                <CardTitle>Venue Management</CardTitle>

                <CardDescription>
                  Manage academy centers and their time slots.
                </CardDescription>
              </div>

              <Button onClick={() => setShowVenueForm(!showVenueForm)}>
                <MapPin className="mr-2" />

                {showVenueForm ? "Cancel" : "Add Venue"}
              </Button>
            </CardHeader>

            <CardContent>

              {showVenueForm && (
                <form
                  onSubmit={handleSubmitVenue}
                  className="space-y-4 p-4 border rounded mb-6"
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Center Name *</Label>

                      <Input
                        value={venueForm.name}
                        onChange={(e) =>
                          setVenueForm({ ...venueForm, name: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label>Center Head *</Label>

                      <Input
                        value={venueForm.centerHead}
                        onChange={(e) =>
                          setVenueForm({
                            ...venueForm,

                            centerHead: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* Address input */}

                  <div>
                    <Label>Address *</Label>

                    <Textarea
                      value={venueForm.address}
                      onChange={(e) =>
                        setVenueForm({ ...venueForm, address: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* Google Maps URL Input */}

                  <div>
                    <Label>Google Maps URL *</Label>

                    <Input
                      type="url"
                      placeholder="https://maps.app.goo.gl/..."
                      value={venueForm.googleMapsUrl}
                      onChange={(e) =>
                        setVenueForm({
                          ...venueForm,

                          googleMapsUrl: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  {/* OPERATING HOURS MAPPING */}

                  <div className="space-y-6 pt-4 border-t">
                    <Label className="block text-lg font-semibold">
                      Operating Hours
                    </Label>

                    {/* Map over the 7 fixed days */}

                    {venueForm.operatingHours.map((dayEntry, dayIndex) => {
                      const firstSlot = dayEntry.slots[0];

                      // FIX 3: Check for both 'Open Day' and 'Enter Hours' status to display slots
                      const isDayOpen =
                        dayEntry.status === "Open Day" ||
                        dayEntry.status === "Enter Hours";

                      return (
                        <div
                          key={dayEntry.day}
                          className="border-b pb-4 last:border-b-0"
                        >
                          {/* 1. HEADER ROW: Day Name, Status, and the FIRST Time Slot */}

                          <div className="grid grid-cols-[100px_120px_120px_120px_40px_1fr] items-center gap-2 md:gap-4 mb-1 mt-2">
                            {/* Day Name (Col 1) */}

                            <h4 className="font-bold text-base">
                              {dayEntry.day}
                            </h4>

                            {/* Day Status Dropdown (Col 2) */}

                            <Select
                              value={dayEntry.status}
                              onValueChange={(value) =>
                                handleDayStatusChange(dayIndex, value)
                              }
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>

                              <SelectContent>
                                <SelectItem value="Open Day">
                                  Open Day
                                </SelectItem>

                                <SelectItem value="Closed">Closed</SelectItem>
                                {/* Note: "Enter Hours" is not an option, as it is only the default state */}
                              </SelectContent>
                            </Select>

                            {/* Conditional rendering for the FIRST time slot (index 0) - Cols 3, 4, 5 */}

                            {isDayOpen && firstSlot ? (
                              <>
                                {/* From Input (First slot) - Col 3 */}

                                <Input
                                  type="time"
                                  placeholder="From"
                                  className="h-10"
                                  value={firstSlot.startTime}
                                  onChange={(e) =>
                                    handleTimeSlotChange(
                                      dayIndex,
                                      0,
                                      "startTime",
                                      e.target.value
                                    )
                                  }
                                  // Mark as required if day is open, although validation handles empty input
                                  required={dayEntry.status === "Open Day"}
                                />

                                {/* To Input (First slot) - Col 4 */}

                                <Input
                                  type="time"
                                  placeholder="To"
                                  className="h-10"
                                  value={firstSlot.endTime}
                                  onChange={(e) =>
                                    handleTimeSlotChange(
                                      dayIndex,
                                      0,
                                      "endTime",
                                      e.target.value
                                    )
                                  }
                                  required={dayEntry.status === "Open Day"}
                                />

                                {/* Remove Slot Button for the FIRST slot (Col 5) */}

                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="h-10 w-10 flex-shrink-0"
                                  onClick={() =>
                                    handleRemoveTimeSlot(dayIndex, 0)
                                  }
                                  title="Remove Hour"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              // RENDER PLACEHOLDERS WHEN DAY IS CLOSED
                              <>
                                <div className="h-10"></div>

                                <div className="h-10"></div>

                                <div className="h-10 w-10"></div>
                              </>
                            )}

                            <div className="col-span-1"></div>
                          </div>

                          {/* 2. ADDITIONAL SLOTS AND ADD BUTTON (Rendered below the header) */}

                          <div className="space-y-3 pl-[220px]">
                            {/* Map over time slots starting from the SECOND slot (index 1) */}

                            {dayEntry.slots.slice(1).map((slot, slotIndex) => {
                              const actualIndex = slotIndex + 1;

                              return (
                                <div
                                  key={actualIndex}
                                  className="grid grid-cols-[120px_120px_40px] items-center gap-2 md:gap-4"
                                >
                                  <Input
                                    type="time"
                                    placeholder="From"
                                    className="h-10"
                                    value={slot.startTime}
                                    onChange={(e) =>
                                      handleTimeSlotChange(
                                        dayIndex,
                                        actualIndex,
                                        "startTime",
                                        e.target.value
                                      )
                                    }
                                    required={dayEntry.status === "Open Day"}
                                  />

                                  <Input
                                    type="time"
                                    placeholder="To"
                                    className="h-10"
                                    value={slot.endTime}
                                    onChange={(e) =>
                                      handleTimeSlotChange(
                                        dayIndex,
                                        actualIndex,
                                        "endTime",
                                        e.target.value
                                      )
                                    }
                                    required={dayEntry.status === "Open Day"}
                                  />

                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="h-10 w-10 flex-shrink-0"
                                    onClick={() =>
                                      handleRemoveTimeSlot(
                                        dayIndex,
                                        actualIndex
                                      )
                                    }
                                    title="Remove Hour"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              );
                            })}

                            {/* Add Hour Button */}

                            {isDayOpen && (
                              <div className="text-left pt-2">
                                <Button
                                  type="button"
                                  variant="link"
                                  size="sm"
                                  onClick={() => handleAddTimeSlot(dayIndex)}
                                  className="p-0 h-auto"
                                >
                                  Add Enter Hour
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* END OPERATING HOURS MAPPING */}

                  {/* Submit/Cancel Buttons */}

                  <div className="flex gap-3 mt-6">
                    <Button type="submit">Save Venue</Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        // Reset to the FIXED initial state
                        setVenueForm(initialVenueForm);
                        setShowVenueForm(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              {/* VENUE LIST DISPLAY */}

              <div className="space-y-3 mt-6">
                {/* --- VENUE SEARCH INPUT --- */}
                <Input
                  placeholder="Search venues by name, head, or address..."
                  className="mb-4"
                  value={searchTermVenue}
                  onChange={(e) => {
                    setSearchTermVenue(e.target.value);
                    setCurrentPage(1); // Reset to first page on new search
                  }}
                />
                {/* --- END SEARCH INPUT --- */}

                {venues.length === 0 ? (
                  <div className="text-center p-6 opacity-70 border rounded">
                    <MapPin className="mx-auto mb-2 h-6 w-6" />
                    No venues added yet.
                  </div>
                ) : paginatedVenues.length === 0 ? (
                  <div className="text-center p-6 opacity-70 border rounded">
                    <MapPin className="mx-auto mb-2 h-6 w-6" />
                    No venues match your search criteria.
                  </div>
                ) : (
                  paginatedVenues.map((v) => {
                    const groupedHours = v.operatingHours.reduce((acc, slot) => {
                      const day = slot.day || "Unknown Day";

                      // Ensure we have valid time data before grouping (already filtered in loadVenues, but good for robustness)
                      if (slot.startTime && slot.endTime) {
                        if (!acc[day]) {
                          acc[day] = [];
                        }
                        acc[day].push(slot);
                      }
                      return acc;
                    }, {});

                    // Get all days to render (all 7 fixed days + any unknown days)
                    const daysToRender = [
                      ...weekDays,
                      ...Object.keys(groupedHours).filter(
                        (day) => !weekDays.includes(day)
                      ),
                    ];

                    return (
                      <Card key={v.id} className="shadow-sm">
                        <CardHeader className="flex flex-row justify-between items-start space-y-0">
                          <div>
                            <CardTitle>{v.name}</CardTitle>

                            <CardDescription>
                              Center Head: {v.centerHead}
                            </CardDescription>
                          </div>

                          <Button
                            variant="ghost"
                            onClick={() => handleDeleteVenue(v.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </CardHeader>

                        <CardContent>
                          {/* Address */}

                          <p className="text-sm opacity-70 mb-2">Address:</p>

                          <p className="text-sm mb-4">{v.address}</p>

                          {/* Google Maps Link */}

                          {v.googleMapsUrl && (
                            <div className="mb-4">
                              <p className="text-sm opacity-70 mb-1">
                                Google Maps Link:
                              </p>

                              <a
                                href={v.googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline truncate block"
                              >
                                {v.googleMapsUrl}
                              </a>
                            </div>
                          )}

                          {/* Operating Hours Display (Updated logic) */}

                          <p className="text-sm font-medium mb-2">
                            Operating Hours:
                          </p>

                          <div className="space-y-2">
                            {daysToRender.length > 0 ? (
                              daysToRender.map((day) => {
                                const slots = groupedHours[day];

                                return (
                                  <div
                                    key={day}
                                    className="p-3 border rounded bg-secondary/20"
                                  >
                                    <div className="flex items-center gap-2 font-bold mb-1">
                                      <Clock className="text-primary h-4 w-4" />

                                      <span>{day}</span>
                                    </div>

                                    <div className="pl-6 space-y-1 text-sm">
                                      {slots && slots.length > 0 ? (
                                        slots.map((slot, idx) => (
                                          <div key={idx}>
                                            {slot.startTime} - {slot.endTime}
                                          </div>
                                        ))
                                      ) : (
                                        <p className="opacity-70">Closed</p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-sm opacity-70">
                                No operating hours defined.
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>

           
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 p-3 border-t">
                  <p className="text-sm opacity-70">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {/* --- END PAGINATION CONTROLS --- */}
            </CardContent>
          </Card>      
      </Tabs>
    </div>
  );
}