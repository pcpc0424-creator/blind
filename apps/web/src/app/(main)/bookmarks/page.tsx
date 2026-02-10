'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bookmark, Loader2, FileText, MessageSquare, Eye, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layouts/main-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { formatRelativeTime, formatNumber } from '@/lib/utils';

interface BookmarkedPost {
  id: string;
  title: string;
  content: string;
  isAnonymous: boolean;
  viewCount: number;
  voteCount: number;
  commentCount: number;
  createdAt: string;
  bookmarkedAt: string;
  author: {
    id: string;
    nickname: string;
    isAnonymous: boolean;
  };
  community: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function BookmarksPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Fetch bookmarked posts
  const { data, isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const response = await api.get<{
        posts: BookmarkedPost[];
        pagination: { total: number };
      }>('/posts/bookmarks');
      return response.data;
    },
    enabled: isAuthenticated,
  });

  // Remove bookmark mutation
  const removeBookmark = useMutation({
    mutationFn: async (postId: string) => {
      return api.post(`/posts/${postId}/bookmark`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  const posts = data?.posts || [];

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Bookmark className="h-6 w-6" />
            Bookmarks
          </h1>
          <p className="text-muted-foreground">
            {data?.pagination.total || 0} saved posts
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Bookmark className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No saved posts yet</h3>
              <p className="text-muted-foreground mb-4">
                Click the bookmark button on posts you are interested in
                <br />
                to save them for later.
              </p>
              <Button asChild variant="outline">
                <Link href="/">
                  <FileText className="h-4 w-4 mr-2" />
                  Browse Posts
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {post.author.isAnonymous ? 'A' : post.author.nickname.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <span>{post.author.nickname}</span>
                        <span>·</span>
                        <Link
                          href={`/community/${post.community.slug}`}
                          className="hover:underline"
                        >
                          {post.community.name}
                        </Link>
                        <span>·</span>
                        <span>{formatRelativeTime(post.createdAt)}</span>
                      </div>
                      <Link href={`/post/${post.id}`}>
                        <h3 className="font-semibold mb-1 hover:text-primary">
                          {post.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {post.content}
                        </p>
                      </Link>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {formatNumber(post.viewCount)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {formatNumber(post.commentCount)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => removeBookmark.mutate(post.id)}
                          disabled={removeBookmark.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
