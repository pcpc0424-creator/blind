'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Megaphone,
  Search,
  Loader2,
  Mail,
  Phone,
  Building2,
  User,
  Clock,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api';

interface AdInquiry {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  adType: string;
  budget: string | null;
  duration: string | null;
  message: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
};

const adTypeLabels: Record<string, string> = {
  BANNER: 'Banner Ads',
  SPONSORED: 'Sponsored Posts',
  NEWSLETTER: 'Newsletter Ads',
  PARTNERSHIP: 'Partnership',
  OTHER: 'Other',
};

export default function AdminAdInquiriesPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState<AdInquiry | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [newStatus, setNewStatus] = useState('');

  // Fetch inquiries
  const { data, isLoading } = useQuery({
    queryKey: ['admin-ad-inquiries', statusFilter],
    queryFn: async () => {
      const response = await api.get<AdInquiry[]>('/ad-inquiries', {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: 100,
      });
      return response;
    },
  });

  // Update inquiry mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, status, adminNote }: { id: string; status?: string; adminNote?: string }) => {
      return api.patch(`/ad-inquiries/${id}`, { status, adminNote });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ad-inquiries'] });
      setSelectedInquiry(null);
    },
  });

  // Delete inquiry mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/ad-inquiries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ad-inquiries'] });
    },
  });

  const handleViewInquiry = (inquiry: AdInquiry) => {
    setSelectedInquiry(inquiry);
    setAdminNote(inquiry.adminNote || '');
    setNewStatus(inquiry.status);
  };

  const handleUpdateInquiry = () => {
    if (!selectedInquiry) return;
    updateMutation.mutate({
      id: selectedInquiry.id,
      status: newStatus !== selectedInquiry.status ? newStatus : undefined,
      adminNote: adminNote !== selectedInquiry.adminNote ? adminNote : undefined,
    });
  };

  const handleDeleteInquiry = (id: string) => {
    if (confirm('Are you sure you want to delete this inquiry?')) {
      deleteMutation.mutate(id);
    }
  };

  const inquiries = data?.data || [];
  const stats = {
    total: inquiries.length,
    pending: inquiries.filter((i) => i.status === 'PENDING').length,
    inProgress: inquiries.filter((i) => i.status === 'IN_PROGRESS').length,
    completed: inquiries.filter((i) => i.status === 'COMPLETED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6" />
            Ad Inquiries
          </h1>
          <p className="text-muted-foreground">Manage advertising inquiries</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Inquiries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : inquiries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No inquiries found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Ad Type</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map((inquiry) => (
                  <TableRow key={inquiry.id}>
                    <TableCell className="font-medium">{inquiry.companyName}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{inquiry.contactName}</div>
                        <div className="text-muted-foreground">{inquiry.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{adTypeLabels[inquiry.adType] || inquiry.adType}</TableCell>
                    <TableCell>{inquiry.budget || '-'}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[inquiry.status]}>
                        {statusLabels[inquiry.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(inquiry.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewInquiry(inquiry)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteInquiry(inquiry.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
            <DialogDescription>
              View and manage this advertising inquiry
            </DialogDescription>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> Company
                  </label>
                  <p className="font-medium">{selectedInquiry.companyName}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> Contact
                  </label>
                  <p className="font-medium">{selectedInquiry.contactName}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email
                  </label>
                  <p className="font-medium">{selectedInquiry.email}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Phone
                  </label>
                  <p className="font-medium">{selectedInquiry.phone || '-'}</p>
                </div>
              </div>

              {/* Inquiry Details */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Ad Type</label>
                  <p className="font-medium">{adTypeLabels[selectedInquiry.adType]}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Budget</label>
                  <p className="font-medium">{selectedInquiry.budget || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Duration</label>
                  <p className="font-medium">{selectedInquiry.duration || '-'}</p>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Message</label>
                <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                  {selectedInquiry.message}
                </div>
              </div>

              {/* Status Update */}
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Admin Note</label>
                  <Textarea
                    placeholder="Add internal notes about this inquiry..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedInquiry(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateInquiry}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
