import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  Edit,
  Users,
  Trash2,
  UserPlus,
  FileDown,
  FileUp,
  Upload,
  ChevronLeft,
  Download,
  ChevronRight,
  Search,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  GetPlayerDetails,
  deletePlayer,
  AddCoachdata,
  GetCoachDetails,
  UpdateCoachdata,
  importExcelInsert,
  DeactivateCoachdata,
  GetregistrationsData,
  fetchVenuesdetails,
  getVenuesLocation,
} from "../../../api";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const CoachProfile = ({}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  // Data State
  const [coaches, setCoaches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isImporting, setIsImporting] = useState(false);
  const recordsPerPage = 8;

  const [formData, setFormData] = useState({
    coach_name: "",
    email: "",
    phone_numbers: "",
    salary: "",
    week_salary: "",
    profile_img: null,
    active: true,
    status: "Active",
  });

  const [loadingVenues, setLoadingVenues] = useState(false);
  const [venues, setVenues] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const title = formData?.coach_id ? "Edit Coach" : "Add Coach";
  const coachImageRef = useRef(null);

  const handleCoachImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setFormData((prev) => ({
      ...prev,
      profile_img: previewUrl,
      profile_img_file: file,
    }));
  };

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
      setError("Failed to fetch coach data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoachData();
  }, [fetchCoachData]);

  const filteredCoaches = coaches.filter((coach) => {
    const nameMatch = coach.coach_name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const phoneMatch = coach.phone_numbers
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    return nameMatch || phoneMatch;
  });

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

  // Pagination Logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredCoaches.slice(
    indexOfFirstRecord,
    indexOfLastRecord,
  );
  const totalPages = Math.ceil(filteredCoaches.length / recordsPerPage);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const onClose = (open) => {
    setIsOpen(open);
    if (!open) {
      setFormData({
        coach_name: "",
        email: "",
        phone_numbers: "",
        salary: "",
        week_salary: "",
        profile_img: null,
        active: true,
        status: "Active",
      });
    }
  };

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));

  const handleLocationChange = (value) => {
    const selectedVenue = venues.find((loc) => {
      const id = loc.id ?? loc.raw?.id;
      return String(id) === value;
    });

    const venueDisplayName =
      selectedVenue?.name || selectedVenue?.center_head || value;

    setFormData((prev) => ({
      ...prev,
      location_id: value,
      location: venueDisplayName,
    }));
  };

  const handleActiveChange = (val) =>
    setFormData((prev) => ({
      ...prev,
      active: val,
      status: val ? "Active" : "Inactive",
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const data = new FormData();
      data.append("coach_name", formData.coach_name);
      data.append("email", formData.email);
      data.append("phone_numbers", formData.phone_numbers);
      data.append("salary", formData.salary || "");
      data.append("week_salary", formData.week_salary || "");
      data.append("active", formData.active);
      data.append("status", formData.active ? "Active" : "Inactive");
      data.append("location", formData.location || "");
      if (formData.profile_img_file) {
        data.append("profile_img", formData.profile_img_file);
      }

      if (formData.coach_id) {
        data.append("coach_id", formData.coach_id);
        await UpdateCoachdata(data);
      } else {
        await AddCoachdata(data);
      }

      toast({ description: "Teacher saved successfully!" });
      setIsOpen(false);
      fetchCoachData();
    } catch (error) {
      toast({ variant: "destructive", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const openAddCoachModal = () => {
    setFormData({
      coach_name: "",
      email: "",
      phone_numbers: "",
      salary: "",
      week_salary: "",
      profile_img: null,
      active: true,
      status: "Active",
    });
    setIsOpen(true);
  };

  const openEditCoachModal = (coach) => {
    setFormData({
      coach_id: coach.coach_id,
      coach_name: coach.coach_name || coach.name || "",
      email: coach.email || "",
      phone_numbers: coach.phone_numbers || "",
      salary: coach.salary || "",
      week_salary: coach.week_salary || "",
      profile_img: null,
      active:
        coach.active !== undefined ? coach.active : coach.status === "Active",
      status: coach.status || "Active",
      location: coach.location || "",
      address: coach.address || "",
    });
    setIsOpen(true);
  };

  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsImporting(true);
    try {
      await importExcelInsert(file);
      toast({ title: "Success", description: "Import Successful!" });
      fetchCoachData();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Import failed. Check console.",
      });
    } finally {
      setIsImporting(false);
      event.target.value = null;
    }
  };

 const handleDownloadSample = () => {
    const templateData = [
      {
        "Coach Name": "John Doe",
        "Phone": "1234567890",
        "Email": "john@example.com",
        "Location": "Main Center",
        "Salary": 50000,
        "Week Salary": 1500,
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Teacher_Upload_Sample.xlsx");
  };

  const handleDeleteCoach = useCallback(
    async (coachId, coachName) => {
      if (
        !window.confirm(
          `Are you sure you want to PERMANENTLY DELETE coach ${coachName}? This action cannot be undone.`,
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
    [toast],
  );

  return (
    <div className="space-y-6">
      <Card className="shadow-md border-muted/60">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-3 text-2xl font-bold">
              <div className="p-2.5 bg-[#1A9CFF]/10 rounded-xl">
                <Users className="h-6 w-6 text-[#1A9CFF]" />
              </div>
              Teacher Management
            </CardTitle>
            <CardDescription className="text-sm">
              Manage your teacher staff and their profiles
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name or phone..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 focus-visible:ring-[#1A9CFF] rounded-xl h-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".xlsx, .xls"
                onChange={handleFileImport}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={isImporting}
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#1A9CFF] hover:bg-[#1582d8] text-white rounded-xl px-4 shadow-sm"
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Import Excel
              </Button>

              <Button
                size="sm"
                onClick={openAddCoachModal}
                className="bg-[#1A9CFF] hover:bg-[#1582d8] text-white rounded-xl px-4 shadow-sm"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add New
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadSample}
                className="rounded-xl border-muted hover:bg-slate-100"
              >
                <Download className="h-4 w-4 mr-2" />
                Sample
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#1A9CFF]" />
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr className="text-left font-medium text-muted-foreground">
                    <th className="p-4">Teacher Name </th>
                    <th className="p-4">Email & Location</th>
                    <th className="p-4">Pay (Per Session)</th>
                    <th className="p-4">Monthly Salary</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {currentRecords.map((coach, _cidx) => {
                    const coachId =
                      coach?.coach_id ?? coach?.id ?? `coach-${_cidx}`;

                    return (
                      <tr
                        key={coachId}
                        className="group hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/coach-old/${coach.coach_id}`)}
                      >
                        {/* Profile & Name */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-semibold shrink-0 shadow-inner">
                              {coach.coach_name
                                ? coach.coach_name.charAt(0).toUpperCase()
                                : "?"}
                            </div>
                            <span className="font-semibold text-foreground truncate max-w-[150px]">
                              {coach.coach_name}
                            </span>
                          </div>
                        </td>

                        {/* Email & Location */}
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">
                              {coach.email}
                            </span>
                            <span className="text-[11px] text-[#1A9CFF] font-medium">
                              {coach.location}
                            </span>
                          </div>
                        </td>

                        {/* Session Rate */}
                        <td className="p-4">
                          <span className="font-medium text-foreground">
                            ₹{coach.week_salary}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-1">
                            /session
                          </span>
                        </td>

                        {/* Monthly Salary */}
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">
                              ₹
                              {Number(coach.salary ?? 0).toLocaleString(
                                "en-IN",
                              )}
                            </span>
                            <span className="text-[10px] uppercase text-muted-foreground">
                              Monthly
                            </span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="p-4">
                          <Badge
                            variant={
                              coach.status === "Active"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              coach.status === "Active"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20"
                                : ""
                            }
                          >
                            {coach.status}
                          </Badge>
                        </td>

                        {/* Action Buttons */}
                        <td
                          className="p-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-[#1A9CFF]"
                              onClick={() => openEditCoachModal(coach)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                handleDeleteCoach(
                                  coach.coach_id,
                                  coach.coach_name,
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Empty State */}
              {!currentRecords.length && (
                <div className="p-8 text-center text-muted-foreground">
                  No coaches found.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Provide coach details and select the venue/location for this
              coach.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Photo</Label>
                <div className="col-span-3 flex items-center gap-4">
                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={coachImageRef}
                    onChange={handleCoachImageUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Image Preview (Optional but recommended) */}
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden border">
                    {formData.profile_img ? (
                      <img
                        src={formData.profile_img}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => coachImageRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Photo
                  </Button>
                </div>
              </div>

              {/* --- Coach Name --- */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="coach_name" className="text-right">
                  Name
                </Label>
                <Input
                  id="coach_name"
                  value={formData.coach_name || ""}
                  onChange={handleChange}
                  className="col-span-3 focus-visible:ring-[#1A9CFF]"
                  required
                />
              </div>

              {/* --- Location Selection --- */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  Allocate center
                </Label>
                <div className="col-span-3">
                  <Select
                    value={formData.location_id?.toString()}
                    onValueChange={handleLocationChange}
                  >
                    <SelectTrigger
                      id="location"
                      className="focus:ring-[#1A9CFF]"
                    >
                      <SelectValue
                        placeholder={
                          loadingVenues ? "Loading..." : "Select a location"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingVenues ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin text-[#1A9CFF]" />
                        </div>
                      ) : venues.length > 0 ? (
                        venues.map((loc) => {
                          const id = loc.id ?? loc.raw?.id;
                          const locationName =
                            loc.name || loc.center_head || "Unknown Location";

                          return (
                            <SelectItem key={id} value={String(id)}>
                              {locationName}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem disabled value="none">
                          No locations found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* --- Phone --- */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone_numbers" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone_numbers"
                  value={formData.phone_numbers || ""}
                  onChange={handleChange}
                  className="col-span-3 focus-visible:ring-[#1A9CFF]"
                />
              </div>

              {/* --- Email --- */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  className="col-span-3 focus-visible:ring-[#1A9CFF]"
                  required
                />
              </div>

              {/* --- Monthly Salary --- */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="salary" className="text-right">
                  Monthly Salary
                </Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary || ""}
                  onChange={handleChange}
                  className="col-span-3 focus-visible:ring-[#1A9CFF]"
                />
              </div>

              {/* --- Session Salary --- */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="week_salary" className="text-right">
                  Session Salary
                </Label>
                <Input
                  id="week_salary"
                  type="number"
                  value={formData.week_salary || ""}
                  onChange={handleChange}
                  className="col-span-3 focus-visible:ring-[#1A9CFF]"
                />
              </div>

              {/* --- Status Toggle --- */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="active" className="text-right">
                  Status
                </Label>
                <div className="col-span-3 flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      formData.active
                        ? "text-[#1A9CFF]"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formData.status}
                  </span>
                  <Switch
                    id="active"
                    checked={formData.active || false}
                    onCheckedChange={handleActiveChange}
                    className="data-[state=checked]:bg-[#1A9CFF]"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-[#1A9CFF] hover:bg-[#1A9CFF]/90 shadow-[0_8px_32px_-8px_rgba(26,156,255,0.4)] transition-smooth active:scale-95 text-white font-semibold border-none w-full sm:w-auto"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>{formData.coach_id ? "Save Changes" : "Add Coach"}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoachProfile;
