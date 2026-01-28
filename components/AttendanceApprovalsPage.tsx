"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

interface ApprovalRow {
  id: string;
  date: string;
  work_mode: "office" | "wfh" | "outside";
  status: "present" | "late";
  employee: {
    name: string;
    employee_code: string;
  };
}

export default function AttendanceApprovalsPage() {
  const [rows, setRows] = useState<ApprovalRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    const { data, error } = await supabase
      .from("attendance")
      .select(`
        id,
        date,
        work_mode,
        status,
        employees (
          name,
          employee_code
        )
      `)
      .eq("approval_status", "pending")
      .in("work_mode", ["wfh", "outside"])
      .order("date", { ascending: false });

    if (error) {
      toast.error("Failed to load approvals");
      setLoading(false);
      return;
    }

    setRows(
      (data || []).map((r: any) => ({
        id: r.id,
        date: r.date,
        work_mode: r.work_mode,
        status: r.status,
        employee: {
          name: r.employees.name,
          employee_code: r.employees.employee_code,
        },
      }))
    );

    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("attendance")
      .update({
        approval_status: status,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      toast.error("Action failed");
      return;
    }

    toast.success(`Attendance ${status}`);
    fetchPending();
  };

  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>WFH / Outside Attendance Approvals</CardTitle>
      </CardHeader>

      <CardContent>
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    No pending approvals
                  </TableCell>
                </TableRow>
              )}

              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    {row.employee.name} ({row.employee.employee_code})
                  </TableCell>

                  <TableCell>
                    {format(new Date(row.date), "dd MMM yyyy")}
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="uppercase">
                      {row.work_mode}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={row.status === "late" ? "destructive" : "default"}
                    >
                      {row.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateStatus(row.id, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateStatus(row.id, "rejected")}
                    >
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
