import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Users,
  Search,
  Mail,
  Phone,
  Eye,
  X,
  Copy,
  EyeOff,
  MessageCircle,
  Check,
  UserPlus,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  Upload,
  Download,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  GetPlayerDetails,
  uploadPlayersExcelData,
  deletePlayer,
} from "../../../api";

const API_BASE_URL = "http://localhost:5001";

const makeFullUrl = (raw) => {
  if (!raw) return null;
  if (raw.startsWith("http")) return raw;
  // ensure exactly one slash between base and path
  if (raw.startsWith("/")) return `${API_BASE_URL}${raw}`;
  return `${API_BASE_URL}/${raw}`;
};

const rewriteDevHost = (url) => {
  try {
    if (!url || typeof url !== "string") return url;
    const apiHost = new URL(API_BASE_URL).host;
    if (url.includes("localhost:3000")) {
      return url.replace(/localhost:3000/g, apiHost);
    }
    return url;
  } catch (e) {
    return url;
  }
};

const StudentManagementPage = () => {
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  const fileInputRef = useRef(null);
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const playersPerPage = 8;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState(null);
  const [createdAccounts, setCreatedAccounts] = useState([]);
  const [showCreatedAccounts, setShowCreatedAccounts] = useState(false);
  const [showCredentials, setShowCredentials] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [showWhatsAppList, setShowWhatsAppList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPlayers = useCallback(async () => {
    setIsLoading(true);

    try {
      let playersArray = await GetPlayerDetails();      
      if (!playersArray) playersArray = [];
      if (!Array.isArray(playersArray)) {
        if (Array.isArray(playersArray.data)) playersArray = playersArray.data;
        else if (Array.isArray(playersArray.players)) playersArray = playersArray.players;
        else if (Array.isArray(playersArray.result)) playersArray = playersArray.result;
        else playersArray = [];
      }

      console.debug("Fetched players count:", playersArray.length);

      const mappedData = playersArray.map((player, idx) => {
        const fallbackId = `${player.player_id || player.email || player.name || 'p'}-${idx}`;
        return {
          id: player.id ?? player.player_id ?? fallbackId,
          player_id: player.player_id ?? String(player.id ?? fallbackId),
          name: player.name ?? player.full_name ?? "Unknown",
          age: player.age ?? 0,
          address: player.address ?? "",
          phone_no: player.phone_no ?? player.phone ?? "",
          email_id: player.email_id ?? player.email ?? "",
          status: player.status ?? "Active",
          guardian_email_id: player.guardian_email_id || null,
          login_email: player.login_email || player.email || player.email_id || null,
          contact_email:
            player.guardian_email_id || player.login_email || player.email || player.email_id || null,
          login_password: player.login_password || null,
          profile_photo_path: makeFullUrl(player.profile_photo_path || player.profile_photo || player.profile_image_path),
          gender: player.gender || player.sex || player.gender_value || "",
          date_of_birth: player.date_of_birth || player.dob || "",
          blood_group: player.blood_group || player.bloodgroup || "",
        };
      });

      setPlayers(mappedData);
    } catch (err) {
      uiToast({
        title: "Fetch Failed",
        description: "Could not load students.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [uiToast]);

  const copyToClipboard = async (text, id) => {
    try {
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (e) {
      console.warn("Clipboard write failed", e);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedExtensions = ["xlsx", "xls", "csv"];
    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      uiToast({
        title: "Invalid File",
        description: "Only Excel (.xlsx, .xls) or CSV files are allowed.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const result = await uploadPlayersExcelData(file);
      uiToast({
        title: "Import Successful",
        description: result.message,
      });
      if (
        result &&
        Array.isArray(result.createdAccounts) &&
        result.createdAccounts.length > 0
      ) {
        setCreatedAccounts(result.createdAccounts);
        setShowCreatedAccounts(true);
      }
      if (typeof fetchPlayers === "function") {
        await fetchPlayers();
        if (
          result &&
          Array.isArray(result.createdAccounts) &&
          result.createdAccounts.length > 0
        ) {
          // Update existing players in-place to keep name/email pairing correct.
          setPlayers((prev) =>
            prev.map((p) => {
              const match = result.createdAccounts.find(
                (a) => a.email && p.login_email && a.email.toLowerCase() === p.login_email.toLowerCase(),
              );
              if (match) {
                return {
                  ...p,
                  login_password: match.tempPassword,
                  login_email: match.email,
                  contact_email: match.email,
                };
              }

              const byName = result.createdAccounts.find(
                (a) => a.playerName && p.name && a.playerName === p.name,
              );
              if (byName) {
                return {
                  ...p,
                  login_password: byName.tempPassword,
                  login_email: byName.email,
                  contact_email: byName.email,
                };
              }
              return p;
            }),
          );
        }
      }
    } catch (err) {
      console.error("Import error:", err);
      const errorMsg = err.response?.data?.details || err.message;
      const errorHint = err.response?.data?.hint
        ? ` (${err.response.data.hint})`
        : "";
      uiToast({
        title: "Import Failed",
        description: errorMsg + errorHint,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      event.target.value = "";
    }
  };

  const filteredPlayers = useMemo(() => {
    const lowerSearch = (searchTerm || "").toLowerCase();
    return players.filter((player) => {
      const name = (player.name || "").toLowerCase();
      const pid = String(player.player_id || "").toLowerCase();
      const matchesSearch =
        name.includes(lowerSearch) || pid.includes(lowerSearch);
      const matchesStatus =
        filterStatus === "All" || player.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, filterStatus, players]);

  const openWhatsApp = (rawNumber, name) => {
    const n = String(rawNumber || "").replace(/[^0-9]/g, "");
    if (!n) {
      uiToast({
        title: "No phone number",
        description: "This contact has no phone number.",
        variant: "destructive",
      });
      return;
    }
    // If 10 digits, assume India and prefix 91
    let phone = n;
    if (phone.length === 10) phone = `91${phone}`;
    const url = `https://wa.me/${phone}`;
    window.open(url, "_blank");
  };

  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);
  const currentPlayers = filteredPlayers.slice(
    (currentPage - 1) * playersPerPage,
    currentPage * playersPerPage,
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const openDeletePopUp = (player) => {
    setPlayerToDelete(player);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!playerToDelete) return;
    try {
      await deletePlayer(playerToDelete.id);
      setPlayers((prevPlayers) =>
        prevPlayers.filter((p) => p.id !== playerToDelete.id),
      );
      uiToast({
        title: "Player Deleted",
        description: `The record for ${playerToDelete.name} has been successfully removed.`,
        variant: "success",
      });
    } catch (error) {
      uiToast({
        title: "Delete Failed",
        description:
          error.message || "Failed to delete player. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const openAddPlayerModal = () => navigate("/add-players");
  const openEditPlayerModal = (player) =>
    navigate(`/edit-player/${player.id}/${player.player_id}`);

  const handleDownloadSample = () => {
    const columns = [
      "name",
      "father_name",
      "mother_name",
      "gender",
      "date_of_birth",
      "age",
      "blood_group",
      "email_id",
      "phone_no",
      "emergency_contact_number",
      "guardian_contact_number",
      "guardian_email_id",
      "address",
      "medical_condition",
      "pincode",
      "area",
    ];
    const worksheet = XLSX.utils.json_to_sheet([], { header: columns });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SampleData");
    XLSX.writeFile(workbook, "Student_Import_Sample.xlsx");
  };

  return (
    <div className="space-y-3">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv, .xlsx, .xls"
        className="hidden"
      />

      <Card className="shadow-card border-slate-200">
        <CardHeader className="flex flex-col lg:flex-row items-start justify-between space-y-4 lg:space-y-0 pb-6 border-b border-slate-50">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-3 text-2xl font-bold text-slate-800">
              <div className="p-2 bg-[#1A9CFF]/10 rounded-lg">
                <Users className="h-6 w-6 text-[#1A9CFF]" />
              </div>
              Student Management
            </CardTitle>
            <CardDescription className="text-base text-slate-500 lg:ml-[52px]">
              Showing {currentPlayers.length} of {filteredPlayers.length}{" "}
              Students
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-4xl lg:justify-end">
            <div className="relative w-full sm:w-[380px] lg:w-[480px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search...Phone, Name, ID"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 h-11 focus-visible:ring-[#1A9CFF]"
              />
            </div>

            <Select
              value={filterStatus}
              onValueChange={(val) => {
                setFilterStatus(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px] h-11">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              disabled={isLoading}
              onClick={handleImportClick}
              className="bg-[#1A9CFF] hover:bg-[#1582d8] text-white h-11 w-full sm:w-auto"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Import Excel
            </Button>

            <Button
              onClick={openAddPlayerModal}
              className="bg-[#1A9CFF] hover:bg-[#1582d8] text-white h-11 w-full sm:w-auto"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Student
            </Button>

            <Button
              variant="outline"
              onClick={handleDownloadSample}
              className="border-[#1A9CFF] text-[#1A9CFF] hover:bg-[#1A9CFF]/10 h-11"
            >
              <Download className="h-4 w-4 mr-2" /> Sample
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {isLoading ? (
              <div className="fleux flex-col justify-center items-center p-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-[#1A9CFF] mb-2" />
                <p>Processing request...</p>
              </div>
            ) : currentPlayers.length === 0 ? (
              <div className="flex flex-col justify-center items-center p-12 text-muted-foreground border-2 border-dashed rounded-xl border-slate-100">
                <AlertCircle className="h-10 w-10 mb-3 opacity-20" />
                <p className="font-medium text-slate-600">
                  {searchTerm || filterStatus !== "All"
                    ? `No results found for current filters.`
                    : "No Student Records Found"}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {/* TABLE HEADER */}
                <div className="hidden xl:grid grid-cols-12 gap-2 px-4 py-3 text-[11px] font-extrabold text-slate-700 uppercase tracking-widest bg-slate-50 border border-slate-300 rounded-t-lg shadow-sm">
                  <div className="col-span-2">Student</div>
                  <div className="col-span-2">Contact & Email</div>
                  <div className="col-span-1 text-center border-l border-slate-200">
                    Gender
                  </div>
                  <div className="col-span-1 text-center border-l border-slate-200">
                    DOB
                  </div>
                  <div className="col-span-1 text-center border-l border-slate-200">
                    Age
                  </div>
                  <div className="col-span-1 text-center border-l border-slate-200">
                    Blood
                  </div>
                  <div className="col-span-1 text-center border-l border-slate-200">
                    Login Email
                  </div>
                  <div className="col-span-1 text-center border-l border-slate-200">
                    Status
                  </div>
                  <div className="col-span-1 text-right border-l border-slate-200">
                    Actions
                  </div>
                </div>

                {/* TABLE BODY */}
                {currentPlayers.map((player, _pidx) => (
                  <div
                    key={player?.id || `player-${_pidx}`}
                    className="grid grid-cols-12 items-center gap-2 p-3 bg-slate-50 hover:bg-white border border-slate-100 hover:border-[#1A9CFF]/30 rounded-lg transition-all"
                  >
                    {/* STUDENT */}
                    <div className="col-span-2 flex items-center gap-2 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#1A9CFF] flex items-center justify-center text-white font-bold overflow-hidden">
                        {(() => {
                          const raw =
                            player.profile_photo_path ||
                            player.profile_photo ||
                            null;
                          if (!raw) {
                            return (
                              <span className="text-xs">
                                {(player.name || "P").charAt(0)}
                              </span>
                            );
                          }
                          const url = makeFullUrl(raw);
                          const rewritten = rewriteDevHost(url);
                          const safeUrl = rewritten
                            ? encodeURI(rewritten)
                            : null;
                          return (
                            <img
                              src={safeUrl}
                              alt={player.name || "player"}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = `${API_BASE_URL}/uploads/placeholder.png`;
                              }}
                            />
                          );
                        })()}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-slate-800 text-xs truncate">
                          {player.name}
                        </span>
                        <span className="text-[10px] text-[#1A9CFF] font-mono">
                          ID: {player.player_id}
                        </span>
                      </div>
                    </div>

                    {/* CONTACT */}
                    <div className="col-span-2 flex flex-col">
                      <span className="text-xs text-slate-600">
                        +91 {player.phone_no}
                      </span>

                      <div className="flex items-center gap-1 text-slate-400">
                        <Mail className="h-3 w-3" />
                        <span className="text-[10px] truncate">{player.email_id || "-"}</span>
                      </div>
                    </div>

                    {/* GENDER */}
                    <div className="col-span-1 text-center text-xs text-slate-600">
                      {player.gender}
                    </div>

                    {/* DOB */}
                    <div className="col-span-1 text-center text-xs text-slate-600">
                       {new Date(player.date_of_birth).toLocaleDateString()}
                    </div>

                    {/* AGE */}
                    <div className="col-span-1 text-center">
                      <Badge variant="outline" className="text-[10px]">
                        {player.age} yrs
                      </Badge>
                    </div>

                    {/* BLOOD */}
                    <div className="col-span-1 text-center">
                      <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">
                        {player.blood_group}
                      </span>
                    </div>

                    {/* LOGIN EMAIL */}
                    <div className="col-span-1 text-center font-mono text-xs truncate">
                      {player.login_email}
                    </div>

                    {/* PASSWORD */}
                    {/* <div className="col-span-1 flex items-center gap-1">
                      <span className="font-mono text-xs w-16 truncate">
                        {showCredentials[player.id]
                          ? player.login_password
                          : "••••••••"}
                      </span>

                      <div className="flex gap-0">
                        <Button
                          type="button" // Important: prevents form submission if inside a form
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevents bubbling if the row is clickable
                            setShowCredentials((prev) => ({
                              ...prev,
                              [player.id]: !prev[player.id],
                            }));
                          }}
                        >
                          {showCredentials[player.id] ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>

                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(player.login_password, player.id);
                          }}
                        >
                          {copiedId === player.id ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div> */}

                    {/* STATUS */}
                    <div className="col-span-1 flex items-center justify-center">
                      <div
                        className={`h-2 w-2 rounded-full mr-1 ${
                          player.status === "Active"
                            ? "bg-emerald-500"
                            : "bg-slate-300"
                        }`}
                      />
                      <span className="text-[10px] font-bold uppercase text-slate-500">
                        {player.status}
                      </span>
                    </div>

                    {/* ACTIONS */}
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-slate-400 hover:text-[#1A9CFF]"
                        onClick={() => openEditPlayerModal(player)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"
                        onClick={() => openDeletePopUp(player)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PAGINATION (Same as before) */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-1 border-t pt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => paginate(currentPage - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => paginate(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating WhatsApp Button */}
      <button
        onClick={() => setShowWhatsAppList(!showWhatsAppList)}
        className="fixed bottom-20 right-6 z-50 w-14 h-14 bg-[#1A9CFF] hover:bg-[#1A9CFF] text-white rounded-full shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        title="Send WhatsApp Message"
      >
        <MessageCircle className="h-7 w-7" />
      </button>

      {/* WhatsApp Contact List Popup */}
      {showWhatsAppList && (
        <div className="fixed bottom-32 right-6 z-50 w-80 max-h-[32rem] bg-white border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200 flex flex-col">
          <div className="bg-[#1A9CFF] text-white p-4 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-full">
                  <MessageCircle className="h-5 w-5 fill-white text-[#1A9CFF]" />
                </div>
                <span className="font-bold tracking-wide">
                  WhatsApp Contacts
                </span>
              </div>
              <button
                onClick={() => {
                  setShowWhatsAppList(false);
                  setSearchQuery("");
                }}
                className="hover:bg-black/10 rounded-full p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modern Search Bar */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70 group-focus-within:text-white" />
              <input
                type="text"
                placeholder="Search name or number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/20 border border-transparent rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/70 focus:bg-white/30 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Scrollable List Section */}
          <div className="overflow-y-auto flex-1 bg-[#1A9CFF] custom-scrollbar">
            {players
              .filter((p) => p.status === "Active")
              .filter((p) => {
                const q = String(searchQuery || "").toLowerCase();
                const name = String(p.name || "").toLowerCase();
                const phone = String(p.phone_no || "");
                return name.includes(q) || phone.includes(q);
              })
              .map((player) => {
                const displayName =
                  player.name || player.full_name || "Unknown";
                const rawPhone = String(
                  player.phone_no || player.phone || "",
                ).replace(/[^0-9]/g, "");
                const displayPhone = rawPhone
                  ? rawPhone.length === 10
                    ? `+91 ${rawPhone}`
                    : `+${rawPhone}`
                  : "No number";

                return (
                  <button
                    key={player.id}
                    onClick={() => openWhatsApp(player.phone_no, player.name)}
                    className="w-full flex items-center gap-3 p-4 bg-white hover:bg-[#1A9CFF]/10 transition-colors border-b border-gray-100 text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#1A9CFF]/10 flex items-center justify-center text-[#1A9CFF] font-bold text-base shrink-0 border border-[#1A9CFF]/20">
                      {String(displayName).charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3 text-green-500" />
                        {displayPhone}
                      </p>
                    </div>

                    <MessageCircle className="h-5 w-5 text-[#1A9CFF] opacity-80" />
                  </button>
                );
              })}

            {/* No Results UI */}
            {players.filter(
              (p) =>
                p.status === "Active" &&
                (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.phone_no.includes(searchQuery)),
            ).length === 0 && (
              <div className="flex flex-col items-center justify-center p-10 text-center">
                <Search className="h-10 w-10 text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">
                  No contacts found for "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete
              <span className="font-bold text-slate-900">
                {" "}
                {playerToDelete?.name}
              </span>
              's record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete Student
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StudentManagementPage;
