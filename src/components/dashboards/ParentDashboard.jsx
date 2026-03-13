import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ReceiptIndianRupee } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import Footer from "../../components/Footer";
import {
  getPlayerDetailsByGuardianEmail,
  fetchEvents,
  uploadimageducoment,
  fetchPaymentsDetails,
} from "../../../api";

import {
  User,
  LogOut,
  Calendar,
  TrendingUp,
  CreditCard,
  MapPin,
  Clock,
  FileText,
  Upload,
  Trophy,
  CheckCircle,
  Download,
  Receipt,
  Bell,
  Activity,
  Loader2,
  X,
  Image as ImageIcon,
} from "lucide-react";

const ParentDashboard = () => {
  const [childData, setChildData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, logout, isLoading: isAuthLoading, session } = useAuth();
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(false);
  const [rawEvents, setRawEvents] = useState([]);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const extractToken = () => {
    return (
      session?.token ||
      session?.access_token ||
      session?.accessToken ||
      session?.user?.access_token ||
      user?.accessToken ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("authToken") ||
      null
    );
  };

  const [documents, setDocuments] = useState({
    birthCertificate: {
      name: "Birth Certificate",
      file: null,
      preview: null,
    },
    aadharCard: {
      name: "Aadhar Card",
      file: null,
      preview: null,
    },
    passportPhoto: {
      name: "Passport Photo",
      file: null,
      preview: null,
    },
    transferCertificate: {
      name: "Transfer Certificate",
      file: null,
      preview: null,
    },
  });

  const extractEmail = () => {
    return (
      (user?.email || session?.user?.email || session?.email || localStorage.getItem("email") || null)
    );
  };

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchEvents();
        console.log("API EVENTS:", data);
        setRawEvents(data || []);
        const mappedEvents = (Array.isArray(data) ? data : [])
          .map((schedule, idx) => ({
            id: schedule.id ?? idx,
            title: schedule.title ?? "Untitled Event",
            date: schedule.event_date ?? "N/A",
            time: schedule.event_time ?? "N/A",
            type: schedule.event_type || "Training",
            location: schedule.location ?? "Unknown",
          }))
          .slice(0, 3);
        setEvents(mappedEvents);
      } catch (err) {
        console.error(err);
        setError("Failed to load schedules");
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (isAuthLoading) return;
      const parentEmail = extractEmail();
      const token = extractToken();
      if (!parentEmail || !token) {
        console.warn("Auth credentials missing.");
        setIsLoading(false);
        return;
      }
      try {
        console.debug("ParentDashboard: fetching player details", { parentEmail, tokenPresent: !!token });
        const playersArray = await getPlayerDetailsByGuardianEmail(parentEmail, token);
        if (playersArray && playersArray.length > 0) {
          setChildData(playersArray[0]);
        } else {
          console.info("ParentDashboard: no players found for guardian", parentEmail);
          setChildData({});
        }
      } catch (error) {
        console.error("Error loading child data:", error, error?.response || null);
        toast({
          title: "API Error",
          description: error.message || "Failed to load child data.",
          variant: "destructive",
        });
        setChildData({});
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, isAuthLoading, session, toast]);

