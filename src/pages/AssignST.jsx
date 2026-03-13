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
import { Users, UserPlus, UserCheck, UserX, Check, Search, Filter, CheckCircle2, HelpCircle } from "lucide-react";
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
  const { toast = console.log } = useToast();
  const [venues, setVenues] = useState([]);
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [venueForm, setVenueForm] = useState(initialVenueForm);
  const [players, setPlayers] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [selectedCoachId, setSelectedCoachId] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState("all");
  const [isPlayerPopoverOpen, setIsPlayerPopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermVenue, setSearchTermVenue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const playersData = await GetagssignDetails();
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
          fetchedCoaches = coachData.data;
          if (!fetchedCoaches && Array.isArray(coachData)) {
            fetchedCoaches = coachData;
          }
        }
        setCoaches(fetchedCoaches || []);
      } catch (error) {
        console.error(
          "Failed to load coaches data (Possible 404 on API):",
          error,
        );
        toast({
          title: "Coach Data Load Error",
          description: "Failed to load coach data from API.",
          variant: "destructive",
        });
        setCoaches([]);
      }
    };
    fetchData();
  }, []);

  // Helper function to find coach name by ID from the coaches list
  const getCoachNameById = (coachId) => {
    if (!coachId) return null;
    const coach = coaches.find((c) => String(c.coach_id) === String(coachId));
    return coach ? coach.coach_name : null;
  };

  const handleDayStatusChange = (dayIndex, status) => {
    setVenueForm((prev) => {
      const newOperatingHours = [...prev.operatingHours];
      newOperatingHours[dayIndex].status = status;
      return { ...prev, operatingHours: newOperatingHours };
    });
  };

  const handleAssign = async () => {
    if (selectedPlayers.length === 0 || !selectedCoachId) {
      toast({
        title: "Error",
        description: "Please select at least one player and one coach.",
        variant: "destructive",
      });
      return;
    }

    const coachToAssign = coaches.find(
      (c) => String(c.coach_id) === String(selectedCoachId),
    );

    if (!coachToAssign) {
      toast({
        title: "Error",
        description: "Coach lookup failed.",
        variant: "destructive",
      });
      return;
    }

    let successCount = 0;
    for (const playerId of selectedPlayers) {
      const player = players.find((p) => p.id === playerId);
      if (!player) continue;

      try {
        await AssignCoachupdated(
          coachToAssign.coach_name,
          coachToAssign.coach_id,
          player.player_id,
          player.id,
        );

        setPlayers((prevPlayers) =>
          prevPlayers.map((p) =>
            p.id === playerId
              ? {
                  ...p,
                  coach_id: coachToAssign.coach_id,
                  coach_name: coachToAssign.coach_name,
                }
              : p,
          ),
        );
        successCount++;
      } catch (error) {
        console.error(`Assignment failed for ${player.name}:`, error);
      }
    }

    if (successCount > 0) {
      toast({
        title: "Assignment Complete",
        description: `${successCount} player(s) assigned to ${coachToAssign.coach_name}.`,
      });
    }
    setSelectedPlayers([]);
    setSelectedCoachId("");
  };

  const handlePlayerCheckboxChange = (playerId) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId],
    );
  };

  const getSelectedPlayerDisplay = () => {
    const selectedNames = players
      .filter((p) => selectedPlayers.includes(p.id))
      .map((p) => p.name);
    if (selectedNames.length === 0) return "Choose student(s)...";
    return selectedNames.length <= 2
      ? selectedNames.join(", ")
      : `${selectedNames[0]}... (+${selectedNames.length - 1} more)`;
  };

  // Stats should reflect the currently visible (filtered) players
  // We'll compute stats from the final filtered list below.

 

  // Step 1: apply search + status filters
  const baseFilteredPlayers = players.filter((player) => {
    const coachName = (
      player.coach_name ||
      (getCoachNameById && getCoachNameById(player.coach_id)) ||
      ""
    ).toLowerCase();
    const playerName = (player.name || "").toLowerCase();
    const playerId = (player.player_id || "").toString();

    const matchesSearch =
      playerName.includes(searchTerm.toLowerCase()) ||
      playerId.includes(searchTerm) ||
      coachName.includes(searchTerm.toLowerCase());

    if (filterStatus === "assigned") return matchesSearch && !!player.coach_id;
    if (filterStatus === "unassigned") return matchesSearch && !player.coach_id;
    return matchesSearch;
  });

  // Step 2: apply coach filter if selectedCoach !== 'all'
  const filteredPlayers =
    selectedCoach && selectedCoach !== "all"
      ? baseFilteredPlayers.filter((p) => String(p.coach_id) === String(selectedCoach))
      : baseFilteredPlayers;

  const stats = useMemo(() => {
    const total = filteredPlayers.length;
    const assigned = filteredPlayers.filter((p) => !!p.coach_id).length;
    const unassigned = total - assigned;
    return { total, assigned, unassigned };
  }, [filteredPlayers]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Tabs defaultValue="Assigned" className="space-y-4">
        <Card className="border-t-4 border-t-[#1A9CFF] shadow-card">
          <CardHeader>
            <CardTitle className="text-[#1A9CFF]">
              Assign Student to Teacher
            </CardTitle>
            <CardDescription>
              Select a teacher and students to make an assignment.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Select Teacher</Label>
                <Select
                  value={selectedCoachId}
                  onValueChange={setSelectedCoachId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {coaches.map((coach) => (
                      <SelectItem
                        key={coach.coach_id}
                        value={String(coach.coach_id)}
                      >
                        {coach.coach_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select student(s)</Label>
                <Popover
                  open={isPlayerPopoverOpen}
                  onOpenChange={setIsPlayerPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <span className="truncate">
                        {getSelectedPlayerDisplay()}
                      </span>
                      <Check className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[450px] p-0">
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <ScrollArea className="h-[300px] p-4">
                      <div className="grid grid-cols-2 gap-2">
                        {filteredPlayers.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`p-${player.id}`}
                              checked={selectedPlayers.includes(player.id)}
                              onCheckedChange={() =>
                                handlePlayerCheckboxChange(player.id)
                              }
                            />
                            <Label
                              htmlFor={`p-${player.id}`}
                              className="text-sm font-normal"
                            >
                              {player.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex items-center w-full justify-end">
              <Button
                onClick={handleAssign}
                className="bg-[#1A9CFF] hover:bg-[#1582d8] text-white shadow-sm rounded-xl px-5 transition-all border-none font-medium"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Assign students
              </Button>
            </div>

            <div className="flex justify-between text-sm pt-4 border-t">
              <p>
                Unassigned: {" "}
                <span className="text-red-500 font-bold">{stats.unassigned}</span>
              </p>
              <p>
                Assigned: {" "}
                <span className="text-[#1A9CFF] font-bold">{stats.assigned}</span>
              </p>
              <p>
                Total: <span className="font-bold">{players.length}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        

        {/* Updated Student List Section */}
        <Card className="space-y-6 p-4 md:p-6">
      <CardHeader className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Student Management
          </CardTitle>

          <div className="flex flex-wrap items-center gap-2">

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search name or ID..."
                className="pl-8 w-full md:w-[220px] bg-gray-50 border-gray-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Assigned Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] bg-gray-50">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>

            {/* Coach Dropdown */}
            <Select value={selectedCoach} onValueChange={setSelectedCoach}>
              <SelectTrigger className="w-[170px] bg-gray-50">
                <Users className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Select Coach" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Coaches</SelectItem>

                {coaches.map((coach) => (
                  <SelectItem key={coach.id} value={coach.coach_id}>
                    {coach.coach_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pb-2">
          <div className="bg-gray-50 p-3 rounded-xl border flex items-center space-x-3">
            <Users className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="font-bold text-lg">{stats.total}</p>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-xl border flex items-center space-x-3">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs text-blue-500">Assigned</p>
              <p className="font-bold text-lg text-blue-700">
                {stats.assigned}
              </p>
            </div>
          </div>

          <div className="bg-red-50 p-3 rounded-xl border flex items-center space-x-3">
            <HelpCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-xs text-red-500">Unassigned</p>
              <p className="font-bold text-lg text-red-700">
                {stats.unassigned}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map((player) => {
              const isAssigned = !!player.coach_id;
              const displayCoachName =
                player.coach_name || getCoachNameById(player.coach_id);

              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-4 border rounded-xl hover:shadow-sm bg-white"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`p-2.5 rounded-full ${
                        isAssigned
                          ? "bg-blue-50 text-blue-500"
                          : "bg-gray-50 text-gray-400"
                      }`}
                    >
                      {isAssigned ? (
                        <UserCheck className="h-5 w-5" />
                      ) : (
                        <UserX className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <p className="font-bold text-gray-900">{player.name}</p>
                      <p className="text-xs text-gray-400">
                        ID: {player.player_id}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                    {isAssigned ? (
                      <>
                        <Badge className="bg-blue-500 text-white border-none text-[10px]">
                          ASSIGNED
                        </Badge>

                        <p className="text-xs text-gray-500">
                          Coach:{" "}
                          <span className="text-blue-600 font-bold">
                            {displayCoachName || "N/A"}
                          </span>
                        </p>
                      </>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-gray-400 border-gray-200 text-[10px]"
                      >
                        UNASSIGNED
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 italic">
                No students match your criteria.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
      </Tabs>
    </div>
  );
}
