import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// --- NEW IMPORT for Toasts ---
import { useToast } from "@/components/ui/use-toast"; 
import {
  addpayment
} from "../../../api"; 
// -----------------------------------------------------------------------------

const calculateEndDate = (startDateString) => {
  if (!startDateString) return "";
  const date = new Date(startDateString);
  const newDate = new Date(date.valueOf());
  newDate.setMonth(newDate.getMonth() + 1);
  const year = newDate.getFullYear();
  const month = String(newDate.getMonth() + 1).padStart(2, '0');
  const day = String(newDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getTodayDate = () => new Date().toISOString().substring(0, 10);

const initialFormState = {
  name: "",
  email: "",
  phone: "",
  joinDate: getTodayDate(), 
  paymentAmount: "",
  startDate: getTodayDate(), 
};

export default function AddPaymentRecordDialog({ open, onOpenChange, onAddRecord, initialData = null, isEdit = false, onUpdateRecord = null }) {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast(); 

  const calculatedEndDate = useMemo(() => {
    return calculateEndDate(formData.startDate);
  }, [formData.startDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.paymentAmount || !formData.startDate) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields (*).",
        variant: "destructive",
      });
      return;
    }

    const newRecordData = {
      full_name: formData.name,
      email: formData.email,
      phone: formData.phone,
      amount_paid: parseFloat(formData.paymentAmount),
      hire_date: formData.startDate,
      end_date: calculatedEndDate,
    };

    setIsSubmitting(true);
    try {
      if (isEdit && initialData) {
        const updated = {
          ...initialData,
          ...newRecordData,
        };
        if (onUpdateRecord) onUpdateRecord(updated);
        toast({ title: "Updated", description: "Payment updated locally." });
        onOpenChange(false);
      } else {
        const addedRecord = await addpayment(newRecordData);
        if (onAddRecord) onAddRecord(addedRecord);
        toast({ title: "Success!", description: `Payment record for ${addedRecord.full_name || 'new customer'} added successfully.` });
        setFormData(initialFormState);
        onOpenChange(false);
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (error) {
      console.error("Failed to add/update payment record:", error);
      toast({ title: "Error", description: `Operation failed: ${error.message || 'An unexpected error occurred.'}`, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (open) {
      if (isEdit && initialData) {
        setFormData({
          name: initialData.full_name || initialData.name || "",
          email: initialData.email || "",
          phone: initialData.phone || "",
          joinDate: initialData.hire_date || getTodayDate(),
          paymentAmount: initialData.amount_paid ? String(initialData.amount_paid) : "",
          startDate: initialData.hire_date || getTodayDate(),
        });
      } else {
        setFormData({
          ...initialFormState,
          joinDate: getTodayDate(),
          startDate: getTodayDate(),
        });
      }
    }
  }, [open, isEdit, initialData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Add New Payment Record</DialogTitle>
          <DialogDescription>
            Enter customer details and payment information. End date will be calculated automatically (1 month from start).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter customer name"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="joinDate">Join Date</Label>
                <Input
                  id="joinDate"
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="paymentAmount">Payment Amount (₹) *</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  value={formData.paymentAmount}
                  onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })}
                  placeholder="1000"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startDate">Payment Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                disabled={isSubmitting}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Calculated End Date: {calculatedEndDate || 'Select a Start Date'}
              </p>
              <p className="text-xs text-muted-foreground">
                End date is automatically set to 1 month after the start date.
              </p>
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
              {isSubmitting ? 'Adding Record...' : 'Add Record'} 
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}