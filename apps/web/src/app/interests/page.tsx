'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  Search,
  Users,
  MessageSquare,
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
  Plus,
} from 'lucide-react';
import { MainLayout } from '@/components/layouts/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface InterestCategory {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  description: string | null;
  color: string | null;
  parentId: string | null;
  communityCount: number;
  childCount: number;
  children: Array<{
    id: string;
    name: string;
    slug: string;
    iconUrl: string | null;
    color: string | null;
  }>;
  totalMembers: number;
  totalPosts: number;
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

export default function InterestsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['interests', search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      } else {
        // Only show top-level categories when not searching
        params.append('parentId', 'null');
      }
      params.append('page', page.toString());
      params.append('limit', '12');

      const response = await api.get<InterestCategory[]>(`/interests?${params.toString()}`);
      return response;
    },
  });

  const categories = data?.data || [];
  const meta = data?.meta;

  return (
    <MainLayout>
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Interests</h1>
              <p className="text-muted-foreground">
                Discover communities based on your interests and hobbies
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/request-community?type=INTEREST">
              <Plus className="h-4 w-4 mr-2" />
              Request New
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search interests..."
            className="pl-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-muted-foreground">
          Failed to load categories. Please try again.
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No interest categories found.
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const Icon = categoryIcons[category.slug] || Sparkles;
              const bgColor = category.color || '#8b5cf6';
              return (
                <Link key={category.id} href={`/interest/${category.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${bgColor}20` }}
                        >
                          <Icon className="h-6 w-6" style={{ color: bgColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          {category.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Subcategories Preview */}
                      {category.children && category.children.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {category.children.slice(0, 4).map((child) => (
                            <Badge
                              key={child.id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {child.name}
                            </Badge>
                          ))}
                          {category.childCount > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{category.childCount - 4} more
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MessageSquare className="h-4 w-4" />
                            <span>{category.communityCount}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{category.totalMembers}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center text-primary text-sm font-medium">
                        Explore
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasPrev}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-4">
                Page {meta.page} of {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
    </MainLayout>
  );
}
