'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface DailyAttendanceRow {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  gender: string | null;

  status: 'present' | 'late' | 'leave' | 'absent';

  punch_in_time: string | null;
  punch_out_time: string | null;
  work_hours: number | null;

  home_reached: boolean | null;
  home_reached_at: string | null;
}

export function AdminDailyReportsPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<DailyAttendanceRow[]>([]);

  useEffect(() => {
    fetchDailyAttendance();
  }, [selectedDate]);

  const fetchDailyAttendance = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('attendance')
      .select(`
        employee_id,
        status,
        punch_in_time,
        punch_out_time,
        work_hours,
        home_reached,
        home_reached_at,
        employees (
          name,
          employee_code,
          gender
        )
      `)
      .eq('date', selectedDate)
      .order('punch_in_time', { ascending: true });

    if (error) {
      console.error(error);
      toast.error('Failed to load daily report');
      setLoading(false);
      return;
    }

    const formatted: DailyAttendanceRow[] = (data || []).map((row: any) => ({
      employee_id: row.employee_id,
      employee_name: row.employees?.name ?? 'N/A',
      employee_code: row.employees?.employee_code ?? 'N/A',
      gender: row.employees?.gender ?? null,

      status: row.status,

      punch_in_time: row.punch_in_time,
      punch_out_time: row.punch_out_time,
      work_hours: row.work_hours,

      home_reached: row.home_reached,
      home_reached_at: row.home_reached_at,
    }));

    setRows(formatted);
    setLoading(false);
  };

  const summary = {
    present: rows.filter(r => r.status === 'present').length,
    late: rows.filter(r => r.status === 'late').length,
    leave: rows.filter(r => r.status === 'leave').length,
    absent: rows.filter(r => r.status === 'absent').length,
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-500">Present</Badge>;
      case 'late':
        return <Badge className="bg-yellow-500">Late</Badge>;
      case 'leave':
        return <Badge className="bg-orange-500">Leave</Badge>;
      case 'absent':
        return <Badge className="bg-red-500">Absent</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Daily Attendance Report</CardTitle>
          <CardDescription>
            Employee-wise attendance for selected date
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4 items-center">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-[200px]"
          />
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-gray-600">Present</p>
            <p className="text-3xl">{summary.present}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-gray-600">Late</p>
            <p className="text-3xl">{summary.late}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-gray-600">Leave</p>
            <p className="text-3xl">{summary.leave}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-gray-600">Absent</p>
            <p className="text-3xl">{summary.absent}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <Clock className="animate-spin mr-2" /> Loading...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Emp Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Punch In</TableHead>
                  <TableHead>Punch Out</TableHead>
                  <TableHead>Work Hours</TableHead>
                  <TableHead>Reached Home</TableHead>
                  <TableHead>Reached At</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                      No attendance records for this date
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map(row => (
                    <TableRow key={row.employee_id}>
                      <TableCell>{row.employee_code}</TableCell>
                      <TableCell>{row.employee_name}</TableCell>

                      <TableCell>{statusBadge(row.status)}</TableCell>

                      <TableCell>
                        {row.punch_in_time
                          ? format(new Date(row.punch_in_time), 'hh:mm a')
                          : '-'}
                      </TableCell>

                      <TableCell>
                        {row.punch_out_time
                          ? format(new Date(row.punch_out_time), 'hh:mm a')
                          : '-'}
                      </TableCell>

                      <TableCell>
                        {row.work_hours ? `${row.work_hours.toFixed(2)}h` : '-'}
                      </TableCell>

                      <TableCell className="text-center">
                        {row.gender === 'female'
                          ? row.home_reached
                            ? '✅ Yes'
                            : '❌ No'
                          : '-'}
                      </TableCell>

                      <TableCell>
                        {row.gender === 'female' && row.home_reached_at
                          ? format(new Date(row.home_reached_at), 'hh:mm a')
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
