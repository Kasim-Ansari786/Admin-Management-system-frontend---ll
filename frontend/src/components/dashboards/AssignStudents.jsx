import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const AssignStudents = ({ coaches, students, onAssign }) => {
  const { toast } = useToast();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCoach, setSelectedCoach] = useState(null);

  const unassignedStudents = students.filter(s => !s.coachId);
  const assignedStudents = students.filter(s => s.coachId);

  const handleAssign = () => {
    if (selectedStudent && selectedCoach) {
      onAssign(selectedStudent, selectedCoach);
      const student = students.find(s => s.id === selectedStudent);
      const coach = coaches.find(c => c.id === selectedCoach);
      
      toast({
        title: "Student Assigned",
        description: `${student?.name} has been assigned to ${coach?.name}`,
      });

      setSelectedStudent(null);
      setSelectedCoach(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Assignment Form */}
      <Card className="border-primary/20 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <UserPlus className="h-5 w-5 text-primary" />
            Assign Student to Coach
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Select a student and assign them to a coach
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Select Student */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Select Student</label>
              <Select
                value={selectedStudent?.toString()}
                onValueChange={(value) => setSelectedStudent(Number(value))}
              >
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.name} - {student.position}
                      {student.coachId && " (Currently Assigned)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select Coach */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Select Coach</label>
              <Select
                value={selectedCoach?.toString()}
                onValueChange={(value) => setSelectedCoach(Number(value))}
              >
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Choose a coach" />
                </SelectTrigger>
                <SelectContent>
                  {coaches.map(coach => (
                    <SelectItem key={coach.id} value={coach.id.toString()}>
                      {coach.name} - {coach.category} ({coach.assignedCount} students)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleAssign}
            disabled={!selectedStudent || !selectedCoach}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Assign Student
          </Button>
        </CardContent>
      </Card>

      {/* Unassigned Students */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5 text-muted-foreground" />
            Unassigned Students ({unassignedStudents.length})
          </CardTitle>
        </CardHeader>

        <CardContent>
          {unassignedStudents.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {unassignedStudents.map(student => (
                <Card key={student.id} className="border-border bg-muted/30">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="font-semibold text-foreground">{student.name}</div>
                      <div className="flex gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="border-border">Age {student.age}</Badge>
                        <Badge variant="outline" className="border-border">{student.position}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Attendance: {student.attendance}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              All students have been assigned to coaches
            </p>
          )}
        </CardContent>
      </Card>

      {/* Assigned Students */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5 text-success" />
            Assigned Students ({assignedStudents.length})
          </CardTitle>
        </CardHeader>

        <CardContent>
          {assignedStudents.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {assignedStudents.map(student => {
                const coach = coaches.find(c => c.id === student.coachId);
                return (
                  <Card key={student.id} className="border-success/20 bg-success/5">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="font-semibold text-foreground">{student.name}</div>
                        <div className="flex gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="border-border">Age {student.age}</Badge>
                          <Badge variant="outline" className="border-border">{student.position}</Badge>
                        </div>
                        <div className="text-sm">
                          <Badge className="bg-success text-success-foreground">
                            Coach: {coach?.name}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Attendance: {student.attendance}%
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No students have been assigned yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
