import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  DollarSign,
  Download,
  TrendingUp,
  Calendar,
  Edit,
  PiggyBank,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';

interface SalaryPageProps {
  employeeCode: string;
  role: 'admin' | 'manager' | 'employee';
}

interface SalaryRecord {
  month: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'paid' | 'pending' | 'processing';
}

export function SalaryPage({ employeeCode, role }: SalaryPageProps) {
  const [selectedMonth, setSelectedMonth] = useState('December 2024');
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updateData, setUpdateData] = useState({
    basicSalary: '75000',
    allowances: '15000',
    deductions: '5000',
  });

  const salaryData: SalaryRecord[] = [
    {
      month: 'December 2024',
      basicSalary: 75000,
      allowances: 15000,
      deductions: 5000,
      netSalary: 85000,
      status: 'processing',
    },
    {
      month: 'November 2024',
      basicSalary: 75000,
      allowances: 15000,
      deductions: 5000,
      netSalary: 85000,
      status: 'paid',
    },
    {
      month: 'October 2024',
      basicSalary: 75000,
      allowances: 12000,
      deductions: 4500,
      netSalary: 82500,
      status: 'paid',
    },
    {
      month: 'September 2024',
      basicSalary: 75000,
      allowances: 12000,
      deductions: 4500,
      netSalary: 82500,
      status: 'paid',
    },
    {
      month: 'August 2024',
      basicSalary: 70000,
      allowances: 12000,
      deductions: 4000,
      netSalary: 78000,
      status: 'paid',
    },
    {
      month: 'July 2024',
      basicSalary: 70000,
      allowances: 12000,
      deductions: 4000,
      netSalary: 78000,
      status: 'paid',
    },
  ];

  const currentSalary = salaryData[0];
  const previousSalary = salaryData[1];
  const salaryIncrease = currentSalary.netSalary - previousSalary.netSalary;
  const yearToDateEarnings = salaryData.reduce((sum, record) => sum + record.netSalary, 0);

  const handleDownloadPayslip = (month: string) => {
    toast.success(`Downloading payslip for ${month}`);
  };

  const handleUpdateSalary = () => {
    toast.success('Salary updated successfully!');
    setIsUpdateDialogOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Salary Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Salary</p>
                <p className="text-2xl mt-1">${currentSalary.netSalary.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{currentSalary.month}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="size-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Increase</p>
                <p className="text-2xl mt-1">${salaryIncrease.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="size-3 text-green-600" />
                  <p className="text-xs text-green-600">
                    {((salaryIncrease / previousSalary.netSalary) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="size-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">YTD Earnings</p>
                <p className="text-2xl mt-1">${yearToDateEarnings.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Year to Date</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <PiggyBank className="size-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Deductions</p>
                <p className="text-2xl mt-1">${currentSalary.deductions.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">This Month</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <CreditCard className="size-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Month Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Salary Breakdown</CardTitle>
              <CardDescription>{currentSalary.month}</CardDescription>
            </div>
            <div className="flex gap-2">
              {(role === 'admin' || role === 'manager') && (
                <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Edit className="size-4 mr-2" />
                      Update Salary
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Salary Details</DialogTitle>
                      <DialogDescription>
                        Modify salary components for this employee
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="basicSalary">Basic Salary</Label>
                        <Input
                          id="basicSalary"
                          type="number"
                          value={updateData.basicSalary}
                          onChange={(e) =>
                            setUpdateData({ ...updateData, basicSalary: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="allowances">Allowances</Label>
                        <Input
                          id="allowances"
                          type="number"
                          value={updateData.allowances}
                          onChange={(e) =>
                            setUpdateData({ ...updateData, allowances: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deductions">Deductions</Label>
                        <Input
                          id="deductions"
                          type="number"
                          value={updateData.deductions}
                          onChange={(e) =>
                            setUpdateData({ ...updateData, deductions: e.target.value })
                          }
                        />
                      </div>
                      <Button onClick={handleUpdateSalary} className="w-full">
                        Update Salary
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <Button onClick={() => handleDownloadPayslip(currentSalary.month)}>
                <Download className="size-4 mr-2" />
                Download Payslip
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Basic Salary</span>
              <span className="text-lg">${currentSalary.basicSalary.toLocaleString()}</span>
            </div>
            <Separator />
            
            <div>
              <p className="text-sm text-gray-600 mb-3">Allowances</p>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">House Rent Allowance</span>
                  <span className="text-sm">$8,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Transport Allowance</span>
                  <span className="text-sm">$3,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Performance Bonus</span>
                  <span className="text-sm">$4,000</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Total Allowances</span>
                  <span>${currentSalary.allowances.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm text-gray-600 mb-3">Deductions</p>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Income Tax</span>
                  <span className="text-sm">$3,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Insurance</span>
                  <span className="text-sm">$1,500</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Provident Fund</span>
                  <span className="text-sm">$500</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Total Deductions</span>
                  <span className="text-red-600">-${currentSalary.deductions.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
              <span className="text-lg">Net Salary</span>
              <span className="text-2xl text-green-600">
                ${currentSalary.netSalary.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary History */}
      <Card>
        <CardHeader>
          <CardTitle>Salary History</CardTitle>
          <CardDescription>Your salary records for the past 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Basic Salary</TableHead>
                <TableHead className="text-right">Allowances</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaryData.map((record, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-gray-400" />
                      <span>{record.month}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    ${record.basicSalary.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    +${record.allowances.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    -${record.deductions.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ${record.netSalary.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        record.status === 'paid'
                          ? 'default'
                          : record.status === 'processing'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadPayslip(record.month)}
                    >
                      <Download className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
