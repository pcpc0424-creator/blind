'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  MoreVertical,
  Shield,
  Building2,
  Ban,
  UserCheck,
  Calendar,
  Loader2,
  Users,
  ShieldCheck,
  UserX,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { formatRelativeTime } from '@/lib/utils';

interface User {
  id: string;
  nickname: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  companyVerified: boolean;
  createdAt: string;
  lastActiveAt: string | null;
  company: {
    id: string;
    name: string;
    slug: string;
  } | null;
  postCount: number;
  commentCount: number;
}

interface UserStats {
  total: number;
  active: number;
  suspended: number;
  admins: number;
  companyVerified: number;
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'suspend' | 'activate' | 'role' | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch user list
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter, statusFilter, page],
    queryFn: async (): Promise<{ data: User[]; meta: { total: number; page: number; limit: number; totalPages: number } }> => {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const response = await api.get(`/users/admin?${params.toString()}`);
      return response as { data: User[]; meta: { total: number; page: number; limit: number; totalPages: number } };
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['admin-users-stats'],
    queryFn: async (): Promise<{ data: UserStats }> => {
      const response = await api.get('/users/admin/stats');
      return response as { data: UserStats };
    },
  });

  // Suspend user
  const suspendMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.post(`/users/admin/${id}/suspend`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] });
      setSelectedUser(null);
      setActionType(null);
    },
  });

  // Activate user
  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.post(`/users/admin/${id}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] });
      setSelectedUser(null);
      setActionType(null);
    },
  });

  // Change role
  const roleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      return api.patch(`/users/admin/${id}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] });
      setSelectedUser(null);
      setActionType(null);
      setNewRole('');
    },
  });

  const users = data?.data || [];
  const meta = data?.meta;
  const userStats = stats?.data;

  const handleAction = (user: User, type: 'suspend' | 'activate' | 'role', role?: string) => {
    setSelectedUser(user);
    setActionType(type);
    if (role) setNewRole(role);
  };

  const confirmAction = () => {
    if (!selectedUser) return;

    if (actionType === 'suspend') {
      suspendMutation.mutate(selectedUser.id);
    } else if (actionType === 'activate') {
      activateMutation.mutate(selectedUser.id);
    } else if (actionType === 'role' && newRole) {
      roleMutation.mutate({ id: selectedUser.id, role: newRole });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="destructive">Admin</Badge>;
      case 'MODERATOR':
        return <Badge variant="secondary">Moderator</Badge>;
      default:
        return <Badge variant="outline">User</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'SUSPENDED':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'DELETED':
        return <Badge variant="outline">Deleted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">
            View and manage registered users.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{userStats?.total || 0}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{userStats?.active || 0}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <UserX className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{userStats?.suspended || 0}</div>
                <div className="text-sm text-muted-foreground">Suspended</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{userStats?.admins || 0}</div>
                <div className="text-sm text-muted-foreground">Admins</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Building2 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{userStats?.companyVerified || 0}</div>
                <div className="text-sm text-muted-foreground">Company Verified</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search nickname..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="MODERATOR">Moderator</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="DELETED">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table - Desktop */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No users found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nickname</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.nickname}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      {user.company ? (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          <span>{user.company.name}</span>
                          {user.companyVerified && (
                            <Badge variant="outline" className="ml-1 text-xs">Verified</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Posts {user.postCount}</div>
                        <div className="text-muted-foreground">Comments {user.commentCount}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatRelativeTime(user.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.status === 'ACTIVE' ? (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleAction(user, 'suspend')}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-green-600"
                              onClick={() => handleAction(user, 'activate')}
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {user.role !== 'ADMIN' && (
                            <DropdownMenuItem onClick={() => handleAction(user, 'role', 'ADMIN')}>
                              <Shield className="h-4 w-4 mr-2" />
                              Change to Admin
                            </DropdownMenuItem>
                          )}
                          {user.role !== 'MODERATOR' && (
                            <DropdownMenuItem onClick={() => handleAction(user, 'role', 'MODERATOR')}>
                              <Shield className="h-4 w-4 mr-2" />
                              Change to Moderator
                            </DropdownMenuItem>
                          )}
                          {user.role !== 'USER' && (
                            <DropdownMenuItem onClick={() => handleAction(user, 'role', 'USER')}>
                              <Shield className="h-4 w-4 mr-2" />
                              Change to User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Users Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No users found.
          </div>
        ) : (
          users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{user.nickname}</span>
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.status)}
                    </div>
                    {user.company && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <Building2 className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{user.company.name}</span>
                        {user.companyVerified && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">Verified</Badge>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>Posts {user.postCount}</span>
                      <span>Comments {user.commentCount}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatRelativeTime(user.createdAt)}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {user.status === 'ACTIVE' ? (
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleAction(user, 'suspend')}
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Suspend
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          className="text-green-600"
                          onClick={() => handleAction(user, 'activate')}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Activate
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {user.role !== 'ADMIN' && (
                        <DropdownMenuItem onClick={() => handleAction(user, 'role', 'ADMIN')}>
                          <Shield className="h-4 w-4 mr-2" />
                          Change to Admin
                        </DropdownMenuItem>
                      )}
                      {user.role !== 'MODERATOR' && (
                        <DropdownMenuItem onClick={() => handleAction(user, 'role', 'MODERATOR')}>
                          <Shield className="h-4 w-4 mr-2" />
                          Change to Moderator
                        </DropdownMenuItem>
                      )}
                      {user.role !== 'USER' && (
                        <DropdownMenuItem onClick={() => handleAction(user, 'role', 'USER')}>
                          <Shield className="h-4 w-4 mr-2" />
                          Change to User
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
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
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            {page} / {meta.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={!!actionType} onOpenChange={() => { setActionType(null); setSelectedUser(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'suspend' && 'Suspend User'}
              {actionType === 'activate' && 'Activate User'}
              {actionType === 'role' && 'Change Role'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'suspend' && `Are you sure you want to suspend ${selectedUser?.nickname}?`}
              {actionType === 'activate' && `Are you sure you want to activate ${selectedUser?.nickname}?`}
              {actionType === 'role' && `Are you sure you want to change ${selectedUser?.nickname}'s role to ${newRole === 'ADMIN' ? 'Admin' : newRole === 'MODERATOR' ? 'Moderator' : 'User'}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
