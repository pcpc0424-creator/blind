'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  MoreVertical,
  Bell,
  Trash2,
  Calendar,
  User,
  Send,
  Megaphone,
  Plus,
  CheckCircle,
  Circle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: any;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  user: {
    id: string;
    nickname: string;
  };
}

interface UserOption {
  id: string;
  nickname: string;
  role: string;
}

interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface UsersResponse {
  success: boolean;
  data: UserOption[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const notificationTypes = [
  { value: 'all', label: 'All' },
  { value: 'COMMENT', label: 'Comment' },
  { value: 'REPLY', label: 'Reply' },
  { value: 'VOTE', label: 'Vote' },
  { value: 'MENTION', label: 'Mention' },
  { value: 'MESSAGE', label: 'Message' },
  { value: 'SYSTEM', label: 'System' },
];

export default function AdminNotificationsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<NotificationsResponse>({
    queryKey: ['admin-notifications', search, typeFilter, page],
    queryFn: async (): Promise<NotificationsResponse> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (search) params.append('search', search);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await api.get(`/notifications/admin?${params.toString()}`);
      return response.data as NotificationsResponse;
    },
  });

  const { data: usersData } = useQuery<UsersResponse>({
    queryKey: ['admin-users-for-notification', userSearch],
    queryFn: async (): Promise<UsersResponse> => {
      const params = new URLSearchParams({ limit: '10' });
      if (userSearch) params.append('search', userSearch);
      const response = await api.get(`/notifications/admin/users?${params.toString()}`);
      return response.data as UsersResponse;
    },
    enabled: sendDialogOpen,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/notifications/${id}/admin`);
      return response.data;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Notification has been deleted.' });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Cannot delete notification.', variant: 'destructive' });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (data: { userId: string; title: string; body: string }) => {
      const response = await api.post('/notifications/admin/send', data);
      return response.data;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Notification has been sent.' });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      setSendDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Cannot send notification.', variant: 'destructive' });
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: async (data: { title: string; body: string }) => {
      const response = await api.post('/notifications/admin/broadcast', data);
      return response.data as { success: boolean; data: { count: number; message: string } };
    },
    onSuccess: (data) => {
      toast({ title: 'Success', description: data.data.message });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      setBroadcastDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Cannot send notification.', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setSelectedUserId('');
    setNotifTitle('');
    setNotifBody('');
    setUserSearch('');
  };

  const notifications = data?.data || [];
  const meta = data?.meta;
  const users = usersData?.data || [];

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      COMMENT: 'bg-blue-100 text-blue-700',
      REPLY: 'bg-cyan-100 text-cyan-700',
      VOTE: 'bg-purple-100 text-purple-700',
      MENTION: 'bg-yellow-100 text-yellow-700',
      MESSAGE: 'bg-green-100 text-green-700',
      SYSTEM: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      COMMENT: 'Comment',
      REPLY: 'Reply',
      VOTE: 'Vote',
      MENTION: 'Mention',
      MESSAGE: 'Message',
      SYSTEM: 'System',
    };
    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-700'}>
        {labels[type] || type}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Manage system notifications and send notifications to users.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSendDialogOpen(true)}>
            <Send className="h-4 w-4 mr-2" />
            Send to User
          </Button>
          <Button onClick={() => setBroadcastDialogOpen(true)}>
            <Megaphone className="h-4 w-4 mr-2" />
            Broadcast
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search title or content..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {notificationTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {meta && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Total {meta.total.toLocaleString()} notifications</span>
          <span>Page {meta.page} / {meta.totalPages}</span>
        </div>
      )}

      {/* Notifications Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead className="w-[35%]">Content</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Read</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : notifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No notifications found.
                  </TableCell>
                </TableRow>
              ) : (
                notifications.map((notif) => (
                  <TableRow key={notif.id}>
                    <TableCell>{getTypeBadge(notif.type)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{notif.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {notif.body}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{notif.user.nickname}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {notif.isRead ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(notif.createdAt).toLocaleDateString('ko-KR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeleteId(notif.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasPrev}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
            const pageNum = Math.max(1, Math.min(meta.totalPages - 4, page - 2)) + i;
            if (pageNum > meta.totalPages) return null;
            return (
              <Button
                key={pageNum}
                variant="outline"
                size="sm"
                className={pageNum === page ? 'bg-primary text-primary-foreground' : ''}
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasNext}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Send to User Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>
              Send a system notification to a specific user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Search User</Label>
              <Input
                placeholder="Search by nickname..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Select Recipient</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.nickname} {user.role === 'ADMIN' && '(Admin)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Enter notification title"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                placeholder="Enter notification content"
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedUserId && notifTitle && notifBody) {
                  sendMutation.mutate({
                    userId: selectedUserId,
                    title: notifTitle,
                    body: notifBody,
                  });
                }
              }}
              disabled={!selectedUserId || !notifTitle || !notifBody || sendMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Broadcast Dialog */}
      <Dialog open={broadcastDialogOpen} onOpenChange={setBroadcastDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Broadcast Notification</DialogTitle>
            <DialogDescription>
              Send a system notification to all active users.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Enter announcement title"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                placeholder="Enter announcement content"
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBroadcastDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (notifTitle && notifBody) {
                  broadcastMutation.mutate({
                    title: notifTitle,
                    body: notifBody,
                  });
                }
              }}
              disabled={!notifTitle || !notifBody || broadcastMutation.isPending}
            >
              <Megaphone className="h-4 w-4 mr-2" />
              Broadcast
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete notification?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The notification will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
