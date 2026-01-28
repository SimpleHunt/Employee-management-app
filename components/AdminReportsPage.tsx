'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
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
} from 'recharts';
import { Download, Calendar, Users, TrendingUp, Clock, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, parseISO,subMonths } from 'date-fns';
import { supabase } from '@/lib/supabase';

interface EmployeeAttendance {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  department: string;
  position: string;
  present_days: number;
  late_days: number;
  leave_days: number;
  absent_days: number;
  avg_work_hours: number;
  attendance_percentage: number;
}

export function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [employeesData, setEmployeesData] = useState<EmployeeAttendance[]>([]);
  const [filteredData, setFilteredData] = useState<EmployeeAttendance[]>([]);
 
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);
const [selectedMonth, setSelectedMonth] = useState('0');

const selectedMonthLabel = format(
  subMonths(new Date(), Number(selectedMonth)),
  'MMMM yyyy'
);

  // Fetch all employees and their attendance data
  useEffect(() => {
    fetchEmployeesAttendance();
  }, [selectedMonth]);

  // Filter data when search or department changes
  useEffect(() => {
    filterEmployeesData();
  }, [searchTerm, selectedDepartment, employeesData]);

 const getMonthDateRange = (monthOffset: number) => {
  const baseDate = subMonths(new Date(), monthOffset);

  return {
    start: startOfMonth(baseDate),
    end: endOfMonth(baseDate),
  };
};

  const fetchEmployeesAttendance = async () => {
    setLoading(true);
    try {
      const today = new Date();
      
      const { start, end } = getMonthDateRange(Number(selectedMonth));
      const startDate = format(start, 'yyyy-MM-dd');
      const endDate = format(end, 'yyyy-MM-dd');

      // Fetch all employees
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, name, employee_code, department, position');

      if (empError) throw empError;

      // Get unique departments
      const uniqueDepts = [...new Set(employees?.map(e => e.department) || [])];
      setDepartments(uniqueDepts as string[]);

      // Fetch attendance for all employees
      const { data: attendance, error: attError } = await supabase
      .from('attendance')
      .select('employee_id, status, work_hours')
      .gte('date', startDate)
      .lte('date', endDate);
      if (attError) throw attError;

      // Calculate statistics for each employee
      const employeeStats: EmployeeAttendance[] = (employees || []).map(employee => {
        const empAttendance = attendance?.filter(a => a.employee_id === employee.id) || [];
        
        const presentDays = empAttendance.filter(a => a.status === 'present').length;
        const lateDays = empAttendance.filter(a => a.status === 'late').length;
        const leaveDays = empAttendance.filter(a => a.status === 'leave').length;
        const absentDays = empAttendance.filter(a => a.status === 'absent').length;
        
        const totalWorkHours = empAttendance.reduce((sum, a) => sum + (a.work_hours || 0), 0);
        const avgWorkHours = empAttendance.length > 0 ? totalWorkHours / empAttendance.length : 0;
        
        const totalWorkingDays = presentDays + lateDays + leaveDays + absentDays;
        const attendancePercentage = totalWorkingDays > 0 
          ? ((presentDays + lateDays) / totalWorkingDays) * 100 
          : 0;

        return {
          employee_id: employee.id,
          employee_name: employee.name,
          employee_code: employee.employee_code,
          department: employee.department || 'N/A',
          position: employee.position || 'N/A',
          present_days: presentDays,
          late_days: lateDays,
          leave_days: leaveDays,
          absent_days: absentDays,
          avg_work_hours: Number(avgWorkHours.toFixed(1)),
          attendance_percentage: Number(attendancePercentage.toFixed(1)),
        };
      });

      setEmployeesData(employeeStats);
      setFilteredData(employeeStats);
    } catch (error) {
      console.error('Error fetching employees attendance:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const filterEmployeesData = () => {
    let filtered = [...employeesData];

    // Filter by department
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(emp => emp.department === selectedDepartment);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  const handleDownloadReport = () => {
    toast.success('Downloading company-wide report...');
    // Implement CSV/PDF export logic here
  };

  // Calculate overall statistics
  const overallStats = {
    totalEmployees: filteredData.length,
    avgAttendance: filteredData.length > 0 
      ? (filteredData.reduce((sum, emp) => sum + emp.attendance_percentage, 0) / filteredData.length).toFixed(1)
      : 0,
    totalPresentDays: filteredData.reduce((sum, emp) => sum + emp.present_days, 0),
    avgWorkHours: filteredData.length > 0
      ? (filteredData.reduce((sum, emp) => sum + emp.avg_work_hours, 0) / filteredData.length).toFixed(1)
      : 0,
  };

  // Department-wise attendance data for chart
  const departmentData = departments.map(dept => {
    const deptEmployees = employeesData.filter(emp => emp.department === dept);
    const avgAttendance = deptEmployees.length > 0
      ? deptEmployees.reduce((sum, emp) => sum + emp.attendance_percentage, 0) / deptEmployees.length
      : 0;
    
    return {
      department: dept,
      attendance: Number(avgAttendance.toFixed(1)),
      employees: deptEmployees.length,
    };
  });

  // Attendance distribution
  const attendanceDistribution = [
    { 
      range: '95-100%', 
      count: filteredData.filter(e => e.attendance_percentage >= 95).length,
      color: '#10b981'
    },
    { 
      range: '85-94%', 
      count: filteredData.filter(e => e.attendance_percentage >= 85 && e.attendance_percentage < 95).length,
      color: '#3b82f6'
    },
    { 
      range: '75-84%', 
      count: filteredData.filter(e => e.attendance_percentage >= 75 && e.attendance_percentage < 85).length,
      color: '#f59e0b'
    },
    { 
      range: 'Below 75%', 
      count: filteredData.filter(e => e.attendance_percentage < 75).length,
      color: '#ef4444'
    },
  ].filter(item => item.count > 0);

  const getAttendanceBadge = (percentage: number) => {
    if (percentage >= 95) return <Badge className="bg-green-500">Excellent</Badge>;
    if (percentage >= 85) return <Badge className="bg-blue-500">Good</Badge>;
    if (percentage >= 75) return <Badge className="bg-yellow-500">Average</Badge>;
    return <Badge className="bg-red-500">Poor</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="size-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Company-Wide Attendance Reports</CardTitle>
              <CardDescription>
                View and analyze attendance data for all employees
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                 <SelectItem value="0">Current Month</SelectItem>
                    <SelectItem value="1">Last Month</SelectItem>
                    <SelectItem value="2">2 Months Ago</SelectItem>
                    <SelectItem value="3">3 Months Ago</SelectItem>
                    <SelectItem value="4">4 Months Ago</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleDownloadReport}>
                <Download className="size-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-3xl mt-1">{overallStats.totalEmployees}</p>
                <p className="text-xs text-gray-500 mt-2">Active staff</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="size-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Attendance</p>
                <p className="text-3xl mt-1">{overallStats.avgAttendance}%</p>
                <Badge className="mt-2" variant="outline">Company-wide</Badge>
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
                <p className="text-sm text-gray-600">Total Present Days</p>
                <p className="text-3xl mt-1">{overallStats.totalPresentDays}</p>
                <p className="text-xs text-gray-500 mt-2">This month</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="size-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Work Hours</p>
                <p className="text-3xl mt-1">{overallStats.avgWorkHours}</p>
                <p className="text-xs text-gray-500 mt-2">Per employee</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="size-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 size-4 text-gray-400" />
                <Input
                  placeholder="Search by name or employee code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="size-4 mr-2" />
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department-wise Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Department-wise Attendance</CardTitle>
            <CardDescription>Average attendance by department</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="attendance" fill="#3b82f6" name="Attendance %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Distribution</CardTitle>
            <CardDescription>Employee count by attendance range</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={attendanceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ payload }) => `${payload.range}: ${payload.count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {attendanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Employee Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Attendance Details</CardTitle>
          <CardDescription>
            Showing {filteredData.length} employee(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead className="text-center">Present</TableHead>
                  <TableHead className="text-center">Late</TableHead>
                  <TableHead className="text-center">Leave</TableHead>
                  <TableHead className="text-center">Absent</TableHead>
                  <TableHead className="text-center">Avg Hours</TableHead>
                  <TableHead className="text-center">Attendance %</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                      No employees found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((employee) => (
                    <TableRow key={employee.employee_id}>
                      <TableCell className="font-medium">{employee.employee_code}</TableCell>
                      <TableCell>{employee.employee_name}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                          {employee.present_days}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
                          {employee.late_days}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-800 text-sm font-medium">
                          {employee.leave_days}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-800 text-sm font-medium">
                          {employee.absent_days}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{employee.avg_work_hours}h</TableCell>
                      <TableCell className="text-center font-semibold">{employee.attendance_percentage}%</TableCell>
                      <TableCell className="text-center">{getAttendanceBadge(employee.attendance_percentage)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
