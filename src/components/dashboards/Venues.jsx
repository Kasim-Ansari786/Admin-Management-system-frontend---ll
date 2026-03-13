import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Trash2,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  addVenueData,
  updatedvenuscode,
  deleteVenue,
  fetchVenuesdetails,
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

// FIXED: Corrected template literal syntax and URL construction
const getGoogleMapsEmbedUrl = (url) => {
  const coordMatch = url.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (coordMatch) {
    const lat = coordMatch[1];
    const lng = coordMatch[2];
    return `https://www.google.com/maps?q=${lat},${lng}&output=embed`;
  }
  const placeMatch = url.match(/place\/([^/]+)/);
  if (placeMatch) {
    const place = decodeURIComponent(placeMatch[1]);
    return `https://www.google.com/maps?q=${encodeURIComponent(
      place
    )}&output=embed`;
  }

  if (url.includes("google.com/maps")) {
    return url.includes("output=embed") ? url : `${url}&output=embed`;
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(
    url
  )}&output=embed`;
};

export default function Venues() {
  const { toast } = useToast();
  const [venues, setVenues] = useState([]);
  const [players, setPlayers] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [venueForm, setVenueForm] = useState(initialVenueForm);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState(initialVenueForm);
  const [editingVenue, setEditingVenue] = useState(null);
  const [searchTermVenue, setSearchTermVenue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const playersData = await GetagssignDetails();
        setPlayers(playersData?.players || []);
        const coachData = await GetCoachDetailslist();
        setCoaches(coachData?.coaches || coachData || []);
        const fetchedVenues = await fetchVenuesdetails();
        const normalizedVenues = fetchedVenues.map((v) => ({
          ...v,
          operatingHours: (v.timeSlots || v.operatingHours || [])
            .map((slot) => ({
              day: slot.day,
              startTime: slot.startTime || slot.start_time || slot.start || "",
              endTime: slot.endTime || slot.end_time || slot.end || "",
            }))
            .filter((slot) => slot.day && (slot.startTime || slot.endTime)),
        }));
        setVenues(normalizedVenues);
      } catch (error) {
        console.error("Data fetch error:", error);
      }
    };
    fetchData();
  }, []);

  const handleDayStatusChange = (dayIndex, status) => {
    setVenueForm((prev) => {
      const newOperatingHours = [...prev.operatingHours];
      newOperatingHours[dayIndex].status = status;
      newOperatingHours[dayIndex].slots =
        status === "Closed" ? [] : [{ ...initialTimeSlot }];
      return { ...prev, operatingHours: newOperatingHours };
    });
  };

  const handleAddTimeSlot = (dayIndex) => {
    setVenueForm((prev) => {
      const newOperatingHours = [...prev.operatingHours];
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
      if (newOperatingHours[dayIndex].slots.length === 0)
        newOperatingHours[dayIndex].status = "Closed";
      return { ...prev, operatingHours: newOperatingHours };
    });
  };

  const handleTimeSlotChange = (dayIndex, slotIndex, field, value) => {
    setVenueForm((prev) => {
      const newOperatingHours = [...prev.operatingHours];
      newOperatingHours[dayIndex].slots[slotIndex][field] = value;
      return { ...prev, operatingHours: newOperatingHours };
    });
  };

  const handleSaveEdit = async () => {
    if (!editingVenue) return;
    if (
      !editForm.name ||
      !editForm.centerHead ||
      !editForm.address ||
      !editForm.googleMapsUrl
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const firstDayEntry = editForm.operatingHours.find(
      (d) =>
        (d.status === "Open Day" || d.status === "Enter Hours") &&
        d.slots.length > 0
    );

    if (!firstDayEntry) {
      toast({
        title: "Validation Error",
        description: "Please enter at least one valid time slot.",
        variant: "destructive",
      });
      return;
    }

    const firstSlot = firstDayEntry.slots[0];
    const payload = {
      name: editForm.name,
      center_head: editForm.centerHead,
      address: editForm.address,
      google_url: editForm.googleMapsUrl,
      start_time: firstSlot.startTime,
      end_time: firstSlot.endTime,
      time_slot_id: firstSlot.time_slot_id || editingVenue.time_slot_id,
      day: firstDayEntry.day,
      day_id: firstDayEntry.day_id || editingVenue.day_id,
    };

    try {
      await updatedvenuscode(editingVenue.id, payload);
      const updatedVenue = {
        ...editingVenue,
        name: editForm.name,
        centerHead: editForm.centerHead,
        address: editForm.address,
        googleMapsUrl: editForm.googleMapsUrl,
        operatingHours: editForm.operatingHours.filter(
          (d) => d.status === "Open Day"
        ),
      };

      setVenues((prev) =>
        prev.map((v) => (v.id === editingVenue.id ? updatedVenue : v))
      );

      toast({
        title: "Success",
        description: "Venue updated successfully in database.",
      });

      setEditDialogOpen(false);
      setEditingVenue(null);
      setEditForm(initialVenueForm);
    } catch (error) {
      toast({
        title: "Update Failed",
        description:
          error.response?.data?.error || "Could not save changes to server.",
        variant: "destructive",
      });
    }
  };

  const handleEditVenue = (venue) => {
    const normalized = {
      name: venue.name || "",
      centerHead: venue.centerHead || venue.center_head || "",
      address: venue.address || "",
      googleMapsUrl: venue.googleMapsUrl || venue.google_url || "",
      operatingHours: (venue.operatingHours || []).map((s) => ({
        day: s.day,
        day_id: s.day_id,
        status: "Open Day",
        slots: [
          {
            startTime: s.startTime || s.start_time || "",
            endTime: s.endTime || s.end_time || "",
            time_slot_id: s.time_slot_id,
          },
        ],
      })),
    };

    setEditingVenue(venue);
    setEditForm(normalized);
    setEditDialogOpen(true);
  };

  const handleSubmitVenue = async (e) => {
    e.preventDefault();
    const submissionSlots = [];
    venueForm.operatingHours.forEach((dayEntry) => {
      dayEntry.slots.forEach((slot) => {
        if (slot.startTime && slot.endTime) {
          submissionSlots.push({
            day: dayEntry.day,
            startTime: slot.startTime,
            endTime: slot.endTime,
          });
        }
      });
    });

    try {
      const dataToSubmit = {
        name: venueForm.name,
        centerHead: venueForm.centerHead,
        address: venueForm.address,
        googleUrl: venueForm.googleMapsUrl,
        timeSlots: submissionSlots,
      };
      const apiResponse = await addVenueData(dataToSubmit);
      setVenues([
        ...venues,
        {
          ...venueForm,
          id: apiResponse.venue_id || Date.now(),
          operatingHours: submissionSlots,
        },
      ]);
      setShowVenueForm(false);
      setVenueForm(initialVenueForm);
      toast({ title: "Success", description: "Venue added successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save venue",
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
        updated.length % VENUES_PER_PAGE === 0 &&
        currentPage > Math.ceil(updated.length / VENUES_PER_PAGE) &&
        currentPage > 1
      ) {
        setCurrentPage((prev) => prev - 1);
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

  const { paginatedVenues, totalPages } = useMemo(() => {
    const filtered = venues.filter((v) =>
      v.name.toLowerCase().includes(searchTermVenue.toLowerCase())
    );
    return {
      paginatedVenues: filtered.slice(
        (currentPage - 1) * VENUES_PER_PAGE,
        currentPage * VENUES_PER_PAGE
      ),
      totalPages: Math.ceil(filtered.length / VENUES_PER_PAGE),
    };
  }, [venues, searchTermVenue, currentPage]);
  return (
    <div className="min-h-screen bg-background w-full">
      <main className="w-full p-6">
        <div className="mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row justify-between items-start">
              <div>
                <CardTitle>Center Management</CardTitle>
                <CardDescription>
                  Manage academy centers and their time slots.
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowVenueForm(!showVenueForm)}
                className="bg-[#1A9CFF] hover:bg-[#1582d8] text-white shadow-none rounded-xl px-4 transition-all border-none"
              >
                <MapPin className="mr-2 h-4 w-4" />
                {showVenueForm ? "Cancel" : "Add Venue"}
              </Button>
            </CardHeader>
            <CardContent>
              {showVenueForm && (
                <form
                  onSubmit={handleSubmitVenue}
                  className="space-y-4 p-4 border rounded-xl mb-6 bg-slate-50/50"
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
                  <div>
                    <Label>Google Maps URL *</Label>
                    <Input
                      type="url"
                      placeholder="https://maps.google.com/..."
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

                  <div className="space-y-6 pt-4 border-t">
                    <Label className="block text-lg font-semibold">
                      Operating Hours
                    </Label>
                    {venueForm.operatingHours.map((dayEntry, dayIndex) => {
                      const firstSlot = dayEntry.slots[0];
                      const isDayOpen =
                        dayEntry.status === "Open Day" ||
                        dayEntry.status === "Enter Hours";

                      return (
                        <div
                          key={dayEntry.day}
                          className="border-b pb-4 last:border-b-0"
                        >
                          <div className="grid grid-cols-[100px_120px_120px_120px_40px_1fr] items-center gap-2 md:gap-4 mb-1 mt-2">
                            <h4 className="font-bold text-base">
                              {dayEntry.day}
                            </h4>
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
                              </SelectContent>
                            </Select>
                            {isDayOpen && firstSlot ? (
                              <>
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
                                  required={dayEntry.status === "Open Day"}
                                />
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
                              <>
                                <div className="h-10"></div>
                                <div className="h-10"></div>
                                <div className="h-10 w-10"></div>
                              </>
                            )}
                            <div className="col-span-1"></div>
                          </div>

                          <div className="space-y-3 pl-24">
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
                            {isDayOpen && (
                              <div className="pl-0 pt-2">
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

                  <div className="flex gap-3 mt-6">
                    <Button
                      type="submit"
                      className="bg-[#1A9CFF] hover:bg-[#1582d8]"
                    >
                      Save Venue
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setVenueForm(initialVenueForm);
                        setShowVenueForm(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              <div className="space-y-6 mt-6">
                <Input
                  placeholder="Search venues by name, head, or address..."
                  className="mb-4 rounded-xl border-slate-200 h-12 shadow-sm"
                  value={searchTermVenue}
                  onChange={(e) => {
                    setSearchTermVenue(e.target.value);
                    setCurrentPage(1);
                  }}
                />

                {venues.length === 0 ? (
                  <div className="text-center p-12 opacity-70 border-2 border-dashed rounded-2xl bg-slate-50">
                    <MapPin className="mx-auto mb-2 h-8 w-8 text-slate-400" />
                    <p className="font-medium">No venues added yet.</p>
                  </div>
                ) : paginatedVenues.length === 0 ? (
                  <div className="text-center p-12 opacity-70 border-2 border-dashed rounded-2xl bg-slate-50">
                    <MapPin className="mx-auto mb-2 h-8 w-8 text-slate-400" />
                    <p className="font-medium">
                      No venues match your search criteria.
                    </p>
                  </div>
                ) : (
                  paginatedVenues.map((v) => {
                    const hoursArray = Array.isArray(v.operatingHours)
                      ? v.operatingHours
                      : [];
                    const groupedHours = hoursArray.reduce((acc, slot) => {
                      const day = slot?.day || "Unknown Day";
                      if (slot?.startTime && slot?.endTime) {
                        if (!acc[day]) acc[day] = [];
                        acc[day].push(slot);
                      }
                      return acc;
                    }, {});

                    return (
                      <Card
                        key={v.id}
                        className="overflow-hidden border-none shadow-sm rounded-2xl bg-white hover:ring-1 hover:ring-[#1A9CFF]/30 transition-all"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-12">
                          {/* LEFT SIDE */}
                          <div className="lg:col-span-4 p-6 border-r border-slate-100">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-xl font-bold text-slate-800">
                                  {v.name}
                                </h3>
                                <p className="text-[#1A9CFF] font-semibold text-sm">
                                  Center Head: {v.centerHead}
                                </p>
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                {/* Edit Button */}
                                <Button
                                  variant="ghost"
                                  onClick={() => handleEditVenue(v)}
                                  className="text-[#1A9CFF] hover:bg-[#1A9CFF]/10 hover:text-[#1582d8] rounded-full p-2 h-10 w-10"
                                >
                                  <Pencil className="h-5 w-5" />
                                </Button>

                                {/* Delete Button */}
                                <Button
                                  variant="ghost"
                                  onClick={() => handleDeleteVenue(v.id)}
                                  className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full p-2 h-10 w-10"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-start gap-3">
                                <div className="mt-1 p-2 bg-slate-100 rounded-lg">
                                  <MapPin className="h-4 w-4 text-slate-500" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-400 uppercase">
                                    Address
                                  </p>
                                  <p className="text-sm text-slate-600">
                                    {v.address}
                                  </p>
                                </div>
                              </div>

                              {v.googleMapsUrl && (
                                <div className="pt-2">
                                  <a
                                    href={v.googleMapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-xs font-bold text-[#1A9CFF] bg-[#1A9CFF]/10 px-3 py-2 rounded-lg hover:bg-[#1A9CFF]/20 transition-colors"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    OPEN IN GOOGLE MAPS
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* MAP */}
                          <div className="lg:col-span-4 p-6 border-r border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-[#1A9CFF]" />
                              Location Map
                            </p>
                            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200">
                              <iframe
                                src={getGoogleMapsEmbedUrl(v.googleMapsUrl)}
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title={`Map of ${v.name}`}
                              />
                            </div>
                            <a
                              href={v.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#1A9CFF] hover:underline mt-2 inline-block"
                            >
                              View larger map
                            </a>
                          </div>

                          {/* OPERATING HOURS */}
                          <div className="lg:col-span-4 bg-slate-50/50 p-6 flex flex-col">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                              <Clock className="h-4 w-4 text-[#1A9CFF]" />
                              Operating Hours
                            </p>

                            <div className="space-y-2 flex-grow">
                              {weekDays.map((day) => {
                                const slots = groupedHours[day] || [];

                                return (
                                  <div
                                    key={day}
                                    className="flex justify-between items-start py-1.5 border-b border-slate-200/50 last:border-0"
                                  >
                                    <span className="text-sm font-bold text-slate-700">
                                      {day}
                                    </span>

                                    <div className="text-right space-y-1">
                                      {slots.length > 0 ? (
                                        slots.map((slot, idx) => (
                                          <p
                                            key={idx}
                                            className="text-sm font-medium text-[#1A9CFF]"
                                          >
                                            {slot.startTime} – {slot.endTime}
                                          </p>
                                        ))
                                      ) : (
                                        <span className="text-xs text-slate-400 italic">
                                          Closed
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
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
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
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
            </CardContent>
          </Card>
        </div>
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Venue</DialogTitle>
              <DialogDescription>
                Update the venue details and operating hours.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Center Name *</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Center Head *</Label>
                  <Input
                    value={editForm.centerHead}
                    onChange={(e) =>
                      setEditForm({ ...editForm, centerHead: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Address *</Label>
                <Textarea
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Google Maps URL *</Label>
                <Input
                  type="url"
                  placeholder="https://maps.google.com/..."
                  value={editForm.googleMapsUrl}
                  onChange={(e) =>
                    setEditForm({ ...editForm, googleMapsUrl: e.target.value })
                  }
                />
              </div>

              <div className="space-y-6 pt-4 border-t">
                <Label className="block text-lg font-semibold">
                  Operating Hours
                </Label>
                {editForm.operatingHours.map((dayEntry, dayIndex) => {
                  const firstSlot = dayEntry.slots[0];
                  const isDayOpen =
                    dayEntry.status === "Open Day" ||
                    dayEntry.status === "Enter Hours";

                  return (
                    <div
                      key={dayEntry.day}
                      className="border-b pb-4 last:border-b-0"
                    >
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-2">
                        <h4 className="font-bold text-base w-24">
                          {dayEntry.day}
                        </h4>
                        <Select
                          value={dayEntry.status}
                          onValueChange={(value) =>
                            handleEditDayStatusChange(dayIndex, value)
                          }
                        >
                          <SelectTrigger className="h-10 w-32">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Open Day">Open Day</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        {isDayOpen && firstSlot && (
                          <>
                            <Input
                              type="time"
                              className="h-10 w-32"
                              value={firstSlot.startTime}
                              onChange={(e) =>
                                handleEditTimeSlotChange(
                                  dayIndex,
                                  0,
                                  "startTime",
                                  e.target.value
                                )
                              }
                            />
                            <Input
                              type="time"
                              className="h-10 w-32"
                              value={firstSlot.endTime}
                              onChange={(e) =>
                                handleEditTimeSlotChange(
                                  dayIndex,
                                  0,
                                  "endTime",
                                  e.target.value
                                )
                              }
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="h-10 w-10"
                              onClick={() =>
                                handleEditRemoveTimeSlot(dayIndex, 0)
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>

                      {isDayOpen && (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          onClick={() => handleEditAddTimeSlot(dayIndex)}
                          className="p-0 h-auto ml-28"
                        >
                          + Add Time Slot
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <Button
                  onClick={handleSaveEdit}
                  className="bg-[#1A9CFF] hover:bg-[#1582d8]"
                >
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setEditingVenue(null);
                    setEditForm(initialVenueForm);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
