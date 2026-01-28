"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Calendar,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  User,
  BarChart3,
  Clock,
  Umbrella,
} from "lucide-react";
import { AttendanceCalendar } from "./AttendanceCalendar";
import { ProfilePage } from "./Profilepage";
import { ReportsPage } from "./ReportsPage";
import { LeaveManagement } from "./Leavemanagement";
import { EmployeeManagement } from "./EmployeeManagement";
import { AdminReportsPage  } from "./AdminReportsPage";
import AdminDocumentsPage from './AdminDocumentsPage';        
import EmployeeDocumentsPage from './EmployeeDocumentsPage'; 
import { PunchInOut } from "./PunchInOut";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import LateApprovalsPage from "./LateApprovalsPage";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Image from "next/image";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { SheetTitle } from "./ui/sheet";
import AttendanceApprovalsPage from "./AttendanceApprovalsPage";
import EmployeeFeedbackAdminPage from "./EmployeeFeedbackAdminPage";
import EmployeeFeedbackPage from "./EmployeeFeedbackPage";
import { AdminDailyReportsPage } from "./AdminDailyReportsPage";



/* ---------------- TYPES ---------------- */

interface DashboardProps {
  employeeCode: string;
  role: "admin" | "manager" | "employee";

  onLogout: () => void;

}

interface Attendance {
  date: Date;
  status: "present" | "leave" | "weekoff" | "holiday";
  hours?: number | null;
}

/* ---------------- COMPONENT ---------------- */

export function Dashboard({ employeeCode, role, onLogout }: DashboardProps) {
  const [currentPage, setCurrentPage] = useState<
  "calendar" | "profile" | "reports" | "leave" | "employees" | "punch" | "late-approvals" |"attendance-approvals"|"admin-reports"|"documents"| "feedback"| "admin-daily-reports"
>(() => {
  if (role === "admin" || role === "manager") return "employees";
  return "punch";
});

const [authReady, setAuthReady] = useState(false);


  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  let mounted = true;

  const initAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.error('Supabase auth failed:', error);
        toast.error('Authentication failed');
        return;
      }
    }

    // Wait for session to be fully ready
    const { data: { user: finalUser } } = await supabase.auth.getUser();
    if (mounted && finalUser) {
      setAuthReady(true);
    }
  };

  initAuth();

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      if (mounted && session?.user) {
        setAuthReady(true);
      }
    }
  );

  return () => {
    mounted = false;
    listener.subscription.unsubscribe();
  };
}, []);


  /* ---------------- FETCH EMPLOYEE ---------------- */

  useEffect(() => {
    const fetchEmployee = async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, name, email, department, position, join_date, employee_code")
        .eq("employee_code", employeeCode)
        .single();

      if (error || !data) {
        toast.error("Failed to load employee data");
        setLoading(false);
        return;
      }

      setEmployeeData({
        id: data.id,
        name: data.name,
        email: data.email,
        department: data.department,
        position: data.position,
        joinDate: data.join_date,
        employeeCode: data.employee_code,
      });

      fetchAttendance(data.id);
    };

    fetchEmployee();
  }, [employeeCode]);

  

  /* ---------------- FETCH ATTENDANCE ---------------- */

  const fetchAttendance = async (employeeId: string) => {
    const { data, error } = await supabase
      .from("attendance")
      .select("date, status, hours")
      .eq("employee_id", employeeId);

    if (!error && data) {
      setAttendanceData(
        data.map((a: any) => ({
          date: new Date(a.date),
          status: a.status,
          hours: a.hours,
        }))
      );
    }

    setLoading(false);


  };
  const pageVisibility: Record<string, ("admin" | "manager" | "employee")[]> = {
  punch: ["employee"],            
  calendar: ["employee",  ],
  profile: ["employee", "admin", "manager"],
  leave: ["employee", "admin", "manager"],
  reports: ["employee",],
  employees: ["admin", "manager"],
   "admin-daily-reports": ["admin", "manager"],
  "late-approvals": ["admin", "manager"],
  "admin-reports": ["admin", "manager"],
  "documents": ["admin", "manager","employee"],
  "attendance-approvals": ["admin", "manager"],
   feedback: ["employee", "admin", "manager"],

  
};

  /* ---------------- NAV ITEMS ---------------- */

