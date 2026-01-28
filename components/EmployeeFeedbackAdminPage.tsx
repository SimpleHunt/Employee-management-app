"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

export default function EmployeeFeedbackAdminPage() {
  const [rows, setRows] = useState<any[]>([]);

  const fetchFeedback = async () => {
    const { data, error } = await supabase
      .from("employee_feedback")
      .select(`
        id,
        title,
        message,
        status,
        created_at,
        employees ( name, employee_code )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load feedback");
      return;
    }

    setRows(data || []);
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase
      .from("employee_feedback")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    toast.success("Status updated");
    fetchFeedback();
  };

  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>Employee Suggestions & Requests</CardTitle>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  {row.employees.name} ({row.employees.employee_code})
                </TableCell>

                <TableCell>{row.title || "-"}</TableCell>

                <TableCell className="max-w-xs truncate">
                  {row.message}
                </TableCell>

                <TableCell>
                  <Badge>{row.status}</Badge>
                </TableCell>

                <TableCell>
                  {format(new Date(row.created_at), "dd MMM yyyy")}
                </TableCell>

                <TableCell className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateStatus(row.id, "reviewed")}
                  >
                    Review
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(row.id, "resolved")}
                  >
                    Resolve
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
