"use client";

import { useSupabaseAuth } from "@/lib/supabase-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Users, AlertTriangle, CheckCircle, BookOpen } from "lucide-react";
import EmergencyRescheduler from "@/components/emergency-rescheduler";
import FacultyAttendance from "@/components/faculty-attendance";
import FacultyLeave from "@/components/faculty-leave";
import SyllabusTracker from "@/components/syllabus-tracker";
import RealTimeNotifications from "@/components/real-time-notifications";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth-guard";
import HolidaysList from "@/components/holidays-list";

interface DashboardData {
  totalSubjects: number;
  totalFaculty: number;
  totalStudents: number;
  pendingApprovals: number;
  upcomingClasses: any[];
  recentHolidays: any[];
  role?: string;
  verificationStatus?: string;
}

function DashboardContent() {
  const { user, session, signOut } = useSupabaseAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalSubjects: 0,
    totalFaculty: 0,
    totalStudents: 0,
    pendingApprovals: 0,
    upcomingClasses: [],
    recentHolidays: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session) return;

    // Load dashboard data based on role
    loadDashboardData();
    const onFocus = () => loadDashboardData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [session]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/dashboard", {
        headers: {
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleDashboard = () => {
    const role = dashboardData.role || (user?.user_metadata?.role || "STUDENT");
    const verificationStatus = dashboardData.verificationStatus || (user?.user_metadata?.verificationStatus || "PENDING");

    if (verificationStatus === "PENDING") {
      return (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your account is pending approval. Please contact the administrator.
          </AlertDescription>
        </Alert>
      );
    }

    switch (role) {
      case "ADMIN":
        return <AdminDashboard data={dashboardData} />;
      case "FACULTY":
        return <FacultyDashboard data={dashboardData} />;
      case "STUDENT":
        return <StudentDashboard data={dashboardData} />;
      default:
        return (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Invalid role assigned. Please contact the administrator.
            </AlertDescription>
          </Alert>
        );
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/signin");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Smart Classroom Scheduler</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Welcome back, {user?.user_metadata?.full_name || user?.email} ({dashboardData.role || user?.user_metadata?.role || "STUDENT"})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RealTimeNotifications />
          <Button variant="outline" size="sm" onClick={handleSignOut} className="text-xs sm:text-sm">
            Sign out
          </Button>
        </div>
      </div>
      
      {getRoleDashboard()}
    </div>
  );
}

export default function Dashboard() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function AdminDashboard({ data }: { data: DashboardData }) {
  const router = useRouter();
  const { session } = useSupabaseAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateTimetable = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/timetable/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          constraints: {
            maxDailyHours: 8,
            maxWeeklyHours: 40,
            minGapBetweenClasses: 15,
            preferredTimeSlots: [],
            labHoursRequired: true
          }
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Timetable generated successfully");
      } else {
        toast.error(result.error || "Failed to generate timetable");
      }
    } catch (error) {
      console.error("Timetable generation error:", error);
      toast.error("An error occurred while generating timetable");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Subjects</CardTitle>
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-2xl font-bold">{data.totalSubjects}</div>
          </CardContent>
        </Card>
        
        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Faculty</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-2xl font-bold">{data.totalFaculty}</div>
          </CardContent>
        </Card>
        
        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Students</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-2xl font-bold">{data.totalStudents}</div>
          </CardContent>
        </Card>
        
        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending Approvals</CardTitle>
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-2xl font-bold">{data.pendingApprovals}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs
        defaultValue="overview"
        className="space-y-4"
        onValueChange={(val) => {
          if (val === "faculty") router.push('/admin/faculty');
          if (val === "subjects") router.push('/admin/subjects');
          if (val === "students") router.push('/admin/students');
        }}
      >
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 w-full">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="faculty" className="text-xs sm:text-sm">Faculty</TabsTrigger>
          <TabsTrigger value="subjects" className="text-xs sm:text-sm">Subjects</TabsTrigger>
          <TabsTrigger value="students" className="text-xs sm:text-sm">Students</TabsTrigger>
          <TabsTrigger value="timetable" className="text-xs sm:text-sm">Timetable</TabsTrigger>
          <TabsTrigger value="holidays" className="text-xs sm:text-sm">Holidays</TabsTrigger>
          <TabsTrigger value="syllabus" className="text-xs sm:text-sm">Syllabus</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Button variant="outline" className="h-16 sm:h-20 flex-col p-2" onClick={() => router.push('/admin/faculty')}>
                <Users className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                <span className="text-xs sm:text-sm text-center">Manage Faculty</span>
              </Button>
              <Button variant="outline" className="h-16 sm:h-20 flex-col p-2" onClick={() => router.push('/admin/subjects')}>
                <BookOpen className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                <span className="text-xs sm:text-sm text-center">Manage Subjects</span>
              </Button>
              <Button variant="outline" className="h-16 sm:h-20 flex-col p-2" onClick={() => router.push('/admin/departments')}>
                <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                <span className="text-xs sm:text-sm text-center">Manage Departments</span>
              </Button>
              <Button variant="outline" className="h-16 sm:h-20 flex-col p-2" onClick={() => router.push('/admin/approvals')}>
                <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                <span className="text-xs sm:text-sm text-center">Approvals</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 sm:h-20 flex-col p-2"
                onClick={handleGenerateTimetable}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <div className="h-4 w-4 sm:h-6 sm:w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-1 sm:mb-2" />
                ) : (
                  <Calendar className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                )}
                <span className="text-xs sm:text-sm text-center">{isGenerating ? "Generating..." : "Generate Timetable"}</span>
              </Button>
              <Button variant="outline" className="h-16 sm:h-20 flex-col p-2" onClick={() => router.push('/faculty/schedule')}>
                <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                <span className="text-xs sm:text-sm text-center">Faculty Schedule</span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timetable" className="space-y-4">
          <EmergencyRescheduler />
        </TabsContent>

        <TabsContent value="syllabus" className="space-y-4">
          <SyllabusTracker />
        </TabsContent>

        <TabsContent value="holidays" className="space-y-4">
          <HolidaysList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FacultyDashboard({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Weekly Hours</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-2xl font-bold">24 / 40</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        
        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Today's Classes</CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-2xl font-bold">{data.upcomingClasses.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>
        
        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Syllabus Progress</CardTitle>
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full">
          <TabsTrigger value="schedule" className="text-xs sm:text-sm">My Schedule</TabsTrigger>
          <TabsTrigger value="subjects" className="text-xs sm:text-sm">My Subjects</TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs sm:text-sm">Attendance</TabsTrigger>
          <TabsTrigger value="leave" className="text-xs sm:text-sm">Request Leave</TabsTrigger>
        </TabsList>
        
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.upcomingClasses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm">No classes scheduled for today</p>
                  </div>
                ) : (
                  data.upcomingClasses.map((classItem, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm sm:text-base">{classItem.subject}</p>
                        <p className="text-xs sm:text-sm text-gray-600">{classItem.time} - {classItem.classroom}</p>
                      </div>
                      <Badge variant={classItem.type === "LAB" ? "destructive" : "secondary"} className="text-xs w-fit">
                        {classItem.type}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <FacultyAttendance />
        </TabsContent>

        <TabsContent value="leave" className="space-y-4">
          <FacultyLeave />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StudentDashboard({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Today's Classes</CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-2xl font-bold">{data.upcomingClasses.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>
        
        <Card className="p-3 sm:p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Current Semester</CardTitle>
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-2xl font-bold">4th</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timetable" className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full">
          <TabsTrigger value="timetable" className="text-xs sm:text-sm">My Timetable</TabsTrigger>
          <TabsTrigger value="subjects" className="text-xs sm:text-sm">Subjects</TabsTrigger>
          <TabsTrigger value="labs" className="text-xs sm:text-sm">Lab Schedule</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs sm:text-sm">Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timetable" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Timetable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.upcomingClasses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm">No classes scheduled for today</p>
                  </div>
                ) : (
                  data.upcomingClasses.map((classItem, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm sm:text-base">{classItem.subject}</p>
                        <p className="text-xs sm:text-sm text-gray-600">{classItem.time} - {classItem.classroom}</p>
                        <p className="text-xs text-gray-500">{classItem.faculty}</p>
                      </div>
                      <Badge variant={classItem.type === "LAB" ? "destructive" : "secondary"} className="text-xs w-fit">
                        {classItem.type}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}