useEffect(() => {
  if (isPaymentHistoryOpen && user?.email) {
    const loadPayments = async () => {
      setIsPaymentsLoading(true);
      try {
        const data = await fetchPaymentsDetails(user.email); 
        const safeData = Array.isArray(data) ? data : []; 
        setPayments(safeData); 
        const total = safeData.reduce((acc, curr) => 
          acc + (parseFloat(curr.amount_paid) || 0), 0
        );
        setTotalPaid(total);
      } catch (err) {
        toast({
          title: "Connection Error",
          description: err.message,
          variant: "destructive",
        });
        setPayments([]);
        setTotalPaid(0);
      } finally {
        setIsPaymentsLoading(false);
      }
    };

    loadPayments();
  }
}, [isPaymentHistoryOpen, user?.email, toast]);
  
  const handleSignOut = () => {
    logout();
    toast({
      title: "Signed Out",
      description:
        "You have been securely logged out and redirected to the login page.",
      variant: "default",
    });
    navigate("/auth");
  };

  const removeFile = (key) => {
    setDocuments((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        file: null,
        preview: null,
      },
    }));
    setUploadError("");
  };

  const MAX_SIZE = 500 * 1024; // 500KB

  const fileRefs = useRef({});
  const [uploadError, setUploadError] = useState("");

  const getRefForKey = (key) => {
    if (!fileRefs.current[key]) {
      fileRefs.current[key] = React.createRef();
    }
    return fileRefs.current[key];
  };

  const handleFileUpload = async (e, documentKey) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE) {
      setUploadError("Image size must be 500KB or less");
      e.target.value = "";
      return;
    }

    setUploadError("");

    try {
      // 1. Map frontend key → backend multer field name
      const keyMap = {
        birthCertificate: "birth_certificate",
        aadharCard: "aadhar_upload",
        passportPhoto: "profile_photo",
        transferCertificate: "aadhar_back_upload",
      };

      const backendKey = keyMap[documentKey];
      if (!backendKey) throw new Error("Invalid document key");

      // 2. Create FormData
      const formData = new FormData();
      formData.append(backendKey, file);
      formData.append("tenant_id", childData?.tenant_id || "default_tenant");
      formData.append("player_id", childData?.player_id);

      // 3. Call API
      const response = await uploadimageducoment(formData);

      if (response) {
        setDocuments((prev) => ({
          ...prev,
          [documentKey]: {
            ...prev[documentKey],
            file,
            preview: URL.createObjectURL(file),
            status: "uploaded",
          },
        }));

        toast({
          title: "Success",
          description: `${documents[documentKey].name} uploaded successfully`,
        });
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadError("Upload failed. Please try again.");
    } finally {
      e.target.value = "";
    }
  };

  // --- Render Logic ---
  if (isLoading || isAuthLoading) {
    return (
      <div className="flex justify-center items-center h-screen-1/2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">
          Loading Player Data...
        </p>
      </div>
    );
  }

  const handleSaveDocuments = () => {
    console.log("Saving documents:", documents);
    toast({
      title: "Documents Updated",
      description:
        "Your documents have been saved successfully (Local State Updated).",
    });
    setIsDocumentDialogOpen(false);
  };

 


  const attendance = Math.round(
    parseFloat(childData?.attendance_percentage) || 0
  );
  const recentActivities =
    typeof childData?.recent_activities_json === "string"
      ? JSON.parse(childData?.recent_activities_json || "[]") || []
      : childData?.recent_activities_json || [];
  const progressData = childData?.progressData || [];
  const scheduleTypeColors = {
    training: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    match: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    meeting: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    tournament: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col space-y-2 pb-10">
      <div className="w-full bg-[#1A9CFF] animate-fade-in p-6 flex items-center justify-between border-b border-white/10 shadow-none rounded-none">
        <div className="flex flex-col gap-1">
          <h1 className="text-base sm:text-2xl font-semibold leading-tight text-white">
            Parent Dashboard
          </h1>
          <p className="text-xs sm:text-base text-white/80">
            Welcome{" "}
            <span className="font-medium text-white">
              {user?.name || "Parent"}
            </span>
          </p>

          <div className="mt-2 space-y-0.5 text-xs sm:text-sm text-white/70">
            <p>Email: {user?.email || "—"}</p>
            <p>Role: {user?.role || "—"}</p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="
      h-9 px-4
      bg-white/10
      hover:bg-white/20
      text-white
      border-none
      text-xs sm:text-sm
      shrink-0
      flex items-center
      rounded-md
    "
          onClick={handleSignOut}
        >
          <LogOut className="h-3.5 w-3.5 mr-2" />
          Sign Out
        </Button>
      </div>

      <Card className="shadow-card">
        <CardContent className="pt-6">
          {" "}
          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col gap-1">
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 w-fit">
                <span className="mr-1.5 h-2 w-2 rounded-full bg-green-600"></span>
                Active
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDocumentDialogOpen(true)}
            >
              <FileText className="h-4 w-4 mr-2" /> Update Documents
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Name
                </p>
                <p className="font-semibold text-sm">{childData?.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  ID: {childData?.player_id}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Age
                </p>
                <p className="font-semibold text-sm">{childData?.age} years</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" style={{ color: "#1A9CFF" }} />
              Attendance
            </CardTitle>
            <CardDescription>Overall attendance rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{attendance}%</span>
                <Badge
                  variant={attendance >= 80 ? "default" : "destructive"}
                  style={attendance >= 80 ? { backgroundColor: "#1A9CFF" } : {}}
                >
                  {attendance >= 80 ? "Good" : "Needs Improvement"}
                </Badge>
              </div>
              <Progress
                value={attendance}
                className="h-2"
                indicatorStyle={{ backgroundColor: "#1A9CFF" }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment Status
            </CardTitle>
            <CardDescription>Next payment due</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Next Payment</p>
                <p className="text-lg font-semibold">{childData?.nextPayment || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-2xl font-bold text-primary">
                  {childData?.paymentAmount || "N/A"}
                </p>
              </div>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => setIsPaymentHistoryOpen(true)}
              >
                <ReceiptIndianRupee className="h-5 w-5 text-primary" />
                View Payment History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Upcoming Events
          </CardTitle>
          <CardDescription>
            Latest upcoming events and training sessions
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Loading */}
          {loading && (
            <p className="text-sm text-muted-foreground">
              Loading schedules...
            </p>
          )}

          {/* Error */}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Empty */}
          {!loading && !error && events.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No upcoming schedules
            </p>
          )}

          {/* Events List */}
          {!loading && !error && events.length > 0 && (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        scheduleTypeColors[event.type] ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      <Calendar className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="font-medium">{event.title}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          {event.date
                            ? new Date(event.date).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "N/A"}
                        </span>
                        <span>•</span>
                        <span>{event.time}</span>
                        <span>•</span>
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>

                  <Badge
                    className={
                      scheduleTypeColors[event.type] ||
                      "bg-gray-100 text-gray-700"
                    }
                  >
                    {event.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activities - Uses fetched recentActivities */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Latest training sessions and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No recent attendance recorded for{" "}
                {childData?.name || "this player"}.
              </p>
            ) : (
              recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {activity.activity}{" "}
                      {/* Matches 'Training Session' from SQL */}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.date} {/* Matches formatted date from SQL */}
                    </p>
                  </div>
                  <Badge
                    variant={
                      ["Present", "Played", "Completed"].includes(
                        activity.status
                      )
                        ? "default"
                        : "destructive"
                    }
                  >
                    {activity.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPaymentHistoryOpen} onOpenChange={setIsPaymentHistoryOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptIndianRupee className="h-5 w-5 text-primary" />
            Payment History
          </DialogTitle>
          <DialogDescription>
            Complete payment history for {childData?.name}
          </DialogDescription>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <p className="text-sm text-muted-foreground">Total Paid</p>
            <p className="text-2xl font-bold text-emerald-500">₹{totalPaid.toFixed(2)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <p className="text-sm text-muted-foreground">Transactions</p>
            <p className="text-2xl font-bold">{payments.length}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <p className="text-sm text-muted-foreground">Next Due</p>
            <p className="text-lg font-bold text-primary">{childData?.paymentAmount || "N/A"}</p>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-auto max-h-[40vh] rounded-lg border border-border relative">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading records...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-destructive">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  {/* <TableHead>Invoice No.</TableHead> */}
                  <TableHead>Full Name</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  {/* <TableHead className="text-right">Action</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length > 0 ? (
                  payments.map((payment) => (
                    <TableRow key={payment.payment_id || payment.id}>
                      <TableCell className="font-medium">
                        {payment.end_date ? new Date(payment.end_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>{payment.full_name}</TableCell>
                      <TableCell>{payment.payment_method || 'Online'}</TableCell>
                      <TableCell className="font-semibold">₹{parseFloat(payment.amount_paid || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Paid
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No payment history found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => setIsPaymentHistoryOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>

      <Dialog
        open={isDocumentDialogOpen}
        onOpenChange={setIsDocumentDialogOpen}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Update Documents
            </DialogTitle>
            <DialogDescription>
              Upload or update documents for {childData?.name || "this player"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {Object.keys(documents).map((key) => {
              const doc = documents[key];

              return (
                <div key={key} className="space-y-3">
                  <Label className="text-sm font-medium">{doc.name}</Label>

                  {doc.preview ? (
                    <div className="relative group">
                      <div className="aspect-[4/3] rounded-lg border overflow-hidden bg-muted/50">
                        <img
                          src={doc.preview}
                          alt={doc.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => getRefForKey(key).current.click()}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Change
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeFile(key)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>

                      <Badge className="absolute top-2 right-2 bg-emerald-500 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    </div>
                  ) : (
                    <div
                      onClick={() => getRefForKey(key).current.click()}
                      className="aspect-[4/3] rounded-lg border-2 border-dashed hover:border-primary bg-muted/30 cursor-pointer flex flex-col items-center justify-center gap-2"
                    >
                      <div className="p-3 rounded-full bg-muted">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Click to upload</p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG up to 500KB
                        </p>
                      </div>
                    </div>
                  )}

                  <input
                    ref={getRefForKey(key)}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, key)}
                  />

                  {/* ❌ ERROR MESSAGE */}
                  {uploadError && (
                    <p className="text-xs text-red-500 font-medium">
                      {uploadError}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDocumentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveDocuments}>
              <Upload className="h-4 w-4 mr-2" />
              Save Documents
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col overflow-hidden bg-gray-50">
        <Footer />
      </div>
    </div>
  );
};

export default ParentDashboard;
