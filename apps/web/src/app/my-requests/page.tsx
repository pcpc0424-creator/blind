'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  Building2,
  Shield,
  Sparkles,
  MessageSquare,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { MainLayout } from '@/components/layouts/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMyRequests, useCancelRequest } from '@/hooks/use-community-request';
import { useAuth } from '@/hooks/use-auth';
import { formatRelativeTime } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
type TargetType = 'COMPANY' | 'PUBLIC_SERVANT' | 'INTEREST' | 'GENERAL';

const statusConfig: Record<RequestStatus, { label: string; icon: any; className: string }> = {
  PENDING: {
    label: 'Under Review',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800',
  },
  APPROVED: {
    label: 'Approved',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800',
  },
  REJECTED: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-red-100 text-red-800',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: Ban,
    className: 'bg-gray-100 text-gray-800',
  },
};

const targetTypeIcons: Record<TargetType, any> = {
  COMPANY: Building2,
  PUBLIC_SERVANT: Shield,
  INTEREST: Sparkles,
  GENERAL: MessageSquare,
};

export default function MyRequestsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyRequests(page);
  const cancelRequest = useCancelRequest();

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="py-12 text-center">
          <h1 className="text-2xl font-bold mb-2">Login Required</h1>
          <p className="text-muted-foreground mb-4">
            Please login first to view your requests.
          </p>
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const requests = data?.data || [];
  const meta = data?.meta;

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Community Requests</h1>
            <p className="text-muted-foreground">
              Check the approval status of your community requests.
            </p>
          </div>
          <Button asChild>
            <Link href="/request-community">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Link>
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && requests.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No community requests yet</h3>
              <p className="text-muted-foreground mb-4">
                If the community you want does not exist, try requesting a new one.
              </p>
              <Button asChild>
                <Link href="/request-community">
                  <Plus className="h-4 w-4 mr-2" />
                  Request Community
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Request List */}
        {!isLoading && requests.length > 0 && (
          <div className="space-y-4">
            {requests.map((request: any) => {
              const status = statusConfig[request.status as RequestStatus];
              const StatusIcon = status.icon;
              const TypeIcon = targetTypeIcons[request.targetType as TargetType];

              return (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-muted">
                          <TypeIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{request.name}</h3>
                            <Badge className={status.className}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          {request.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {request.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime(request.createdAt)}
                            </span>
                            {request.company && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {request.company.name}
                              </span>
                            )}
                            {request.publicServantCategory && (
                              <span className="flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                {request.publicServantCategory.name}
                              </span>
                            )}
                            {request.interestCategory && (
                              <span className="flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                {request.interestCategory.name}
                              </span>
                            )}
                          </div>

                          {/* Admin Note */}
                          {request.adminNote && (
                            <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                              <p className="text-muted-foreground">
                                <AlertCircle className="h-3 w-3 inline mr-1" />
                                Admin Note: {request.adminNote}
                              </p>
                            </div>
                          )}

                          {/* Created Community Link */}
                          {request.createdCommunity && (
                            <div className="mt-3">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/community/${request.createdCommunity.slug}`}>
                                  Visit Community
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Link>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {request.status === 'PENDING' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-muted-foreground">
                              Cancel
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cancelled requests cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>No</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => cancelRequest.mutate(request.id)}
                                disabled={cancelRequest.isPending}
                              >
                                {cancelRequest.isPending ? 'Cancelling...' : 'Yes, cancel'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm text-muted-foreground">
                  {page} / {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === meta.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