const navigationItems = [
  { id: "punch", label: "Log In/Out", icon: Clock },
  { id: "calendar", label: "Attendance", icon: Calendar },
  { id: "profile", label: "Profile", icon: User },
  { id: "leave", label: "Leave", icon: Umbrella },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "employees", label: "Employees", icon: Users },
  { id: "late-approvals", label: "Late Approvals", icon: Clock },
   { id: "attendance-approvals", label: "WFH Approvals", icon: Clock },
   { id: "admin-daily-reports", label: "Daily Reports", icon: BarChart3 },
   { id: "admin-reports", label: "Admin Reports", icon: FileText },
   { id: 'documents', label: 'Documents', icon: FileText },
  { id: "feedback", label: "Suggestions", icon: FileText },


].filter((item) => pageVisibility[item.id]?.includes(role));


  const NavItems = () => (
    <>
      {navigationItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => {
              setCurrentPage(item.id as any);
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full ${
              currentPage === item.id
                ? "bg-indigo-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Icon className="size-5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </>
  );

  /* ---------------- LOADING ---------------- */

  if (loading || !employeeData || !authReady) {
  return <p className="text-center mt-10">Loading...</p>;
}

  

  /* ---------------- UI ---------------- */

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2  rounded-lg">
              <Image
                     src="/simpleHuntLogo.png"
                     alt="Simple Hunt Logo"
                     width={55}
                     height={45}
                   />
            </div>
            <div>
              <h1 className="text-xl">EMS Portal</h1>
              <p className="text-xs text-gray-500 capitalize">{role} Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItems />
        </nav>

        <div className="p-4 border-t">
          <Button variant="outline" className="w-full justify-start" onClick={onLogout}>
            <LogOut className="size-4 mr-2" />
            Logout
          </Button>
        </div>
        
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
           <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>


              <SheetContent side="left" className="w-64 p-0">
                <VisuallyHidden>
                  <SheetTitle>Navigation Menu</SheetTitle>
                </VisuallyHidden>
                <div className="p-6 border-b">
                  <h1 className="text-xl">EMS Portal</h1>
                  <p className="text-xs text-gray-500 capitalize">{role} Panel</p>
                </div>

                <nav className="p-4 space-y-2">
                  <NavItems />
                </nav>

                <div className="p-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={onLogout}
                  >
                    <LogOut className="size-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          <div>
            <h2 className="text-xl">
              {navigationItems.find((i) => i.id === currentPage)?.label}
            </h2>
            <p className="text-sm text-gray-500">Welcome back, {employeeData.name}</p>
          </div>
         


          <Avatar>
            <AvatarFallback className="bg-indigo-600 text-white">
              {employeeData.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
        </header>

              <main className="flex-1 overflow-auto p-6">
          {currentPage === "punch" && role === "employee" && (
            <PunchInOut employeeCode={employeeCode} role={role} />
          )}

          

          {currentPage === "calendar" && (
            <AttendanceCalendar  employeeCode={employeeCode}  />
          )}

          {currentPage === "profile" && (
            <ProfilePage employeeCode={employeeCode} role={role} />
          )}

          {currentPage === "leave" &&   (
            <LeaveManagement role={role} employeeCode={employeeCode} />
          )}

          {currentPage === "reports" &&  (
            <ReportsPage employeeCode={employeeCode} />
          )}

          {currentPage === "employees" && role !== "employee" && (
            <EmployeeManagement role={role} />
          )}

          {currentPage === "late-approvals" && role !== "employee" && (
            <LateApprovalsPage />
          )}
           {currentPage === "attendance-approvals" && role !== "employee" && (
              <AttendanceApprovalsPage />
            )}

           {currentPage === "admin-reports" && role !== "employee" && (
            <AdminReportsPage />
          )}

           {currentPage === 'documents' && (
            role === 'admin' || role === 'manager' ? (
              <AdminDocumentsPage />
            ) : (
              <EmployeeDocumentsPage  employeeCode={employeeCode} />
            )
          )}
                    {currentPage === "feedback" && role === "employee" && (
              <EmployeeFeedbackPage employeeId={employeeData.id} />
            )}

            {currentPage === "feedback" && role !== "employee" && (
              <EmployeeFeedbackAdminPage />
            )}
            {currentPage === "admin-daily-reports" && role !== "employee" && (
                <AdminDailyReportsPage />
              )}

        </main>

      </div>
    </div>
  );
}
