import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Calendar, Plus, CheckCircle, XCircle, Clock, Umbrella } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';


interface LeaveManagementProps {
  role: 'admin' | 'manager' | 'employee';
   employeeCode: string;
}

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedOn: string;
  pay_type: 'paid' | 'unpaid' | null;
  employeeName?: string;
}

export function LeaveManagement({ role, employeeCode }: LeaveManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    type: '',
    startDate: '',
    endDate: '',
    reason: '',
    payType: null as 'paid' | 'unpaid' | null,
  });

  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');


  // ---------------- APPLY LEAVE ----------------
const handleApplyLeave = async () => {
  if (!employeeId) {
    toast.error('Employee not identified yet');
    return;
  }

  if (!leaveForm.type || !leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
    toast.error('Please fill all fields');
    return;
  }

  const start = new Date(leaveForm.startDate);
  const end = new Date(leaveForm.endDate);
  const days =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  
  if (leaveForm.type === 'Sick Leave') {
    const startMonth = start.getMonth();
    const startYear = start.getFullYear();

    const { data, error } = await supabase
      .from('leave_requests')
      .select('start_date')
      .eq('employee_id', employeeId)
      .eq('leave_type', 'Sick Leave')
      .eq('status', 'approved');

    if (error) {
      toast.error('Unable to validate sick leave');
      return;
    }

    const alreadyTakenThisMonth = data.some((leave: any) => {
      const d = new Date(leave.start_date);
      return d.getMonth() === startMonth && d.getFullYear() === startYear;
    });

    if (alreadyTakenThisMonth) {
      toast.error('Sick Leave already taken this month');
      return;
    }
  }


  const { error } = await supabase.from('leave_requests').insert({
    employee_id: employeeId,
    leave_type: leaveForm.type,
    start_date: leaveForm.startDate,
    end_date: leaveForm.endDate,
    days,
    reason: leaveForm.reason,
     pay_type: leaveForm.type === 'Sick Leave' ? 'paid' : null,
    status: 'pending',
    applied_on: new Date().toISOString().split('T')[0],
  });

  if (error) {
    toast.error('Failed to submit leave');
    return;
  }

  toast.success('Leave request submitted successfully!');
  setIsDialogOpen(false);
  setLeaveForm({
      type: '',
      startDate: '',
      endDate: '',
      reason: '',
      payType: null, 
    });

  fetchLeaves();
};

  // ---------------- FETCH EMPLOYEE ----------------
  const fetchEmployeeId = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('id')
      .eq('employee_code', employeeCode)
      .single();

    if (error) {
      toast.error('Unable to identify employee');
      return;
    }

    setEmployeeId(data.id);
  };

  useEffect(() => {
    if (employeeCode) {
      fetchEmployeeId();
    }
  }, [employeeCode]);

  // ---------------- FETCH LEAVES ----------------
const fetchLeaves = async () => {
  setLoading(true);

  let query = supabase
    .from('leave_requests')
    .select(`
      *,
      employees (
        employee_code,
        name
      )
    `)
    .order('created_at', { ascending: false });

  // Employee → only own leaves
  if (role === 'employee') {
    query = query.eq('employee_id', employeeId);
  }

  // Admin / Manager → pending + approved only
  if (role === 'admin' || role === 'manager') {
    query = query.in('status', ['pending', 'approved','rejected']);
  }

  const { data, error } = await query;

  if (!error && data) {
    setLeaveRequests(
      data.map((l: any) => ({
        id: l.id,
        type: l.leave_type,
        startDate: l.start_date,
        endDate: l.end_date,
        days: l.days,
        reason: l.reason,
        status: l.status,
        appliedOn: l.applied_on,
        employeeCode: l.employees?.employee_code ?? '',
        employeeName: l.employees?.name ?? '',
        pay_type: l.pay_type,
      }))
    );
  }

  setLoading(false);
};


  useEffect(() => {
    if (employeeId) {
      fetchLeaves();
    }
  }, [employeeId]);

  

  // ---------------- LEAVE CALCULATIONS ----------------
 const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

const isSameMonth = (date: string) => {
  const d = new Date(date);
  return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
};

const isSameYear = (date: string) => {
  return new Date(date).getFullYear() === currentYear;
};


const sickTakenThisMonth = leaveRequests.filter(
  l =>
    l.type === 'Sick Leave' &&
    l.status === 'approved' &&
    isSameMonth(l.startDate)
).reduce((sum, l) => sum + l.days, 0);

const casualTakenThisMonth = leaveRequests.filter(
  l =>
    l.type === 'Casual Leave' &&
    l.status === 'approved' &&
    isSameMonth(l.startDate)
).reduce((sum, l) => sum + l.days, 0);

