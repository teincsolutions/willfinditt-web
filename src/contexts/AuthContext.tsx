'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMe, useLogin, useRegister, useLogout } from '@/hooks/useAuth';
import { User, LoginData, RegisterData } from '@/types/user';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Use React Query as the single source of truth
  const { data: userData, isLoading, refetch } = useMe();

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  // Ensure we have a valid user object
  const user = useMemo(() => {
    if (userData && (userData.id || userData.email || userData.username)) {
      return userData as User;
    }
    return null;
  }, [userData]);

  const login = async (data: LoginData) => {
    try {
      await loginMutation.mutateAsync(data);
      await refetch();

      // Support redirecting back to original page
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const redirectUrl = params.get('redirect') || '/';
        router.push(redirectUrl);
      } else {
        router.push('/');
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      await registerMutation.mutateAsync(data);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
      router.push('/');
    } catch (error) {
      console.error('Logout failed', error);
      router.push('/');
    }
  };

  const refreshUser = async () => {
    await refetch();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
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
