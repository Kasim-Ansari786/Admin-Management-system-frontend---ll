import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { toast } from "sonner";
import { LogOut, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { useAuth } from "@/contexts/AuthContext";
import PendingRegistrationsComponent from "@/components/dashboards/PendingRegistrations";
import AssignST from "../../pages/AssignST";
import Venues from "@/components/dashboards/Venues";
import PaymentsIndex from "@/components/payments/PaymentsIndex";
import Players from "@/components/dashboards/players";
import Signup from "@/components/dashboards/Signup";
import Footer from "../../components/Footer";
import CoachProfile from "@/components/dashboards/CoachProfile";

import {
  MapPin,
  Heart,
  IndianRupee,
  Users,
  UserPlus,
  TrendingUp,
  AlertCircle,
  DollarSign,
  FileText,
  Settings,
  Edit,
  Globe,
  Bell,
  Loader2,
  ShieldCheck,
  Save,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Search,
  Download,
  Upload,
} from "lucide-react";
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
  AddCoachdata,
  GetCoachDetails,
  UpdateCoachdata,
  GetPlayerDetails,
  GetregistrationsData,
  fetchVenuesdetails,
  getVenuesLocation,
  updateUserAcademy,
  fetchAcademySettings,
} from "../../../api";
const API_URL = "http://localhost:5001";

