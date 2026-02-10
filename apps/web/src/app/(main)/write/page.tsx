'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { createPostSchema, CreatePostInput } from '@blind/shared';
import {
  ArrowLeft,
  Loader2,
  ImagePlus,
  X,
  Youtube,
  Link as LinkIcon,
  Film,
} from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGES = 5;

interface UploadedImage {
  file: File;
  preview: string;
  id: string;
  uploadedUrl?: string;
  uploading?: boolean;
}

// Parse YouTube/Vimeo URL
function parseVideoUrl(url: string): { type: 'youtube' | 'vimeo' | null; id: string | null } {
  // YouTube patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match) {
      return { type: 'youtube', id: match[1] };
    }
  }

  // Vimeo patterns
  const vimeoPattern = /vimeo\.com\/(\d+)/;
  const vimeoMatch = url.match(vimeoPattern);
  if (vimeoMatch) {
    return { type: 'vimeo', id: vimeoMatch[1] };
  }

  return { type: null, id: null };
}

export default function WritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get community from URL if provided
  const communitySlug = searchParams.get('community');

  // State for images
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // State for video embed
  const [videoUrl, setVideoUrl] = useState('');
  const [videoPreview, setVideoPreview] = useState<{ type: 'youtube' | 'vimeo'; id: string } | null>(null);

  // Fetch user's communities
  const { data: communitiesData } = useQuery({
    queryKey: ['my-communities'],
    queryFn: async () => {
      const response = await api.get<any[]>('/communities/me');
      return response.data;
    },
    enabled: isAuthenticated,
  });

  // Create post mutation
  const createPost = useMutation({
    mutationFn: async (data: CreatePostInput & { images?: string[]; videoUrl?: string }) => {
      return api.post<{ id: string }>('/posts', data);
    },
    onSuccess: (response) => {
      toast({
        title: 'Post Created',
        description: 'Your post has been published.',
      });
      router.push(`/post/${response.data?.id}`);
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      isAnonymous: true,
    },
  });

  const communities = communitiesData || [];
  const selectedCommunityId = watch('communityId');

  // Set community if provided in URL
  useEffect(() => {
    if (communitySlug && communities.length > 0) {
      const community = communities.find(
        (c: any) => c.slug === communitySlug
      );
      if (community) {
        setValue('communityId', community.id);
      }
    }
  }, [communitySlug, communities, setValue]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Handle video URL change
  useEffect(() => {
    if (videoUrl.trim()) {
      const parsed = parseVideoUrl(videoUrl);
      if (parsed.type && parsed.id) {
        setVideoPreview({ type: parsed.type, id: parsed.id });
      } else {
        setVideoPreview(null);
      }
    } else {
      setVideoPreview(null);
    }
  }, [videoUrl]);

  // Image upload handlers
  const validateImage = (file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload JPEG, PNG, GIF, or WebP images.';
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return 'Image is too large. Maximum size is 10MB.';
    }
    return null;
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.upload<{ url: string }>('/upload/single', formData);
      return response.data?.url || null;
    } catch (error) {
      console.error('Upload failed:', error);
      return null;
    }
  };

  const handleImageSelect = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    if (images.length + fileArray.length > MAX_IMAGES) {
      toast({
        variant: 'destructive',
        title: 'Too many images',
        description: `You can upload up to ${MAX_IMAGES} images.`,
      });
      return;
    }

    for (const file of fileArray) {
      const error = validateImage(file);
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Invalid Image',
          description: error,
        });
        continue;
      }

      const preview = URL.createObjectURL(file);
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Add image with uploading state
      setImages(prev => [...prev, { file, preview, id, uploading: true }]);

      // Upload the image
      const uploadedUrl = await uploadImage(file);

      if (uploadedUrl) {
        setImages(prev => prev.map(img =>
          img.id === id ? { ...img, uploadedUrl, uploading: false } : img
        ));
      } else {
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: `Failed to upload ${file.name}`,
        });
        setImages(prev => prev.filter(img => img.id !== id));
        URL.revokeObjectURL(preview);
      }
    }
  }, [images.length, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageSelect(e.dataTransfer.files);
  }, [handleImageSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeImage = (id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const onSubmit = async (data: CreatePostInput) => {
    // Check if any images are still uploading
    const stillUploading = images.some(img => img.uploading);
    if (stillUploading) {
      toast({
        variant: 'destructive',
        title: 'Please wait',
        description: 'Images are still uploading...',
      });
      return;
    }

    // Collect uploaded image URLs
    const mediaUrls = images
      .filter(img => img.uploadedUrl)
      .map(img => img.uploadedUrl as string);

    const submitData = {
      ...data,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      videoUrl: videoPreview ? videoUrl : undefined,
    };
    createPost.mutate(submitData);
  };

  if (!isAuthenticated) {
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
          <CardTitle>Create New Post</CardTitle>
          <CardDescription>
            Share your story with the community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Community select */}
            <div className="space-y-2">
              <Label htmlFor="community">Community</Label>
              <Select
                value={selectedCommunityId}
                onValueChange={(value) => setValue('communityId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a community" />
                </SelectTrigger>
                <SelectContent>
                  {communities.map((community: any) => (
                    <SelectItem key={community.id} value={community.id}>
                      {community.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.communityId && (
                <p className="text-sm text-destructive">
                  {errors.communityId.message}
                </p>
              )}
            </div>

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

            {/* Media Attachments */}
            <div className="space-y-4">
              <Label>Media Attachments</Label>

              <Tabs defaultValue="images" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="images" className="gap-2">
                    <ImagePlus className="h-4 w-4" />
                    Images
                  </TabsTrigger>
                  <TabsTrigger value="video" className="gap-2">
                    <Youtube className="h-4 w-4" />
                    Video Link
                  </TabsTrigger>
                </TabsList>

                {/* Images Tab */}
                <TabsContent value="images" className="space-y-4">
                  {/* Image Upload Area */}
                  <div
                    className={`
                      border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
                      ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
                    `}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_IMAGE_TYPES.join(',')}
                      multiple
                      onChange={(e) => e.target.files && handleImageSelect(e.target.files)}
                      className="hidden"
                    />
                    <ImagePlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      Drop images here or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPEG, PNG, GIF, WebP up to 10MB (max {MAX_IMAGES} images)
                    </p>
                  </div>

                  {/* Image Previews */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                      {images.map((image) => (
                        <div key={image.id} className="relative group aspect-square">
                          <img
                            src={image.preview}
                            alt="Preview"
                            className={`w-full h-full object-cover rounded-lg ${image.uploading ? 'opacity-50' : ''}`}
                          />
                          {image.uploading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                          )}
                          {!image.uploading && (
                            <button
                              type="button"
                              onClick={() => removeImage(image.id)}
                              className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Video Link Tab */}
                <TabsContent value="video" className="space-y-4">
                  <Alert>
                    <Film className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Direct video upload is not supported. Please use YouTube or Vimeo links instead.
                      For shorts/reels, use the <a href="/upload-movie" className="text-primary underline">Upload Movie</a> page.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="videoUrl">YouTube / Vimeo URL</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="videoUrl"
                          placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {videoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setVideoUrl('')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Supports YouTube, YouTube Shorts, and Vimeo links
                    </p>
                  </div>

                  {/* Video Preview */}
                  {videoPreview && (
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      {videoPreview.type === 'youtube' && (
                        <iframe
                          src={`https://www.youtube.com/embed/${videoPreview.id}`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      )}
                      {videoPreview.type === 'vimeo' && (
                        <iframe
                          src={`https://player.vimeo.com/video/${videoPreview.id}`}
                          className="w-full h-full"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                        />
                      )}
                    </div>
                  )}

                  {videoUrl && !videoPreview && (
                    <p className="text-sm text-destructive">
                      Invalid video URL. Please enter a valid YouTube or Vimeo link.
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Anonymous toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isAnonymous"
                {...register('isAnonymous')}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isAnonymous" className="text-sm font-normal">
                Post anonymously
              </Label>
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
              <Button type="submit" disabled={createPost.isPending}>
                {createPost.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Publish
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
