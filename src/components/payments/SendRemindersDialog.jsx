import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, Users, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getPaymentsdetails } from "../../../api";

export default function SendRemindersDialog({ open, onOpenChange }) {
  const { toast } = useToast();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedTenants, setSelectedTenants] = useState([]); 
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fetchTenants = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPaymentsdetails();
      setTenants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch payments data:", err);
      setError("Failed to load tenant data. Please try again.");
      toast({
        title: "Error",
        description:
          "Could not fetch the list of tenants with pending payments.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchTenants();
  }, [open]);

  const handleSelectAll = () => {
    if (selectedTenants.length === tenants.length) {
      setSelectedTenants([]);
    } else {
      setSelectedTenants(tenants.map((t) => t.id));
    }
  };

  const handleToggleTenant = (id) => {
    setSelectedTenants((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSendReminders = async () => {
    if (selectedTenants.length === 0) {
      toast({
        title: "No tenants selected",
        description: "Please select at least one tenant to send reminders.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      // Simulate API call delay
      await new Promise((res) => setTimeout(res, 1200));

      toast({
        title: "Reminders Sent",
        description: `Successfully sent payment reminders to ${selectedTenants.length} tenant(s).`,
      });

      setSelectedTenants([]);
      setCustomMessage("");
      onOpenChange(false);
    } catch (e) {
      console.error("Error sending reminders:", e);
      toast({
        title: "Error Sending Reminders",
        description: "An error occurred while trying to send the reminders.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const totalPending = tenants
    .filter((t) => selectedTenants.includes(t.id))
    .reduce((sum, t) => sum + (Number(t.pendingAmount) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Mail className="h-5 w-5 text-primary" />
            Send Payment Reminders
          </DialogTitle>
          <DialogDescription>
            Select tenants to send payment reminder emails.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={
                  selectedTenants.length > 0 &&
                  selectedTenants.length === tenants.length
                }
                onCheckedChange={handleSelectAll}
                disabled={loading || error || tenants.length === 0}
              />
              <Label htmlFor="select-all" className="font-medium">
                Select All Tenants
              </Label>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {selectedTenants.length} selected
            </Badge>
          </div>

          <div className="border rounded-lg divide-y max-h-[240px] overflow-y-auto">
            {loading && (
              <div className="flex justify-center items-center p-6 text-primary">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading tenants...
              </div>
            )}

            {error && !loading && (
              <div className="flex justify-center items-center p-6 text-destructive bg-destructive/10">
                <AlertTriangle className="h-5 w-5 mr-2" />
                {error}
              </div>
            )}

            {!loading && !error && tenants.length === 0 && (
              <div className="flex justify-center items-center p-6 text-muted-foreground">
                No tenants found with pending payments.
              </div>
            )}

            {!loading &&
              !error &&
              tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={tenant.id}
                      checked={selectedTenants.includes(tenant.id)}
                      onCheckedChange={() => handleToggleTenant(tenant.id)}
                    />
                    <div>
                      {/* FIX: Changed htmlFor from tenant.payment_id to tenant.id */}
                      <Label
                        htmlFor={tenant.id} 
                        className="font-medium cursor-pointer"
                      >
                        {tenant.full_name}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {tenant.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-destructive">
                      ₹{(Number(tenant.amount_paid) || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last:{" "}
                      {tenant.end_date
                        ? new Date(tenant.end_date).toLocaleDateString("en-IN")
                        : "—"}
                    </p>
                  </div>
                </div>
              ))}
          </div>

          {selectedTenants.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-sm font-medium">
                Total Pending Amount:{" "}
                <span className="text-primary">
                  ₹{totalPending.toLocaleString()}
                </span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="custom-message">Custom Message (Optional)</Label>
            <Textarea
              id="custom-message"
              placeholder="Add a personalized message to include in the reminder email..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            {"Cancel"}
          </Button>
          <Button
            onClick={handleSendReminders}
            disabled={
              sending ||
              loading ||
              tenants.length === 0 ||
              selectedTenants.length === 0
            }
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Reminders
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}