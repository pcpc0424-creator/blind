'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Plus,
  MoreVertical,
  MessageSquare,
  Edit,
  Trash2,
  Loader2,
  Users,
  FileText,
  Lock,
  Building2,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: 'GENERAL' | 'COMPANY' | 'PUBLIC_SERVANT' | 'INTEREST' | 'JOB' | 'INDUSTRY';
  isPrivate: boolean;
  memberCount: number;
  postCount: number;
  createdAt: string;
  company: { id: string; name: string } | null;
  publicServantCategory: { id: string; name: string } | null;
  interestCategory: { id: string; name: string } | null;
}

interface CommunityStats {
  total: number;
  general: number;
  company: number;
  publicServant: number;
  interest: number;
  private: number;
}

interface FormData {
  name: string;
  description: string;
  type: string;
  isPrivate: boolean;
}

export default function AdminCommunitiesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);
  const [deletingCommunity, setDeletingCommunity] = useState<Community | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    type: 'GENERAL',
    isPrivate: false,
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-communities', search, typeFilter, page],
    queryFn: async (): Promise<{ data: Community[]; meta: { total: number; totalPages: number } }> => {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (typeFilter !== 'all') params.set('type', typeFilter);

      const response = await api.get(`/communities/admin/list?${params.toString()}`);
      return response as { data: Community[]; meta: { total: number; totalPages: number } };
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-communities-stats'],
    queryFn: async (): Promise<{ data: CommunityStats }> => {
      const response = await api.get('/communities/admin/stats');
      return response as { data: CommunityStats };
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => api.post('/communities/admin', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-communities'] });
      queryClient.invalidateQueries({ queryKey: ['admin-communities-stats'] });
      setIsCreateOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FormData> }) =>
      api.patch(`/communities/admin/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-communities'] });
      setEditingCommunity(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/communities/admin/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-communities'] });
      queryClient.invalidateQueries({ queryKey: ['admin-communities-stats'] });
      setDeletingCommunity(null);
    },
  });

  const communities = data?.data || [];
  const meta = data?.meta;
  const communityStats = stats?.data;

  const resetForm = () => {
    setFormData({ name: '', description: '', type: 'GENERAL', isPrivate: false });
  };

  const openEditDialog = (community: Community) => {
    setEditingCommunity(community);
    setFormData({
      name: community.name,
      description: community.description || '',
      type: community.type,
      isPrivate: community.isPrivate,
    });
  };

  const getTypeBadge = (type: string) => {
    const typeConfig: Record<string, { label: string; className: string }> = {
      'GENERAL': { label: 'General', className: 'bg-gray-500' },
      'COMPANY': { label: 'Company', className: 'bg-blue-500' },
      'PUBLIC_SERVANT': { label: 'Public Servant', className: 'bg-green-500' },
      'INTEREST': { label: 'Interest', className: 'bg-purple-500' },
      'JOB': { label: 'Job', className: 'bg-orange-500' },
      'INDUSTRY': { label: 'Industry', className: 'bg-cyan-500' },
    };
    const config = typeConfig[type] || { label: type, className: 'bg-gray-500' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Communities</h1>
          <p className="text-muted-foreground">View and manage communities.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Community
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{communityStats?.total || 0}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100">
                <MessageSquare className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{communityStats?.general || 0}</div>
                <div className="text-sm text-muted-foreground">General</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{communityStats?.company || 0}</div>
                <div className="text-sm text-muted-foreground">Company</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{communityStats?.publicServant || 0}</div>
                <div className="text-sm text-muted-foreground">Public Servant</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{communityStats?.interest || 0}</div>
                <div className="text-sm text-muted-foreground">Interest</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <Lock className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{communityStats?.private || 0}</div>
                <div className="text-sm text-muted-foreground">Private</div>
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
                  placeholder="Search communities..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="GENERAL">General</SelectItem>
                <SelectItem value="COMPANY">Company</SelectItem>
                <SelectItem value="PUBLIC_SERVANT">Public Servant</SelectItem>
                <SelectItem value="INTEREST">Interest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : communities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No communities found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Posts</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {communities.map((community) => (
                  <TableRow key={community.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium flex items-center gap-1">
                            {community.name}
                            {community.isPrivate && <Lock className="h-3 w-3 text-muted-foreground" />}
                          </div>
                          <div className="text-xs text-muted-foreground">{community.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(community.type)}</TableCell>
                    <TableCell>
                      {community.company?.name || community.publicServantCategory?.name || community.interestCategory?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {community.memberCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {community.postCount}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatRelativeTime(community.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(community)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeletingCommunity(community)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
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

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="flex items-center px-4">{page} / {meta.totalPages}</span>
          <Button variant="outline" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Community</DialogTitle>
            <DialogDescription>Create a new community.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Community Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Community name"
              />
            </div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="COMPANY">Company</SelectItem>
                  <SelectItem value="PUBLIC_SERVANT">Public Servant</SelectItem>
                  <SelectItem value="INTEREST">Interest</SelectItem>
                  <SelectItem value="JOB">Job</SelectItem>
                  <SelectItem value="INDUSTRY">Industry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Community description"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Private Community</Label>
              <Switch
                checked={formData.isPrivate}
                onCheckedChange={(c) => setFormData({ ...formData, isPrivate: c })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCommunity} onOpenChange={() => setEditingCommunity(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Community</DialogTitle>
            <DialogDescription>Edit {editingCommunity?.name} information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Community Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Private Community</Label>
              <Switch
                checked={formData.isPrivate}
                onCheckedChange={(c) => setFormData({ ...formData, isPrivate: c })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingCommunity(null); resetForm(); }}>
              Cancel
            </Button>
            <Button
              onClick={() => editingCommunity && updateMutation.mutate({ id: editingCommunity.id, data: formData })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCommunity} onOpenChange={() => setDeletingCommunity(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Community</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingCommunity?.name}?
              All posts and memberships in this community will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deletingCommunity && deleteMutation.mutate(deletingCommunity.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
