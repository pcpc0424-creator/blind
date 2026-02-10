'use client';

import { useState } from 'react';
import {
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  Building2,
  Shield,
  Sparkles,
  MessageSquare,
  Check,
  X,
  User,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAdminRequests, useReviewRequest } from '@/hooks/use-community-request';
import { formatRelativeTime } from '@/lib/utils';

type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
type TargetType = 'COMPANY' | 'PUBLIC_SERVANT' | 'INTEREST' | 'GENERAL';

const statusConfig: Record<RequestStatus, { label: string; icon: any; className: string }> = {
  PENDING: { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: 'Approved', icon: CheckCircle, className: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Rejected', icon: XCircle, className: 'bg-red-100 text-red-800' },
  CANCELLED: { label: 'Cancelled', icon: Ban, className: 'bg-gray-100 text-gray-800' },
};

const targetTypeConfig: Record<TargetType, { label: string; icon: any }> = {
  COMPANY: { label: 'Company', icon: Building2 },
  PUBLIC_SERVANT: { label: 'Public Servant', icon: Shield },
  INTEREST: { label: 'Interest', icon: Sparkles },
  GENERAL: { label: 'General', icon: MessageSquare },
};

export default function AdminCommunityRequestsPage() {
  const [activeTab, setActiveTab] = useState<RequestStatus | 'ALL'>('PENDING');
  const [page, setPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNote, setAdminNote] = useState('');
  const [dialogType, setDialogType] = useState<'approve' | 'reject' | null>(null);

  const statusFilter = activeTab === 'ALL' ? undefined : activeTab;
  const { data, isLoading } = useAdminRequests(statusFilter as any, page);
  const reviewRequest = useReviewRequest();

  const handleReview = async () => {
    if (!selectedRequest || !dialogType) return;

    await reviewRequest.mutateAsync({
      requestId: selectedRequest.id,
      status: dialogType === 'approve' ? 'APPROVED' : 'REJECTED',
      adminNote: adminNote || undefined,
    });

    setSelectedRequest(null);
    setDialogType(null);
    setAdminNote('');
  };

  const requests = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Community Requests</h1>
        <p className="text-muted-foreground">
          Review and approve/reject community requests from users.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="PENDING">
            <Clock className="h-4 w-4 mr-1" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="APPROVED">
            <CheckCircle className="h-4 w-4 mr-1" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="REJECTED">
            <XCircle className="h-4 w-4 mr-1" />
            Rejected
          </TabsTrigger>
          <TabsTrigger value="ALL">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {/* Loading */}
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
                <h3 className="text-lg font-semibold mb-2">No requests</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'PENDING' ? 'No requests to review.' : 'No requests with this status.'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Request List */}
          {!isLoading && requests.length > 0 && (
            <div className="space-y-4">
              {requests.map((request: any) => {
                const status = statusConfig[request.status as RequestStatus];
                const StatusIcon = status.icon;
                const typeConfig = targetTypeConfig[request.targetType as TargetType];
                const TypeIcon = typeConfig.icon;

                return (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 rounded-lg bg-muted">
                            <TypeIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold">{request.name}</h3>
                              <Badge className={status.className}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status.label}
                              </Badge>
                              <Badge variant="outline">{typeConfig.label}</Badge>
                            </div>

                            {request.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {request.description}
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {request.user?.nickname || 'Unknown'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatRelativeTime(request.createdAt)}
                              </span>
                            </div>

                            {request.adminNote && (
                              <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                                <p className="text-muted-foreground">Admin: {request.adminNote}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        {request.status === 'PENDING' && (
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => {
                                setSelectedRequest(request);
                                setDialogType('approve');
                              }}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setSelectedRequest(request);
                                setDialogType('reject');
                              }}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm text-muted-foreground">
                    {page} / {meta.totalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={page === meta.totalPages} onClick={() => setPage(page + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog
        open={!!dialogType}
        onOpenChange={(open) => {
          if (!open) {
            setDialogType(null);
            setSelectedRequest(null);
            setAdminNote('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'approve' ? 'Approve Community' : 'Reject Community'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'approve'
                ? `Create the "${selectedRequest?.name}" community.`
                : `Reject the "${selectedRequest?.name}" request.`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium">Admin Note (Optional)</label>
            <Textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder={
                dialogType === 'approve'
                  ? 'Enter approval reason or instructions.'
                  : 'Enter rejection reason.'
              }
              className="mt-2"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogType(null);
                setSelectedRequest(null);
                setAdminNote('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={reviewRequest.isPending}
              className={dialogType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {reviewRequest.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : dialogType === 'approve' ? (
                'Approve'
              ) : (
                'Reject'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
