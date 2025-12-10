'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMe, useLogin, useRegister, useLogout } from '@/hooks/useAuth';
import { User, LoginData, RegisterData } from '@/types/user';
import { isAuthenticated } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const meQuery = useMe();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  const login = async (data: LoginData) => {
    try {
      await loginMutation.mutateAsync(data);
      // Refetch user data after successful login
      const userData = await meQuery.refetch();
      setUser(userData.data || null);
      router.push('/');
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      await registerMutation.mutateAsync(data);
      // Refetch user data after successful registration
      const userData = await meQuery.refetch();
      setUser(userData.data || null);
      router.push('/');
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setUser(null);
      router.push('/');
    } catch (error) {
      // Even if logout fails on server, clear local state
      setUser(null);
      router.push('/');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
