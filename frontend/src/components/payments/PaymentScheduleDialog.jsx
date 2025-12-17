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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Trash2, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const initialSchedules = [
  { id: "1", name: "Monthly Rent", amount: 1200, frequency: "monthly", dueDay: 1, status: "active" },
  { id: "2", name: "Maintenance Fee", amount: 100, frequency: "monthly", dueDay: 15, status: "active" },
  { id: "3", name: "Parking Fee", amount: 50, frequency: "monthly", dueDay: 1, status: "active" },
];

export default function PaymentScheduleDialog({ open, onOpenChange }) {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: "",
    amount: "",
    frequency: "monthly",
    dueDay: "1",
  });

  const handleAddSchedule = () => {
    if (!newSchedule.name || !newSchedule.amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const schedule = {
      id: Date.now().toString(),
      name: newSchedule.name,
      amount: parseFloat(newSchedule.amount),
      frequency: newSchedule.frequency,
      dueDay: parseInt(newSchedule.dueDay, 10),
      status: "active",
    };

    setSchedules([...schedules, schedule]);
    setNewSchedule({ name: "", amount: "", frequency: "monthly", dueDay: "1" });
    setShowAddForm(false);

    toast({
      title: "Schedule Added",
      description: `${schedule.name} has been added to the payment schedule.`,
    });
  };

  const handleDeleteSchedule = (id) => {
    setSchedules(schedules.filter((s) => s.id !== id));
    toast({
      title: "Schedule Removed",
      description: "The payment schedule has been removed.",
    });
  };

  const handleToggleStatus = (id) => {
    setSchedules(
      schedules.map((s) =>
        s.id === id ? { ...s, status: s.status === "active" ? "paused" : "active" } : s
      )
    );
  };

  const getFrequencyLabel = (frequency) => {
    const labels = {
      weekly: "Weekly",
      biweekly: "Bi-weekly",
      monthly: "Monthly",
      quarterly: "Quarterly",
      yearly: "Yearly",
    };
    return labels[frequency] || frequency;
  };

  const totalMonthly = schedules
    .filter((s) => s.status === "active")
    .reduce((sum, s) => {
      const multiplier =
        s.frequency === "weekly"
          ? 4
          : s.frequency === "biweekly"
          ? 2
          : s.frequency === "quarterly"
          ? 1 / 3
          : s.frequency === "yearly"
          ? 1 / 12
          : 1;
      return sum + s.amount * multiplier;
    }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Calendar className="h-5 w-5 text-primary" />
            Payment Schedule
          </DialogTitle>
          <DialogDescription>Manage recurring payment schedules for your tenants.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary Card */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Monthly Expected</p>
                <p className="text-2xl font-bold text-primary">₹{totalMonthly.toLocaleString()}</p>
              </div>
              <Badge variant="secondary">{schedules.filter((s) => s.status === "active").length} Active</Badge>
            </div>
          </div>

          {/* Schedule List */}
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`border rounded-lg p-4 transition-all ${
                  schedule.status === "paused" ? "opacity-60 bg-muted/50" : "bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{schedule.name}</h4>
                      <Badge
                        variant={schedule.status === "active" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {schedule.status}
                      </Badge>
                    </div>
                    <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                      <span>${schedule.amount.toLocaleString()}</span>
                      <span>•</span>
                      <span>{getFrequencyLabel(schedule.frequency)}</span>
                      <span>•</span>
                      <span>Due: Day {schedule.dueDay}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(schedule.id)}>
                      {schedule.status === "active" ? "Pause" : "Resume"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Schedule Form */}
          {showAddForm ? (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <h4 className="font-semibold">Add New Schedule</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Name</Label>
                  <Input
                    placeholder="e.g., Monthly Rent"
                    value={newSchedule.name}
                    onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newSchedule.amount}
                    onChange={(e) => setNewSchedule({ ...newSchedule, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={newSchedule.frequency}
                    onValueChange={(value) => setNewSchedule({ ...newSchedule, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Due Day of Month</Label>
                  <Select
                    value={newSchedule.dueDay}
                    onValueChange={(value) => setNewSchedule({ ...newSchedule, dueDay: value })}
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
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleAddSchedule}>
                  <Check className="h-4 w-4 mr-2" />
                  Add Schedule
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full border-dashed" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Payment Schedule
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
