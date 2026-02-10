'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePostSchema, UpdatePostInput } from '@blind/shared';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layouts/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';

export default function EditPostPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { toast } = useToast();

  // Fetch existing post
  const { data: post, isLoading: isLoadingPost } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const response = await api.get<any>(`/posts/${id}`);
      return response.data;
    },
    enabled: isAuthenticated,
  });

  // Update post mutation
  const updatePost = useMutation({
    mutationFn: async (data: UpdatePostInput) => {
      return api.patch<{ id: string }>(`/posts/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: 'Post Updated',
        description: 'Your post has been updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      router.push(`/post/${id}`);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdatePostInput>({
    resolver: zodResolver(updatePostSchema),
  });

  // Populate form with existing data
  useEffect(() => {
    if (post) {
      reset({
        title: post.title,
        content: post.content,
      });
    }
  }, [post, reset]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Check if user is the author
  useEffect(() => {
    if (post && !post.isAuthor) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You can only edit your own posts.',
      });
      router.push(`/post/${id}`);
    }
  }, [post, id, router, toast]);

  const onSubmit = async (data: UpdatePostInput) => {
    updatePost.mutate(data);
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoadingPost) {
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!post) {
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

  // Check author permission
  if (!post.isAuthor) {
    return null;
  }

  return (
    <MainLayout>
      {/* Back button */}
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Go Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Post</CardTitle>
          <CardDescription>
            Update your post in {post.community.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter a title"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Enter your content"
                rows={10}
                {...register('content')}
              />
              {errors.content && (
                <p className="text-sm text-destructive">
                  {errors.content.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updatePost.isPending}>
                {updatePost.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
