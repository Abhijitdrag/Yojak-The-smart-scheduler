"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Plus } from "lucide-react";
import { toast } from "sonner";

interface LeaveRecord {
  id: string;
  date: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason?: string;
}

export default function FacultyLeave() {
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  useEffect(() => {
    fetchLeaveRecords();
  }, []);

  const fetchLeaveRecords = async () => {
    try {
      const response = await fetch("/api/faculty/leave");
      if (response.ok) {
        const data = await response.json();
        setLeaveRecords(data.requests || []);
      }
    } catch (error) {
      console.error("Error fetching leave records:", error);
      toast.error("Failed to fetch leave records");
    }
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!leaveDate || !leaveReason) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/faculty/leave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: leaveDate,
          reason: leaveReason
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Leave request submitted successfully");
        setLeaveDate("");
        setLeaveReason("");
        fetchLeaveRecords();
      } else {
        toast.error(data.error || "Failed to submit leave request");
      }
    } catch (error) {
      console.error("Leave submission error:", error);
      toast.error("An error occurred while submitting leave request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline">Pending</Badge>;
      case "APPROVED":
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Leave Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Request Leave
          </CardTitle>
          <CardDescription>
            Submit a leave request for a specific date
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitLeave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leave-date">Date</Label>
                <Input
                  id="leave-date"
                  type="date"
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leave-reason">Reason</Label>
                <Textarea
                  id="leave-reason"
                  placeholder="Please provide a reason for your leave request"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  required
                  rows={3}
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !leaveDate || !leaveReason}
              className="w-full md:w-auto"
            >
              {isSubmitting ? "Submitting..." : "Submit Leave Request"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Leave Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave Requests
          </CardTitle>
          <CardDescription>
            Your leave requests and their statuses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaveRecords.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No leave requests found
              </p>
            ) : (
              leaveRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {new Date(record.date).toLocaleDateString("en-US", { 
                          weekday: "long", 
                          year: "numeric", 
                          month: "long", 
                          day: "numeric" 
                        })}
                      </p>
                      {record.reason && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {record.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(record.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}