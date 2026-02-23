'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  MessageSquare,
  Bookmark,
  Share2,
  Flag,
  Loader2,
  ArrowLeft,
  Pencil,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { MainLayout } from '@/components/layouts/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { formatRelativeTime, formatNumber, cn } from '@/lib/utils';
import { CommentSection } from '@/components/features/comment-section';
import { ReportModal } from '@/components/features/report-modal';
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
import { useToast } from '@/hooks/use-toast';

export default function PostDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch post
  const { data: postData, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const response = await api.get<any>(`/posts/${id}`);
      return response.data;
    },
  });

  // Fetch related posts from the same community
  const { data: relatedPostsData } = useQuery({
    queryKey: ['related-posts', id, postData?.community?.id],
    queryFn: async () => {
      const response = await api.get<any>(`/posts?communityId=${postData.community.id}&limit=10`);
      return response.data;
    },
    enabled: !!postData?.community?.id,
  });

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/posts/${id}/bookmark`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      toast({
        title: post?.isBookmarked ? 'Bookmark Removed' : 'Bookmarked',
        description: post?.isBookmarked ? 'Post removed from bookmarks.' : 'Post added to bookmarks.',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return api.delete(`/posts/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Post Deleted',
        description: 'Your post has been deleted.',
      });
      router.push('/');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete post.',
      });
    },
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (value: 1 | -1 | 0) => {
      return api.post(`/posts/${id}/vote`, { value });
    },
    onSuccess: (_, value) => {
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      const messages: Record<number, { title: string; description: string }> = {
        1: { title: 'Upvoted', description: 'You upvoted this post.' },
        [-1]: { title: 'Downvoted', description: 'You downvoted this post.' },
        0: { title: 'Vote Removed', description: 'Your vote has been removed.' },
      };
      toast(messages[value]);
    },
  });

  const handleBookmark = () => {
    if (!isAuthenticated) return;
    bookmarkMutation.mutate();
  };

  const handleDelete = () => {
    deleteMutation.mutate();
    setDeleteDialogOpen(false);
  };

  const handleVote = (value: 1 | -1) => {
    if (!isAuthenticated) return;
    // If already voted with same value, remove vote (0), otherwise set new vote
    const newValue = post?.myVote === value ? 0 : value;
    voteMutation.mutate(newValue);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!postData) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Post not found.</p>
          <Button variant="link" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </MainLayout>
    );
  }

  const post = postData;

  // Calculate prev/next posts and related posts
  // API returns posts sorted by newest first, so:
  // - Previous (older post) = next index in array
  // - Next (newer post) = previous index in array
  const relatedPosts = relatedPostsData || [];
  const currentIndex = relatedPosts.findIndex((p: any) => p.id === id);
  const prevPost = currentIndex >= 0 && currentIndex < relatedPosts.length - 1 ? relatedPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? relatedPosts[currentIndex - 1] : null;
  const otherPosts = relatedPosts.filter((p: any) => p.id !== id).slice(0, 5);

  return (
    <MainLayout>
      {/* Back button */}
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Go Back
      </Button>

      {/* Post content */}
      <Card>
        <CardHeader>
          {/* Author info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  {post.author.isAnonymous ? 'A' : post.author.nickname.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {post.author.isAnonymous ? 'Anonymous' : post.author.nickname}
                </p>
                <p className="text-sm text-muted-foreground">
                  <Link
                    href={`/community/${post.community.slug}`}
                    className="hover:underline"
                  >
                    {post.community.name}
                  </Link>
                  {' · '}
                  {formatRelativeTime(post.createdAt)}
                  {' · '}
                  {formatNumber(post.viewCount)} views
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {isAuthenticated && post.isAuthor && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-primary"
                    onClick={() => router.push(`/post/${id}/edit`)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </>
              )}
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    setReportCommentId(null);
                    setReportModalOpen(true);
                  }}
                >
                  <Flag className="h-4 w-4 mr-1" />
                  Report
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Title */}
          <h1 className="text-2xl font-bold">{post.title}</h1>

          {/* Content */}
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            {post.content}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag: any) => (
                <Link
                  key={tag.slug}
                  href={`/search?tag=${tag.slug}`}
                  className="text-sm px-3 py-1 bg-muted rounded-full text-muted-foreground hover:bg-muted/80"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          {/* Media */}
          {post.media && post.media.length > 0 && (
            <div className="grid gap-4">
              {post.media.map((m: any) => {
                // Check if it's a video link (YouTube/Vimeo)
                if (m.type === 'LINK') {
                  // YouTube
                  const youtubeMatch = m.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
                  if (youtubeMatch) {
                    return (
                      <div key={m.id} className="aspect-video rounded-lg overflow-hidden">
                        <iframe
                          src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    );
                  }
                  // Vimeo
                  const vimeoMatch = m.url.match(/vimeo\.com\/(\d+)/);
                  if (vimeoMatch) {
                    return (
                      <div key={m.id} className="aspect-video rounded-lg overflow-hidden">
                        <iframe
                          src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
                          className="w-full h-full"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    );
                  }
                  // Other links - just show as link
                  return (
                    <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      {m.url}
                    </a>
                  );
                }
                // Image
                return (
                  <img
                    key={m.id}
                    src={m.url}
                    alt={m.caption || 'Image'}
                    className="rounded-lg max-h-96 object-contain"
                  />
                );
              })}
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Vote buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote(1)}
                  disabled={voteMutation.isPending || !isAuthenticated}
                  className={cn(post.myVote === 1 && 'text-primary')}
                >
                  <ThumbsUp className={cn('h-4 w-4', post.myVote === 1 && 'fill-current')} />
                </Button>
                <span className={cn(
                  'text-sm font-medium min-w-[2ch] text-center',
                  post.voteCount > 0 && 'text-primary',
                  post.voteCount < 0 && 'text-destructive'
                )}>
                  {post.voteCount}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote(-1)}
                  disabled={voteMutation.isPending || !isAuthenticated}
                  className={cn(post.myVote === -1 && 'text-destructive')}
                >
                  <ThumbsDown className={cn('h-4 w-4', post.myVote === -1 && 'fill-current')} />
                </Button>
              </div>

              {/* Comment count */}
              <Button variant="ghost" size="sm" asChild>
                <a href="#comments">
                  <MessageSquare className="mr-1 h-4 w-4" />
                  {formatNumber(post.commentCount)}
                </a>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {/* Bookmark */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                disabled={bookmarkMutation.isPending}
              >
                <Bookmark
                  className={cn('h-4 w-4', post.isBookmarked && 'fill-current')}
                />
              </Button>

              {/* Share */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({
                    title: 'Link Copied',
                    description: 'Post link has been copied to clipboard.',
                  });
                }}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments section */}
      <div id="comments" className="mt-6">
        <CommentSection
          postId={id}
          postAuthorId={post.author.id}
          onReportComment={(commentId) => {
            setReportCommentId(commentId);
            setReportModalOpen(true);
          }}
        />
      </div>

      {/* Prev/Next Post Navigation */}
      <div className="mt-6 flex justify-between gap-4">
        {prevPost ? (
          <Link href={`/post/${prevPost.id}`} className="flex-1">
            <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <div className="text-left min-w-0">
                <p className="text-xs text-muted-foreground">Previous</p>
                <p className="text-sm font-medium truncate">{prevPost.title}</p>
              </div>
            </Button>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {nextPost ? (
          <Link href={`/post/${nextPost.id}`} className="flex-1">
            <Button variant="outline" className="w-full justify-end gap-2 h-auto py-3">
              <div className="text-right min-w-0">
                <p className="text-xs text-muted-foreground">Next</p>
                <p className="text-sm font-medium truncate">{nextPost.title}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </Button>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>

      {/* Related Posts from Same Community */}
      {otherPosts.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">More from {post.community.name}</h3>
              <Link
                href={`/community/${post.community.slug}`}
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y">
              {otherPosts.map((relatedPost: any) => (
                <Link
                  key={relatedPost.id}
                  href={`/post/${relatedPost.id}`}
                  className="flex items-center justify-between py-3 hover:bg-muted/50 -mx-4 px-4 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{relatedPost.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{formatRelativeTime(relatedPost.createdAt)}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatNumber(relatedPost.viewCount)}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {relatedPost.commentCount}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm ml-4">
                    <ThumbsUp className="h-3 w-3" />
                    <span>{relatedPost.voteCount}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Modal */}
      <ReportModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        postId={reportCommentId ? undefined : id}
        commentId={reportCommentId || undefined}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