const sickTakenThisYear = leaveRequests.filter(
  l =>
    l.type === 'Sick Leave' &&
    l.status === 'approved' &&
    isSameYear(l.startDate)
).reduce((sum, l) => sum + l.days, 0);

const TOTAL_SICK_PER_YEAR = 12;

const sickLeftThisYear = Math.max(
  TOTAL_SICK_PER_YEAR - sickTakenThisYear,
  0
);

const approvedThisMonth = leaveRequests.filter(
  l => l.status === 'approved' && isSameMonth(l.startDate)
).length;

const rejectedThisMonth = leaveRequests.filter(
  l => l.status === 'rejected' && isSameMonth(l.startDate)
).length;

const pendingThisMonth = leaveRequests.filter(
  l => l.status === 'pending' && isSameMonth(l.startDate)
).length;


  // ---------------- APPROVE / REJECT ----------------
  const handleApproveLeave = async (
  id: string,
  leaveType: string,
  payType: 'paid' | 'unpaid' | null
) => {
  // 🔒 RULE ENFORCEMENT
  if (leaveType === 'Casual Leave' && !payType) {
    toast.error('Select Paid or Unpaid');
    return;
  }

  const finalPayType =
    leaveType === 'Sick Leave' ? 'paid' : payType;

  const { error } = await supabase
    .from('leave_requests')
    .update({
      status: 'approved',
      pay_type: finalPayType,
    })
    .eq('id', id);

  if (error) {
    toast.error('Approval failed');
    return;
  }

  toast.success('Leave approved successfully!');
  fetchLeaves();
};


  const handleRejectLeave = async (id: string) => {
    const { error } = await supabase
      .from('leave_requests')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (error) {
      toast.error('Rejection failed');
      return;
    }

    toast.success('Leave rejected!');
    fetchLeaves();
  };

  const filteredLeaves = leaveRequests.filter((leave: any) => {
  if (statusFilter !== 'all' && leave.status !== statusFilter) return false;

  if (employeeFilter && !leave.employeeCode?.includes(employeeFilter)) return false;

  if (fromDate && new Date(leave.startDate) < new Date(fromDate)) return false;

  if (toDate && new Date(leave.endDate) > new Date(toDate)) return false;

  return true;
});

