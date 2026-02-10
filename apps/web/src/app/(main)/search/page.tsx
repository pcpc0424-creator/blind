'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layouts/main-layout';
import { PostCard } from '@/components/features/post-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import Link from 'next/link';

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  const initialQuery = searchParams.get('q') || '';
  const initialTag = searchParams.get('tag') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('posts');
  const [page, setPage] = useState(1);

  // Search posts
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['search-posts', initialQuery, initialTag, page],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit: 20 };
      if (initialQuery) params.search = initialQuery;
      if (initialTag) params.tag = initialTag;
      const response = await api.get<any[]>('/posts', params);
      return response;
    },
    enabled: !!(initialQuery || initialTag),
  });

  // Search companies
  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    queryKey: ['search-companies', initialQuery],
    queryFn: async () => {
      const response = await api.get<any[]>('/companies', {
        search: initialQuery,
        limit: 10,
      });
      return response;
    },
    enabled: !!initialQuery && activeTab === 'companies',
  });

  // Search communities
  const { data: communitiesData, isLoading: communitiesLoading } = useQuery({
    queryKey: ['search-communities', initialQuery],
    queryFn: async () => {
      const response = await api.get<any[]>('/communities', {
        search: initialQuery,
        limit: 10,
      });
      return response;
    },
    enabled: !!initialQuery && activeTab === 'communities',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const posts = postsData?.data || [];
  const companies = companiesData?.data || [];
  const communities = communitiesData?.data || [];

  return (
    <MainLayout>
      {/* Search header */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Enter search term"
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {(initialQuery || initialTag) && (
          <p className="mt-2 text-sm text-muted-foreground">
            {initialTag ? (
              <>
                Tag: <span className="font-medium">#{initialTag}</span>
              </>
            ) : (
              <>
                Results for &quot;{initialQuery}&quot;
              </>
            )}
          </p>
        )}
      </div>

      {/* Results tabs */}
      {(initialQuery || initialTag) && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="communities">Communities</TabsTrigger>
          </TabsList>

          {/* Posts results */}
          <TabsContent value="posts">
            <div className="space-y-4">
              {postsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No results found.</p>
                </div>
              ) : (
                <>
                  {posts.map((post: any) => (
                    <PostCard key={post.id} post={post} />
                  ))}
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
                </>
              )}
            </div>
          </TabsContent>

          {/* Companies results */}
          <TabsContent value="companies">
            <div className="space-y-4">
              {companiesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : companies.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No results found.</p>
                </div>
              ) : (
                companies.map((company: any) => (
                  <Card key={company.id}>
                    <CardContent className="py-4">
                      <Link
                        href={`/company/${company.slug}`}
                        className="flex items-center gap-4 hover:opacity-80"
                      >
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">
                          {company.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{company.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {company.industry || 'Industry not listed'}
                            {company.avgRating && (
                              <> · Rating {company.avgRating.toFixed(1)}</>
                            )}
                          </p>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Communities results */}
          <TabsContent value="communities">
            <div className="space-y-4">
              {communitiesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : communities.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No results found.</p>
                </div>
              ) : (
                communities.map((community: any) => (
                  <Card key={community.id}>
                    <CardContent className="py-4">
                      <Link
                        href={`/community/${community.slug}`}
                        className="flex items-center gap-4 hover:opacity-80"
                      >
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                          {community.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{community.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {community.memberCount} members · {community.postCount}{' '}
                            posts
                          </p>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Empty state */}
      {!initialQuery && !initialTag && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Enter a search term</h2>
          <p className="text-muted-foreground">
            Search for posts, companies, and communities
          </p>
        </div>
      )}
    </MainLayout>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </MainLayout>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
