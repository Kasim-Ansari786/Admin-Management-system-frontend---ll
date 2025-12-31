import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  IndianRupee,
  CreditCard,
  FileText,
  Settings,
  Calendar,
  TrendingUp,
  Users,
  Loader2,
  Edit as Pencil,
  AlertCircle,
  CheckCircle,
  Phone,
  Trash2,
  PlusCircle,
} from "lucide-react";

import SendRemindersDialog from "@/components/payments/SendRemindersDialog";
import GenerateReportDialog from "@/components/payments/GenerateReportDialog";
import PaymentSettingsDialog from "@/components/payments/PaymentSettingsDialog";
import PaymentScheduleDialog from "@/components/payments/PaymentScheduleDialog";
import AddPaymentRecordDialog from "@/components/payments/AddPaymentRecordDialog";
import EditPaymentDialog from "./EditPaymentDialog";
import { getPayments, deletePayment, getPaymentStatus } from "../../../api";
import { useToast } from "@/components/ui/use-toast";

const today = new Date("2025-12-15");
const isPaymentOverdue = (endDateString) => {
  const endDate = new Date(endDateString);
  return endDate < today;
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  // Convert date string to a Date object first, in case it's in a non-standard format
  const date = new Date(dateString);
  // Check if date parsing was successful
  if (isNaN(date)) return "N/A";

  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getStatusBadge = (record) => {
  const isOverdue =
    isPaymentOverdue(record.endDate) && record.status === "pending";

  let statusText = record.status;
  let variant = "default";
  let icon = null;

  if (isOverdue) {
    statusText = "Overdue";
    variant = "destructive";
    icon = <AlertCircle className="h-3 w-3 mr-1" />;
  } else if (record.status === "paid") {
    statusText = "Paid";
    variant = "success";
    icon = <CheckCircle className="h-3 w-3 mr-1" />;
  } else if (record.status === "pending") {
    statusText = "Pending";
    variant = "secondary";
    icon = <AlertCircle className="h-3 w-3 mr-1" />;
  } else if (record.status === "completed") {
    statusText = "Completed";
    variant = "outline";
    icon = <CheckCircle className="h-3 w-3 mr-1" />;
  }

  return (
    <Badge variant={variant} className="capitalize">
      {icon}
      {statusText}
    </Badge>
  );
};

export default function Index() {
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [addRecordOpen, setAddRecordOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentOverview, setPaymentOverview] = useState([]); // *** ADDED state for payment overview ***
  const { toast } = useToast();

  const fetchPaymentData = async () => {
    try {
      const payload = await getPaymentStatus();

      // Normalize various shapes: payload may be an array, or an object { rows, totalCount, ... }
      const rows = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.rows)
        ? payload.rows
        : Array.isArray(payload.data)
        ? payload.data
        : [];

      // Compute totals: treat 'amount_paid' as numeric source
      const totalCollected = rows.reduce((acc, r) => {
        const amount = Number(r.amount_paid || r.collected || 0);
        return acc + (r.status === "paid" ? amount : 0);
      }, 0);
      const totalPending = rows.reduce((acc, r) => {
        const amount = Number(r.amount_paid || r.pending || 0);
        return acc + (r.status !== "paid" ? amount : 0);
      }, 0);

      const overallTotal = totalCollected + totalPending;
      const collectionRate =
        overallTotal > 0
          ? ((totalCollected / overallTotal) * 100).toFixed(1)
          : "0.0";

      // Build a simple overview array for the UI to map over
      const overviewArray = [
        {
          payment_date: "All",
          total: overallTotal,
          collected: totalCollected,
          totalCollected: totalCollected,
          totalPending: totalPending,
        },
      ];

      setPaymentOverview({
        data: overviewArray,
        totalCollected,
        totalPending,
        collectionRate,
      });

      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Failed to fetch payment overview:", err);
        setError(err.message);
      } else {
        setError("An unknown error occurred while fetching payment data.");
      }
    }
  };

  // *** NEW useEffect to call fetchPaymentData on mount ***
  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPayments();

      const mappedRecords = Array.isArray(data)
        ? data.map((record) => ({
            id: record.payment_id,
            name: record.full_name,
            email: record.email,
            phone: record.phone,
            joinDate: record.hire_date,
            startDate: record.start_date || record.hire_date,
            paymentAmount: parseFloat(record.amount_paid) || 0,

            // ADDED: Mapping the new column from backend
            payment_method: record.payment_method || "N/A",

            endDate: record.end_date,
            status: record.status,
          }))
        : [];

      setRecords(mappedRecords);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      setError(err.message || "Failed to load payment records.");
      toast({
        title: "Load Error",
        description: err.message || "Could not retrieve payment records.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // *** UPDATED handleEdit FUNCTION ***
  const handleEdit = (record) => {
    // We now receive the full record object from the table row
    setEditingRecord(record);
    setEditDialogOpen(true);
  };

  const handleUpdateRecord = (updated) => {
    const mapped = {
      id: updated.id || updated.payment_id,
      name: updated.name || updated.full_name,
      email: updated.email,
      phone: updated.phone,
      joinDate: updated.joinDate || updated.hire_date,
      startDate: updated.startDate,
      paymentAmount: parseFloat(updated.paymentAmount),
      endDate: updated.endDate,
      status: updated.status,
    };

    setRecords((prev) => prev.map((r) => (r.id === mapped.id ? mapped : r)));
    fetchPaymentData();
  };

  const handleSendReminder = (record) => {
    console.log(`Sending reminder to ${record.name}`);
    toast({
      title: "Reminder Sent",
      description: `Reminder sent to ${record.name}.`,
    });
  };

  const onDelete = async (id) => {
    try {
      await deletePayment(id);
      setRecords((prevRecords) =>
        prevRecords.filter((record) => record.id !== id)
      );

      console.log(`✅ Deactivated and removed record with ID: ${id}`);
      toast({
        title: "Success",
        description: `Payment record deactivated successfully! ID: ${id}`,
      });
      fetchPaymentData();
    } catch (error) {
      console.error("Failed to process payment deactivation in UI:", error);
      toast({
        title: "ERROR",
        description:
          error.message ||
          `Could not deactivate payment record ${id}. Check console for details.`,
        variant: "destructive",
      });
    }
  };

  const handleAddRecord = (newRecord) => {
    const mapped = {
      id: newRecord.payment_id || newRecord.id,
      name: newRecord.full_name || newRecord.name,
      email: newRecord.email,
      phone: newRecord.phone,
      joinDate: newRecord.hire_date || newRecord.joinDate,
      startDate: newRecord.start_date || newRecord.startDate,
      paymentAmount:
        parseFloat(newRecord.amount_paid || newRecord.paymentAmount) || 0,
      endDate: newRecord.end_date || newRecord.endDate,
      status: newRecord.status || "pending",
    };

    setRecords((prevRecords) => [mapped, ...prevRecords]);
    console.log("New record added:", mapped);
    fetchPaymentData();
  };

  const overviewData = Array.isArray(paymentOverview.data)
    ? paymentOverview.data
    : [];
  const totalCollected = paymentOverview.totalCollected
    ? paymentOverview.totalCollected.toLocaleString("en-IN")
    : "0";
  const totalPending = paymentOverview.totalPending
    ? paymentOverview.totalPending.toLocaleString("en-IN")
    : "0";
  const collectionRate = paymentOverview.collectionRate || "0.0";

  return (
    <div className="space-y-0">
      <main className="space-y-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Collected
                  </p>
                  <p className="text-2xl font-bold text-success">
                    ₹ {totalCollected}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Pending */}
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-warning">
                    ₹ {totalPending}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Total Tenants */}
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tenants</p>
                  <p className="text-2xl font-bold">
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : (
                      records.length
                    )}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Collection Rate */}
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Collection Rate
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {collectionRate}%
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="transactions">Records</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Payment Overview
                  </CardTitle>
                  <CardDescription>
                    Monthly payment collection status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {overviewData.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No payment overview data available.
                      </div>
                    ) : (
                      overviewData.map((payment, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">
                              {payment.payment_date}
                            </span>
                            <span className="font-semibold">
                              ₹{payment.total.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <Progress
                            value={(payment.collected / payment.total) * 100}
                            className="h-2"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span className="text-success">
                              Collected: ₹
                              {payment.totalCollected.toLocaleString("en-IN")}
                            </span>
                            <span className="text-warning">
                              Pending: ₹
                              {payment.totalPending.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Actions Card */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <FileText className="h-5 w-5 text-primary" />
                    Payment Actions
                  </CardTitle>
                  <CardDescription>
                    Manage payment reminders and reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button
                      className="w-full justify-start"
                      onClick={() => setRemindersOpen(true)}
                    >
                      <IndianRupee className="h-5 w-5 text-white mt-0.5" />
                      Send Payment Reminders
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setReportOpen(true)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Payment Report
                    </Button>
                    {/* <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setScheduleOpen(true)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Payment Schedule
                    </Button> */}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2 font-display">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Payment Records
                  </CardTitle>
                  <Button
                    onClick={() => setAddRecordOpen(true)}
                    className="flex items-center gap-2"
                    size="sm"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add New Record
                  </Button>
                </div>
                <CardDescription>All recorded payment details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-card overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold w-[60px]">
                          Sr/No
                        </TableHead>
                        <TableHead className="font-semibold min-w-[120px]">
                          Name
                        </TableHead>
                        <TableHead className="font-semibold min-w-[150px]">
                          Email
                        </TableHead>
                        <TableHead className="font-semibold min-w-[120px]">
                          Phone
                        </TableHead>
                        <TableHead className="font-semibold min-w-[100px]">
                          Join Date
                        </TableHead>
                        <TableHead className="font-semibold min-w-[120px]">
                          Amount
                        </TableHead>
                        <TableHead className="font-semibold min-w-[130px]">
                          Method
                        </TableHead>
                        <TableHead className="font-semibold min-w-[100px]">
                          Start Date
                        </TableHead>
                        <TableHead className="font-semibold min-w-[100px]">
                          End Date
                        </TableHead>
                        <TableHead className="font-semibold min-w-[120px]">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold text-right min-w-[120px]">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell
                            colSpan={11}
                            className="text-center py-8 text-primary"
                          >
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                            Loading payment records...
                          </TableCell>
                        </TableRow>
                      ) : records.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={11}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No payment records found. Click "Add New Record" to
                            create one.
                          </TableCell>
                        </TableRow>
                      ) : (
                        records.map((record, index) => {
                          const overdue = isPaymentOverdue(record.endDate);

                          // Dynamic styling for Payment Method
                          const getMethodStyle = (method) => {
                            const m = method?.toLowerCase();
                            if (m === "razorpay")
                              return "bg-indigo-100 text-indigo-700 border-indigo-200";
                            if (m === "cash")
                              return "bg-emerald-100 text-emerald-700 border-emerald-200";
                            if (m === "upi")
                              return "bg-orange-100 text-orange-700 border-orange-200";
                            return "bg-slate-100 text-slate-700 border-slate-200";
                          };

                          // Dynamic styling for Status
                          const getStatusStyle = (status) => {
                            const s = status?.toLowerCase();
                            if (s === "paid" || s === "completed")
                              return "bg-green-100 text-green-700 border-green-200";
                            if (s === "active")
                              return "bg-blue-100 text-blue-700 border-blue-200";
                            if (s === "overdue" || overdue)
                              return "bg-red-100 text-red-700 border-red-200";
                            return "bg-gray-100 text-gray-700 border-gray-200";
                          };

                          return (
                            <TableRow
                              key={record.id}
                              className={
                                overdue && record.status !== "paid"
                                  ? "bg-destructive/5 hover:bg-destructive/10"
                                  : "hover:bg-muted/50"
                              }
                            >
                              <TableCell className="text-muted-foreground font-medium">
                                {index + 1}
                              </TableCell>

                              <TableCell className="font-medium">
                                {record.name}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {record.email}
                              </TableCell>
                              <TableCell>{record.phone}</TableCell>
                              <TableCell>
                                {formatDate(record.joinDate)}
                              </TableCell>
                              <TableCell className="font-semibold text-primary">
                                ₹ {record.paymentAmount.toLocaleString("en-IN")}
                              </TableCell>

                              {/* Colorized Method Badge */}
                              <TableCell>
                                <span
                                  className={`capitalize px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${getMethodStyle(
                                    record.payment_method
                                  )}`}
                                >
                                  {record.payment_method || "N/A"}
                                </span>
                              </TableCell>

                              <TableCell>
                                {formatDate(record.startDate)}
                              </TableCell>
                              <TableCell
                                className={
                                  overdue && record.status !== "paid"
                                    ? "text-destructive font-bold"
                                    : ""
                                }
                              >
                                {formatDate(record.endDate)}
                              </TableCell>

                              {/* Colorized Status Badge */}
                              <TableCell>
                                <span
                                  className={`capitalize px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${getStatusStyle(
                                    record.status
                                  )}`}
                                >
                                  {overdue && record.status !== "paid"
                                    ? "Overdue"
                                    : record.status}
                                </span>
                              </TableCell>

                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(record)}
                                    className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSendReminder(record)}
                                    className="h-8 px-2 text-xs flex items-center gap-1 border-primary/20 hover:bg-primary/5"
                                  >
                                    <Phone className="h-3.5 w-3.5" />
                                    Remind
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Delete Record
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete **
                                          {record.name}**'s payment record? This
                                          action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => onDelete(record.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* --- Dialogs --- */}
      <SendRemindersDialog
        open={remindersOpen}
        onOpenChange={setRemindersOpen}
      />
      <GenerateReportDialog open={reportOpen} onOpenChange={setReportOpen} />
      {/* Note: Settings dialog needs its own trigger if you want to use it */}
      <PaymentSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
      <PaymentScheduleDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
      />

      {/* *** The Add Record Dialog (Simplified for only adding) *** */}
      <AddPaymentRecordDialog
        open={addRecordOpen}
        onOpenChange={setAddRecordOpen} // Now only controls add dialog visibility
        onAddRecord={handleAddRecord}
        // Removed initialData, isEdit, and onUpdateRecord props as they are now in EditPaymentDialog
      />

      {/* *** The NEW Edit Payment Dialog *** */}
      {editingRecord && (
        <EditPaymentDialog
          record={editingRecord}
          open={editDialogOpen}
          onOpenChange={(v) => {
            setEditDialogOpen(v);
            if (!v) {
              setEditingRecord(null); // Clear the editing record when the dialog closes
            }
          }}
          onSave={handleUpdateRecord} // Uses the same logic to update the records array
        />
      )}
    </div>
  );
}
