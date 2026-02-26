'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  Users,
  MessageSquare,
  FileText,
  ChevronRight,
  Loader2,
  Lightbulb,
  TrendingUp,
  Briefcase,
  Heart,
  Gamepad2,
  BookOpen,
  Plane,
  Home,
  Flame,
  Eye,
  ThumbsUp,
  Clock,
  ArrowLeft,
  Plus,
  PenSquare,
} from 'lucide-react';
import { MainLayout } from '@/components/layouts/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PromoBanner, usePromos } from '@/components/features/promo-banner';
import { api } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';

interface InterestCategoryDetail {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  description: string | null;
  color: string | null;
  parent: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
  } | null;
  children: Array<{
    id: string;
    name: string;
    slug: string;
    iconUrl: string | null;
    description: string | null;
    color: string | null;
    communityCount: number;
  }>;
  communities: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    memberCount: number;
    postCount: number;
    iconUrl: string | null;
  }>;
  totalMembers: number;
  totalPosts: number;
  communityCount: number;
  childCount: number;
}

interface HotPost {
  id: string;
  title: string;
  preview: string;
  viewCount: number;
  voteCount: number;
  commentCount: number;
  createdAt: string;
  authorNickname: string;
  community: {
    id: string;
    name: string;
    slug: string;
  };
}

const categoryIcons: Record<string, any> = {
  'tech': Lightbulb,
  'investment': TrendingUp,
  'career': Briefcase,
  'lifestyle': Heart,
  'gaming': Gamepad2,
  'study': BookOpen,
  'travel': Plane,
  'real-estate': Home,
};

