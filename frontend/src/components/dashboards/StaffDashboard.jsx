import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { useAuth } from "@/contexts/AuthContext";
import PendingRegistrationsComponent from "@/components/dashboards/PendingRegistrations";
import AssignST from "../../pages/AssignST";
import Venues from "@/components/dashboards/Venues";
import PaymentsIndex from "@/components/payments/PaymentsIndex";
import SignupForm from "@/components/auth/SignupForm";

import {
  MapPin,
  IndianRupee,
  Users,
  UserPlus,
  CreditCard,
  Calendar,
  TrendingUp,
  AlertCircle,
  DollarSign,
  FileText,
  Settings,
  Edit,
  Globe,
  Bell,
  LogOut,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Search,
  Download,
  Upload,
} from "lucide-react";
//import { Bell, LogOut } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  GetPlayerDetails,
  deletePlayer,
  AddCoachdata,
  GetCoachDetails,
  UpdateCoachdata,
  DeactivateCoachdata,
  GetregistrationsData,
  fetchVenuesdetails, // VENUES API IMPORT
} from "../../../api";

const CoachFormDialog = ({ isOpen, onClose, coachToEdit, onSave }) => {
  const [formData, setFormData] = useState(
    coachToEdit || {
      coach_id: null,
      coach_name: "",
      phone_numbers: "",
      email: "",
      address: "",
      players: 0,
      salary: 0,
      week_salary: 0,
      category: "",
      status: "Active",
      active: true,
    }
  );

  const [isSaving, setIsSaving] = useState(false);
  const handleActiveChange = (checked) => {
    setFormData((prev) => ({
      ...prev,
      active: checked,
      status: checked ? "Active" : "Inactive",
    }));
  };

  React.useEffect(() => {
    setFormData(
      coachToEdit
        ? {
            ...coachToEdit,
            active: coachToEdit.status === "Active",
          }
        : {
            coach_id: null,
            coach_name: "",
            phone_numbers: "",
            email: "",
            address: "",
            players: 0,
            salary: 0,
            week_salary: 0,
            category: "",
            status: "Active",
            active: true,
            attendance: 0,
          }
    );
  }, [coachToEdit]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]:
        id === "players" ||
        id === "salary" ||
        id === "week_salary" ||
        id === "attendance"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };

  const title = formData.coach_id ? "Edit Coach" : "Add New Coach";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Coach Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="coach_name" className="text-right">
                Name
              </Label>
              <Input
                id="coach_name"
                value={formData.coach_name}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>

            {/* Phone Numbers */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone_numbers" className="text-right">
                Phone
              </Label>
              <Input
                id="phone_numbers"
                value={formData.phone_numbers}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>

            {/* Email */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>

            {/* Address (using Textarea) */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="address" className="text-right pt-2">
                Address
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>

            {/* Salary */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="salary" className="text-right">
                Monthly Salary
              </Label>
              <Input
                id="salary"
                type="number"
                value={formData.salary}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>

            {/* Week Salary */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="week_salary" className="text-right">
                Session Salary
              </Label>
              <Input
                id="week_salary"
                type="number"
                value={formData.week_salary}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>

            {/* Active (Switch) and Status Display */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="active" className="text-right">
                Status
              </Label>
              <div className="col-span-3 flex items-center justify-between">
                <span> {formData.status}</span>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={handleActiveChange}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <>{formData.coach_id ? "Save Changes" : "Add Coach"}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const RegistrationReviewDialog = ({ isOpen, onClose, registration }) => {
  const { toast } = useToast();

  if (!registration) return null;

  const handleApprove = () => {
    toast({
      title: "Registration Approved",
      description: `Player ${registration.name} has been approved and added to active roster.`,
      variant: "success",
    });
    onClose();
  };

  const handleReject = () => {
    toast({
      title: "Registration Rejected",
      description: `Player ${registration.name} was rejected. An email notification has been sent.`,
      variant: "destructive",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Review Registration: {registration.name}</DialogTitle>
          <DialogDescription>
            Review the details before approving or rejecting the player's
            application.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <Label className="text-right">Player Name</Label>
            <p className="col-span-2 font-medium">{registration.name}</p>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label className="text-right">Parent Name</Label>
            <p className="col-span-2">{registration.parent}</p>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label className="text-right">Application Date</Label>
            <p className="col-span-2">{registration.date}</p>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label className="text-right">Current Status</Label>
            <Badge
              className="col-span-2 w-fit"
              variant={
                registration.status === "Pending Payment"
                  ? "destructive"
                  : "secondary"
              }
            >
              {registration.status}
            </Badge>
          </div>
          <div className="grid grid-cols-3 items-center gap-4 pt-4 border-t">
            <Label htmlFor="review-notes" className="text-right">
              Staff Notes
            </Label>
            <Input
              id="review-notes"
              placeholder="Add approval/rejection notes..."
              className="col-span-2"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleReject}>
            Reject
          </Button>
          <Button onClick={handleApprove}>Approve Registration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DeleteConfirmationDialog = ({ isOpen, onClose, onConfirm, name }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <Trash2 className="h-5 w-5" /> Confirm Deletion
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete **{name}**'s player
            record? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- Academy Settings Tab Component (No Change) ---
const AcademySettingsTab = () => {
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    siteName: "Spartan Soccer Academy",
    notificationsEnabled: true,
    autoBackup: true,
    defaultCurrency: "₹ INR",
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setSettings((prev) => ({ ...prev, [id]: value }));
  };

  const handleSwitchChange = (id, checked) => {
    setSettings((prev) => ({ ...prev, [id]: checked }));
  };

  const handleSave = () => {
    console.log("Settings saved:", settings);
    toast({
      title: "Settings Saved",
      description: "General academy settings have been successfully updated.",
      variant: "success",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Academy Settings
          </CardTitle>
          <CardDescription>
            Manage core academy information and operational parameters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Site Name Setting */}
            <div className="space-y-2">
              <Label htmlFor="siteName">Academy Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={handleInputChange}
              />
            </div>

            {/* Currency Setting */}
            <div className="space-y-2">
              <Label htmlFor="defaultCurrency">Default Currency</Label>
              <Input
                id="defaultCurrency"
                value={settings.defaultCurrency}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <hr className="my-4" />

          {/* Notifications Setting */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Enable Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive alerts for new registrations and payments.
                </p>
              </div>
            </div>
            <Switch
              checked={settings.notificationsEnabled}
              onCheckedChange={(checked) =>
                handleSwitchChange("notificationsEnabled", checked)
              }
            />
          </div>

          {/* Backup Setting */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Automatic Data Backup</p>
                <p className="text-sm text-muted-foreground">
                  Automatically back up data every 24 hours.
                </p>
              </div>
            </div>
            <Switch
              checked={settings.autoBackup}
              onCheckedChange={(checked) =>
                handleSwitchChange("autoBackup", checked)
              }
            />
          </div>

          <Button onClick={handleSave} className="w-full mt-6">
            Save Academy Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// --- Pagination Control Component (No Change) ---
const PaginationControls = ({ currentPage, totalPages, paginate }) => {
  if (totalPages <= 1) return null;

  // Simple rendering of all page numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex justify-between items-center pt-4 border-t mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => paginate(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
      </Button>
      <div className="flex gap-1">
        {pageNumbers.map((number) => (
          <Button
            key={number}
            variant={number === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => paginate(number)}
          >
            {number}
          </Button>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => paginate(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
};

// --- Main Staff Dashboard Component ---
const StaffDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();

  const fileInputRef = useRef(null);

  const [coaches, setCoaches] = useState([{}]);

  const staffData = {
    // completionRate will be computed dynamically instead
  };

  // --- REGISTRATIONS STATE (FIXED) ---
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [isRegistrationsLoading, setIsRegistrationsLoading] = useState(true);
  const [registrationsError, setRegistrationsError] = useState(null);

  const paymentOverview = [
    { month: "January", collected: 42000, pending: 3000, total: 45000 },
    { month: "February", collected: 38000, pending: 7600, total: 45600 },
  ];

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [players, setPlayers] = useState([]);

  const completionRate = useMemo(() => {
    if (!Array.isArray(players) || players.length === 0) return 0;
    const completedCount = players.reduce((acc, p) => {
      const s = (p?.status ?? "").toString().toLowerCase().trim();
      if (!s) return acc;
      if (
        s.includes("active") ||
        s.includes("paid") ||
        s.includes("complete") ||
        s.includes("completed") ||
        s.includes("verified")
      ) {
        return acc + 1;
      }
      // fallback: check payment_status or similar fields
      const paymentStatus = (p?.payment_status ?? p?.paymentStatus ?? "")
        .toString()
        .toLowerCase();
      if (paymentStatus.includes("paid")) return acc + 1;
      return acc;
    }, 0);
    return Math.round((completedCount / players.length) * 100);
  }, [players]);

  // --- VENUES STATE (FIXED) ---
  const [venues, setVenues] = useState([]);
  const [isVenuesLoading, setIsVenuesLoading] = useState(true);
  const [venuesError, setVenuesError] = useState(null);

  // --- Search & Filter States (No Change) ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // --- Pagination State (No Change) ---
  const [currentPage, setCurrentPage] = useState(1);
  const playersPerPage = 5;

  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewingRegistration, setReviewingRegistration] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState(null);
  const { authToken } = useAuth();

  // --- EXCEL IMPORT/EXPORT LOGIC (No Change) ---
  const bulkImportApi = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/registrations/import", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message:
            "Server responded with an error, but no JSON error message was provided.",
        }));
        throw new Error(
          errorData.error ||
            errorData.message ||
            `HTTP error! Status: ${response.status}`
        );
      }
      return await response.json();
    } catch (err) {
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        throw new Error(
          "Connection failed. Please ensure your backend server is running on and CORS is configured correctly."
        );
      }
      throw err;
    }
  };

  // --- Modal Open/Close Handlers (No Change) ---

  const openAddCoachModal = () => {
    setEditingCoach(null);
    setIsCoachModalOpen(true);
  };
  const openEditCoachModal = (coach) => {
    setEditingCoach({
      ...coach,
      coach_id: coach.coach_id,
      coach_name: coach.coach_name,
      email: coach.email,
      address: coach.address,
    });
    setIsCoachModalOpen(true);
  };

  const closeCoachModal = () => {
    setIsCoachModalOpen(false);
    setEditingCoach(null);
  };

  const openReviewModal = (registration) => {
    setReviewingRegistration(registration);
    setIsReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setIsReviewModalOpen(false);
    setReviewingRegistration(null);
  };

  const openAddPlayerModal = () => {
    navigate("/add-players");
  };

  const openEditPlayerModal = (player) => {
    navigate(`/edit-player/${player.id}/${player.player_id}`);
  };

  const openDeletePlayerModal = (player) => {
    setPlayerToDelete(player);
    setIsDeleteModalOpen(true);
  };

  const closeDeletePlayerModal = () => {
    setIsDeleteModalOpen(false);
    setPlayerToDelete(null);
  };

  // --- Coach Save/Delete Logic (No Change) ---
  const handleSaveCoach = useCallback(
    async (newCoachData) => {
      const apiData = {
        ...newCoachData,
        coach_name: newCoachData.coach_name ?? newCoachData.name ?? null,
        coach_id: newCoachData.coach_id ?? newCoachData.id ?? undefined,
      };
      const isUpdate = !!apiData.coach_id;
      if (isUpdate) {
        console.log("Executing UPDATE logic...");
        try {
          const result = await UpdateCoachdata(apiData);
          setCoaches((prevCoaches) =>
            prevCoaches.map((coach) => {
              if (String(coach.coach_id) === String(apiData.coach_id)) {
                return {
                  ...coach,
                  ...apiData,
                  coach_name: apiData.coach_name ?? coach.coach_name,
                  name: apiData.name ?? apiData.coach_name ?? coach.name,
                };
              }
              return coach;
            })
          );

          toast({
            title: "Coach Updated",
            description: `Coach ${
              apiData.coach_name ?? apiData.name
            } saved successfully.`,
            variant: "success",
          });
        } catch (err) {
          console.error("Error updating coach:", err);
          toast({
            title: "Coach Update Failed",
            description:
              typeof err === "string"
                ? err
                : err?.message || "Unknown error while updating coach.",
            variant: "destructive",
          });
        }
      } else {
        console.log("Executing INSERT logic...");
        try {
          const response = await AddCoachdata(apiData);
          const returnedCoach =
            response?.coach ??
            response?.data?.coach ??
            response?.coach_data ??
            response;
          const newCoachId =
            returnedCoach?.coach_id ?? returnedCoach?.id ?? null;

          if (!newCoachId) {
            throw new Error(
              "Server did not return a coach ID for the newly created coach."
            );
          }

          const newCoach = {
            ...apiData,
            coach_id: newCoachId,
            name:
              apiData.coach_name ?? apiData.name ?? returnedCoach?.name ?? "",
          };

          setCoaches((prev) => [...prev, newCoach]);

          toast({
            title: "Coach Added",
            description: `New coach ${newCoach.name} has been added.`,
            variant: "success",
          });
        } catch (err) {
          console.error("Error adding coach:", err);
          toast({
            title: "Coach Add Failed",
            description:
              typeof err === "string"
                ? err
                : err?.message || "Unknown API error while adding coach.",
            variant: "destructive",
          });
        }
      }
      try {
        closeCoachModal();
      } catch {}
    },
    [setCoaches, toast, closeCoachModal, UpdateCoachdata, AddCoachdata]
  );

  const handleDeleteCoach = useCallback(
    async (coachId, coachName) => {
      if (
        !window.confirm(
          `Are you sure you want to PERMANENTLY DELETE coach ${coachName}? This action cannot be undone.`
        )
      ) {
        return;
      }

      try {
        await DeactivateCoachdata(coachId);

        toast({
          title: "Coach Deleted",
          description: `Coach ${coachName} has been successfully deleted. The page will now refresh.`,
          variant: "success",
        });

        setTimeout(() => {
          window.location.reload();
        }, 500);
      } catch (error) {
        console.error("Error deleting coach:", error);
        toast({
          title: "Deletion Failed",
          description: `Failed to delete coach. Error: ${
            error.message || "Unknown API error."
          }`,
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  // --- Player Delete Logic (No Change) ---
  const handleDeletePlayer = async () => {
    if (!playerToDelete) return;

    try {
      await deletePlayer(playerToDelete.id);

      setPlayers((prevPlayers) =>
        prevPlayers.filter((p) => p.id !== playerToDelete.id)
      );

      toast({
        title: "Player Deleted",
        description: `The record for ${playerToDelete.name} has been successfully removed.`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: `Failed to delete player. Error: ${
          error.message ||
          "Unknown API error. Please check the API implementation."
        }`,
        variant: "destructive",
      });
    }

    closeDeletePlayerModal();
  };

  // --- Function: Fetch Registrations Data (FIXED) ---
  const fetchRegistrationsData = useCallback(async () => {
    setIsRegistrationsLoading(true);
    setRegistrationsError(null);
    try {
      const responseData = await GetregistrationsData();
      const registrationArray =
        responseData.registrations || responseData.data || responseData || [];

      if (Array.isArray(registrationArray)) {
        setAllRegistrations(registrationArray);
      } else {
        console.error(
          "GetregistrationsData did not return an array:",
          responseData
        );
        setAllRegistrations([]);
      }
    } catch (err) {
      console.error("Failed to fetch registrations data:", err);
      setRegistrationsError("Failed to load"); // Set error state on failure
    } finally {
      setIsRegistrationsLoading(false); // Stop loading
    }
  }, []);

  // --- Effect to fetch registrations data (No Change) ---
  useEffect(() => {
    fetchRegistrationsData();
  }, [fetchRegistrationsData]);

  // --- Function: Fetch Venues Data (FIXED) ---
  const fetchVenuesData = useCallback(async () => {
    setIsVenuesLoading(true);
    setVenuesError(null); // Clear previous error
    try {
      const responseData = await fetchVenuesdetails();
      const venuesArray = responseData.data || responseData || [];

      if (Array.isArray(venuesArray)) {
        setVenues(venuesArray);
      } else {
        console.error(
          "fetchVenuesdetails did not return an array:",
          responseData
        );
        setVenues([]);
      }
    } catch (err) {
      console.error("Failed to fetch venues data:", err);
      setVenuesError("Failed to load"); // Set error state on failure
    } finally {
      setIsVenuesLoading(false); // Stop loading
    }
  }, []);

  // --- Effect to fetch venues data (No Change) ---
  useEffect(() => {
    fetchVenuesData();
  }, [fetchVenuesData]);

  const fetchCoachData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const responseData = await GetCoachDetails();
      const coachArray = responseData.data || [];
      const mappedData = coachArray.map((coach) => ({
        coach_id: coach.coach_id,
        coach_name: coach.coach_name,
        email: coach.email,
        address: coach.address,
        phone_numbers: coach.phone_numbers,
        salary: coach.salary,
        week_salary: coach.week_salary,
        category: coach.category,
        status: coach.status,
      }));

      setCoaches(mappedData);
    } catch (err) {
      console.error("Failed to fetch coach data:", err);
      setError("Failed to fetch coach data. Please log in again.");
      setCoaches([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoachData();
  }, [fetchCoachData]);

  const fetchPlayers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const playersArray = await GetPlayerDetails();
      if (!Array.isArray(playersArray)) {
        throw new Error("API response is not an array of players.");
      }

      const mappedData = playersArray.map((player) => ({
        id:
          player.id ?? player.player_id ?? Math.random().toString(36).slice(2),
        player_id: player.player_id ?? player.id ?? "N/A",
        name: player.name ?? player.full_name ?? "Unknown Player",
        age: player.age ?? 0,
        address: player.address ?? "",
        phone_no: player.phone_no ?? player.phone ?? "",
        center_name: player.center_name ?? player.center ?? "",
        coach_name: player.coach_name ?? player.coach ?? "",
        category: player.category ?? "General",
        status: player.status ?? "Unknown",
      }));

      setPlayers(mappedData);
      console.log(`Successfully loaded ${mappedData.length} players.`);
    } catch (err) {
      console.error("Fetch Players Error:", err);
      const status = err?.response?.status;
      const message =
        err?.response?.data?.error ?? err.message ?? "Failed to load players.";
      setError(message);
      toast({
        title: "Unable to load players",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, navigate, logout, setPlayers, setIsLoading, setError]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const handleSendReminders = () => {
    toast({
      title: "Reminders Sent",
      description:
        "Payment reminders sent to all players with pending balances.",
      variant: "success",
    });
  };

  const handleGenerateReport = () => {
    toast({
      title: "Report Generating",
      description:
        "Generating detailed monthly payment report. Check downloads shortly.",
      variant: "success",
    });
  };

  const handlePaymentSettings = () => {
    toast({
      title: "Feature Simulated",
      description:
        "Attempting to open payment gateway configuration settings...",
      variant: "secondary",
    });
  };

  const handlePaymentSchedule = () => {
    toast({
      title: "Schedule View",
      description: "Displaying recurring payment schedule overview.",
      variant: "secondary",
    });
  };

  const handleSignOut = () => {
    logout();
    toast({
      title: "Signed Out",
      description:
        "You have been securely logged out and redirected to the login page.",
      variant: "success",
    });
    navigate("/auth");
  };


  const filteredPlayers = useMemo(() => {
    let currentPlayers = players;

    if (filterStatus !== "All") {
      currentPlayers = currentPlayers.filter(
        (player) => player.status === filterStatus
      );
    }

    if (!searchTerm) return currentPlayers;

    const lowerCaseSearch = searchTerm.toLowerCase().trim();

    return currentPlayers.filter((player) => {
      if (player.name && player.name.toLowerCase().includes(lowerCaseSearch)) {
        return true;
      }
      if (
        player.player_id &&
        player.player_id.toLowerCase().includes(lowerCaseSearch)
      ) {
        return true;
      }
      if (player.phone_no) {
        const cleanedPhone = player.phone_no.replace(/\D/g, "");
        if (cleanedPhone.includes(lowerCaseSearch.replace(/\D/g, ""))) {
          return true;
        }
      }
      return false;
    });
  }, [players, searchTerm, filterStatus]);
  const validTabs = [
    "registrations",
    "players",
    "payments",
    "coaches",
    "settings",
    "Assigned",
    "venues",
    "Administrator",
  ];

  const searchParams = new URLSearchParams(location.search);
  const urlTab = searchParams.get("tab");
  const defaultTab = validTabs.includes(urlTab) ? urlTab : "registrations";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const playersToPaginate = filteredPlayers;
  const indexOfLastPlayer = currentPage * playersPerPage;
  const indexOfFirstPlayer = indexOfLastPlayer - playersPerPage;
  const currentPlayers = playersToPaginate.slice(
    indexOfFirstPlayer,
    indexOfLastPlayer
  );
  const totalPages = Math.ceil(playersToPaginate.length / playersPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const handleTabClick = (value) => {
    if (value === "venues") {
      navigate("/venues");
    } else if (value === "players") {
      navigate("/add-player");
    }
  };

  const handleTabChange = (newTab) => {
    if (validTabs.includes(newTab)) {
      setActiveTab(newTab);
      navigate(`?tab=${newTab}`, { replace: true });
    }
  };


  const pendingRegistrationsCount = useMemo(() => {
    if (!Array.isArray(allRegistrations)) return 0;

    return allRegistrations.filter((reg) => {
      const status = reg?.status;
      if (typeof status === "string") {
        return status.toLowerCase().includes("pending");
      }
      return false;
    }).length;
  }, [allRegistrations]);

  const pendingCountDisplay = isRegistrationsLoading ? (
    <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
  ) : registrationsError ? (
    <AlertCircle className="h-6 w-6 text-red-500" title="API Error" />
  ) : (
    pendingRegistrationsCount
  );

  // 2. Active Venues Count Logic
  const activeVenuesCount = useMemo(() => {
    if (!Array.isArray(venues)) return 0;

    return venues.filter(
      (venue) =>
        venue?.status?.toLowerCase() === "active" || venue?.active === true
    ).length;
  }, [venues]);

  const venuesCountDisplay = isVenuesLoading ? (
    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
  ) : venuesError ? (
    <AlertCircle className="h-6 w-6 text-red-500" title="API Error" />
  ) : (
    activeVenuesCount
  );

  const handleNotifications = () => {
    // Your notifications logic here
    console.log("Opening notifications...");
  };

  return (
    <div className="space-y-6">
      <CoachFormDialog
        isOpen={isCoachModalOpen}
        onClose={closeCoachModal}
        coachToEdit={editingCoach}
        onSave={handleSaveCoach}
      />

      <RegistrationReviewDialog
        isOpen={isReviewModalOpen}
        onClose={closeReviewModal}
        registration={reviewingRegistration}
      />

      <DeleteConfirmationDialog
        isOpen={isDeleteModalOpen}
        onClose={closeDeletePlayerModal}
        onConfirm={handleDeletePlayer}
        name={playerToDelete?.name || "this player"}
      />

      <div className="bg-gradient-primary rounded-xl p-6 text-primary-foreground flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold mb-2">Staff Administration</h1>
          <p className="text-primary-foreground/80">
            Complete academy management and oversight
          </p>
        </div>

        <div className="flex items-center gap-3">         
          <Button
            variant="secondary"
            className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Data Cards Grid (FIXED) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">
                  {pendingCountDisplay}
                </p>
                <p className="text-xs text-muted-foreground">
                  Pending Registrations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Players Card */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    players.length
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Total Players</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <div>
                <p className="text-2xl font-bold">{completionRate}%</p>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {coaches.filter((c) => c.status === "Active").length}
                </p>
                <p className="text-xs text-muted-foreground">Active Coaches</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Venues Card - FIXED */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {venuesCountDisplay} 
                </p>
                <p className="text-xs text-muted-foreground">Active Venues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="players">Player Management</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="coaches">Coach Management</TabsTrigger>
          <TabsTrigger value="settings">Academy Settings</TabsTrigger>
          <TabsTrigger value="Assigned">Assign Players</TabsTrigger>
          <TabsTrigger value="venues">Venue Management</TabsTrigger>
          <TabsTrigger value="Administrator">Admin Access</TabsTrigger>
        </TabsList>

        <TabsContent value="venues">
          <Venues />
        </TabsContent>

        <TabsContent value="Administrator" className="mt-4">
          <SignupForm />
        </TabsContent>

        <TabsContent value="registrations">
          <PendingRegistrationsComponent />
        </TabsContent>

       
        <TabsContent value="Assigned">
          <AssignST />
        </TabsContent>

        <TabsContent value="players" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Player Management
                </CardTitle>
                <CardDescription>
                  Manage all registered players and their details
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-end gap-3 w-full max-w-lg ml-auto">
                <div className="relative w-full sm:w-[250px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by name, player ID, or phone number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-[150px] flex-shrink-0">
                    <span className="text-muted-foreground mr-2">Status:</span>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={openAddPlayerModal}
                  className="w-full sm:w-auto flex-shrink-0"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add New Player
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {isLoading ? (
                  <div className="flex justify-center items-center p-8 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Fetching player data...
                  </div>
                ) : currentPlayers.length === 0 ? (
                  <div className="flex flex-col justify-center items-center p-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <p className="font-medium">
                      {searchTerm || filterStatus !== "All"
                        ? `No results found for current filters.`
                        : "No Player Records Found"}
                    </p>
                    <p className="text-sm">
                      Click "Add New Player" or check your server connection.
                    </p>
                    {error && (
                      <p className="text-xs text-red-500 mt-2">
                        Error: {error}
                      </p>
                    )}
                  </div>
                ) : (
                  currentPlayers.map((player, _pidx) => (
                    <div
                      key={player?.id ?? player?.player_id ?? `player-${_pidx}`}
                      className="flex items-start justify-between p-4 bg-muted rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold shrink-0 mt-1">
                          {(player.name || "").charAt(0).toUpperCase() || "-"}
                        </div>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {player.name}{" "}
                            <Badge
                              variant="secondary"
                              className="ml-2 font-mono"
                            >
                              {player.player_id}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Age {player.age} • Center: {player.center_name}
                          </p>
                          <p className="text-xs text-muted-foreground max-w-md">
                            Address: {player.address} • Phone: {player.phone_no}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Coach: {player.coach_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge
                          variant={
                            player.status === "Active" ? "default" : "secondary"
                          }
                        >
                          {player.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditPlayerModal(player)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDeletePlayerModal(player)}
                          className="p-2 h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {filteredPlayers.length > playersPerPage && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  paginate={paginate}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsIndex />
        </TabsContent>        
        
        <TabsContent value="coaches" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Coach Management
                </CardTitle>
                <CardDescription>
                  Manage coaching staff and their assignments
                </CardDescription>
              </div>
              <Button size="sm" onClick={openAddCoachModal}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Coach
              </Button>
            </CardHeader>

            <CardContent className="pt-4">
              <div className="space-y-3">
                {coaches.map((coach, _cidx) => (
                  <div
                    key={coach?.coach_id ?? coach?.id ?? `coach-${_cidx}`}
                    className="flex items-center justify-between p-4 bg-muted rounded-lg cursor-pointer hover:bg-accent"
                    onClick={() => navigate(`/coach-old/${coach.coach_id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                        {coach.coach_name ? coach.coach_name.charAt(0) : "?"}
                      </div>

                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {coach.coach_name}
                          <span className="text-sm font-normal text-gray-500">
                            ({coach.phone_numbers})
                          </span>
                          <span className="text-sm font-normal text-green-600">
                            (₹{coach.week_salary} /session)
                          </span>
                        </p>

                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span className="font-normal">{coach.email}</span>
                          <span className="font-normal">• {coach.address}</span>
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium">
                          ₹{Number(coach.salary ?? 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Monthly</p>
                      </div>

                      <Badge
                        variant={
                          coach.status === "Active" ? "default" : "secondary"
                        }
                      >
                        {coach.status}
                      </Badge>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditCoachModal(coach)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          handleDeleteCoach(
                            coach.id || coach.coach_id,
                            coach.coach_name
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <AcademySettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StaffDashboard;
