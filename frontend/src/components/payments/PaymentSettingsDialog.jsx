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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Settings, Save, Bell, CreditCard, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function PaymentSettingsDialog({ open, onOpenChange }) {
  const [settings, setSettings] = useState({
    dueDayOfMonth: "1",
    gracePeriod: "5",
    lateFeePercentage: "5",
    lateFeeAmount: "50",
    lateFeeType: "percentage",
    autoReminders: true,
    reminderDaysBefore: "3",
    reminderFrequency: "weekly",
    acceptOnlinePayments: true,
    acceptCash: true,
    acceptCheck: true,
    acceptBankTransfer: true,
    sendReceipts: true,
    currency: "USD",
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);

    toast({
      title: "Settings Saved",
      description: "Your payment settings have been updated successfully.",
    });
    onOpenChange(false);
  };

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Settings className="h-5 w-5 text-primary" />
            Payment Settings
          </DialogTitle>
          <DialogDescription>Configure your payment collection preferences.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Payment Due Date */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Payment Schedule</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Day of Month</Label>
                <Select
                  value={settings.dueDayOfMonth}
                  onValueChange={(value) => updateSetting("dueDayOfMonth", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Grace Period (Days)</Label>
                <Input
                  type="number"
                  value={settings.gracePeriod}
                  onChange={(e) => updateSetting("gracePeriod", e.target.value)}
                  min="0"
                  max="30"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Late Fees */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Late Fee Configuration</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Late Fee Type</Label>
                <Select
                  value={settings.lateFeeType}
                  onValueChange={(value) => updateSetting("lateFeeType", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{settings.lateFeeType === "percentage" ? "Percentage (%)" : "Amount ($)"}</Label>
                <Input
                  type="number"
                  value={
                    settings.lateFeeType === "percentage"
                      ? settings.lateFeePercentage
                      : settings.lateFeeAmount
                  }
                  onChange={(e) =>
                    updateSetting(
                      settings.lateFeeType === "percentage"
                        ? "lateFeePercentage"
                        : "lateFeeAmount",
                      e.target.value
                    )
                  }
                  min="0"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Reminders */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Automatic Reminders</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Auto Reminders</Label>
                <p className="text-sm text-muted-foreground">Automatically send payment reminders</p>
              </div>
              <Switch
                checked={settings.autoReminders}
                onCheckedChange={(checked) => updateSetting("autoReminders", checked)}
              />
            </div>
            {settings.autoReminders && (
              <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-primary/20">
                <div className="space-y-2">
                  <Label>Days Before Due</Label>
                  <Input
                    type="number"
                    value={settings.reminderDaysBefore}
                    onChange={(e) => updateSetting("reminderDaysBefore", e.target.value)}
                    min="1"
                    max="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reminder Frequency</Label>
                  <Select
                    value={settings.reminderFrequency}
                    onValueChange={(value) => updateSetting("reminderFrequency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Once</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Payment Methods */}
          <div className="space-y-4">
            <h3 className="font-semibold">Accepted Payment Methods</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label>Online Payments</Label>
                <Switch
                  checked={settings.acceptOnlinePayments}
                  onCheckedChange={(checked) => updateSetting("acceptOnlinePayments", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Cash</Label>
                <Switch
                  checked={settings.acceptCash}
                  onCheckedChange={(checked) => updateSetting("acceptCash", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Check</Label>
                <Switch
                  checked={settings.acceptCheck}
                  onCheckedChange={(checked) => updateSetting("acceptCheck", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Bank Transfer</Label>
                <Switch
                  checked={settings.acceptBankTransfer}
                  onCheckedChange={(checked) => updateSetting("acceptBankTransfer", checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Other Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold">Other Settings</h3>
            <div className="flex items-center justify-between">
              <div>
                <Label>Send Payment Receipts</Label>
                <p className="text-sm text-muted-foreground">Automatically email receipts after payment</p>
              </div>
              <Switch
                checked={settings.sendReceipts}
                onCheckedChange={(checked) => updateSetting("sendReceipts", checked)}
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={settings.currency} onValueChange={(value) => updateSetting("currency", value)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              "Saving..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
