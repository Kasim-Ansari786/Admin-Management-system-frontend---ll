import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Download, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// 🔔 IMPORT YOUR API FETCHING FUNCTION
import { getPaymentsExceldata } from "../../../api"; 

// 🔔 Mock toast (replace with real useToast if available)
const useToast = () => ({
  toast: ({ title, description, variant }) => {
    console.log(`${variant || "info"}: ${title} - ${description}`);
  },
});

/* -------------------- OPTIONS -------------------- */

const reportTypeOptions = [
  { value: "summary", label: "Payment Summary" },
  { value: "detailed", label: "Detailed Transactions" },
  { value: "outstanding", label: "Outstanding Payments" },
  { value: "collection", label: "Collection Report" },
];

const exportFormatOptions = [
  { value: "pdf", label: "PDF Document" },
  { value: "excel", label: "Excel Spreadsheet" },
  { value: "csv", label: "CSV File" },
];

/* -------------------- COMPONENT -------------------- */

export default function GenerateReportDialog({ open, onOpenChange }) {
  const [reportType, setReportType] = useState("summary");
  const [exportFormat, setExportFormat] = useState("excel"); // Changed default to 'excel'
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [includeGraphs, setIncludeGraphs] = useState(true);
  const [includeTenantDetails, setIncludeTenantDetails] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const { toast } = useToast();

  /* -------------------- MOCK DATA (KEPT FOR REFERENCE/PDF MOCK) -------------------- */
  // NOTE: This mock is no longer used for the excel/csv download but kept for other report types
  const generateMockReportData = (sDate, eDate) => ({
    title: "Payment Report",
    reportType,
    exportFormat,
    includeGraphs,
    includeTenantDetails,
    generatedAt: new Date().toISOString(),
    dateRange: {
      start: sDate ? sDate.toISOString() : null,
      end: eDate ? eDate.toISOString() : null,
    },
    // ... other summary fields
    transactions: [
      // ... mock transactions
    ],
  });

  /* -------------------- CSV -------------------- */
  
  // FIX: The convertToCSV function must now accept the raw array of payment data,
  // not an object that contains a 'transactions' key.
  // The API returns an array like: [{ tenant_id: 1, full_name: '...', amount_paid: '...' }, ...]
  const convertToCSV = (paymentRecords) => {
    if (!paymentRecords || paymentRecords.length === 0) {
      return "";
    }

    // Use the keys of the first object for headers
    const headers = Object.keys(paymentRecords[0]).join(",");
    
    // Map each object to a CSV row
    const rows = paymentRecords.map((record) =>
      Object.values(record)
        .map((val) => {
          // Wrap values in double quotes and escape internal quotes
          // This is essential for fields like 'full_name' or 'email' that might contain commas
          const cleanedVal = String(val).replace(/"/g, '""');
          return `"${cleanedVal}"`;
        })
        .join(",")
    );

    return [headers, ...rows].join("\n");
  };

  /* -------------------- DOWNLOAD -------------------- */

  // FIX: The downloadReport function must now handle the raw payment data array 
  // directly, not the mock report object.
  const downloadReport = (paymentRecords, formatType) => {
    let content;
    let mimeType;
    let extension;

    switch (formatType) {
      case "csv":
        content = convertToCSV(paymentRecords);
        mimeType = "text/csv";
        extension = "csv";
        break;

      case "excel":
        // FIX: Reverted to CSV content with a CSV mime/extension for simple download
        // without an external XLSX library. Excel can open CSVs easily.
        content = convertToCSV(paymentRecords);
        mimeType = "text/csv"; 
        extension = "csv"; 
        break;

      default:
        // For PDF/JSON or other formats
        content = JSON.stringify(paymentRecords, null, 2);
        mimeType = "application/json";
        extension = "json";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;

    // Get report name based on the state variable `reportType`
    const reportName =
      reportTypeOptions
        .find((r) => r.value === reportType)
        ?.label.replace(/\s/g, "-")
        .toLowerCase() || "report";

    link.download = `${reportName}-${
      new Date().toISOString().split("T")[0]
    }.${extension}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* -------------------- HANDLER -------------------- */

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Date Range Required",
        description: "Please select both start and end dates.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    let paymentRecords = [];

    try {
        if (exportFormat === "csv" || exportFormat === "excel") {
            // 🚀 REAL DATA FETCH: Call your API function
            paymentRecords = await getPaymentsExceldata();

            if (paymentRecords.length === 0) {
                toast({
                    title: "No Data Found",
                    description: "No payment records available for download.",
                    variant: "warning",
                });
                return;
            }
            
            // 🚀 DOWNLOAD: Use the downloaded data to generate and download the file
            downloadReport(paymentRecords, exportFormat);

            toast({
                title: "Report Generated",
                description: `Your ${exportFormat.toUpperCase()} report has been downloaded successfully.`,
            });
            
        } else {
            // MOCK/Placeholder for PDF generation (which is complex and often server-side)
            const reportData = generateMockReportData(startDate, endDate);
            downloadReport(reportData, exportFormat);
            toast({
                title: "Report Generation Initiated",
                description: "PDF generation is typically server-side. Check for the file.",
            });
        }
        
        onOpenChange(false);
        
    } catch (error) {
        toast({
            title: "Download Failed",
            description: error.message,
            variant: "destructive",
        });
    } finally {
        setGenerating(false);
    }
  };

  /* -------------------- UI -------------------- */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-primary" />
            Generate Payment Report
          </DialogTitle>
          <DialogDescription>
            Configure and download your payment report.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Report Type */}
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportTypeOptions.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate
                      ? format(startDate, "dd-MM-yyyy")
                      : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setStartDateOpen(false);
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd-MM-yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setEndDateOpen(false);
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Export Format */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {exportFormatOptions.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={includeGraphs}
                onCheckedChange={(v) => setIncludeGraphs(Boolean(v))}
              />
              <Label>Charts & Graphs</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={includeTenantDetails}
                onCheckedChange={(v) => setIncludeTenantDetails(Boolean(v))}
              />
              <Label>Tenant Details</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerateReport}
            disabled={generating || !startDate || !endDate}
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}