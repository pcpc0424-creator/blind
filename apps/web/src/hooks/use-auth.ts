'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';
import {
  CurrentUser,
  RegisterEmailInput,
  VerifyEmailInput,
  CompleteRegistrationInput,
  RegisterGeneralInput,
  LoginInput,
  RegisterGeneralEmailInput,
  VerifyGeneralEmailInput,
  CompleteGeneralRegistrationInput,
} from '@blind/shared';

export function useCurrentUser() {
  const { setUser, setLoading } = useAuthStore();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const response = await api.get<CurrentUser>('/auth/me');
        setUser(response.data!);
        return response.data!;
      } catch (error) {
        setUser(null);
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRegisterEmail() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: RegisterEmailInput) => {
      const response = await api.post<{
        message: string;
        company: { id: string; name: string; slug: string };
        expiresAt: string;
      }>('/auth/register', input);
      return response.data!;
    },
    onSuccess: (data) => {
      toast({
        title: 'Verification Code Sent',
        description: `A verification code has been sent to your email for ${data.company.name} employee verification.`,
      });
    },
    onError: (error: ApiError) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    },
  });
}

export function useVerifyEmail() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: VerifyEmailInput) => {
      const response = await api.post<{
        tempToken: string;
        expiresAt: string;
        company: { id: string; name: string; slug: string };
      }>('/auth/verify-email', input);
      return response.data!;
    },
    onSuccess: () => {
      toast({
        title: 'Email Verified',
        description: 'Please set your password to complete registration.',
      });
    },
    onError: (error: ApiError) => {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: error.message,
      });
    },
  });
}

export function useCompleteRegistration() {
  const { setUser } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompleteRegistrationInput) => {
      const response = await api.post<{
        user: CurrentUser;
        tokens: { accessToken: string; expiresAt: string };
      }>('/auth/complete', input);
      return response.data!;
    },
    onSuccess: (data) => {
      setUser(data.user as CurrentUser);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast({
        title: 'Registration Complete',
        description: `Welcome, ${data.user.nickname}!`,
      });
    },
    onError: (error: ApiError) => {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.message,
      });
    },
  });
}

export function useRegisterGeneral() {
  const { setUser } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RegisterGeneralInput) => {
      const response = await api.post<{
        user: CurrentUser;
        tokens: { accessToken: string; expiresAt: string };
      }>('/auth/register-general', input);
      return response.data!;
    },
    onSuccess: (data) => {
      setUser(data.user as CurrentUser);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast({
        title: 'Registration Complete',
        description: `Welcome, ${data.user.nickname}!`,
      });
    },
    onError: (error: ApiError) => {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.message,
      });
    },
  });
}

export function useLogin() {
  const { setUser } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const response = await api.post<{
        user: CurrentUser;
        tokens: { accessToken: string; expiresAt: string };
      }>('/auth/login', input);
      return response.data!;
    },
    onSuccess: (data) => {
      setUser(data.user as CurrentUser);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${data.user.nickname}!`,
      });
    },
    onError: (error: ApiError) => {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message,
      });
    },
  });
}

export function useRegisterGeneralEmail() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: RegisterGeneralEmailInput) => {
      const response = await api.post<{
        message: string;
        expiresAt: string;
      }>('/auth/register-general-email', input);
      return response.data!;
    },
    onSuccess: () => {
      toast({
        title: 'Verification Code Sent',
        description: 'A verification code has been sent to your email.',
      });
    },
    onError: (error: ApiError) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    },
  });
}

export function useVerifyGeneralEmail() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: VerifyGeneralEmailInput) => {
      const response = await api.post<{
        tempToken: string;
        expiresAt: string;
      }>('/auth/verify-general-email', input);
      return response.data!;
    },
    onSuccess: () => {
      toast({
        title: 'Email Verified',
        description: 'Please set your username and password to complete registration.',
      });
    },
    onError: (error: ApiError) => {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: error.message,
      });
    },
  });
}

export function useCompleteGeneralRegistration() {
  const { setUser } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompleteGeneralRegistrationInput) => {
      const response = await api.post<{
        user: CurrentUser;
        tokens: { accessToken: string; expiresAt: string };
      }>('/auth/complete-general', input);
      return response.data!;
    },
    onSuccess: (data) => {
      setUser(data.user as CurrentUser);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast({
        title: 'Registration Complete',
        description: `Welcome, ${data.user.nickname}!`,
      });
    },
    onError: (error: ApiError) => {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.message,
      });
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSuccess: () => {
      logout();
      queryClient.clear();
      toast({
        title: 'Logged Out',
        description: 'You have been logged out.',
      });
    },
  });
}

export function useAuth() {
  const { user, isLoading: storeLoading, isAuthenticated } = useAuthStore();
  const { isLoading: queryLoading } = useCurrentUser();

  return {
    user,
    isLoading: storeLoading || queryLoading,
    isAuthenticated,
  };
}