export default function InterestDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { isAuthenticated } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['interest', slug],
    queryFn: async () => {
      const response = await api.get<InterestCategoryDetail>(`/interests/${slug}`);
      return response.data!;
    },
  });

  const { data: hotPosts, isLoading: hotPostsLoading } = useQuery({
    queryKey: ['interest-hot-posts', slug],
    queryFn: async () => {
      const response = await api.get<HotPost[]>(`/interests/${slug}/hot-posts?limit=10`);
      return response.data!;
    },
    enabled: !!data,
  });

  // Fetch promos for interest pages (must be before early returns)
  const { data: promos = [] } = usePromos('INTEREST');

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="py-12 text-center">
          <h1 className="text-2xl font-bold mb-2">Category not found</h1>
          <p className="text-muted-foreground mb-4">
            The interest category you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link href="/interests">Back to Interests</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const category = data;
  const Icon = categoryIcons[category.slug] || Sparkles;
  const bgColor = category.color || '#8b5cf6';

  // Insert promos every 4 posts in hot posts list
  const renderHotPostsWithPromos = () => {
    if (!hotPosts || hotPosts.length === 0) return null;

    const result: React.ReactNode[] = [];
    let promoIndex = 0;

    hotPosts.forEach((post, index) => {
      result.push(
        <Link key={post.id} href={`/post/${post.id}`}>
          <Card className="hover:shadow-md transition-all hover:border-primary/50 cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold line-clamp-1">{post.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {post.preview}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(post.createdAt)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {post.community.name}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground shrink-0">
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
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      );

      // Insert promo after every 4 posts
      if ((index + 1) % 4 === 0 && promos[promoIndex]) {
        result.push(
          <div key={`promo-${promoIndex}`} className="my-1">
            <PromoBanner promo={promos[promoIndex]} variant="inline" />
          </div>
        );
        promoIndex = (promoIndex + 1) % promos.length;
      }
    });

    return result;
  };

  return (
    <MainLayout>
    <div className="max-w-6xl">
      {/* Breadcrumb */}
      {category.parent && (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <Link href="/interests" className="text-muted-foreground hover:text-foreground">
            Interests
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Link href={`/interest/${category.parent.slug}`} className="text-muted-foreground hover:text-foreground">
            {category.parent.name}
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{category.name}</span>
        </div>
      )}

      {/* Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div
              className="w-20 h-20 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${bgColor}20` }}
            >
              <Icon className="h-10 w-10" style={{ color: bgColor }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{category.name}</h1>
                <Badge style={{ backgroundColor: bgColor }}>Interest</Badge>
              </div>
              {category.description && (
                <p className="text-muted-foreground">{category.description}</p>
              )}
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-xl min-w-[140px]">
              <div className="flex items-center gap-2 text-2xl font-bold" style={{ color: bgColor }}>
                <MessageSquare className="h-6 w-6" />
                {category.communityCount}
              </div>
              <p className="text-sm text-muted-foreground">
                communities
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="hot">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="hot">
                <Flame className="h-4 w-4 mr-1" />
                Hot Posts
              </TabsTrigger>
              {category.childCount > 0 && (
                <TabsTrigger value="subcategories">
                  Subcategories ({category.childCount})
                </TabsTrigger>
              )}
              <TabsTrigger value="communities">
                Communities ({category.communityCount})
              </TabsTrigger>
            </TabsList>

            {/* Hot Posts Tab */}
            <TabsContent value="hot" className="space-y-3 mt-6">
              {hotPostsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !hotPosts || hotPosts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No posts yet. Be the first to write!
                  </CardContent>
                </Card>
              ) : (
                renderHotPostsWithPromos()
              )}
            </TabsContent>

            {/* Subcategories Tab */}
            {category.childCount > 0 && (
              <TabsContent value="subcategories" className="space-y-3 mt-6">
                <div className="grid gap-3 md:grid-cols-2">
                  {category.children.map((child) => {
                    const ChildIcon = categoryIcons[child.slug] || Sparkles;
                    const childColor = child.color || bgColor;
                    return (
                      <Link key={child.id} href={`/interest/${child.slug}`}>
                        <Card className="hover:shadow-md transition-all hover:border-primary/50 cursor-pointer h-full">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="p-2 rounded-lg shrink-0"
                                style={{ backgroundColor: `${childColor}20` }}
                              >
                                <ChildIcon className="h-5 w-5" style={{ color: childColor }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold">{child.name}</h3>
                                {child.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {child.description}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {child.communityCount} communities
                                </p>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </TabsContent>
            )}

            {/* Communities Tab */}
            <TabsContent value="communities" className="space-y-3 mt-6">
              {category.communities.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No communities in this category yet.
                  </CardContent>
                </Card>
              ) : (
                category.communities.map((community) => (
                  <Link key={community.id} href={`/community/${community.slug}`}>
                    <Card className="hover:shadow-md transition-all hover:border-primary/50 cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="p-2 rounded-lg"
                              style={{ backgroundColor: `${bgColor}20` }}
                            >
                              <MessageSquare className="h-5 w-5" style={{ color: bgColor }} />
                            </div>
                            <div>
                              <h3 className="font-semibold">{community.name}</h3>
                              {community.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {community.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {community.memberCount} members
                                </span>
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {community.postCount} posts
                                </span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {category.childCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subcategories</span>
                  <span className="font-semibold">{category.childCount}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Communities</span>
                <span className="font-semibold">{category.communityCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Members</span>
                <span className="font-semibold">{category.totalMembers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Posts</span>
                <span className="font-semibold">{category.totalPosts}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {category.communities.length > 0 && isAuthenticated && (
                <Button className="w-full" asChild>
                  <Link href={`/write?community=${category.communities[0].slug}`}>
                    <PenSquare className="h-4 w-4 mr-2" />
                    Write Post
                  </Link>
                </Button>
              )}
              {category.communities.length > 0 && (
                <Button className="w-full" variant={isAuthenticated ? "outline" : "default"} asChild>
                  <Link href={`/community/${category.communities[0].slug}`}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Join a Community
                  </Link>
                </Button>
              )}
              <Button className="w-full" variant="outline" asChild>
                <Link href={`/request-community?type=INTEREST&categoryId=${category.id}&categoryName=${encodeURIComponent(category.name)}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Request New Community
                </Link>
              </Button>
              {category.parent ? (
                <Button className="w-full" variant="ghost" asChild>
                  <Link href={`/interest/${category.parent.slug}`}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to {category.parent.name}
                  </Link>
                </Button>
              ) : (
                <Button className="w-full" variant="ghost" asChild>
                  <Link href="/interests">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Browse All Interests
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </MainLayout>
  );
}
