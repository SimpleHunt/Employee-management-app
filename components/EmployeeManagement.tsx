import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
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
import { Users, Plus, Edit, Trash2, Search, Filter, DollarSign, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';



interface EmployeeManagementProps {
  role: 'admin' | 'manager';
}

interface Employee {
  id: string;
  name: string;
  email: string;
  employeeCode: string;
  department: string;
  position: string;
  salary: number;
  joinDate: string;
  companyName:string;
  status: 'active' | 'inactive';
  role: 'admin' | 'manager' | 'employee';

  gender?: 'male' | 'female' | 'other';
  homeLat?: number;
  homeLng?: number;
}

export function EmployeeManagement({ role }: EmployeeManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    employeeCode: '',
    department: '',
    position: '',
    salary: '',
    companyName: '',
    joinDate: '',
    role: 'employee',

     gender: '',
      homeLat: '',
      homeLng: '',
  });

const [employees, setEmployees] = useState<Employee[]>([]);
const [loading, setLoading] = useState(false);

 const departments = [
  'all',
  'Finance',
  'Admin',
  'HR',
  'Sales',
  'Operation',
  'IT',
];

  
  const departmentRoles: Record<string, string[]> = {
  Finance: ["Finance Executive", "Finance Manager", "Finance Head"],
  Admin: ["Admin Executive", "Admin Manager", "Admin Head"],
  HR: ["HR Executive", "HR BDM", "HR Manager", "HR Head", "HR Inside Sales"],
  Sales: ["BDM", "Field Sales", "Inside Sales",],
  Operation: ["Operation Manager", "Operation Head", "Process Lead","Project Manager"],
  IT: ["Full Stack Developer", "Project Manager", "Project Head","Digital Marketing"],
};

  const companies = [
  'Legacy Innovations',
  'SimpleHunt',
  'Greenland Acres',
  'Bhaga Tunga'
  ];


  const fetchEmployees = async () => {
  setLoading(true);

  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false });

  if (!error && data) {
    setEmployees(
      data.map((e) => ({
        id: e.id,
        name: e.name,
        email: e.email,
        employeeCode: e.employee_code,
        department: e.department,
        position: e.position,
        salary: e.salary,
        joinDate: e.join_date,
        companyName:e.company_name,
        status: e.status,
        role: e.role,
      }))
    );
  }

  setLoading(false);
};

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (emp.email || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment =
      filterDepartment === 'all' || emp.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });



const handleAddEmployee = async () => {
  if (!newEmployee.name || !newEmployee.employeeCode || !newEmployee.companyName) {
    toast.error('Please fill all required fields');
    return;
  }

  
  if (
    newEmployee.gender === 'female' &&
    (!newEmployee.homeLat || !newEmployee.homeLng)
  ) {
    toast.error('Please enter Home Latitude & Longitude for female employees');
    return;
  }

  try {
    const payload = {
      name: newEmployee.name,
      email: newEmployee.email || null,
      employee_code: newEmployee.employeeCode,
      department: newEmployee.department || null,
      position: newEmployee.position || null,
      salary: newEmployee.salary ? Number(newEmployee.salary) : null,
      role: newEmployee.role,
      company_name: newEmployee.companyName,
      join_date: newEmployee.joinDate
        ? newEmployee.joinDate
        : new Date().toISOString().slice(0, 10),
      status: 'active',

     
      gender: newEmployee.gender || null,
      home_lat:
        newEmployee.gender === 'female'
          ? Number(newEmployee.homeLat)
          : null,
      home_lng:
        newEmployee.gender === 'female'
          ? Number(newEmployee.homeLng)
          : null,
    };

    await supabase.from('employees').insert(payload).throwOnError();

    toast.success('Employee added successfully!');
    setIsAddDialogOpen(false);

    
    setNewEmployee({
      name: '',
      email: '',
      employeeCode: '',
      department: '',
      position: '',
      salary: '',
      companyName: '',
      joinDate: '',
      role: 'employee',

      gender: '',
      homeLat: '',
      homeLng: '',
    });

    fetchEmployees();
  } catch (err: any) {
    console.error('Supabase insert error:', err.message);
    toast.error(err.message || 'Failed to add employee');
  }
};



  useEffect(() => {
  fetchEmployees();
}, []);



 const handleEditEmployee = async () => {
  if (!selectedEmployee) return;

  const { error } = await supabase
    .from('employees')
    .update({
      name: selectedEmployee.name,
      email: selectedEmployee.email,
      department: selectedEmployee.department,
      position: selectedEmployee.position,
      salary: selectedEmployee.salary,
      status: selectedEmployee.status,
       join_date: selectedEmployee.joinDate,
      company_name: selectedEmployee.companyName,

       gender: selectedEmployee.gender || null,
        home_lat: selectedEmployee.gender === 'female' 
          ? selectedEmployee.homeLat 
          : null,
        home_lng: selectedEmployee.gender === 'female' 
          ? selectedEmployee.homeLng 
          : null,
          })
    .eq('id', selectedEmployee.id);

  if (error) {
    toast.error('Failed to update employee');
    return;
  }

  toast.success('Employee updated successfully!');
  setIsEditDialogOpen(false);
  setSelectedEmployee(null);
  fetchEmployees();
};