return (
  <div className="max-w-6xl mx-auto space-y-6">

    {/* Leave Balance Overview – EMPLOYEE ONLY */}
    {role === 'employee' && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sick Leave </p>
                <p className="text-3xl mt-1">{sickTakenThisMonth}</p>
                <p className="text-xs text-gray-500 mt-1">Taken this month</p>
              </div>
             <div className="size-12 rounded-full bg-red-100 flex items-center justify-center">
                <div className="size-6 rounded-full bg-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Casual Leave</p>
                <p className="text-3xl mt-1">{casualTakenThisMonth}</p>
                <p className="text-xs text-gray-500 mt-1">Taken this month</p>
              </div>
              <div className="size-12 rounded-full bg-gray-100 flex items-center justify-center">
                <div className="size-6 rounded-full bg-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sick Leave</p>
                <p className="text-3xl mt-1">{sickLeftThisYear}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {sickTakenThisYear} / 12 used this year
                </p>
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
                <p className="text-sm text-gray-600">Annual Leave</p>
                <p className="text-3xl mt-1">12</p>
              </div>
              <div className="size-12 rounded-full bg-purple-100 flex items-center justify-center">
                <div className="size-6 rounded-full bg-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )}

    {/* approvals  – admin and manager ONLY */}
    {(role === 'admin' || role === 'manager') && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved Leaves </p>
                <p className="text-3xl mt-1">{approvedThisMonth}</p>
                <p className="text-xs text-gray-500 mt-1">Taken this month</p>
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
                <p className="text-sm text-gray-600">Rejected Leaves</p>
                <p className="text-3xl mt-1">{rejectedThisMonth}</p>
                <p className="text-xs text-gray-500 mt-1">Taken this month</p>
              </div>
              <div className="size-12 rounded-full bg-red-100 flex items-center justify-center">
                <div className="size-6 rounded-full bg-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Leaves</p>
                <p className="text-3xl mt-1">{pendingThisMonth}</p>
                <p className="text-xs text-gray-500 mt-1">Taken this month</p>
              </div>
              <div className="size-12 rounded-full bg-red-100 flex items-center justify-center">
                <div className="size-6 rounded-full bg-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    )}


    {/* Leave Requests */}
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {role === 'employee' ? 'Leave Requests' : 'Leave Approval Requests'}
            </CardTitle>
            <CardDescription>
              {role === 'employee'
                ? 'Manage your leave applications'
                : 'Review and approve employee leave requests'}
            </CardDescription>
          </div>

          {/*  APPLY LEAVE – EMPLOYEE ONLY */}
          {role === 'employee' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4 mr-2" />
                  Apply Leave
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Apply for Leave</DialogTitle>
                  <DialogDescription>
                    Fill in the details for your leave request
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Leave Type</Label>
                    <Select
                      value={leaveForm.type}
                      onValueChange={(value) =>
                        setLeaveForm({ ...leaveForm, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                        <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="date"
                      value={leaveForm.startDate}
                      onChange={(e) =>
                        setLeaveForm({ ...leaveForm, startDate: e.target.value })
                      }
                    />
                    <Input
                      type="date"
                      value={leaveForm.endDate}
                      onChange={(e) =>
                        setLeaveForm({ ...leaveForm, endDate: e.target.value })
                      }
                    />
                  </div>

                  <Textarea
                    placeholder="Reason"
                    value={leaveForm.reason}
                    onChange={(e) =>
                      setLeaveForm({ ...leaveForm, reason: e.target.value })
                    }
                  />

                  <Button onClick={handleApplyLeave} className="w-full">
                    Submit Leave Request
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>

      {/* Filters – ADMIN / MANAGER ONLY */}
      {(role === 'admin' || role === 'manager') && (
        <div className="flex flex-wrap gap-3 mb-4">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Employee Code"
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="w-40"
          />

          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
        </div>
      )}

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
               <TableHead>Applied By</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Applied On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pay Type</TableHead>
              
              {(role === 'admin' || role === 'manager') && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredLeaves.map((leave) => (
              <TableRow key={leave.id}>
                  <TableCell className="font-medium">{leave.employeeName}</TableCell>
                <TableCell>{leave.type}</TableCell>
                <TableCell>{new Date(leave.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(leave.endDate).toLocaleDateString()}</TableCell>
                <TableCell>{leave.days}</TableCell>
                <TableCell className="truncate">{leave.reason}</TableCell>
                <TableCell>{new Date(leave.appliedOn).toLocaleDateString()}</TableCell>
                <TableCell>{leave.status}</TableCell>
                <TableCell>
                  <Badge
                      variant={
                        leave.pay_type === 'paid'
                          ? 'default'
                          : leave.pay_type === 'unpaid'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {leave.pay_type ?? 'Pending'}
                  </Badge>
                </TableCell>
             {(role === 'admin' || role === 'manager') && (
                  <TableCell>
                    {leave.status === 'pending' && (
                      <div className="flex flex-col gap-2">

                        {/*  APPROVE / REJECT → BOTH LEAVES */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleApproveLeave(
                                leave.id,
                                leave.type,
                                leave.type === 'Sick Leave' ? 'paid' : null
                              )
                            }
                          >
                            Approve
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectLeave(leave.id)}
                          >
                            Reject
                          </Button>
                        </div>

                        {/*  PAID / UNPAID → ONLY CASUAL AFTER APPROVE */}
                        {leave.type === 'Casual Leave' && leave.pay_type === null && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 text-white hover:bg-green-700"
                              onClick={() =>
                                handleApproveLeave(leave.id, leave.type, 'paid')
                              }
                            >
                              Paid
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleApproveLeave(leave.id, leave.type, 'unpaid')
                              }
                            >
                              Unpaid
                            </Button>
                          </div>
                        )}

                      </div>
                    )}
                  </TableCell>
                )}


              </TableRow>
            ))}

            {!loading && filteredLeaves.length === 0 && (
              <TableRow>
                <TableCell colSpan={role === 'admin' || role === 'manager' ? 8 : 7} className="text-center text-gray-500 py-4">
                  No leave records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    {role === 'employee' && (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Leaves</CardTitle>
          <CardDescription>Your approved leaves for the next 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaveRequests
              .filter((leave) => leave.status === 'approved')
              .slice(0, 3)
              .map((leave) => (
                <div key={leave.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{leave.type}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(leave.startDate).toLocaleDateString()} -{' '}
                      {new Date(leave.endDate).toLocaleDateString()}
                       <Badge variant="outline">{leave.pay_type}</Badge>
                    </p>
                  </div>
                  <Badge variant="outline">{leave.days} days</Badge>
                 
                </div>
              ))}

            {leaveRequests.filter((leave) => leave.status === 'approved').length === 0 && (
              <p className="text-center text-gray-500 py-8">No upcoming leaves</p>
            )}
          </div>
        </CardContent>
      </Card>
    )}
  </div>
);



}
