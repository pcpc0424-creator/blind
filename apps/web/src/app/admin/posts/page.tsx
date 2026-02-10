'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  MoreVertical,
  FileText,
  MessageSquare,
  ThumbsUp,
  Eye,
  EyeOff,
  Trash2,
  Pin,
  PinOff,
  Calendar,
  User,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
import { apiClient } from '@/lib/api';

interface Post {
  id: string;
  title: string;
  content: string;
  status: 'ACTIVE' | 'HIDDEN' | 'DELETED';
  voteCount: number;
  commentCount: number;
  viewCount: number;
  isAnonymous: boolean;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  author: {
    id: string;
    nickname: string;
  };
  community: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Stats {
  total: number;
  active: number;
  hidden: number;
  deleted: number;
  today: number;
}

export default function AdminPostsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const limit = 20;

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['admin', 'posts', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get<Stats>('/posts/admin/stats');
      return res.data as Stats;
    },
  });

  // Fetch posts
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'posts', page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await apiClient.get<Post[]>(`/posts/admin/list?${params}`);
      return { data: res.data as Post[], meta: res.meta as { total: number; totalPages: number } };
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiClient.patch(`/posts/admin/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
    },
  });

  // Toggle pin mutation
  const togglePinMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/posts/admin/${id}/pin`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/posts/admin/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
      setDeleteId(null);
    },
  });

  const posts = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const getStatusBadge = (post: Post) => {
    if (post.isPinned) {
      return <Badge className="bg-blue-100 text-blue-700">Pinned</Badge>;
    }
    switch (post.status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case 'HIDDEN':
        return <Badge className="bg-gray-100 text-gray-700">Hidden</Badge>;
      case 'DELETED':
        return <Badge className="bg-red-100 text-red-700">Deleted</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Post Management</h1>
        <p className="text-muted-foreground">
          View and manage posts.
        </p>
      </div>

      {/* Stats */}
      {statsData && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{statsData.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total Posts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{statsData.active.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-600">{statsData.hidden.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Hidden</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{statsData.deleted.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Deleted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{statsData.today.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>
        </div>
      )}

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
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table - Desktop */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No posts found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Post</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Community</TableHead>
                  <TableHead>Reactions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium line-clamp-1">
                          {post.isPinned && <Pin className="inline h-3 w-3 mr-1 text-blue-500" />}
                          {post.title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {post.isAnonymous ? 'Anonymous' : post.author.nickname}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{post.community.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {post.voteCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {post.commentCount}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          {post.viewCount}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(post)}
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
                            onClick={() => window.open(`/blind/post/${post.id}`, '_blank')}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View Post
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => togglePinMutation.mutate(post.id)}
                          >
                            {post.isPinned ? (
                              <>
                                <PinOff className="h-4 w-4 mr-2" />
                                Unpin
                              </>
                            ) : (
                              <>
                                <Pin className="h-4 w-4 mr-2" />
                                Pin
                              </>
                            )}
                          </DropdownMenuItem>
                          {post.status === 'ACTIVE' ? (
                            <DropdownMenuItem
                              onClick={() => updateStatusMutation.mutate({ id: post.id, status: 'HIDDEN' })}
                            >
                              <EyeOff className="h-4 w-4 mr-2" />
                              Hide
                            </DropdownMenuItem>
                          ) : post.status === 'HIDDEN' ? (
                            <DropdownMenuItem
                              onClick={() => updateStatusMutation.mutate({ id: post.id, status: 'ACTIVE' })}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Unhide
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeleteId(post.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Permanently
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

      {/* Posts Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No posts found.
          </div>
        ) : (
          posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {getStatusBadge(post)}
                      <Badge variant="outline" className="text-xs">{post.community.name}</Badge>
                    </div>
                    <div className="font-medium line-clamp-2">
                      {post.isPinned && <Pin className="inline h-3 w-3 mr-1 text-blue-500" />}
                      {post.title}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      {post.isAnonymous ? 'Anonymous' : post.author.nickname}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {post.voteCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {post.commentCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => window.open(`/blind/post/${post.id}`, '_blank')}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Post
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => togglePinMutation.mutate(post.id)}
                      >
                        {post.isPinned ? (
                          <>
                            <PinOff className="h-4 w-4 mr-2" />
                            Unpin
                          </>
                        ) : (
                          <>
                            <Pin className="h-4 w-4 mr-2" />
                            Pin
                          </>
                        )}
                      </DropdownMenuItem>
                      {post.status === 'ACTIVE' ? (
                        <DropdownMenuItem
                          onClick={() => updateStatusMutation.mutate({ id: post.id, status: 'HIDDEN' })}
                        >
                          <EyeOff className="h-4 w-4 mr-2" />
                          Hide
                        </DropdownMenuItem>
                      ) : post.status === 'HIDDEN' ? (
                        <DropdownMenuItem
                          onClick={() => updateStatusMutation.mutate({ id: post.id, status: 'ACTIVE' })}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Unhide
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => setDeleteId(post.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Permanently
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              if (pageNum > totalPages) return null;
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this post? This action cannot be undone,
              and all comments, votes, and bookmarks will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
