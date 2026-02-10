'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Flag,
  MoreVertical,
  FileText,
  MessageSquare,
  Check,
  X,
  Eye,
  EyeOff,
  Trash2,
  Calendar,
  User,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

const reasonLabels: Record<string, { label: string; color: string }> = {
  SPAM: { label: 'Spam/Ads', color: 'bg-yellow-100 text-yellow-700' },
  HARASSMENT: { label: 'Harassment', color: 'bg-red-100 text-red-700' },
  HATE_SPEECH: { label: 'Hate Speech', color: 'bg-orange-100 text-orange-700' },
  MISINFORMATION: { label: 'Misinformation', color: 'bg-blue-100 text-blue-700' },
  PRIVACY_VIOLATION: { label: 'Privacy Violation', color: 'bg-purple-100 text-purple-700' },
  INAPPROPRIATE_CONTENT: { label: 'Inappropriate', color: 'bg-pink-100 text-pink-700' },
  OTHER: { label: 'Other', color: 'bg-gray-100 text-gray-700' },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  REVIEWING: { label: 'Reviewing', color: 'bg-blue-100 text-blue-700' },
  RESOLVED: { label: 'Resolved', color: 'bg-green-100 text-green-700' },
  DISMISSED: { label: 'Dismissed', color: 'bg-gray-100 text-gray-700' },
};

interface Report {
  id: string;
  reason: string;
  description?: string;
  status: string;
  createdAt: string;
  resolution?: string;
  reporter: {
    id: string;
    nickname: string;
  };
  reportedUser?: {
    id: string;
    nickname: string;
  };
  post?: {
    id: string;
    title: string;
    content: string;
    author: {
      id: string;
      nickname: string;
    };
  };
  comment?: {
    id: string;
    content: string;
    author: {
      id: string;
      nickname: string;
    };
  };
  resolver?: {
    id: string;
    nickname: string;
  };
}

