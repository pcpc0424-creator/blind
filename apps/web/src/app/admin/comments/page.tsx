'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  MoreVertical,
  MessageSquare,
  ThumbsUp,
  Eye,
  EyeOff,
  Trash2,
  Calendar,
  User,
  FileText,
  ExternalLink,
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
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface Comment {
  id: string;
  content: string;
  isAnonymous: boolean;
  status: 'ACTIVE' | 'HIDDEN' | 'DELETED';
  voteCount: number;
  replyCount: number;
  createdAt: string;
  author: {
    id: string;
    nickname: string;
  };
  post: {
    id: string;
    title: string;
    community: {
      id: string;
      name: string;
      slug: string;
    };
  } | null;
}

interface CommentsResponse {
  success: boolean;
  data: Comment[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function AdminCommentsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<CommentsResponse>({
    queryKey: ['admin-comments', search, statusFilter, page],
    queryFn: async (): Promise<CommentsResponse> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await api.get(`/comments/admin?${params.toString()}`);
      return response.data as CommentsResponse;
    },
  });

  const toggleHideMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/comments/${id}/toggle-hide`);
      return response.data as { success: boolean; data: { id: string; status: string; message: string } };
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data.data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Cannot process the action.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/comments/${id}/admin`);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Comment has been deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Cannot delete comment.',
        variant: 'destructive',
      });
    },
  });

  const comments = data?.data || [];
  const meta = data?.meta;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case 'HIDDEN':
        return <Badge className="bg-gray-100 text-gray-700">Hidden</Badge>;
      case 'DELETED':
        return <Badge className="bg-red-100 text-red-700">Deleted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Comments</h1>
        <p className="text-muted-foreground">
          View and manage all comments.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search comment content..."
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
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="HIDDEN">Hidden</SelectItem>
                <SelectItem value="DELETED">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {meta && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Total {meta.total.toLocaleString()} comments</span>
          <span>Page {meta.page} / {meta.totalPages}</span>
        </div>
      )}

      {/* Comments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Comment</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Post</TableHead>
                <TableHead>Reactions</TableHead>
                <TableHead>Status</TableHead>
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
              ) : comments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No comments found.
                  </TableCell>
                </TableRow>
              ) : (
                comments.map((comment) => (
                  <TableRow key={comment.id}>
                    <TableCell>
                      <div>
                        <div className="line-clamp-2 text-sm">{comment.content}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(comment.createdAt).toLocaleDateString('en-US')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {comment.isAnonymous ? 'Anonymous' : comment.author.nickname}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {comment.post ? (
                        <div className="max-w-[200px]">
                          <Link
                            href={`/post/${comment.post.id}`}
                            target="_blank"
                            className="text-sm hover:underline flex items-center gap-1"
                          >
                            <span className="line-clamp-1">{comment.post.title}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {comment.post.community.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Deleted post</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {comment.voteCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {comment.replyCount}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(comment.status)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {comment.post && (
                            <DropdownMenuItem asChild>
                              <Link href={`/post/${comment.post.id}`} target="_blank">
                                <FileText className="h-4 w-4 mr-2" />
                                View Post
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {comment.status !== 'DELETED' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => toggleHideMutation.mutate(comment.id)}
                              >
                                {comment.status === 'HIDDEN' ? (
                                  <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Unhide
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="h-4 w-4 mr-2" />
                                    Hide
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDeleteId(comment.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The comment will be permanently deleted.
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
