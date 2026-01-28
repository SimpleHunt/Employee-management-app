"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import Footer from "./Footer";
import { supabase } from "@/lib/supabase";

/* ---------------- TYPES ---------------- */

type DayStatus = "present" | "late" | "leave" | "weekoff" | "holiday";

interface AttendanceData {
  date: Date;
  status: DayStatus;
}

interface AttendanceCalendarProps {
  employeeCode: string;
}



/* ---------------- COMPONENT ---------------- */

export function AttendanceCalendar({ employeeCode }: AttendanceCalendarProps) {
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  

  /* ---------------- FETCH EMPLOYEE ID ---------------- */


  useEffect(() => {
    const fetchEmployeeId = async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id")
        .eq("employee_code", employeeCode)
        .single();

      if (!error && data) {
        setEmployeeId(data.id);
      }
    };

    fetchEmployeeId();
  }, [employeeCode]);

  

  /* ---------------- FETCH ALL DATA ---------------- */

useEffect(() => {
  if (!employeeId) return;

  const fetchData = async () => {
    // 1️ Attendance (present / late)
    const { data: attendance } = await supabase
      .from("attendance")
      .select("date, status")
      .eq("employee_id", employeeId)
      .gte("date", format(monthStart, "yyyy-MM-dd"))
      .lte("date", format(monthEnd, "yyyy-MM-dd"));

    const attendanceMap = new Map<string, DayStatus>();
    attendance?.forEach((a: any) => {
      attendanceMap.set(a.date, a.status); // present | late
    });

    // 2️ Approved Leaves
    const { data: leaves } = await supabase
      .from("leave_requests")
      .select("start_date, end_date")
      .eq("employee_id", employeeId)
      .eq("status", "approved");

    const leaveSet = new Set<string>();
    leaves?.forEach((l: any) => {
      eachDayOfInterval({
        start: new Date(l.start_date),
        end: new Date(l.end_date),
      }).forEach((d) =>
        leaveSet.add(format(d, "yyyy-MM-dd"))
      );
    });

    // 3️ Holidays (fixed national/company)
    const { data: holidays } = await supabase
      .from("holidays")
      .select("date")
      .gte("date", format(monthStart, "yyyy-MM-dd"))
      .lte("date", format(monthEnd, "yyyy-MM-dd"));

    const holidaySet = new Set<string>(
      holidays?.map((h: any) => h.date)
    );

    // 4️ FINAL STATUS PER DAY (CORRECT PRIORITY)
    const finalData: AttendanceData[] = daysInMonth.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");

      // Holiday
      if (holidaySet.has(dateStr)) {
        return { date: day, status: "holiday" };
      }

      // Leave (approved)
      if (leaveSet.has(dateStr)) {
        return { date: day, status: "leave" };
      }

      // Attendance
      if (attendanceMap.has(dateStr)) {
        return { date: day, status: attendanceMap.get(dateStr)! };
      }

      // Weekoff (Sunday)
      if (day.getDay() === 0) {
        return { date: day, status: "weekoff" };
      }

      // Default working day without record
      return { date: day, status: "weekoff" };
    });

    setAttendanceData(finalData);
  };

  fetchData();
}, [employeeId, currentMonth]);



  /* ---------------- HELPERS ---------------- */



  const getStatusForDate = (date: Date) =>
    attendanceData.find(
      (a) => format(a.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    )?.status;

  const getStatusColor = (status?: DayStatus) => {
    switch (status) {
      case "present":
        return "bg-green-100 border-green-400 text-green-700";
      case "late": 
        return "bg-green-100 border-green-400 text-green-700";
      case "leave":
        return "bg-red-100 border-red-400 text-red-700";
      case "weekoff":
        return "bg-blue-100 border-blue-400 text-blue-700";
      case "holiday":
        return "bg-purple-100 border-purple-400 text-purple-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-500";
    }
  };

  const getStatusLabel = (status?: DayStatus) => {
    switch (status) {
      case "present":
        return "Present";
      case "late":
        return "present";
      case "leave":
        return "Leave";
      case "weekoff":
        return "Week Off";
      case "holiday":
        return "Holiday";
      default:
        return "No Record";
    }
  };

  const stats = {
    present: attendanceData.filter((a) => a.status === "present").length,
    late: attendanceData.filter((a) => a.status === "late").length,
    leave: attendanceData.filter((a) => a.status === "leave").length,
    weekoff: attendanceData.filter((a) => a.status === "weekoff").length,
    holiday: attendanceData.filter((a) => a.status === "holiday").length,
  };

  const presents = stats.present + stats.late;

  /* ---------------- UI (UNCHANGED) ---------------- */

  const previousMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));

  const nextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  return (
    <div className="space-y-6">
    <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Present</p>
                    <p className="text-3xl mt-1">{presents}</p>
                  </div>
                  <div className="size-12 rounded-full bg-green-100 flex items-center justify-center">
                    <div className="size-6 rounded-full bg-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
    
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Leave</p>
                    <p className="text-3xl mt-1">{stats.leave}</p>
                  </div>
                  <div className="size-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <div className="size-6 rounded-full bg-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
    
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Week Offs</p>
                    <p className="text-3xl mt-1">{stats.weekoff}</p>
                  </div>
                  <div className="size-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <div className="size-6 rounded-full bg-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
    
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Holidays</p>
                    <p className="text-3xl mt-1">{stats.holiday}</p>
                  </div>
                  <div className="size-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <div className="size-6 rounded-full bg-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
    
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Attendance Calendar</CardTitle>
                  <CardDescription>
                    View your monthly attendance in color-coded format
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={previousMonth}>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="min-w-[140px] text-center">
                    {format(currentMonth, 'MMMM yyyy')}
                  </span>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                
                {/* Days of the month */}
                {daysInMonth.map((day) => {
                  const status = getStatusForDate(day);
                  const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        aspect-square p-2 rounded-lg border-2 transition-all hover:scale-105
                        ${getStatusColor(status)}
                        ${isToday ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}
                      `}
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className="text-sm">{format(day, 'd')}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
    
              {selectedDate && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Selected Date</p>
                  <p className="text-lg mt-1">{format(selectedDate, 'MMMM d, yyyy')}</p>
                  <Badge className="mt-2" variant="outline">
                    {getStatusLabel(getStatusForDate(selectedDate))}
                  </Badge>
                </div>
              )}
    
              <div className="mt-6 flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="size-4 rounded bg-green-500" />
                  <span className="text-sm">Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-4 rounded bg-orange-500" />
                  <span className="text-sm">Leave</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-4 rounded bg-blue-500" />
                  <span className="text-sm">Week Off</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-4 rounded bg-purple-500" />
                  <span className="text-sm">Holiday</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Footer/>
        </div>
      <Footer />
    </div>
  );
}
