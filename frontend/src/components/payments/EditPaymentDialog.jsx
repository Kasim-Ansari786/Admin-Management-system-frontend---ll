import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react"; 

// Assuming the API functions are exported from this path
import { updatePayment, getPaymentDetailsupdated } from "../../../api"; 

// Helper function to format any valid date string to YYYY-MM-DD
const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  try {
    // Check if it's already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Attempt to parse any other format (e.g., ISO string)
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error("Date formatting failed:", e);
    return "";
  }
};

export default function EditPaymentDialog({
  record, // Full record object passed from PaymentsIndex.jsx
  open,
  onOpenChange,
  onSave,
}) {
  // State to hold the complete and editable form data
  const [formData, setFormData] = useState(null);
  // State for submitting the form (PUT request)
  const [isSubmitting, setIsSubmitting] = useState(false); 
  // State for fetching the initial data (GET request)
  const [isLoading, setIsLoading] = useState(false); 

  // --- 1. Fetch data when the dialog opens ---
  useEffect(() => {
    // Determine the ID from the record object
    const idToFetch = record?.id || record?.payment_id || record?._id;

    if (open && idToFetch) {
      // Reset formData to null while fetching
      setFormData(null); 
      setIsLoading(true);

      async function fetchData() {
        try {
          // The function name here should match your api.js export
          const fullRecord = await getPaymentDetailsupdated(idToFetch); 
          
          // Set the form data with the fetched details.
          setFormData({
            ...fullRecord,
            // Ensure ID fields are consistently named
            id: idToFetch, 
            full_name: fullRecord.full_name || fullRecord.name || '',
            amount_paid: fullRecord.amount_paid || fullRecord.paymentAmount || 0,
            
            // *** FIX: Apply date formatting here ***
            hire_date: formatDateForInput(fullRecord.hire_date || fullRecord.startDate),
            end_date: formatDateForInput(fullRecord.end_date || fullRecord.endDate),
          });
        } catch (error) {
          console.error(`❌ Error fetching full payment details for ID ${idToFetch}:`, error);
          toast({
            title: "Load Failed",
            description: "Could not fetch the full record data. Check your server status and API endpoint.",
            variant: "destructive",
          });
          onOpenChange(false); 
        } finally {
          setIsLoading(false);
        }
      }

      fetchData();
    }
  }, [open, record, onOpenChange]); 

  // --- 2. Handle Form Submission (PUT/Update) ---
  const handleSubmit = async (e) => { 
    e.preventDefault();
    const idToUpdate = formData.id || formData.payment_id || formData._id; 

    if (!formData || isSubmitting || !idToUpdate) return;

    setIsSubmitting(true);

    try {
      const updatedRecord = await updatePayment(idToUpdate, formData);
      onSave(updatedRecord);

      toast({
        title: "Record Updated",
        description: `${formData.full_name || formData.name}'s payment record has been updated successfully.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update payment record:", error);
      toast({
        title: "Update Failed",
        description: error.message || "There was an error updating the payment record.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Display a loading message while fetching initial data
  if (isLoading || !formData) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Loading Payment Details...</DialogTitle>
                    <DialogDescription>Please wait while we retrieve the record data.</DialogDescription>
                </DialogHeader>
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                    <p className="text-gray-500">Loading payment details...</p>
                </div>
            </DialogContent>
        </Dialog>
    );
  }

  // --- 3. Render the Form with Fetched Data ---
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Payment Record</DialogTitle>
          <DialogDescription>
            Update the payment details for **{formData.full_name || formData.name || 'this user'}**
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">

            {/* Name & Email */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.full_name} 
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Phone & Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-amount">Payment Amount (₹)</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  value={formData.amount_paid || ""} 
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount_paid: Number(e.target.value),
                    })
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Start & End Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  // Uses the formatted hire_date
                  value={formData.hire_date || ""} 
                  onChange={(e) =>
                    setFormData({ ...formData, hire_date: e.target.value })
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-endDate">End Date</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  // Uses the formatted end_date
                  value={formData.end_date || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}