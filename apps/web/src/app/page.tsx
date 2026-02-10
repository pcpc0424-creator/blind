'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { MainLayout } from '@/components/layouts/main-layout';
import { PostCard } from '@/components/features/post-card';
import { TrendingPosts } from '@/components/features/trending-posts';
import { AdBanner, useAds } from '@/components/features/ad-banner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  PenSquare,
  Loader2,
  Flame,
  TrendingUp,
  Clock,
  Users,
  Coffee,
  Briefcase,
  Laptop,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Eye,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

type SortOption = 'latest' | 'popular' | 'trending';

const quickLinks = [
  { href: '/community/free-talk', label: 'Free Talk', icon: Coffee, color: 'bg-orange-500', count: '10' },
  { href: '/community/career', label: 'Career', icon: Briefcase, color: 'bg-green-500', count: '6' },
  { href: '/community/tech-talk', label: 'Tech Lounge', icon: Laptop, color: 'bg-cyan-500', count: '7' },
];

const stats = [
  { label: 'Posts Today', value: '33', icon: MessageSquare, color: 'text-blue-500' },
  { label: 'Active Users', value: '128', icon: Users, color: 'text-green-500' },
  { label: 'Comments Today', value: '89', icon: MessageSquare, color: 'text-purple-500' },
];

export default function HomePage() {
  const [sort, setSort] = useState<SortOption>('latest');
  const [page, setPage] = useState(1);
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch posts
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', sort, page],
    queryFn: async () => {
      const response = await api.get<any[]>('/posts', { sort, page, limit: 20 });
      return response;
    },
  });

  // Fetch trending posts
  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ['posts', 'trending'],
    queryFn: async () => {
      const response = await api.get<any[]>('/posts/trending', { limit: 5 });
      return response;
    },
  });

  // Fetch communities
  const { data: communitiesData } = useQuery({
    queryKey: ['communities'],
    queryFn: async () => {
      const response = await api.get<any[]>('/communities', { limit: 5 });
      return response;
    },
  });

  const posts = postsData?.data || [];
  const trendingPosts = trendingData?.data || [];
  const communities = communitiesData?.data || [];

  // Fetch ads for home page
  const { data: ads = [] } = useAds('HOME');

  // Insert ads every 4 posts
  const renderPostsWithAds = () => {
    const result: React.ReactNode[] = [];
    let adIndex = 0;

    posts.forEach((post: any, index: number) => {
      result.push(<PostCard key={post.id} post={post} />);

      // Insert ad after every 4 posts
      if ((index + 1) % 4 === 0 && ads[adIndex]) {
        result.push(
          <div key={`ad-${adIndex}`} className="my-1">
            <AdBanner ad={ads[adIndex]} variant="inline" />
          </div>
        );
        adIndex = (adIndex + 1) % ads.length;
      }
    });

    return result;
  };

  return (
    <MainLayout
      rightPanel={
        <div className="space-y-4 sticky top-20">
          {/* Trending Posts */}
          <TrendingPosts posts={trendingPosts} isLoading={trendingLoading} />

          {/* Recommended Communities */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Recommended
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {communities.slice(0, 4).map((community: any) => (
                <Link
                  key={community.id}
                  href={`/community/${community.slug}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {community.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{community.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {community.memberCount} members · {community.postCount} posts
                    </p>
                  </div>
                </Link>
              ))}
              <Button variant="ghost" className="w-full mt-2 text-primary" asChild>
                <Link href="/communities">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Today's Stats */}
          <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Today's Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center p-2">
                    <stat.icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
                    <p className="text-lg font-bold">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      {/* Welcome Banner - Not logged in */}
      {!isAuthenticated && (
        <Card className="mb-4 sm:mb-6 overflow-hidden bg-gradient-to-r from-primary via-purple-600 to-pink-500 text-white border-0">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg sm:text-2xl font-bold mb-1.5 sm:mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
                  Anonymous Workplace Community
                </h1>
                <p className="text-white/80 mb-3 sm:mb-4 text-sm sm:text-base">
                  Have honest conversations with your colleagues.
                </p>
                <div className="flex gap-2 sm:gap-3">
                  <Button size="sm" variant="secondary" className="bg-white text-primary hover:bg-white/90 text-xs sm:text-sm h-8 sm:h-9" asChild>
                    <Link href="/register">
                      Get Started Free
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" className="text-white border-white/30 hover:bg-white/10 text-xs sm:text-sm h-8 sm:h-9" asChild>
                    <Link href="/login">
                      Sign In
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-white/10 flex items-center justify-center">
                  <Eye className="h-12 w-12 lg:h-16 lg:w-16 text-white/80" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logged in - Simple greeting */}
      {isAuthenticated && (
        <Card className="mb-4 sm:mb-6 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
          <CardContent className="py-3 sm:py-4 px-3 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm sm:text-base truncate">Have a great day! 👋</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">New stories are waiting for you</p>
                </div>
              </div>
              <Button size="sm" className="bg-gradient-to-r from-primary to-purple-600 shrink-0 h-8 sm:h-9" asChild>
                <Link href="/write">
                  <PenSquare className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Write</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group relative overflow-hidden rounded-lg sm:rounded-xl border bg-card p-2.5 sm:p-4 hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            <div className={`absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 ${link.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform`} />
            <div className="relative">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${link.color} flex items-center justify-center mb-2 sm:mb-3`}>
                <link.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <p className="font-semibold text-xs sm:text-sm truncate">{link.label}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{link.count} posts</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Feed Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <Tabs
            value={sort}
            onValueChange={(value) => {
              setSort(value as SortOption);
              setPage(1);
            }}
          >
            <TabsList className="bg-muted/50 h-8 sm:h-9">
              <TabsTrigger value="latest" className="gap-1 sm:gap-1.5 data-[state=active]:bg-background text-xs sm:text-sm px-2 sm:px-3">
                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Latest
              </TabsTrigger>
              <TabsTrigger value="popular" className="gap-1 sm:gap-1.5 data-[state=active]:bg-background text-xs sm:text-sm px-2 sm:px-3">
                <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Popular
              </TabsTrigger>
              <TabsTrigger value="trending" className="gap-1 sm:gap-1.5 data-[state=active]:bg-background text-xs sm:text-sm px-2 sm:px-3">
                <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                HOT
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Badge variant="secondary" className="text-[10px] sm:text-xs hidden sm:flex">
          {postsData?.meta?.total || 0} posts total
        </Badge>
      </div>

      {/* Posts feed */}
      <div className="space-y-2 sm:space-y-3">
        {postsLoading ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12">
            <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary mb-3 sm:mb-4" />
            <p className="text-muted-foreground text-sm sm:text-base">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <Card className="py-8 sm:py-12">
            <CardContent className="text-center px-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <p className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">No posts yet</p>
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">Be the first to write a post!</p>
              {isAuthenticated && (
                <Button size="sm" asChild>
                  <Link href="/write">
                    <PenSquare className="h-4 w-4 mr-2" />
                    Write
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          renderPostsWithAds()
        )}
      </div>

      {/* Load more */}
      {postsData?.meta?.hasNext && (
        <div className="flex justify-center mt-4 sm:mt-6">
          <Button
            variant="outline"
            size="default"
            className="rounded-full px-6 sm:px-8 h-9 sm:h-10 text-sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={postsLoading}
          >
            {postsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            Load More
          </Button>
        </div>
      )}
    </MainLayout>
  );
}
