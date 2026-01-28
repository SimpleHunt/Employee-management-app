"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Download, Calendar, TrendingUp, Clock, Award } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/lib/supabase";

/* ---------------- TYPES ---------------- */

interface AttendanceRow {
  date: string;
  status: "present" | "late" | "absent";
  punch_in_time: string | null;
  punch_out_time: string | null;
  work_hours: number | null;
}

interface ReportsPageProps {
  employeeCode: string;
}

interface LeaveRequest {
  id: string;
  type: string;         
  startDate: string;
  endDate: string;
  days: number;
  status: 'pending' | 'approved' | 'rejected';
}


/* ---------------- COMPONENT ---------------- */

export function ReportsPage({ employeeCode }: ReportsPageProps) {
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  const isSameMonth = (date: string) => {
  const d = new Date(date);
  const now = new Date();
  return (
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
};



  /* ---------------- FETCH EMPLOYEE ---------------- */

  useEffect(() => {
    const fetchEmployee = async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, name, employee_code, department, position,company_name")
        .eq("employee_code", employeeCode)
        .single();

      if (error || !data) {
        toast.error("Employee not found");
        setLoading(false);
        return;
      }

      setEmployeeId(data.id);
      setEmployeeData(data);
    };

    fetchEmployee();
  }, [employeeCode]);

  
  /* ---------------- FETCH LEAVES ---------------- */

useEffect(() => {
  if (!employeeId) return;

 const fetchLeaves = async () => {
  if (!employeeId) return;

  const { data, error } = await supabase
    .from("leave_requests")
    .select("id, leave_type, start_date, end_date, days, status")
    .eq("employee_id", employeeId)
    .eq("status", "approved");

  if (error) {
    toast.error("Failed to load leaves");
    return;
  }

  const mappedLeaves: LeaveRequest[] =
    (data ?? []).map((l: any) => ({
      id: l.id,
      type: l.leave_type,
      startDate: l.start_date,
      endDate: l.end_date,
      days: l.days,
      status: l.status,
    }));

  setLeaveRequests(mappedLeaves);
};


  fetchLeaves();
}, [employeeId]);



  /* ---------------- FETCH ATTENDANCE ---------------- */

  useEffect(() => {
    if (!employeeId) return;

    const fetchAttendance = async () => {
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      const { data, error } = await supabase
        .from("attendance")
        .select("date, status, punch_in_time, punch_out_time, work_hours")
        .eq("employee_id", employeeId)
        .gte("date", start.toISOString())
        .lte("date", end.toISOString());

      if (error) {
        toast.error("Failed to load attendance");
        setLoading(false);
        return;
      }

      setAttendance(data ?? []);
      setLoading(false);
    };

    fetchAttendance();
  }, [employeeId]);

  /* ---------------- CALCULATIONS ---------------- */

  const stats = useMemo(() => {
    const present = attendance.filter(a => a.status === "present").length;
    const late = attendance.filter(a => a.status === "late").length;
    const absent = attendance.filter(a => a.status === "absent").length;

    

    return { present, late, absent };
  }, [attendance]);

  const presents= stats.present+ stats.late

  const workingDays = stats.present + stats.late;

  const attendancePercentage =
    workingDays > 0 ? ((stats.present / workingDays) * 100).toFixed(1) : "0";

const totalLeavesTakenThisMonth = leaveRequests
  .filter(
    l =>
      l.status === 'approved' &&
      isSameMonth(l.startDate)
  )
  .reduce((sum, l) => sum + l.days, 0);

  const avgHours = useMemo(() => {
    const hours = attendance
      .map(a => a.work_hours ?? 0)
      .filter(h => h > 0);

    return hours.length
      ? (hours.reduce((a, b) => a + b, 0) / hours.length).toFixed(1)
      : "0";
  }, [attendance]);

  const monthlyData = [
    {
      month: format(new Date(), "MMM"),
      present: stats.present+stats.late,
      late: totalLeavesTakenThisMonth,
      avgHours: Number(avgHours),
    },
  ];

  const pieData = [
    { name: "Present", value: stats.present, color: "#10b981" },
    { name: "Late", value: stats.late, color: "#f59e0b" },
    { name: "Absent", value:totalLeavesTakenThisMonth, color: "#ef4444" },
  ];

  const performanceData = [
    { metric: "Punctuality", score: 95 },
    { metric: "Task Completion", score: 92 },
    { metric: "Team Collaboration", score: 88 },
    { metric: "Quality of Work", score: 94 },
  ];

  const handleDownloadReport = () => {
    toast.success("Downloading monthly report...");
  };
  
  


  if (loading || !employeeData) {
    return <p className="text-center">Loading report...</p>;
  }
 
  return (
    <div className="max-w-6xl mx-auto space-y-6">
            <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Monthly Report</CardTitle>
              <CardDescription>
                Comprehensive overview of your performance and attendance
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select defaultValue="current">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">
                    {format(new Date(), "MMMM yyyy")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleDownloadReport}>
                <Download className="size-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Employee Name</p>
              <p className="text-lg mt-1">{employeeData.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Employee ID</p>
              <p className="text-lg mt-1">{employeeData.employee_code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Company Name</p>
              <p className="text-lg mt-1">{employeeData.company_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Position</p>
              <p className="text-lg mt-1">{employeeData.position}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Attendance Rate</p>
                    <p className="text-3xl mt-1">{attendancePercentage}%</p>
                    <Badge className="mt-2" variant="outline">Excellent</Badge>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Calendar className="size-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
    
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Working Days</p>
                    <p className="text-3xl mt-1">{presents}</p>
                    <p className="text-xs text-gray-500 mt-2">This month</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Clock className="size-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
    
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg. Hours/Day</p>
                    <p className="text-3xl mt-1">{avgHours}</p>
                    <p className="text-xs text-gray-500 mt-2">Hours worked</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <TrendingUp className="size-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
        
         {/*
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Performance</p>
                    <p className="text-3xl mt-1">92%</p>
                    <Badge className="mt-2" variant="outline">Outstanding</Badge>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Award className="size-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
           */}
          </div>

           
    
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Attendance Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Trend</CardTitle>
                <CardDescription>Last 6 months attendance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="present" fill="#10b981" name="Present Days" />
                    <Bar dataKey="leave" fill="#f97316" name="Leave Days" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
    
            {/* Attendance Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Distribution</CardTitle>
                <CardDescription>Current month breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                            `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                          }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
    
            {/* Average Working Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Average Working Hours</CardTitle>
                <CardDescription>Daily average over last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avgHours"
                      stroke="#6366f1"
                      strokeWidth={2}
                      name="Avg Hours"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
    
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Current month evaluation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">{item.metric}</span>
                        <span className="text-sm">{item.score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all"
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
    
          {/* Detailed Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Attendance Summary</CardTitle>
              <CardDescription>Month-by-month breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyData.reverse().map((month, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span>{month.month} 2024</span>
                      <div className="flex gap-4">
                        <span className="text-sm text-gray-600">
                          Present: <span className="text-green-600">{presents}</span>
                        </span>
                        <span className="text-sm text-gray-600">
                          Leave: <span className="text-orange-600">{totalLeavesTakenThisMonth}</span>
                        </span>
                        <span className="text-sm text-gray-600">
                          Avg Hours: <span className="text-blue-600">{month.avgHours}</span>
                        </span>
                      </div>
                    </div>
                    {index < monthlyData.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
  );
}
