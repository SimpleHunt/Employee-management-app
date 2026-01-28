'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Upload, FileText, Eye, Trash2, Download, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Employee {
  id: string;
  employee_code: string;
  name: string;
  email: string;
}

interface Document {
  id: string;
  employee_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
  uploaded_by: string;
}

const DOCUMENT_TYPES = [
  { value: 'offer_letter', label: 'Offer Letter' },
  { value: 'joining_letter', label: 'Joining Letter' },
  { value: 'appointment_letter', label: 'Appointment Letter' },
  { value: 'salary_slip', label: 'Salary Slip' },
  { value: 'resignation_letter', label: 'Resignation Letter' },
  { value: 'other', label: 'Other' },
];






export default function AdminDocumentsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  
 
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
 
  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchDocuments(selectedEmployee.id);
    }
  }, [selectedEmployee]);

  


useEffect(() => {
  supabase.auth.getUser().then(({ data }) => {
    setUser(data.user);
  });
}, []);




 const fetchEmployees = async () => {
  try {
    setLoading(true);

    const { data, error } = await supabase
      .from('employees')
      .select('*');

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    setEmployees(data ?? []);
  } catch (err: any) {
    console.error('Error fetching employees:', err?.message || err);
    toast.error(err?.message || 'Failed to fetch employees');
  } finally {
    setLoading(false);
  }
};


  const fetchDocuments = async (employeeId: string) => {
  try {
    const { data, error } = await supabase
      .from('employee_documents') 
      .select('*')
      .eq('employee_id', employeeId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    setDocuments(data || []);
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    toast.error('Failed to fetch documents');
  }
};


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should not exceed 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

const handleUpload = async () => {
    if (!user) {
    toast.error('Authentication required');
    setUploading(false);
    return;
  }


  if (!selectedEmployee || !selectedFile || !documentType) {
    toast.error('Please select employee, document type and file');
    return;
  }

  setUploading(true);

  const fileExt = selectedFile.name.split('.').pop();
  const fileName = `${selectedEmployee.employee_code}_${documentType}_${Date.now()}.${fileExt}`;
  const filePath = `${selectedEmployee.id}/${fileName}`;

  // 1️⃣ Upload to STORAGE
  const { error: uploadError } = await supabase.storage
    .from('employee-documents')
    .upload(filePath, selectedFile);

  if (uploadError) {
    console.error('STORAGE ERROR:', uploadError);
    toast.error(uploadError.message);
    setUploading(false);
    return;
  }
 


const { error: dbError } = await supabase
  .from('employee_documents')
  .insert({
    employee_id: selectedEmployee.id,
    document_type: documentType,
    file_name: selectedFile.name,
    file_path: filePath,
    uploaded_by: user.id,
  });


  if (dbError) {
   console.error('DB ERROR RAW:', dbError);
   console.error('DB ERROR STRING:', JSON.stringify(dbError));

    toast.error(dbError.message || 'Database insert failed');
    setUploading(false);
    return;
  }

  toast.success('Document uploaded successfully');
  setUploadDialogOpen(false);
  setSelectedFile(null);
  setDocumentType('');
  fetchDocuments(selectedEmployee.id);
  setUploading(false);
};




  const handleDownload = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('employee-documents')
        .download(document.file_path);

      if (error) throw error;

      // Create download link
      const url = window.URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Document downloaded');
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

 const handleDelete = async (document: Document) => {
  if (!window.confirm('Are you sure you want to delete this document?')) return;

  try {
    // ✅ STORAGE
    const { error: storageError } = await supabase.storage
      .from('employee-documents')
      .remove([document.file_path]);

    if (storageError) throw storageError;

    // ✅ DATABASE
    const { error: dbError } = await supabase
      .from('employee_documents')
      .delete()
      .eq('id', document.id);

    if (dbError) throw dbError;

    toast.success('Document deleted successfully');
    fetchDocuments(document.employee_id);
  } catch (error: any) {
    console.error(error);
    toast.error('Failed to delete document');
  }
};


  const filteredEmployees = employees.filter(emp =>
    emp.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDocumentTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find(dt => dt.value === type)?.label || type;
  };

  const getDocumentTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      offer_letter: 'bg-blue-100 text-blue-800',
      joining_letter: 'bg-green-100 text-green-800',
      appointment_letter: 'bg-purple-100 text-purple-800',
      salary_slip: 'bg-orange-100 text-orange-800',
      resignation_letter: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors.other;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Documents Management</h1>
          <p className="text-gray-600">Upload and manage employee documents</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Employees</CardTitle>
              <CardDescription>Select an employee to manage documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by code or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading employees...</div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No employees found</div>
                ) : (
                  filteredEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      onClick={() => setSelectedEmployee(employee)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedEmployee?.id === employee.id
                          ? 'bg-blue-50 border-blue-500'
                          : 'bg-white hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="font-medium text-gray-900">Name:{employee.name}</div>
                      <div className="text-sm text-gray-500">Code: {employee.employee_code}</div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Documents Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {selectedEmployee ? `Documents for ${selectedEmployee.name}` : 'Select an Employee'}
                  </CardTitle>
                  <CardDescription>
                    {selectedEmployee
                      ? `Employee Code: ${selectedEmployee.employee_code}`
                      : 'Choose an employee from the list to view and manage documents'}
                  </CardDescription>
                </div>
                {selectedEmployee && (
                  <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Document</DialogTitle>
                        <DialogDescription>
                          Upload a document for {selectedEmployee.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="documentType">Document Type</Label>
                          <Select value={documentType} onValueChange={setDocumentType}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                            <SelectContent>
                              {DOCUMENT_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="file">File (Max 10MB)</Label>
                          <Input
                            id="file"
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          />
                          {selectedFile && (
                            <p className="text-sm text-gray-500 mt-1">
                              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                          )}
                        </div>
                       <Button
                        onClick={handleUpload}
                      
                        className="w-full"
                        >
                        {uploading ? 'Uploading...' : 'Upload Document'}
                        </Button>



                         
                        
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedEmployee ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select an employee to view their documents</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No documents uploaded yet</p>
                  <Button onClick={() => setUploadDialogOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload First Document
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document Type</TableHead>
                        <TableHead>File Name</TableHead>
                        <TableHead>Uploaded Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <Badge className={getDocumentTypeBadgeColor(doc.document_type)}>
                              {getDocumentTypeLabel(doc.document_type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{doc.file_name}</TableCell>
                          <TableCell>
                            {new Date(doc.uploaded_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(doc)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(doc)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
