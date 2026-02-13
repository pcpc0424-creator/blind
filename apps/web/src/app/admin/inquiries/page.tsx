'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  HelpCircle,
  MoreVertical,
  Eye,
  MessageSquare,
  Send,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  AlertTriangle,
  User,
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

const categoryLabels: Record<string, { label: string; color: string }> = {
  BUG_REPORT: { label: 'Bug Report', color: 'bg-red-100 text-red-700' },
  FEATURE_REQUEST: { label: 'Feature Request', color: 'bg-purple-100 text-purple-700' },
  ACCOUNT_ISSUE: { label: 'Account Issue', color: 'bg-orange-100 text-orange-700' },
  REPORT_ISSUE: { label: 'Report Issue', color: 'bg-yellow-100 text-yellow-700' },
  GENERAL: { label: 'General', color: 'bg-blue-100 text-blue-700' },
  OTHER: { label: 'Other', color: 'bg-gray-100 text-gray-700' },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  ANSWERED: { label: 'Answered', color: 'bg-green-100 text-green-700' },
  CLOSED: { label: 'Closed', color: 'bg-gray-100 text-gray-700' },
};

interface Inquiry {
  id: string;
  category: string;
  subject: string;
  content: string;
  status: string;
  adminReply?: string;
  createdAt: string;
  repliedAt?: string;
  user: {
    id: string;
    nickname: string;
  };
  admin?: {
    id: string;
    nickname: string;
  };
}

