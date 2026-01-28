"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";

interface Props {
  employeeId: string;
}

export default function EmployeeFeedbackPage({ employeeId }: Props) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submitFeedback = async () => {
    if (!message.trim()) {
      toast.error("Message is required");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("employee_feedback").insert({
      employee_id: employeeId,
      title,
      message,
    });

    setLoading(false);

    if (error) {
      toast.error("Failed to submit");
      return;
    }

    setTitle("");
    setMessage("");
    toast.success("Submitted successfully");
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Suggestions & Requests</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Input
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Textarea
          placeholder="Write your idea, suggestion, or request..."
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <Button onClick={submitFeedback} disabled={loading}>
          Submit
        </Button>
      </CardContent>
    </Card>
  );
}
