'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Upload,
  Film,
  X,
  Loader2,
  FileVideo,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { MainLayout } from '@/components/layouts/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const ACCEPTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB for shorts/reels
const MAX_DURATION = 60; // 60 seconds for shorts

const VIDEO_CATEGORIES = [
  { value: 'short', label: 'Short Video (Reels/Shorts)' },
  { value: 'vlog', label: 'Vlog' },
  { value: 'review', label: 'Review' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'other', label: 'Other' },
];

interface UploadedFile {
  file: File;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  duration?: number;
}

export default function UploadMoviePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user's communities
  const { data: communitiesData } = useQuery({
    queryKey: ['my-communities'],
    queryFn: async () => {
      const response = await api.get<any[]>('/communities/me');
      return response.data;
    },
    enabled: isAuthenticated,
  });

  const communities = communitiesData || [];

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload MP4, WebM, or MOV files.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File is too large. Maximum size is 100MB for shorts.';
    }
    return null;
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => resolve(0);
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Invalid File',
        description: error,
      });
      return;
    }

    // Get video duration
    const duration = await getVideoDuration(file);

    if (category === 'short' && duration > MAX_DURATION) {
      toast({
        variant: 'destructive',
        title: 'Video Too Long',
        description: `Shorts must be ${MAX_DURATION} seconds or less. Your video is ${Math.round(duration)} seconds.`,
      });
      return;
    }

    // Create video preview
    const preview = URL.createObjectURL(file);

    setUploadedFile({
      file,
      preview,
      progress: 0,
      status: 'pending',
      duration,
    });
  }, [category, toast]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removeFile = () => {
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview);
    }
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const simulateUpload = async (): Promise<void> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadedFile((prev) =>
            prev ? { ...prev, progress: 100, status: 'complete' } : null
          );
          resolve();
        } else {
          setUploadedFile((prev) =>
            prev ? { ...prev, progress, status: 'uploading' } : null
          );
        }
      }, 200);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a title.',
      });
      return;
    }

    if (!category) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a category.',
      });
      return;
    }

    if (!uploadedFile) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please upload a video file.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate file upload (actual implementation would upload to storage)
      await simulateUpload();

      toast({
        title: 'Upload Complete',
        description: 'Your video has been uploaded successfully.',
      });

      // Redirect to home or community page
      router.push('/');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Failed to upload video. Please try again.',
      });
      setUploadedFile((prev) =>
        prev ? { ...prev, status: 'error' } : null
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <Card className="max-w-md mx-auto mt-12">
          <CardContent className="pt-6 text-center">
            <Film className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-4">
              Please login to upload videos.
            </p>
            <Button onClick={() => router.push('/login')}>Login</Button>
          </CardContent>
        </Card>
      </MainLayout>
    );
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Film className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Upload Video</CardTitle>
              <CardDescription>
                Share your shorts, reels, or video content
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Info Alert */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                For short-form content (Reels/Shorts): Max 60 seconds, 100MB.
                For longer videos, please use YouTube/Vimeo and embed the link in a regular post.
              </AlertDescription>
            </Alert>

            {/* Community (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="community">Community (Optional)</Label>
              <Select
                value={communityId}
                onValueChange={setCommunityId}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a community (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {communities.map((community: any) => (
                    <SelectItem key={community.id} value={community.id}>
                      {community.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter video title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={category}
                onValueChange={setCategory}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add a description for your video..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* File Upload Area */}
            <div className="space-y-2">
              <Label>Video File *</Label>
              <div
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-colors
                  ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                  ${isSubmitting ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-primary/50'}
                `}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !isSubmitting && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_VIDEO_TYPES.join(',')}
                  onChange={handleInputChange}
                  className="hidden"
                  disabled={isSubmitting}
                />

                {!uploadedFile ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">
                        Drop your video here or click to browse
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        MP4, WebM, MOV up to 100MB
                      </p>
                      {category === 'short' && (
                        <p className="text-xs text-amber-600 mt-1">
                          Shorts must be 60 seconds or less
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                    {/* Video Preview */}
                    {uploadedFile.preview && (
                      <div className="aspect-video max-w-md mx-auto rounded-lg overflow-hidden bg-black">
                        <video
                          ref={videoRef}
                          src={uploadedFile.preview}
                          className="w-full h-full object-contain"
                          controls
                          muted
                        />
                      </div>
                    )}

                    {/* File Info */}
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg max-w-md mx-auto">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileVideo className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-sm truncate max-w-[200px]">
                            {uploadedFile.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(uploadedFile.file.size)}
                            {uploadedFile.duration && (
                              <> · {formatDuration(uploadedFile.duration)}</>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {uploadedFile.status === 'complete' && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                        {uploadedFile.status !== 'uploading' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeFile}
                            disabled={isSubmitting}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {uploadedFile.status === 'uploading' && (
                      <div className="space-y-2 max-w-md mx-auto">
                        <Progress value={uploadedFile.progress} className="h-2" />
                        <p className="text-sm text-muted-foreground text-center">
                          Uploading... {Math.round(uploadedFile.progress)}%
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Video
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