const handleDeleteEmployee = async (id: string) => {
  const { error } = await supabase
    .from('employees')
    .update({ status: 'inactive' }) 
    .eq('id', id);

  if (error) {
    console.error(error);
    toast.error('Failed to remove employee');
    return;
  }

  toast.success('Employee deactivated successfully!');
  fetchEmployees();
};



  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === 'active').length;
  const totalSalaryExpense = employees.reduce((sum, emp) => sum + emp.salary, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-3xl mt-1">{totalEmployees}</p>
                <p className="text-xs text-gray-500 mt-1">All departments</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="size-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Employees</p>
                <p className="text-3xl mt-1">{activeEmployees}</p>
                <p className="text-xs text-gray-500 mt-1">Currently working</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <UserCheck className="size-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payroll</p>
                <p className="text-3xl mt-1">{totalSalaryExpense }</p>
                <p className="text-xs text-gray-500 mt-1">Monthly expense</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="size-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Management Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Employee Directory</CardTitle>
              <CardDescription>Manage all employees and their information</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4 mr-2" />
                  Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                  <DialogDescription>
                    Enter the details of the new employee
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={newEmployee.name}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, name: e.target.value })
                      }
                      placeholder="Nikhil N M "
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newEmployee.email}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, email: e.target.value })
                      }
                      placeholder="nikhi@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employeeCode">Employee Code *</Label>
                    <Input
                      id="employeeCode"
                      value={newEmployee.employeeCode}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, employeeCode: e.target.value })
                      }
                      placeholder="EMP005"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={newEmployee.department}
                      onValueChange={(value) =>
                        setNewEmployee({ ...newEmployee, department: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Admin">Admin </SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Operation">Operation  </SelectItem>
                         <SelectItem value="IT"> IT</SelectItem>
                         
                      </SelectContent>
                    </Select>
                  </div>
                 
                  <div className="space-y-2">
                    <Label htmlFor="salary">Salary</Label>
                    <Input
                      id="salary"
                      type="number"
                      value={newEmployee.salary}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, salary: e.target.value })
                      }
                      placeholder="75000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Select
                    value={newEmployee.position}
                    onValueChange={(value) =>
                      setNewEmployee({ ...newEmployee, position: value })
                    }
                    disabled={!newEmployee.department}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentRoles[newEmployee.department]?.map((pos) => (
                        <SelectItem key={pos} value={pos}>
                          {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>


                  <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Select
                    value={newEmployee.companyName}
                    onValueChange={(value) =>
                      setNewEmployee({ ...newEmployee, companyName: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company} value={company}>
                          {company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joinDate">Joining Date *</Label>
                  <Input
                    id="joinDate"
                    type="date"
                    value={newEmployee.joinDate}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, joinDate: e.target.value })
                    }
                  />
                </div>


                </div>
                <Button onClick={handleAddEmployee} className="w-full">
                  Add Employee
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 size-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or employee code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="size-4 mr-2" />
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept === 'all' ? 'All Departments' : dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading && (
            <p className="text-sm text-gray-500 mb-2">Loading employees...</p>
          )}


          {/* Employee Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Employee Code</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Joining Date</TableHead>
                <TableHead >Salary</TableHead>
                <TableHead>Status</TableHead>
               <TableHead>Company</TableHead>

                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                          {employee.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p>{employee.name}</p>
                        <p className="text-sm text-gray-500">{employee.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{employee.employeeCode}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>
                      {new Date(employee.joinDate).toLocaleDateString()}
                    </TableCell>

                  <TableCell >
                   Rs.{employee.salary ? employee.salary.toLocaleString() : '0'}

                  </TableCell>
                  <TableCell>
                    <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{employee.companyName}</TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(employee)}
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEmployee(employee.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-12">
              <Users className="size-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No employees found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update employee information</DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Full Name</Label>
                <Input
                  id="editName"
                  value={selectedEmployee.name}
                  onChange={(e) =>
                    setSelectedEmployee({ ...selectedEmployee, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={selectedEmployee.email || ''}
                  onChange={(e) =>
                    setSelectedEmployee({ ...selectedEmployee, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDepartment">Department</Label>
                <Select
                  value={selectedEmployee.department}
                  onValueChange={(value) =>
                    setSelectedEmployee({ ...selectedEmployee, department: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Admin">Admin </SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value=" Sales "> Sales </SelectItem>
                        <SelectItem value="Operation  ">Operation  </SelectItem>
                         <SelectItem value="IT">IT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
             
              <div className="space-y-2">
                <Label htmlFor="editSalary">Salary</Label>
                <Input
                  id="editSalary"
                  type="number"
                  value={selectedEmployee.salary ?? ''}
                  onChange={(e) =>
                    setSelectedEmployee({ ...selectedEmployee, salary: Number(e.target.value) })
                  }
                />
              </div>
                <div className="space-y-2">
                <Label htmlFor="editCompanyName">Company Name *</Label>
                <Select
                  value={selectedEmployee.companyName}
                  onValueChange={(value) =>
                    setSelectedEmployee({ ...selectedEmployee, companyName: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editJoinDate">Joining Date</Label>
                <Input
                  id="editJoinDate"
                  type="date"
                 value={selectedEmployee.joinDate || ''}
                  onChange={(e) =>
                    setSelectedEmployee({
                      ...selectedEmployee,
                      joinDate: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={selectedEmployee.gender || ''}
                    onValueChange={(value) =>
                      setSelectedEmployee({ 
                        ...selectedEmployee, 
                        gender: value as 'male' | 'female' | 'other' 
                      })
                    }

                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedEmployee.gender === 'female' && (
                  <>
                    <div className="space-y-2">
                      <Label>Home Latitude</Label>
                      <Input
                        type="number"
                        value={selectedEmployee.homeLat || ''}
                        onChange={(e) =>
                          setSelectedEmployee({ 
                            ...selectedEmployee, 
                            homeLat: Number(e.target.value) 
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Home Longitude</Label>
                      <Input
                        type="number"
                       value={selectedEmployee.homeLng || ''}
                      onChange={(e) =>
                        setSelectedEmployee({ 
                          ...selectedEmployee, 
                          homeLng: Number(e.target.value) 
                        })
                      }

                      />
                    </div>
                  </>
                )}


              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select
                  value={selectedEmployee.status}
                  onValueChange={(value: 'active' | 'inactive') =>
                    setSelectedEmployee({ ...selectedEmployee, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <Button onClick={handleEditEmployee} className="w-full">
            Save Changes
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}


