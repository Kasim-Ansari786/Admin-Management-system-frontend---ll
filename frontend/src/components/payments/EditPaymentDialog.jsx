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

import { updatePayment, getPaymentDetailsupdated } from "../../../api"; 

const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return "";
  }
};

export default function EditPaymentDialog({ record, open, onOpenChange, onSave }) {
  const [formData, setFormData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [isLoading, setIsLoading] = useState(false); 

  useEffect(() => {
    const idToFetch = record?.id || record?.payment_id || record?._id;

    if (open && idToFetch) {
      setFormData(null); 
      setIsLoading(true);

      async function fetchData() {
        try {
          const fullRecord = await getPaymentDetailsupdated(idToFetch); 
          setFormData({
            ...fullRecord,
            id: idToFetch, 
            full_name: fullRecord.full_name || '',
            email: fullRecord.email || '',
            phone: fullRecord.phone || '',
            amount_paid: fullRecord.amount_paid || 0,
            payment_method: fullRecord.payment_method || '', // Map DB field to state
            status: fullRecord.status || '',
            hire_date: formatDateForInput(fullRecord.hire_date),
            end_date: formatDateForInput(fullRecord.end_date),
          });
        } catch (error) {
          toast({
            title: "Load Failed",
            description: "Could not fetch record data.",
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

  const handleSubmit = async (e) => { 
    e.preventDefault();
    const idToUpdate = formData.id || formData.payment_id; 
    if (!formData || isSubmitting || !idToUpdate) return;
    
    setIsSubmitting(true);
    try {
      const updatedRecord = await updatePayment(idToUpdate, formData);
      onSave(updatedRecord);
      toast({ title: "Record Updated", description: "Successfully saved changes." });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message || "Error updating record.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !formData) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Loading</DialogTitle>
            <DialogDescription>Retrieving payment details</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-gray-500">Retrieving details...</p>
          </div>
        </DialogContent>
        </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Payment Record</DialogTitle>
          <DialogDescription>
            Update details for: {formData.full_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={formData.full_name} 
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  value={formData.amount_paid} 
                  onChange={(e) => setFormData({ ...formData, amount_paid: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.hire_date} 
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(val) => setFormData({ ...formData, payment_method: val })}
                >
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="razorpay">Razorpay (Online)</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI / QR Scan</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
