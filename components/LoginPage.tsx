import { useState,useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Building2, Lock, User } from 'lucide-react';
import { toast } from 'sonner';
import Image from "next/image";
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';

interface LoginPageProps {
  onLogin: (employeeCode: string, password: string, role: 'admin' | 'manager' | 'employee') => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [loginCode, setLoginCode] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerCode, setRegisterCode] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotCode, setForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [forgotStep, setForgotStep] = useState<'idle' | 'code' | 'reset'>('idle');



  useEffect(() => {
    const auth = localStorage.getItem('auth');
    if (auth) {
      const parsed = JSON.parse(auth);
      if (parsed.loggedIn) {
        onLogin(parsed.employee_code, '', parsed.role);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  const { data: employee, error } = await supabase
    .from('employees')
    .select('*')
    .eq('employee_code', loginCode)
    .single();

  if (error || !employee) {
    toast.error('Invalid employee code');
    return;
  }

  if (!employee.is_registered || !employee.password) {
    toast.error('Account not registered yet');
    return;
  }

  const isValid = await bcrypt.compare(loginPassword, employee.password);

  if (!isValid) {
    toast.error('Incorrect password');
    return;
  }
  if (rememberMe) {
  localStorage.setItem(
    'auth',
    JSON.stringify({
      employee_code: employee.employee_code,
      role: employee.role,
      loggedIn: true,
    })
  );
}
  toast.success('Login successful');
  onLogin(employee.employee_code, loginPassword, employee.role);
};

const handleForgotPassword = async () => {
  if (!forgotCode) {
    toast.error('Enter employee code');
    return;
  }

  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  const { error } = await supabase
    .from('employees')
    .update({
      reset_token: token,
      reset_expires: expires.toISOString(),
    })
    .eq('employee_code', forgotCode);

  if (error) {
    toast.error('Employee not found');
    return;
  }

  setResetToken(token);             
  setForgotStep('reset');            
  toast.success('Reset token generated');
};



const handleResetPassword = async () => {
  if (!newPassword) {
    toast.error('Enter new password');
    return;
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  const { error } = await supabase
    .from('employees')
    .update({
      password: hashed,
      reset_token: null,
      reset_expires: null,
    })
    .eq('reset_token', resetToken);

  if (error) {
    toast.error('Reset failed');
    return;
  }

  toast.success('Password updated successfully');

 
  setForgotStep('idle');
  setForgotCode('');
  setNewPassword('');
  setResetToken('');
};



useEffect(() => {
  try {
    const auth = localStorage.getItem('auth');
    if (!auth) return;

    const parsed = JSON.parse(auth);
    if (parsed.loggedIn === true) {
      onLogin(parsed.employee_code, '', parsed.role);
    }
  } catch {
    localStorage.removeItem('auth');
  }
}, []);

const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();

  //  Fetch employee by code
  const { data: employee, error } = await supabase
    .from('employees')
    .select('id, role, status, is_registered')
    .eq('employee_code', registerCode)
    .single();

  //  Employee not found
  if (error || !employee) {
    toast.error('Employee not registered');
    return;
  }

  //  Already registered
  if (employee.is_registered) {
    toast.error('Employee already registered');
    return;
  }

  //  Not approved (only admin can bypass)
  if (employee.role !== 'admin') {
    if (employee.status !== 'active') {
      toast.error('Employee code not approved by admin');
      return;
    }
  }

  //  Generate password
  const generatedPassword = Math.random()
    .toString(36)
    .slice(-8)
    .toUpperCase();

  const hashedPassword = await bcrypt.hash(generatedPassword, 10);

  //  Update same employee row
  const { error: updateError } = await supabase
    .from('employees')
    .update({
      password: hashedPassword,
      is_registered: true,
      updated_at: new Date().toISOString(),
    })
    .eq('employee_code', registerCode);

  if (updateError) {
    toast.error('Registration failed');
    return;
  }

  setGeneratedPassword(generatedPassword);
  toast.success('Registration successful! Save your password.');
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#b224ef] to-[#7579ff] p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center ">
            <div className="   rounded-2xl">
               <Image
                            src="/legacylogo.png"
                            alt="Legacy Innovations"
                            width={160}
                            height={90}
                            className="sm:w-[200px]"
                            priority
                          />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginCode">Employee Code</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 size-4 text-gray-400" />
                    <Input
                      id="loginCode"
                      placeholder="Enter your employee code"
                      value={loginCode}
                      onChange={(e) => setLoginCode(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loginPassword">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 size-4 text-gray-400" />
                    <Input
                      id="loginPassword"
                      type="password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-sm"
                 onClick={() => setForgotStep('code')}
                >
                  Forgot password?
                </Button>

                {showForgot && (
                  <div className="space-y-4 mt-4">
                    <Label>Employee Code</Label>
                    <Input
                      value={forgotCode}
                      onChange={(e) => setForgotCode(e.target.value)}
                      placeholder="Enter employee code"
                    />

                    <Button
                      type="button"
                      className="w-full"
                      onClick={handleForgotPassword}
                    >
                      Generate Reset
                    </Button>
                  </div>
                )}

              {forgotStep === 'code' && (
                  <div className="space-y-4 mt-4">
                    <Label>Employee Code</Label>
                    <Input
                      value={forgotCode}
                      onChange={(e) => setForgotCode(e.target.value)}
                      placeholder="Enter employee code"
                    />

                    <Button type="button" className="w-full" onClick={handleForgotPassword}>
                      Generate Reset
                    </Button>
                  </div>
                )}

                {forgotStep === 'reset' && (
                  <div className="space-y-4 mt-4">
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />

                    <Button type="button" className="w-full" onClick={handleResetPassword}>
                      Reset Password
                    </Button>
                  </div>
                )}



                <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="rememberMe" className="text-sm">
                      Remember Me
                    </Label>
                  </div>

                <Button type="submit" className="w-full">
                  Sign In
                </Button>
                
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="registerName">Full Name</Label>
                  <Input
                    id="registerName"
                    placeholder="Enter your full name"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registerCode">Employee Code</Label>
                  <Input
                    id="registerCode"
                    placeholder="Enter your employee code"
                    value={registerCode}
                    onChange={(e) => setRegisterCode(e.target.value)}
                  />
                </div>
                {generatedPassword && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm">Your generated password:</p>
                    <p className="text-lg font-mono select-all">{generatedPassword}</p>
                    <p className="text-xs text-gray-600 mt-2">
                      Please save this password securely!
                    </p>
                  </div>
                )}
                <Button type="submit" className="w-full">
                  Register
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
        </CardContent>
        <div className="mt-3 flex flex-row items-center gap-2 text-sm text-gray-500 justify-center">
          <span>Developed By</span>
          <Image
            src="/simpleHunt.png"
            alt="Simple Hunt Logo"
            width={120}
            height={40}
          />
        </div>

      </Card>
    </div>
  );
}
