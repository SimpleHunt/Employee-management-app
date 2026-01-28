import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Geolocation } from '@capacitor/geolocation';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { 
  Clock, 
  MapPin, 
  LogIn, 
  LogOut, 
  AlertCircle, 
  CheckCircle,
  Navigation,
  Calendar as CalendarIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

interface PunchInOutProps {
  employeeCode: string;
  role: 'admin' | 'manager' | 'employee';
}

interface PunchRecord {
  id: string;
  date: string;
  punchInTime: string;
  punchOutTime?: string;
  status: 'present' | 'late';
  late_approval_status?: 'approved' | 'not_approved';
  
  home_reached?: boolean;          
  home_reached_at?: string | null; 

  workHours?: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string; 
  };
}



export function PunchInOut({ employeeCode, role }: PunchInOutProps) {
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [todayPunch, setTodayPunch] = useState<PunchRecord | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [lateApproved, setLateApproved] = useState(0);
const [lateNotApproved, setLateNotApproved] = useState(0);
const [punchHistory, setPunchHistory] = useState<PunchRecord[]>([]);
const [monthlyPresentDays, setMonthlyPresentDays] = useState(0);
type WorkMode = 'office' | 'wfh' | 'outside';

const [workMode, setWorkMode] = useState<WorkMode>('office');

const [employeeProfile, setEmployeeProfile] = useState<{
  gender?: string;
  homeLat?: number;
  homeLng?: number;
} | null>(null);



const fetchAttendance = async () => {
  const { data } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employeeId)
    .order('date', { ascending: false });

  if (!data) return;

  setPunchHistory(
    data.map((row) => ({
      id: row.id,
      date: row.date,
      punchInTime: format(new Date(row.punch_in_time), 'hh:mm a'),
      punchOutTime: row.punch_out_time
        ? format(new Date(row.punch_out_time), 'hh:mm a')
        : undefined,
      status: row.status,
      late_approval_status: row.late_approval_status,

      home_reached: row.home_reached,       
      home_reached_at: row.home_reached_at,

      workHours: row.work_hours
        ? `${row.work_hours.toFixed(2)} hrs`
        : undefined,
      location: {
        latitude: row.location_lat,
        longitude: row.location_lng,
      },
    }))
  );
};


useEffect(() => {
  if (!employeeId) return;

  const fetchAttendance = async () => {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .order('date', { ascending: false });

    if (error) {
      toast.error('Failed to load attendance');
      return;
    }

    const formatted: PunchRecord[] = data.map((row) => ({
      id: row.id,
      date: row.date,
      punchInTime: format(new Date(row.punch_in_time), 'hh:mm a'),
      punchOutTime: row.punch_out_time
        ? format(new Date(row.punch_out_time), 'hh:mm a')
        : undefined,
      status: row.status,
      late_approval_status: row.late_approval_status,

      home_reached: row.home_reached,       
      home_reached_at: row.home_reached_at,

      workHours: row.work_hours
        ? `${row.work_hours.toFixed(2)} hrs`
        : undefined,
      location: {
        latitude: row.location_lat,
        longitude: row.location_lng,
      },
    }));

    setPunchHistory(formatted);
  };

  fetchAttendance();
}, [employeeId]);



useEffect(() => {
  if (!employeeId) return;

  const fetchLateStats = async () => {
    const start = format(new Date(), 'yyyy-MM-01');

    const { count: approved } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', employeeId)
      .eq('status', 'late')
      .eq('late_approval_status', 'approved')
      .gte('date', start);

    const { count: notApproved } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', employeeId)
      .eq('status', 'late')
      .eq('late_approval_status', 'not_approved')
      .gte('date', start);

    setLateApproved(approved || 0);
    setLateNotApproved(notApproved || 0);
  };

  fetchLateStats();
}, [employeeId]);

useEffect(() => {
  if (!employeeId) return;

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('employees')
      .select('gender, home_lat, home_lng')
      .eq('id', employeeId)
      .single();

    if (data) {
      setEmployeeProfile({
        gender: data.gender,
        homeLat: data.home_lat,
        homeLng: data.home_lng,
      });
    }
  };

  fetchProfile();
}, [employeeId]);


  
  