export default function AdminInquiriesPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Fetch inquiries
  const { data: inquiriesData, isLoading, refetch } = useQuery({
    queryKey: ['admin-inquiries', statusFilter, categoryFilter, page],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit: 20 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      const response = await api.get<Inquiry[]>('/inquiries', params);
      return response;
    },
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['admin-inquiries-stats'],
    queryFn: async () => {
      const response = await api.get<any>('/inquiries/stats');
      return response.data;
    },
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ id, adminReply }: { id: string; adminReply: string }) => {
      return api.post(`/inquiries/${id}/reply`, { adminReply });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inquiries-stats'] });
      setReplyDialogOpen(false);
      setSelectedInquiry(null);
      setReplyText('');
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return api.patch(`/inquiries/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inquiries-stats'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/inquiries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inquiries-stats'] });
    },
  });

  const handleReply = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setReplyText(inquiry.adminReply || '');
    setReplyDialogOpen(true);
  };

  const handleSubmitReply = () => {
    if (!selectedInquiry || !replyText.trim()) return;
    replyMutation.mutate({
      id: selectedInquiry.id,
      adminReply: replyText.trim(),
    });
  };

  const handleView = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setViewDialogOpen(true);
  };

  const inquiries = inquiriesData?.data || [];
  const meta = inquiriesData?.meta;
  const pendingCount = statsData?.pending || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Inquiries</h1>
          <p className="text-sm text-muted-foreground">
            Manage user inquiries and respond to questions.
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
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-xl md:text-2xl font-bold text-yellow-600">{statsData.pending}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xl md:text-2xl font-bold text-blue-600">{statsData.inProgress}</div>
              <div className="text-xs md:text-sm text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xl md:text-2xl font-bold text-green-600">{statsData.answered}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Answered</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xl md:text-2xl font-bold text-gray-600">{statsData.closed}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Closed</div>
            </CardContent>
          </Card>
          <Card className="col-span-2 md:col-span-1">
            <CardContent className="pt-4">
              <div className="text-xl md:text-2xl font-bold">{statsData.total}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4">
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="ANSWERED">Answered</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(value) => { setCategoryFilter(value); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(categoryLabels).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inquiries Table - Desktop */}
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
                  <TableHead>Category</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No inquiries found.
                    </TableCell>
                  </TableRow>
                ) : (
                  inquiries.map((inquiry: Inquiry) => (
                    <TableRow key={inquiry.id}>
                      <TableCell>
                        <Badge className={categoryLabels[inquiry.category]?.color || 'bg-gray-100 text-gray-700'}>
                          {categoryLabels[inquiry.category]?.label || inquiry.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[250px]">
                          <div className="font-medium line-clamp-1">{inquiry.subject}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{inquiry.content}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{inquiry.user.nickname}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusLabels[inquiry.status]?.color || 'bg-gray-100 text-gray-700'}>
                          {statusLabels[inquiry.status]?.label || inquiry.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {new Date(inquiry.createdAt).toLocaleDateString('en-US')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleView(inquiry)}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {inquiry.status !== 'CLOSED' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleReply(inquiry)}
                              title="Reply"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(inquiry)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {inquiry.status !== 'CLOSED' && (
                                <DropdownMenuItem onClick={() => handleReply(inquiry)}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Reply
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {inquiry.status !== 'IN_PROGRESS' && inquiry.status !== 'CLOSED' && (
                                <DropdownMenuItem
                                  onClick={() => updateStatusMutation.mutate({ id: inquiry.id, status: 'IN_PROGRESS' })}
                                >
                                  <Clock className="h-4 w-4 mr-2" />
                                  Mark In Progress
                                </DropdownMenuItem>
                              )}
                              {inquiry.status !== 'CLOSED' && (
                                <DropdownMenuItem
                                  onClick={() => updateStatusMutation.mutate({ id: inquiry.id, status: 'CLOSED' })}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Close
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => deleteMutation.mutate(inquiry.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Inquiries Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No inquiries found.
          </div>
        ) : (
          inquiries.map((inquiry: Inquiry) => (
            <Card key={inquiry.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge className={`text-xs ${categoryLabels[inquiry.category]?.color || 'bg-gray-100 text-gray-700'}`}>
                        {categoryLabels[inquiry.category]?.label || inquiry.category}
                      </Badge>
                      <Badge className={statusLabels[inquiry.status]?.color || 'bg-gray-100 text-gray-700'}>
                        {statusLabels[inquiry.status]?.label || inquiry.status}
                      </Badge>
                    </div>
                    <div className="font-medium line-clamp-1 text-sm">{inquiry.subject}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{inquiry.content}</div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {inquiry.user.nickname}
                      </span>
                      <span>{new Date(inquiry.createdAt).toLocaleDateString('en-US')}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleView(inquiry)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {inquiry.status !== 'CLOSED' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600"
                        onClick={() => handleReply(inquiry)}
                      >
                        <Send className="h-4 w-4" />
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

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply to Inquiry</DialogTitle>
            <DialogDescription>
              Send a response to the user's inquiry.
            </DialogDescription>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={categoryLabels[selectedInquiry.category]?.color || 'bg-gray-100'}>
                    {categoryLabels[selectedInquiry.category]?.label || selectedInquiry.category}
                  </Badge>
                  <span className="text-sm text-muted-foreground">from {selectedInquiry.user.nickname}</span>
                </div>
                <p className="font-medium">{selectedInquiry.subject}</p>
                <p className="text-sm mt-2 whitespace-pre-wrap">{selectedInquiry.content}</p>
              </div>
              <div className="space-y-2">
                <Label>Your Reply</Label>
                <Textarea
                  placeholder="Enter your response..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={6}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReply}
              disabled={!replyText.trim() || replyMutation.isPending}
            >
              {replyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="h-4 w-4 mr-2" />
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">User</Label>
                  <p className="font-medium">{selectedInquiry.user.nickname}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <Badge className={categoryLabels[selectedInquiry.category]?.color || 'bg-gray-100'}>
                    {categoryLabels[selectedInquiry.category]?.label || selectedInquiry.category}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={statusLabels[selectedInquiry.status]?.color || 'bg-gray-100'}>
                    {statusLabels[selectedInquiry.status]?.label || selectedInquiry.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p>{new Date(selectedInquiry.createdAt).toLocaleString('en-US')}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Subject</Label>
                <p className="font-medium mt-1">{selectedInquiry.subject}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Content</Label>
                <div className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">
                  {selectedInquiry.content}
                </div>
              </div>

              {selectedInquiry.adminReply && (
                <div>
                  <Label className="text-muted-foreground">Admin Reply</Label>
                  <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded-md whitespace-pre-wrap">
                    {selectedInquiry.adminReply}
                  </div>
                  {selectedInquiry.repliedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Replied: {new Date(selectedInquiry.repliedAt).toLocaleString('en-US')}
                      {selectedInquiry.admin && ` by ${selectedInquiry.admin.nickname}`}
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
            {selectedInquiry && selectedInquiry.status !== 'CLOSED' && (
              <Button onClick={() => { setViewDialogOpen(false); handleReply(selectedInquiry); }}>
                <Send className="h-4 w-4 mr-2" />
                Reply
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
