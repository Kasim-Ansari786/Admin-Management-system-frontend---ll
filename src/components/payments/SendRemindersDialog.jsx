import React, { useState, useEffect, useMemo } from "react";
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
import { getPaymentsdetails, getAuthHeaders } from "../../../api";

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

  const getTid = (t, idx) => t?.id ?? t?._id ?? t?.user_id ?? t?.tenant_id ?? idx;

  const totalSelectedAmount = useMemo(() => {
    return tenants.reduce((sum, tenant, idx) => {
      const tid = getTid(tenant, idx);
      return selectedTenants.includes(tid)
        ? sum + (Number(tenant.amount_paid) || 0)
        : sum;
    }, 0);
  }, [tenants, selectedTenants]);

  const handleToggleTenant = (id, checked) => {
    setSelectedTenants((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      } else {
        return prev.filter((t) => t !== id);
      }
    });
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
      // collect recipient emails from selected tenants
      const recipients = tenants
        .map((t, idx) => ({ t, idx }))
        .filter(({ t, idx }) => selectedTenants.includes(getTid(t, idx)))
        .map(({ t }) => t.email || t.guardian_email_id || t.login_email)
        .filter(Boolean);

      if (recipients.length === 0) {
        toast({
          title: "No email addresses",
          description: "Selected tenants have no email addresses.",
          variant: "destructive",
        });
        setSending(false);
        return;
      }

      const payload = {
        recipients: Array.from(new Set(recipients)),
        subject: "Payment Reminder",
        message: customMessage || `This is a friendly reminder about your pending payment.`,
      };

      const headers = getAuthHeaders();

      const resp = await fetch("http://localhost:5001/api/send-reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Failed to send reminders (${resp.status})`);
      }

      const result = await resp.json();
      const successCount = (result.results || []).filter((r) => r.success).length;

      toast({
        title: "Reminders Sent",
        description: `Sent to ${successCount} of ${recipients.length} recipient(s).`,
      });

      setSelectedTenants([]);
      setCustomMessage("");
      onOpenChange(false);
    } catch (e) {
      console.error("Error sending reminders:", e);
      toast({
        title: "Error Sending Reminders",
        description: e.message || "An error occurred while trying to send the reminders.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const totalPending = tenants.reduce((sum, t, idx) => {
    const tid = getTid(t, idx);
    return selectedTenants.includes(tid) ? sum + (Number(t.pendingAmount) || 0) : sum;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Mail className="h-5 w-5 text-[#1A9CFF]" />
            Send Payment Reminders
          </DialogTitle>

          <DialogDescription>
            Select tenant to send payment reminder email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Selected Count */}
          <div className="flex justify-end">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {selectedTenants.length} selected
            </Badge>
          </div>

          {/* Tenant List */}
          <div className="border rounded-lg divide-y max-h-[240px] overflow-y-auto">
            {loading && (
              <div className="flex justify-center items-center p-6 text-[#1A9CFF]">
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
              tenants.map((tenant, idx) => {
                const tid = getTid(tenant, idx);
                return (
                  <div
                    key={tid}
                    className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`tenant-${tid}`}
                        checked={selectedTenants.includes(tid)}
                        onCheckedChange={(checked) =>
                          handleToggleTenant(tid, checked)
                        }
                        className="data-[state=checked]:bg-[#1A9CFF] data-[state=checked]:border-[#1A9CFF]"
                      />

                      <div>
                        <Label
                          htmlFor={`tenant-${tid}`}
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
                        Last: {" "}
                        {tenant.end_date
                          ? new Date(tenant.end_date).toLocaleDateString("en-IN")
                          : "—"}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Total Amount */}
          {selectedTenants.length > 0 && (
            <div className="bg-[#1A9CFF]/5 border border-[#1A9CFF]/20 rounded-lg p-3">
              <p className="text-sm font-medium">
                Total Pending Amount:{" "}
                <span className="text-[#1A9CFF] font-bold text-lg">
                  ₹{totalSelectedAmount.toLocaleString()}
                </span>
              </p>
            </div>
          )}

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="custom-message">Custom Message (Optional)</Label>

            <Textarea
              id="custom-message"
              placeholder="Add a personalized message..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
              className="focus-visible:ring-[#1A9CFF]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSendReminders}
            disabled={
              sending ||
              loading ||
              tenants.length === 0 ||
              selectedTenants.length === 0
            }
            className="bg-[#1A9CFF] hover:bg-[#1582d4] text-white border-none"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Reminder
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