const CoachFormDialog = ({ isOpen, onClose, coachToEdit, onSave }) => {
  const [formData, setFormData] = useState(
    coachToEdit || {
      coach_id: null,
      coach_name: "",
      phone_numbers: "",
      email: "",
      location: "",
      players: 0,
      salary: 0,
      week_salary: 0,
      category: "",
      status: "Active",
      active: true,
    },
  );

  const [isSaving, setIsSaving] = useState(false);
  const [venues, setVenues] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState(null);
  const { logout } = useAuth();
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
          },
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

  useEffect(() => {
    const loadVenues = async () => {
      setLoadingVenues(true);
      try {
        const data = await getVenuesLocation();
        setVenues(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load venues:", err.message);
      } finally {
        setLoadingVenues(false);
      }
    };

    if (isOpen) {
      loadVenues();
    }
  }, [isOpen, getVenuesLocation]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      console.log("[CoachFormDialog] Submitting formData:", formData);
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error("Failed to save coach:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {coachToEdit ? "Edit Coach" : "Add New Coach"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="coach_name">Coach Name</Label>
              <Input
                id="coach_name"
                value={formData.coach_name}
                onChange={handleChange}
                placeholder="Enter coach name"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="coach@example.com"
              />
            </div>
            <div>
              <Label htmlFor="phone_numbers">Phone</Label>
              <Input
                id="phone_numbers"
                value={formData.phone_numbers}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter location"
              />
            </div>
            <div>
              <Label htmlFor="salary">Monthly Salary</Label>
              <Input
                id="salary"
                type="number"
                value={formData.salary}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="week_salary">Weekly Salary</Label>
              <Input
                id="week_salary"
                type="number"
                value={formData.week_salary}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => handleActiveChange(e.target.checked)}
            />
            <Label htmlFor="active">Active</Label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Coach"}
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
      description: `Player ${registration.name} was rejected.`,
      variant: "destructive",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Review Registration</DialogTitle>
          <DialogDescription>
            Review the registration details below and approve or reject the
            submission.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          <div>
            <p className="font-medium">Name</p>
            <p className="text-sm text-muted-foreground">{registration.name}</p>
          </div>
          <div>
            <p className="font-medium">Guardian Email</p>
            <p className="text-sm text-muted-foreground">
              {registration.guardian_email || registration.email}
            </p>
          </div>
          <div>
            <p className="font-medium">Player Age</p>
            <p className="text-sm text-muted-foreground">
              {registration.age ?? "N/A"}
            </p>
          </div>
          <div>
            <p className="font-medium">Requested Center</p>
            <p className="text-sm text-muted-foreground">
              {registration.center || registration.requested_center || "N/A"}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleReject} className="mr-2">
            Reject
          </Button>
          <Button onClick={handleApprove}>Approve</Button>
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

  useEffect(() => {
    let mounted = true;
    const loadSettings = async () => {
      try {
        const resp = await fetchAcademySettings();
        // API returns an array of rows or an object
        const row = Array.isArray(resp) ? resp[0] : (resp?.data ?? resp);
        const src = Array.isArray(row) ? row[0] : row;
        if (!src) return;
        if (!mounted) return;
        setSettings((prev) => ({
          ...prev,
          id: src.id ?? prev.id,
          siteName: src.site_name ?? prev.siteName,
          defaultCurrency: src.default_currency ?? prev.defaultCurrency,
          foundingDate: src.founding_date
            ? String(src.founding_date).split("T")[0]
            : prev.foundingDate,
          activeSince: src.active_since
            ? String(src.active_since).split("T")[0]
            : prev.activeSince,
          validity: src.validity
            ? String(src.validity).split("T")[0]
            : prev.validity,
          address: src.address ?? prev.address,
          notificationsEnabled:
            typeof src.notifications_enabled === "boolean"
              ? src.notifications_enabled
              : prev.notificationsEnabled,
          autoBackup:
            typeof src.auto_backup === "boolean"
              ? src.auto_backup
              : prev.autoBackup,
        }));
      } catch (err) {
        console.warn(
          "Failed to load academy settings:",
          err?.response?.data || err.message || err,
        );
      }
    };
    loadSettings();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    try {
      const updatedData = await updateUserAcademy(settings);

      // Map back from snake_case to camelCase for state
      setSettings({
        id: updatedData.id,
        siteName: updatedData.site_name,
        defaultCurrency: updatedData.default_currency,
        foundingDate: updatedData.founding_date?.split("T")[0], // format for date input
        activeSince: updatedData.active_since?.split("T")[0],
        validity: updatedData.validity?.split("T")[0],
        address: updatedData.address,
        notificationsEnabled: updatedData.notifications_enabled,
        autoBackup: updatedData.auto_backup,
      });

      toast({
        title: "Settings Saved",
        description: "Academy settings have been successfully updated.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Error",
        description:
          err.response?.data?.message || "Failed to connect to server.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card border-t-4 border-t-[#1A9CFF]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1A9CFF]">
            <Settings className="h-5 w-5" />
            General Academy Settings
          </CardTitle>
          <CardDescription>
            Manage core academy information and operational parameters.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="siteName" className="font-semibold">
                Academy Name
              </Label>
              <Input
                id="siteName"
                placeholder="e.g. Global Sports Academy"
                value={settings.siteName}
                onChange={handleInputChange}
                className="focus-visible:ring-[#1A9CFF]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultCurrency" className="font-semibold">
                Default Currency
              </Label>
              <Input
                id="defaultCurrency"
                placeholder="USD ($)"
                value={settings.defaultCurrency}
                onChange={handleInputChange}
                className="focus-visible:ring-[#1A9CFF]"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="foundingDate"
                className="flex items-center gap-2 font-semibold"
              >
                <Calendar className="h-4 w-4 text-slate-500" /> Founding Date
              </Label>
              <Input
                id="foundingDate"
                type="date"
                value={settings.foundingDate}
                onChange={handleInputChange}
                className="focus-visible:ring-[#1A9CFF]"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="activeSince"
                className="flex items-center gap-2 font-semibold"
              >
                <ShieldCheck className="h-4 w-4 text-slate-500" /> Active Since
                (Service Start)
              </Label>
              <Input
                id="activeSince"
                type="date"
                value={settings.activeSince}
                onChange={handleInputChange}
                className="focus-visible:ring-[#1A9CFF]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="validity" className="font-semibold">
                License/Subscription Validity
              </Label>
              <Input
                id="validity"
                type="date"
                value={settings.validity}
                onChange={handleInputChange}
                className="focus-visible:ring-[#1A9CFF]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label
                htmlFor="address"
                className="flex items-center gap-2 font-semibold"
              >
                <MapPin className="h-4 w-4 text-slate-500" /> Physical Address
              </Label>
              <Textarea
                id="address"
                placeholder="Enter the full academy address..."
                value={settings.address}
                onChange={handleInputChange}
                className="focus-visible:ring-[#1A9CFF] min-h-[80px]"
              />
            </div>
          </div>

          <hr className="my-4 border-slate-100 dark:border-slate-800" />
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-4 bg-blue-50/40 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900 transition-all hover:bg-blue-50/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                  <Bell className="h-5 w-5 text-[#1A9CFF]" />
                </div>
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
                className="data-[state=checked]:bg-[#1A9CFF]"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50/40 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900 transition-all hover:bg-blue-50/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                  <Globe className="h-5 w-5 text-[#1A9CFF]" />
                </div>
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
                className="data-[state=checked]:bg-[#1A9CFF]"
              />
            </div>
          </div>
          <div className="flex justify-end w-full">
            <Button
              onClick={handleSave}
              className="mt-6 py-2 px-6 bg-[#1A9CFF] hover:bg-[#1A9CFF]/90 shadow-[0_4px_16px_-4px_rgba(26,156,255,0.4)] transition-all active:scale-[0.98] text-white font-semibold text-sm flex items-center gap-2 h-auto"
            >
              <Save className="h-4 w-4" />
              Save Academy Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();
  const fileInputRef = useRef(null);
  const [coaches, setCoaches] = useState([{}]);

  const staffData = {};

  // --- REGISTRATIONS STATE (FIXED) ---
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [isRegistrationsLoading, setIsRegistrationsLoading] = useState(true);
  const [registrationsError, setRegistrationsError] = useState(null);

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
      const paymentStatus = (p?.payment_status ?? p?.paymentStatus ?? "")
        .toString()
        .toLowerCase();
      if (paymentStatus.includes("paid")) return acc + 1;
      return acc;
    }, 0);
    return Math.round((completedCount / players.length) * 100);
  }, [players]);

  const [venues, setVenues] = useState([]);
  const [isVenuesLoading, setIsVenuesLoading] = useState(true);
  const [venuesError, setVenuesError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
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
            `HTTP error! Status: ${response.status}`,
        );
      }
      return await response.json();
    } catch (err) {
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        throw new Error(
          "Connection failed. Please ensure your backend server is running on and CORS is configured correctly.",
        );
      }
      throw err;
    }
  };

  const closeCoachModal = () => {
    setIsCoachModalOpen(false);
    setEditingCoach(null);
  };

  const closeReviewModal = () => {
    setIsReviewModalOpen(false);
    setReviewingRegistration(null);
  };

  const closeDeletePlayerModal = () => {
    setIsDeleteModalOpen(false);
    setPlayerToDelete(null);
  };

  const handleSaveCoach = useCallback(
    async (newCoachData) => {
      console.log("[handleSaveCoach] Received newCoachData:", newCoachData);

      const apiData = {
        ...newCoachData,
        coach_name: newCoachData.coach_name ?? newCoachData.name ?? null,
        coach_id:
          newCoachData.coach_id !== undefined && newCoachData.coach_id !== null
            ? newCoachData.coach_id
            : newCoachData.id !== undefined && newCoachData.id !== null
              ? newCoachData.id
              : undefined,
        location: newCoachData.location ?? newCoachData.location ?? null,
      };

      console.log("[handleSaveCoach] Extracted apiData:", apiData);

      const isUpdate = !!apiData.coach_id;
      console.log(
        "[handleSaveCoach] isUpdate:",
        isUpdate,
        "coach_id:",
        apiData.coach_id,
      );

      if (isUpdate) {
        try {
          const result = await UpdateCoachdata(apiData);
          setCoaches((prevCoaches) =>
            prevCoaches.map((coach) => {
              if (String(coach.coach_id) === String(apiData.coach_id)) {
                return {
                  ...coach,
                  ...apiData,
                  name: apiData.coach_name ?? apiData.name ?? coach.name,
                };
              }
              return coach;
            }),
          );

          toast({
            title: "Coach Updated",
            description: "Coach details updated successfully.",
            variant: "success",
          });
        } catch (err) {
          console.error("Update Error:", err);
          toast({ title: "Update Failed", variant: "destructive" });
        }
      } else {
        try {
          const response = await AddCoachdata(apiData);
          const returnedCoach =
            response?.coach ?? response?.data?.coach ?? response;
          const newCoachId =
            returnedCoach?.coach_id ?? returnedCoach?.id ?? null;

          if (!newCoachId) throw new Error("No ID returned from server.");

          const newCoach = {
            ...apiData,
            coach_id: newCoachId,
            name:
              apiData.coach_name ??
              apiData.name ??
              returnedCoach?.coach_name ??
              "",
          };

          setCoaches((prev) => [...prev, newCoach]);

          toast({
            title: "Coach Added",
            description: `Coach ${newCoach.name} added successfully.`,
            variant: "success",
          });
        } catch (err) {
          console.error("Add Error:", err);
          toast({ title: "Add Failed", variant: "destructive" });
        }
      }
      try {
        closeCoachModal();
      } catch {}
    },
    [setCoaches, toast, closeCoachModal, UpdateCoachdata, AddCoachdata],
  );

  // --- Player Delete Logic (No Change) ---
  const handleDeletePlayer = async () => {
    if (!playerToDelete) return;
    try {
      await deletePlayer(playerToDelete.id);
      setPlayers((prevPlayers) =>
        prevPlayers.filter((p) => p.id !== playerToDelete.id),
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
          responseData,
        );
        setAllRegistrations([]);
      }
    } catch (err) {
      console.error("Failed to fetch registrations data:", err);
      setRegistrationsError("Failed to load");
    } finally {
      setIsRegistrationsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrationsData();
  }, [fetchRegistrationsData]);

  const fetchVenuesData = useCallback(async () => {
    setIsVenuesLoading(true);
    setVenuesError(null);
    try {
      const responseData = await fetchVenuesdetails();
      const venuesArray = responseData.data || responseData || [];
      if (Array.isArray(venuesArray)) {
        setVenues(venuesArray);
      } else {
        console.error(
          "fetchVenuesdetails did not return an array:",
          responseData,
        );
        setVenues([]);
      }
    } catch (err) {
      console.error("Failed to fetch venues data:", err);
      setVenuesError("Failed to load");
    } finally {
      setIsVenuesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVenuesData();
  }, [fetchVenuesData]);

  const fetchCoachData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const responseData = await GetCoachDetails();
      const coachArray = Array.isArray(responseData)
        ? responseData
        : responseData?.data || [];
      const mappedData = coachArray.map((coach) => ({
        coach_id: coach.coach_id,
        coach_name: coach.coach_name,
        email: coach.email,
        location: coach.location,
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

  const filteredPlayers = useMemo(() => {
    let currentPlayers = players;
    if (filterStatus !== "All") {
      currentPlayers = currentPlayers.filter(
        (player) => player.status === filterStatus,
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
  const { user, updateAvatar } = useAuth();
  const playersToPaginate = filteredPlayers;
  const indexOfLastPlayer = currentPage * playersPerPage;
  const indexOfFirstPlayer = indexOfLastPlayer - playersPerPage;
  const [logoUrl, setLogoUrl] = useState(user?.logo || null);
  const currentPlayers = playersToPaginate.slice(
    indexOfFirstPlayer,
    indexOfLastPlayer,
  );
  const totalPages = Math.ceil(playersToPaginate.length / playersPerPage);

  useEffect(() => {
    if (user?.logo) {
      setLogoUrl(user.logo);
    }
  }, [user]);

  const getFullImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

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
        venue?.status?.toLowerCase() === "active" || venue?.active === true,
    ).length;
  }, [venues]);

  const venuesCountDisplay = isVenuesLoading ? (
    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
  ) : venuesError ? (
    <AlertCircle className="h-6 w-6 text-red-500" title="API Error" />
  ) : (
    activeVenuesCount
  );

  return (
    <div className="space-y-6 pb-10">
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
      <div
        className="w-full shadow-lg shadow-blue-500/20 animate-fade-in p-6 flex items-center justify-between rounded-b-2xl"
        style={{
          background: `linear-gradient(135deg, #1A9CFF 0%, #0076FF 100%)`,
        }}
      >
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-inner">
            {logoUrl ? (
              <img
                src={getFullImageUrl(logoUrl)}
                alt="Academy Logo"
                className="h-full w-full object-cover"
                onError={() => setLogoUrl(null)}
              />
            ) : (
              <ImageIcon className="h-7 w-7 text-white" />
            )}
          </div>

          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold text-white tracking-tight leading-none">
              Staff Administration
            </h1>
            <p className="text-blue-50 text-sm opacity-90">
              Complete academy management and oversight
            </p>
          </div>
        </div>

        {/* Right Section: Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-all duration-200"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
      {/* Data Cards Grid (FIXED) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-2">
        <Card className="group transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-b-4 border-b-yellow-500 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-50 rounded-lg group-hover:scale-110 transition-transform">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">
                  {pendingCountDisplay}
                </p>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Pending
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Players */}
        <Card className="group transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-b-4 border-b-primary shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    players.length
                  )}
                </p>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Students
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card className="group transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-b-4 border-b-emerald-500 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">
                  {completionRate}%
                </p>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-b-4 border-b-indigo-500 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg group-hover:scale-110 transition-transform">
                <UserPlus className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">
                  {coaches.filter((c) => c.status === "Active").length}
                </p>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Teachers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-b-4 border-b-blue-600 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg group-hover:scale-110 transition-transform">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">
                  {venuesCountDisplay}
                </p>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Centers
                </p>
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
        <TabsList className="grid w-full grid-cols-9 gap-3 p-1 bg-slate-100 rounded-xl border-b-4 border-slate-300 shadow-[0_8px_0_0_rgba(0,0,0,0.1)]">
          <TabsTrigger
            value="dashboard"
            asChild
            className="data-[state=active]:shadow-inner data-[state=active]:translate-y-[2px] data-[state=active]:border-b-0 border-b-2 border-slate-300 bg-white rounded-lg transition-all duration-75 active:scale-95 shadow-sm"
          >
            <Link to="/">Dashboard</Link>
          </TabsTrigger>

          <TabsTrigger value="registrations" className="3d-tab">
            Registrations
          </TabsTrigger>
          <TabsTrigger value="players" className="3d-tab">
            Student Management
          </TabsTrigger>
          <TabsTrigger value="payments" className="3d-tab">
            Payments
          </TabsTrigger>
          <TabsTrigger value="coaches" className="3d-tab">
            Teacher Management
          </TabsTrigger>
          <TabsTrigger value="settings" className="3d-tab">
            Academy Settings
          </TabsTrigger>
          <TabsTrigger value="Assigned" className="3d-tab">
            Assign Students
          </TabsTrigger>
          <TabsTrigger value="venues" className="3d-tab">
            Center Management
          </TabsTrigger>
          <TabsTrigger value="Administrator" className="3d-tab">
            Admin Access
          </TabsTrigger>
        </TabsList>

        <TabsContent value="venues">
          <Venues />
        </TabsContent>

        <TabsContent value="Administrator" className="mt-4">
          <Signup />
        </TabsContent>

        <TabsContent value="registrations">
          <PendingRegistrationsComponent />
        </TabsContent>

        <TabsContent value="Assigned">
          <AssignST />
        </TabsContent>

        <TabsContent value="players">
          <Players />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsIndex />
        </TabsContent>

        <TabsContent value="coaches">
          <CoachProfile />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <AcademySettingsTab />
        </TabsContent>
      </Tabs>
      <div className="flex flex-col overflow-hidden bg-gray-50">
        <Footer />
      </div>
    </div>
  );
};

export default StaffDashboard;
