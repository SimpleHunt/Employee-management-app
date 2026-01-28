"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";

interface LateRecord {
  id: string;
  date: string | null;
  punch_in_time: string | null;
  late_approval_status: "approved" | "not_approved";
  employee: {
    name: string;
    employee_code: string;
  } | null;
}

/* ---------------- SAFE FORMATTERS ---------------- */

const safeDate = (value?: string | null) => {
  if (!value) return "--";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "--" : format(d, "dd MMM yyyy");
};

const safeTime = (value?: string | null) => {
  if (!value) return "--";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "--" : format(d, "hh:mm a");
};

/* ---------------- PAGE ---------------- */

export default function LateApprovalsPage() {
  const [records, setRecords] = useState<LateRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLateRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          id,
          date,
          punch_in_time,
          late_approval_status,
          employees:employee_id (
            name,
            employee_code
          )
        `)
        .eq("status", "late")
        .order("date", { ascending: false });

      if (error) throw error;

      const formatted: LateRecord[] = (data ?? []).map((row: any) => ({
        id: row.id,
        date: row.date,
        punch_in_time: row.punch_in_time,
        late_approval_status: row.late_approval_status,
       employee: row.employees ?? null
,
      }));

      setRecords(formatted);
    } catch (err) {
      console.error("Late approvals error:", err);
      toast.error("Failed to load late approvals");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLateRecords();
  }, []);

  const updateApproval = async (
    attendanceId: string,
    status: "approved" | "not_approved"
  ) => {
    const { error } = await supabase
      .from("attendance")
      .update({ late_approval_status: status })
      .eq("id", attendanceId);

    if (error) {
      toast.error("Failed to update approval");
      return;
    }

    toast.success(`Late ${status.replace("_", " ")}`);
    fetchLateRecords();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Late Arrival Approvals</h1>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-center py-10">Loading...</p>
      ) : records.length === 0 ? (
        <p className="text-center py-10 text-gray-500">
          No late arrivals found
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Punch In</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {row.employee?.name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {row.employee?.employee_code ?? "--"}
                    </p>
                  </div>
                </TableCell>

                <TableCell>{safeDate(row.date)}</TableCell>
                <TableCell>{safeTime(row.punch_in_time)}</TableCell>

                <TableCell>
                  <Badge
                    variant={
                      row.late_approval_status === "approved"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {row.late_approval_status === "approved"
                      ? "Approved"
                      : "Not Approved"}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                {row.late_approval_status === "not_approved" ? (
                  <div className="space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateApproval(row.id, "approved")}
                    >
                      <CheckCircle className="size-4 mr-1 text-green-600" />
                      Approve
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateApproval(row.id, "not_approved")}
                    >
                      <XCircle className="size-4 mr-1 text-red-600" />
                      Reject
                    </Button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 italic">
                    Action completed
                  </span>
                )}
              </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