export default function AdminReportsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolveAction, setResolveAction] = useState<'RESOLVED' | 'DISMISSED'>('RESOLVED');
  const [resolution, setResolution] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Fetch reports
  const { data: reportsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-reports', statusFilter, page],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit: 20 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await api.get<Report[]>('/reports', params);
      return response;
    },
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['admin-reports-stats'],
    queryFn: async () => {
      const response = await api.get<any>('/reports/stats');
      return response.data;
    },
  });

  // Resolve mutation
  const resolveMutation = useMutation({
    mutationFn: async ({ id, status, resolution }: { id: string; status: string; resolution?: string }) => {
      return api.patch(`/reports/${id}/resolve`, { status, resolution });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports-stats'] });
      setResolveDialogOpen(false);
      setSelectedReport(null);
      setResolution('');
    },
  });

  // Hide content mutation
  const hideMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.post(`/reports/${id}/hide`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports-stats'] });
    },
  });

  // Delete content mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.post(`/reports/${id}/delete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports-stats'] });
    },
  });

  const handleResolve = (report: Report, action: 'RESOLVED' | 'DISMISSED') => {
    setSelectedReport(report);
    setResolveAction(action);
    setResolveDialogOpen(true);
  };

  const handleSubmitResolve = () => {
    if (!selectedReport) return;
    resolveMutation.mutate({
      id: selectedReport.id,
      status: resolveAction,
      resolution: resolution.trim() || undefined,
    });
  };

  const handleView = (report: Report) => {
    setSelectedReport(report);
    setViewDialogOpen(true);
  };

  const reports = reportsData?.data || [];
  const meta = reportsData?.meta;
  const pendingCount = statsData?.pending || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Review reported posts and comments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Badge className="bg-orange-100 text-orange-700 text-sm px-3 py-1">
              <AlertTriangle className="h-4 w-4 mr-1" />
              {pendingCount} Pending
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      {statsData && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-xl md:text-2xl font-bold text-yellow-600">{statsData.pending}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xl md:text-2xl font-bold text-blue-600">{statsData.reviewing}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Reviewing</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xl md:text-2xl font-bold text-green-600">{statsData.resolved}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Resolved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xl md:text-2xl font-bold text-gray-600">{statsData.dismissed}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Dismissed</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REVIEWING">Reviewing</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="DISMISSED">Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table - Desktop */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reported</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No reports found.
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report: Report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        {report.post ? (
                          <Badge variant="outline">
                            <FileText className="h-3 w-3 mr-1" />
                            Post
                          </Badge>
                        ) : report.comment ? (
                          <Badge variant="outline">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Comment
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <User className="h-3 w-3 mr-1" />
                            User
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <div className="font-medium line-clamp-1">
                            {report.post?.title || report.comment?.content?.substring(0, 50) || 'User Report'}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {report.post?.author?.nickname || report.comment?.author?.nickname || report.reportedUser?.nickname || '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={reasonLabels[report.reason]?.color || 'bg-gray-100 text-gray-700'}>
                          {reasonLabels[report.reason]?.label || report.reason}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{report.reporter.nickname}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusLabels[report.status]?.color || 'bg-gray-100 text-gray-700'}>
                          {statusLabels[report.status]?.label || report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {new Date(report.createdAt).toLocaleDateString('en-US')}
                        </span>
                      </TableCell>
                      <TableCell>
                        {report.status === 'PENDING' || report.status === 'REVIEWING' ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleResolve(report, 'RESOLVED')}
                              title="Resolve"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleResolve(report, 'DISMISSED')}
                              title="Dismiss"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(report)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {(report.post || report.comment) && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => hideMutation.mutate(report.id)}
                                      disabled={hideMutation.isPending}
                                    >
                                      <EyeOff className="h-4 w-4 mr-2" />
                                      Hide
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => deleteMutation.mutate(report.id)}
                                      disabled={deleteMutation.isPending}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleView(report)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <span className="text-xs text-muted-foreground">Processed</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reports Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No reports found.
          </div>
        ) : (
          reports.map((report: Report) => (
            <Card key={report.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {report.post ? (
                        <Badge variant="outline" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          Post
                        </Badge>
                      ) : report.comment ? (
                        <Badge variant="outline" className="text-xs">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Comment
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <User className="h-3 w-3 mr-1" />
                          User
                        </Badge>
                      )}
                      <Badge className={statusLabels[report.status]?.color || 'bg-gray-100 text-gray-700'}>
                        {statusLabels[report.status]?.label || report.status}
                      </Badge>
                    </div>
                    <div className="font-medium line-clamp-2 text-sm">
                      {report.post?.title || report.comment?.content?.substring(0, 80) || 'User Report'}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      <Badge className={`text-xs ${reasonLabels[report.reason]?.color || 'bg-gray-100 text-gray-700'}`}>
                        {reasonLabels[report.reason]?.label || report.reason}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {report.reporter.nickname}
                      </span>
                      <span>
                        {new Date(report.createdAt).toLocaleDateString('en-US')}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {report.status === 'PENDING' || report.status === 'REVIEWING' ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleResolve(report, 'RESOLVED')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleResolve(report, 'DISMISSED')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleView(report)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleView(report)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!meta.hasPrev}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            {meta.page} / {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!meta.hasNext}
          >
            Next
          </Button>
        </div>
      )}

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {resolveAction === 'RESOLVED' ? 'Resolve Report' : 'Dismiss Report'}
            </DialogTitle>
            <DialogDescription>
              {resolveAction === 'RESOLVED'
                ? 'Are you sure you want to resolve this report? Please leave a note about the action taken.'
                : 'Are you sure you want to dismiss this report? Please leave a note about the reason.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Resolution Note (Optional)</Label>
              <Textarea
                placeholder="Enter resolution details..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={resolveAction === 'RESOLVED' ? 'default' : 'destructive'}
              onClick={handleSubmitResolve}
              disabled={resolveMutation.isPending}
            >
              {resolveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {resolveAction === 'RESOLVED' ? 'Resolve' : 'Dismiss'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Reporter</Label>
                  <p className="font-medium">{selectedReport.reporter.nickname}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reason</Label>
                  <Badge className={reasonLabels[selectedReport.reason]?.color || 'bg-gray-100'}>
                    {reasonLabels[selectedReport.reason]?.label || selectedReport.reason}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={statusLabels[selectedReport.status]?.color || 'bg-gray-100'}>
                    {statusLabels[selectedReport.status]?.label || selectedReport.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reported Date</Label>
                  <p>{new Date(selectedReport.createdAt).toLocaleString('en-US')}</p>
                </div>
              </div>

              {selectedReport.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1 p-3 bg-muted rounded-md text-sm">{selectedReport.description}</p>
                </div>
              )}

              {selectedReport.post && (
                <div>
                  <Label className="text-muted-foreground">Reported Post</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <p className="font-medium">{selectedReport.post.title}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                      {selectedReport.post.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Author: {selectedReport.post.author.nickname}
                    </p>
                  </div>
                </div>
              )}

              {selectedReport.comment && (
                <div>
                  <Label className="text-muted-foreground">Reported Comment</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <p className="text-sm">{selectedReport.comment.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Author: {selectedReport.comment.author.nickname}
                    </p>
                  </div>
                </div>
              )}

              {selectedReport.resolution && (
                <div>
                  <Label className="text-muted-foreground">Resolution Note</Label>
                  <p className="mt-1 p-3 bg-green-50 rounded-md text-sm">{selectedReport.resolution}</p>
                  {selectedReport.resolver && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Resolved by: {selectedReport.resolver.nickname}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
