"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { User, Mail, Briefcase, Calendar, MapPin, Phone, Edit, Save, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface ProfilePageProps {
  role: "admin" | "manager" | "employee";
  employeeCode: string;
}

export function ProfilePage({ role, employeeCode }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    phone: "",
    address: "",
    emergencyContact: "",
    bloodGroup: "",
    
  });

  const TOTAL_SICK_PER_YEAR = 12;
  const [sickTakenThisYear, setSickTakenThisYear] = useState(0);

  // ---------------- FETCH EMPLOYEE ID 
  const fetchEmployeeId = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id")
      .eq("employee_code", employeeCode)
      .single();

    if (error) {
      toast.error("Unable to identify employee");
      return;
    }

    setEmployeeId(data.id);
  };

  useEffect(() => {
    if (employeeCode) fetchEmployeeId();
  }, [employeeCode]);

  // ---------------- FETCH PROFILE
  const fetchProfile = async () => {
    if (!employeeId) return;

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", employeeId)
      .single();

    if (error) {
      toast.error("Failed to load profile");
      return;
    }

    setEmployeeData(data);
    setFormData({
      phone: data.phone ?? "",
      address: data.address ?? "",
      emergencyContact: data.emergency_contact ?? "",
      bloodGroup: data.blood_group ?? "",
     
    });

    setLoading(false);
  };

  // ---------------- FETCH LEAVES
  const fetchSickLeaves = async () => {
    if (!employeeId) return;

    const currentYear = new Date().getFullYear();

    const { data, error } = await supabase
      .from("leave_requests")
      .select("days, start_date")
      .eq("employee_id", employeeId)
      .eq("leave_type", "Sick Leave")
      .eq("status", "approved");

    if (error) return;

    const total = data
      .filter((l: any) => new Date(l.start_date).getFullYear() === currentYear)
      .reduce((sum: number, l: any) => sum + l.days, 0);

    setSickTakenThisYear(total);
  };

  useEffect(() => {
    if (employeeId) {
      fetchProfile();
      fetchSickLeaves();
    }
  }, [employeeId]);

  // ---------------- SAVE PROFILE
  const handleSave = async () => {
    if (!employeeId) return;

    const { error } = await supabase
      .from("employees")
      .update({
        phone: formData.phone,
        address: formData.address,
        emergency_contact: formData.emergencyContact,
        blood_group: formData.bloodGroup,
      })
      .eq("id", employeeId);

    if (error) {
      toast.error("Failed to update profile");
      return;
    }

    toast.success("Profile updated successfully!");
    setIsEditing(false);
    fetchProfile();
  };

  const handleCancel = () => setIsEditing(false);

  // ---------------- CALCULATIONS
  const yearsOfService = employeeData
    ? Math.floor(
        (Date.now() - new Date(employeeData.join_date).getTime()) /
          (1000 * 60 * 60 * 24 * 365)
      )
    : 0;

  const leaveBalance = Math.max(
    TOTAL_SICK_PER_YEAR - sickTakenThisYear,
    0
  );

  if (loading || !employeeData) {
    return <p className="text-center">Loading...</p>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Profile Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="size-24">
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-2xl">
                {employeeData.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h2 className="text-3xl">{employeeData.name}</h2>
                <Badge variant="outline" className="capitalize w-fit mx-auto md:mx-0">
                  {role}
                </Badge>
              </div>
              <p className="text-gray-600 mb-1">{employeeData.position}</p>
              <p className="text-sm text-gray-500">{employeeData.email}</p>
              <p className="text-sm text-gray-500">
                Employee Code: {employeeData.employee_code}
              </p>
            </div>

            <Button
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              className="w-full md:w-auto"
            >
              {isEditing ? (
                <>
                  <Save className="size-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit className="size-4 mr-2" />
                  Edit Profile
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Your basic information and contact details</CardDescription>
        </CardHeader>
         <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="flex items-center gap-2">
                <User className="size-4 text-gray-400" />
                <Input
                  id="fullName"
                  value={employeeData.name?? ""}
                  disabled={!isEditing}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-gray-400" />
                <Input
                  id="email"
                  value={employeeData.email?? ""}
                  disabled={!isEditing}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-gray-400" />
                <Input
                  id="phone"
                  value={formData.phone?? ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bloodGroup">Blood Group</Label>
              <Input
                id="bloodGroup"
                value={formData.bloodGroup?? ""}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-gray-400" />
                <Input
                  id="address"
                  value={formData.address?? ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!isEditing}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-gray-400" />
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, emergencyContact: e.target.value })
                  }
                  disabled={!isEditing}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave} className="flex-1">
                <Save className="size-4 mr-2" />
                Save Changes
              </Button>
              <Button onClick={handleCancel} variant="outline" className="flex-1">
                <X className="size-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
       {/* Employment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Employment Information</CardTitle>
          <CardDescription>Your work-related details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Employee Code</p>
              <p className="font-mono">{employeeData.employee_code}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Department</p>
              <div className="flex items-center gap-2">
                <Briefcase className="size-4 text-gray-400" />
                <p>{employeeData.company_name}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Position</p>
              <p>{employeeData.department}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Join Date</p>
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-gray-400" />
                <p>{new Date(employeeData.join_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Employment Type</p>
              <Badge>Full Time</Badge>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Work Location</p>
              <p>Banglore</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-gray-600">Years of Service</p>
            <p className="text-3xl mt-2">{yearsOfService}</p>
          </CardContent>
        </Card>
        {role === 'employee' &&(<Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-gray-600">Sick Leave Balance</p>
            <p className="text-3xl mt-2">{leaveBalance}</p>
          </CardContent>
        </Card>)}
        
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-gray-600">Performance Rating</p>
            <p className="text-3xl mt-2">4.5</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