useEffect(() => {
  const fetchEmployee = async () => {
    const { data } = await supabase
      .from('employees')
      .select('id')
      .eq('employee_code', employeeCode)
      .single();

    if (data) setEmployeeId(data.id);
  };

  fetchEmployee();
}, [employeeCode]);

  const OFFICE_LOCATION = {
    latitude: 12.99695,
    longitude: 77.66048,
    name: 'SimpleHunt',
  };


  const MAX_DISTANCE_KM = 0.1; 

 
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);


useEffect(() => {
  const today = format(new Date(), 'yyyy-MM-dd');
    const record = punchHistory.find(
      (r) => r.date === today
    );

    setTodayPunch(record || null);
    setIsPunchedIn(!!record && !record.punchOutTime);


}, [punchHistory]);

useEffect(() => {
  if (!employeeId) return;

  const fetchMonthlyPresent = async () => {
    const startOfMonth = format(new Date(), "yyyy-MM-01");
    const today = format(new Date(), "yyyy-MM-dd");

    const { count, error } = await supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", employeeId)
      .in("status", ["present", "late"])
      .gte("date", startOfMonth)
      .lte("date", today);

    if (error) {
      console.error("Monthly present fetch error:", error);
      return;
    }

    setMonthlyPresentDays(count || 0);
  };

  fetchMonthlyPresent();
}, [employeeId]);
 

  
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

 
const getCurrentLocation = async (): Promise<{
  latitude: number;
  longitude: number;
}> => {
  // 🟢 If running on web
  if (typeof window !== 'undefined' && 'geolocation' in navigator) {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
        }
      );
    });
  }

  // 📱 If running on mobile (Capacitor)
  const permission = await Geolocation.requestPermissions();

  if (permission.location !== 'granted') {
    throw new Error('Location permission denied');
  }

  const position = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
};




  const checkIfLate = (time: Date): 'present' | 'late' => {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const cutoffMinutes = 9 * 60 + 35; // 

    return totalMinutes > cutoffMinutes ? 'late' : 'present';
  };

 
  const calculateWorkHours = (punchIn: string, punchOut: string): string => {
    const parseTime = (timeStr: string): Date => {
      const [time, period] = timeStr.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      const date = new Date();
      let hour24 = hours;
      
      if (period === 'PM' && hours !== 12) {
        hour24 = hours + 12;
      } else if (period === 'AM' && hours === 12) {
        hour24 = 0;
      }
      
      date.setHours(hour24, minutes, 0, 0);
      return date;
    };

    const inTime = parseTime(punchIn);
    const outTime = parseTime(punchOut);
    const diffMs = outTime.getTime() - inTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHours}h ${diffMinutes}m`;
  };

  
const handlePunchIn = async () => {
  if (!employeeId) {
    toast.error("Employee not loaded. Please refresh.");
    return;
  }

  setLoadingLocation(true);
   toast.info("If you forget to log out, auto logout will happen at 11:45 PM");


  try {
    const today = format(new Date(), "yyyy-MM-dd");

    // 1️ Check if already punched today
    const { data: todayRecord } = await supabase
      .from("attendance")
      .select("id")
      .eq("employee_id", employeeId)
      .eq("date", today)
      .maybeSingle();

    if (todayRecord) {
      toast.info("Attendance already completed for today");
      return;
    }

    // 2️ Location ONLY for OFFICE
    let userLocation: { latitude: number; longitude: number } | null = null;

    if (workMode === "office") {
      userLocation = await getCurrentLocation();

      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        OFFICE_LOCATION.latitude,
        OFFICE_LOCATION.longitude
      );

      if (distance > MAX_DISTANCE_KM) {
        toast.error(
          `You are ${Math.round(distance * 1000)}m away. Office radius is ${MAX_DISTANCE_KM * 1000}m`
        );
        return;
      }
    }

    // 3️ Status (late / present)
    const now = new Date();
    const status = checkIfLate(now);

    // 4️ Approval logic
    const approvalStatus =
      workMode === "office" ? "approved" : "pending";

    // 5️ Insert attendance
    const { error } = await supabase.from("attendance").insert({
      employee_id: employeeId,
      date: today,
      punch_in_time: now.toISOString(),
      status,
      work_mode: workMode,
      approval_status: approvalStatus,
      late_approval_status: status === "late" ? "not_approved" : null,
      location_lat: userLocation?.latitude ?? null,
      location_lng: userLocation?.longitude ?? null,
    });

    if (error) throw error;

    await fetchAttendance();

    toast.success(
      workMode === "office"
        ? "Logged in successfully"
        : "Punch in recorded. Waiting for approval"
    );
  } catch (err: any) {
    console.error("Punch In Error:", err);
    toast.error("Punch in failed. Please try again.");
  } finally {
    setLoadingLocation(false);
  }
};



  
const handlePunchOut = async () => {
  if (!employeeId) return;

  setLoadingLocation(true);

  try {
    const today = format(new Date(), 'yyyy-MM-dd');

    
    const { data: punch, error: fetchError } = await supabase
      .from('attendance')
      .select('id, punch_in_time')
      .eq('employee_id', employeeId)
      .eq('date', today)
      .is('punch_out_time', null)
      .single();

    if (fetchError || !punch) {
      toast.error('No active punch-in found');
      return;
    }

    const now = new Date();
    const punchInTime = new Date(punch.punch_in_time);

    //2. Calculate work hours accurately
    const diffMs = now.getTime() - punchInTime.getTime();
    const workHours = diffMs / (1000 * 60 * 60);

    //  3. Update DB
    const { error } = await supabase
      .from('attendance')
      .update({
        punch_out_time: now.toISOString(),
        work_hours: Number(workHours.toFixed(2)),
      })
      .eq('id', punch.id);

    if (error) throw error;

    //  4. Refresh UI from DB
    await fetchAttendance();

    toast.success('Punched out successfully');
  } catch (err) {
    console.error(err);
    toast.error('Punch out failed');
  } finally {
    setLoadingLocation(false);
  }
};

const handleReachedHome = async () => {
  if (!employeeId) {
    toast.error('Employee not loaded yet');
    return;
  }

  if (
    employeeProfile?.homeLat == null ||
    employeeProfile?.homeLng == null
  ) {
    toast.error('Home location not configured');
    return;
  }

  try {
    const userLocation = await getCurrentLocation();

    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      employeeProfile.homeLat,
      employeeProfile.homeLng
    );

    console.log('Home distance (km):', distance);

    if (distance > 0.2) {
      toast.error(`You are ${Math.round(distance * 1000)}m away from home`);
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('attendance')
      .update({
        home_reached: true,
        home_reached_at: new Date().toISOString(),
      })
      .eq('employee_id', employeeId)
      .eq('date', today);

    if (error) {
      console.error('Supabase update error:', error);
      toast.error(error.message);
      return;
    }

    await fetchAttendance();

    toast.success('Reached home recorded safely ❤️');
  } catch (err) {
    console.error('Reached home exception:', err);
    toast.error('Failed to mark reached home');
  }
};



  const todayStats = punchHistory.filter(
    (record) => record.date === format(new Date(), 'yyyy-MM-dd')
  )[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Current Status Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white rounded-2xl shadow-lg">
                <Clock className="size-12 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Time</p>
                <p className="text-4xl tabular-nums">
                  {format(currentTime, 'hh:mm:ss a')}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {format(currentTime, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>
                      <Card>
            <CardContent className="pt-4">
              <p className="text-sm font-medium mb-3">Work Mode</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  variant={workMode === "office" ? "default" : "outline"}
                  onClick={() => setWorkMode("office")}
                  className="w-full"
                >
                  Office
                </Button>

                <Button
                  variant={workMode === "wfh" ? "default" : "outline"}
                  onClick={() => setWorkMode("wfh")}
                  className="w-full"
                >
                  Work From Home
                </Button>

                <Button
                  variant={workMode === "outside" ? "default" : "outline"}
                  onClick={() => setWorkMode("outside")}
                  className="w-full"
                >
                  Outside Duty
                </Button>
              </div>
            </CardContent>
          </Card>



            <div className="flex flex-col gap-3 w-full md:w-auto">
              {!isPunchedIn ? (
                <Button
                  size="lg"
                  onClick={handlePunchIn}
                  disabled={loadingLocation}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8"
                >
                  <LogIn className="size-5 mr-2" />
                  {loadingLocation ? 'Getting Location...' : 'Log In'}
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handlePunchOut}
                  disabled={loadingLocation}
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-8"
                >
                  <LogOut className="size-5 mr-2" />
                  {loadingLocation ? 'Getting Location...' : 'Log Out'}
                </Button>
                
              )}
                        {employeeProfile?.gender?.toLowerCase() === 'female' &&
              todayPunch &&
              todayPunch.punchOutTime &&
              !todayPunch.home_reached && (
                <Button
                  size="lg"
                  onClick={handleReachedHome}
                  className="bg-gradient-to-r from-pink-600 to-rose-600 text-white"
                >
                  🏠 Reached Home
                </Button>
            )}


              
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <MapPin className="size-4" />
                <span>Location tracking enabled</span>
              </div>
            </div>
          </div>

          {todayPunch && (
            <>
              <Separator className="my-6" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Log In Time</p>
                  <p className="text-xl">{todayPunch.punchInTime}</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <Badge
                    variant={todayPunch.status === 'present' ? 'default' : 'destructive'}
                    className="text-sm"
                  >
                    {todayPunch.status === 'present' ? (
                      <>
                        <CheckCircle className="size-3 mr-1" />
                        On Time
                      </>
                    ) : (
                      <>
                        <AlertCircle className="size-3 mr-1" />
                        Late
                      </>
                    )}
                  </Badge>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Log Out Time</p>
                  <p className="text-xl">
                    {todayPunch.punchOutTime || (
                      <span className="text-gray-400">Not yet</span>
                    )}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Work Hours</p>
                  <p className="text-xl">
                    {todayPunch.workHours || (
                      <span className="text-gray-400">In progress</span>
                    )}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-3xl mt-2">{monthlyPresentDays}</p>
              <p className="text-xs text-gray-500 mt-1">Days Present</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Late Arrivals</p>

              <div className="flex justify-center gap-6 mt-3">
                <div>
                  <p className="text-2xl font-semibold text-green-600">
                    {lateApproved}
                  </p>
                  <p className="text-xs text-gray-500">Approved</p>
                </div>

                <div>
                  <p className="text-2xl font-semibold text-red-600">
                    {lateNotApproved}
                  </p>
                  <p className="text-xs text-gray-500">Not Approved</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-2">This Month</p>
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Avg Work Hours</p>
              <p className="text-3xl mt-2">9</p>
              <p className="text-xs text-gray-500 mt-1">Hours per Day</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Office Location Info */}
      <Card>
        <CardHeader>
          <CardTitle>Office Location</CardTitle>
          <CardDescription>You must be within {MAX_DISTANCE_KM * 100}m radius to punch in</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <Navigation className="size-5 text-blue-600 mt-1" />
            <div>
              <p className="font-medium">{OFFICE_LOCATION.name}</p>
              <p className="text-sm text-gray-600 mt-1">
                Latitude: {OFFICE_LOCATION.latitude}, Longitude: {OFFICE_LOCATION.longitude}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Make sure your location services are enabled and you're within the office premises
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Punch History */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>Your recent punch in/out records</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Log In</TableHead>
                <TableHead>Log Out</TableHead>
                <TableHead>Work Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {punchHistory.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="size-4 text-gray-400" />
                      {format(new Date(record.date), 'MMM dd, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <LogIn className="size-4 text-green-600" />
                      {record.punchInTime}
                    </div>
                  </TableCell>
                  <TableCell>
                    {record.punchOutTime ? (
                      <div className="flex items-center gap-2">
                        <LogOut className="size-4 text-red-600" />
                        {record.punchOutTime}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">In progress</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {record.workHours || <span className="text-gray-400">-</span>}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={record.status === 'present' ? 'default' : 'destructive'}
                    >
                      {record.status === 'present' ? (
                        <>
                          <CheckCircle className="size-3 mr-1" />
                          On Time
                        </>
                      ) : (
                        <>
                          <AlertCircle className="size-3 mr-1" />
                          Late
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="size-3" />
                      {record.location.address || 'Office'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}