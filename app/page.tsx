'use client';

import { useState } from 'react';
import { LoginPage } from '@/components/LoginPage';
import { Dashboard } from '@/components/Dashboard';
import { Toaster } from '@/components/ui/sonner';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    employeeCode: string;
    role: 'admin' | 'manager' | 'employee';
  } | null>(null);

  const handleLogin = (
    employeeCode: string,
    password: string,
    role: 'admin' | 'manager' | 'employee'
  ) => {
    setCurrentUser({ employeeCode, role });
    setIsLoggedIn(true);
  };

  
  const handleLogout = () => {
    localStorage.removeItem('auth');
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  return (
    <>
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        currentUser && (
          <Dashboard
            employeeCode={currentUser.employeeCode}
            role={currentUser.role}
            onLogout={handleLogout}
          />
        )
      )}
      <Toaster />
    </>
  );
}
