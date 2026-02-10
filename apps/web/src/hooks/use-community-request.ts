'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface CommunityRequest {
  id: string;
  name: string;
  description: string | null;
  targetType: 'COMPANY' | 'PUBLIC_SERVANT' | 'INTEREST' | 'GENERAL';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  adminNote: string | null;
  createdAt: string;
  company?: { id: string; name: string; slug: string } | null;
  publicServantCategory?: { id: string; name: string; slug: string } | null;
  interestCategory?: { id: string; name: string; slug: string } | null;
  createdCommunity?: { id: string; name: string; slug: string } | null;
}

interface CreateRequestInput {
  name: string;
  description?: string;
  targetType: 'COMPANY' | 'PUBLIC_SERVANT' | 'INTEREST' | 'GENERAL';
  companyId?: string;
  publicServantCategoryId?: string;
  interestCategoryId?: string;
}

export function useMyRequests(page: number = 1) {
  return useQuery({
    queryKey: ['myRequests', page],
    queryFn: async () => {
      const response = await api.get<CommunityRequest[]>(
        `/community-requests/my?page=${page}&limit=10`
      );
      return response;
    },
  });
}

export function useCreateRequest() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRequestInput) => {
      const response = await api.post<CommunityRequest>('/community-requests', input);
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRequests'] });
      toast({
        title: 'Request Submitted',
        description: 'Your community request has been submitted. It will be created after admin approval.',
      });
    },
    onError: (error: ApiError) => {
      toast({
        variant: 'destructive',
        title: 'Request Failed',
        description: error.message,
      });
    },
  });
}

export function useCancelRequest() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await api.delete<CommunityRequest>(`/community-requests/${requestId}`);
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRequests'] });
      toast({
        title: 'Cancelled',
        description: 'Request has been cancelled.',
      });
    },
    onError: (error: ApiError) => {
      toast({
        variant: 'destructive',
        title: 'Cancel Failed',
        description: error.message,
      });
    },
  });
}

// Admin hooks
export function useAdminRequests(
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED',
  page: number = 1
) {
  return useQuery({
    queryKey: ['adminRequests', status, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      params.append('page', page.toString());
      params.append('limit', '20');

      const response = await api.get<CommunityRequest[]>(
        `/community-requests/admin?${params.toString()}`
      );
      return response;
    },
  });
}

export function useReviewRequest() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      status,
      adminNote,
    }: {
      requestId: string;
      status: 'APPROVED' | 'REJECTED';
      adminNote?: string;
    }) => {
      const response = await api.post<CommunityRequest>(
        `/community-requests/${requestId}/review`,
        { status, adminNote }
      );
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminRequests'] });
      toast({
        title: data.status === 'APPROVED' ? 'Approved' : 'Rejected',
        description:
          data.status === 'APPROVED'
            ? `${data.name} community has been created.`
            : 'Request has been rejected.',
      });
    },
    onError: (error: ApiError) => {
      toast({
        variant: 'destructive',
        title: 'Processing Failed',
        description: error.message,
      });
    },
  });
}
