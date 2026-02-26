'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Users, Lock, PenSquare, Loader2, Film, ShieldAlert } from 'lucide-react';
import { MainLayout } from '@/components/layouts/main-layout';
import { PostCard } from '@/components/features/post-card';
import { PromoBanner, usePromos, PromoData } from '@/components/features/promo-banner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { formatNumber } from '@/lib/utils';

type SortOption = 'latest' | 'popular' | 'trending';

export default function CommunityPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [sort, setSort] = useState<SortOption>('latest');
  const [page, setPage] = useState(1);
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch community
  const { data: communityData, isLoading: communityLoading, error: communityError } = useQuery({
    queryKey: ['community', slug],
    queryFn: async () => {
      const response = await api.get<any>(`/communities/${slug}`);
      return response.data;
    },
  });

  // Check if error is access denied (403)
  const isAccessDenied = communityError && (communityError as any)?.response?.status === 403;

  // Determine promo placement based on community type
  const getPlacement = () => {
    if (!communityData) return 'ALL';
    switch (communityData.type) {
      case 'COMPANY':
        return 'COMPANY';
      case 'PUBLIC_SERVANT':
        return 'PUBLIC_SERVANT';
      case 'INTEREST':
        return 'INTEREST';
      default:
        return 'ALL';
    }
  };

  // Fetch promos for this placement (must be before early returns)
  const { data: promos = [] } = usePromos(getPlacement());

  // Fetch posts
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['community-posts', slug, sort, page],
    queryFn: async () => {
      if (!communityData?.id) return { data: [], meta: { hasNext: false, hasPrev: false, page: 1, limit: 20, total: 0, totalPages: 0 } };
      const response = await api.get<any[]>('/posts', {
        communityId: communityData.id,
        sort,
        page,
        limit: 20,
      });
      return response;
    },
    enabled: !!communityData?.id,
  });

  // Join mutation
  const joinMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/communities/${slug}/join`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', slug] });
      queryClient.invalidateQueries({ queryKey: ['my-communities'] });
    },
  });

  // Leave mutation
  const leaveMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/communities/${slug}/leave`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', slug] });
      queryClient.invalidateQueries({ queryKey: ['my-communities'] });
    },
  });

  const handleJoinLeave = () => {
    if (!isAuthenticated) return;
    if (communityData?.isMember) {
      leaveMutation.mutate();
    } else {
      joinMutation.mutate();
    }
  };

  if (communityLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (isAccessDenied) {
    return (
      <MainLayout>
        <Card className="max-w-md mx-auto mt-12">
          <CardContent className="py-8 text-center">
            <ShieldAlert className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground mb-4">
              This community is only accessible to verified employees of this company.
            </p>
            <Button variant="outline" asChild>
              <Link href="/communities">Browse Communities</Link>
            </Button>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  if (!communityData) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Community not found.</p>
        </div>
      </MainLayout>
    );
  }

  const community = communityData;
  const posts = postsData?.data || [];

  // Insert promos every 4 posts
  const renderPostsWithPromos = () => {
    const result: React.ReactNode[] = [];
    let promoIndex = 0;

    posts.forEach((post: any, index: number) => {
      result.push(<PostCard key={post.id} post={post} />);

      // Insert promo after every 4 posts
      if ((index + 1) % 4 === 0 && promos[promoIndex]) {
        result.push(
          <div key={`promo-${promoIndex}`} className="my-2">
            <PromoBanner promo={promos[promoIndex]} variant="inline" />
          </div>
        );
        promoIndex = (promoIndex + 1) % promos.length;
      }
    });

    return result;
  };

  return (
    <MainLayout
      rightPanel={
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Community Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {community.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{community.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {community.type === 'COMPANY' ? 'Company' : 'General'} Community
                </p>
              </div>
            </div>
            {community.description && (
              <p className="text-sm text-muted-foreground">
                {community.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{formatNumber(community.memberCount)} members</span>
              </div>
              {community.isPrivate && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Private</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      }
    >
      {/* Community header */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {community.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{community.name}</h1>
                {community.description && (
                  <p className="text-muted-foreground mt-1">
                    {community.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>{formatNumber(community.memberCount)} members</span>
                  <span>{formatNumber(community.postCount)} posts</span>
                </div>
              </div>
            </div>
            {isAuthenticated && (
              <Button
                variant={community.isMember ? 'outline' : 'default'}
                onClick={handleJoinLeave}
                disabled={joinMutation.isPending || leaveMutation.isPending}
              >
                {(joinMutation.isPending || leaveMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {community.isMember ? 'Leave' : 'Join'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Posts section */}
      <div className="flex items-center justify-between mb-4">
        <Tabs
          value={sort}
          onValueChange={(value) => {
            setSort(value as SortOption);
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="latest">Latest</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="trending">HOT</TabsTrigger>
          </TabsList>
        </Tabs>

        {isAuthenticated && community.isMember && (
          <div className="flex items-center gap-2">
            {slug === 'local' && (
              <Button variant="outline" asChild>
                <Link href="/community/local/movie-upload">
                  <Film className="mr-2 h-4 w-4" />
                  Upload Movie
                </Link>
              </Button>
            )}
            <Button asChild>
              <Link href={`/write?community=${slug}`}>
                <PenSquare className="mr-2 h-4 w-4" />
                Write
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Posts list */}
      <div className="space-y-4">
        {postsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts yet.</p>
            {isAuthenticated && community.isMember && (
              <Button variant="link" asChild>
                <Link href={`/write?community=${slug}`}>
                  Be the first to write a post
                </Link>
              </Button>
            )}
          </div>
        ) : (
          renderPostsWithPromos()
        )}
      </div>

      {/* Load more */}
      {postsData?.meta?.hasNext && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={postsLoading}
          >
            Load More
          </Button>
        </div>
      )}
    </MainLayout>
  );
}
