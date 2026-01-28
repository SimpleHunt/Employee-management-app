import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { FileText, Download, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

interface Document {
  id: string;
  employee_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
}

const DOCUMENT_TYPES = [
  { value: 'offer_letter', label: 'Offer Letter' },
  { value: 'joining_letter', label: 'Joining Letter' },
  { value: 'appointment_letter', label: 'Appointment Letter' },
  { value: 'salary_slip', label: 'Salary Slip' },
  { value: 'resignation_letter', label: 'Resignation Letter' },
  { value: 'other', label: 'Other' },
];

export default function EmployeeDocumentsPage({
  employeeCode,
}: {
  employeeCode: string;
}) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [employeeName, setEmployeeName] = useState('');

 useEffect(() => {
  fetchDocuments();
}, [employeeCode]);


const fetchDocuments = async () => {
  try {
    setLoading(true);

    //  Get employee using employeeCode (SAME SOURCE AS DASHBOARD)
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, name')
      .eq('employee_code', employeeCode)
      .single();

    if (empError || !employee) throw empError;

    setEmployeeName(employee.name);

    // 2 Fetch documents using employee.id
    const { data: docs, error: docsError } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('employee_id', employee.id)
      .order('uploaded_at', { ascending: false });

    if (docsError) throw docsError;

    setDocuments(docs || []);
  } catch (error) {
    console.error('Error fetching documents:', error);
    toast.error('Failed to fetch documents');
  } finally {
    setLoading(false);
  }
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

      toast.success('Document downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

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

  const groupDocumentsByType = () => {
    const grouped: Record<string, Document[]> = {};
    documents.forEach(doc => {
      if (!grouped[doc.document_type]) {
        grouped[doc.document_type] = [];
      }
      grouped[doc.document_type].push(doc);
    });
    return grouped;
  };

  const groupedDocuments = groupDocumentsByType();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Documents</h1>
          <p className="text-gray-600">View and download your employment documents</p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">Loading documents...</div>
            </CardContent>
          </Card>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Available</h3>
                <p className="text-gray-500">
                  You don't have any documents yet. Please contact HR or your manager.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Documents</CardDescription>
                  <CardTitle className="text-3xl">{documents.length}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Document Types</CardDescription>
                  <CardTitle className="text-3xl">{Object.keys(groupedDocuments).length}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Latest Upload</CardDescription>
                  <CardTitle className="text-lg">
                    {documents.length > 0
                      ? new Date(documents[0].uploaded_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'N/A'}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Documents by Type */}
            <div className="space-y-4">
              {Object.entries(groupedDocuments).map(([type, docs]) => (
                <Card key={type}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {getDocumentTypeLabel(type)}
                        </CardTitle>
                        <CardDescription>{docs.length} document(s)</CardDescription>
                      </div>
                      <Badge className={getDocumentTypeBadgeColor(type)}>
                        {getDocumentTypeLabel(type)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>File Name</TableHead>
                          <TableHead>Uploaded Date</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {docs.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                {doc.file_name}
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(doc.uploaded_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(doc)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* All Documents Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Documents</CardTitle>
                <CardDescription>Complete list of all your documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document Type</TableHead>
                        <TableHead>File Name</TableHead>
                        <TableHead>Uploaded Date</TableHead>
                        <TableHead className="text-right">Action</TableHead>
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
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              {doc.file_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(doc.uploaded_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(doc)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
