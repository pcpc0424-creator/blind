'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  Search,
  Star,
  Users,
  ChevronRight,
  Loader2,
  Flame,
  Stethoscope,
  GraduationCap,
  Landmark,
  Mail,
  Calculator,
  Swords,
} from 'lucide-react';
import { MainLayout } from '@/components/layouts/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface PublicServantCategory {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  description: string | null;
  avgRating: number | null;
  totalReviews: number;
  communityCount: number;
}

const categoryIcons: Record<string, any> = {
  police: Shield,
  firefighter: Flame,
  teacher: GraduationCap,
  military: Swords,
  'government-admin': Landmark,
  healthcare: Stethoscope,
  postal: Mail,
  'tax-office': Calculator,
};

export default function PublicServantsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-servants', search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('limit', '12');

      const response = await api.get<PublicServantCategory[]>(`/public-servants?${params.toString()}`);
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
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
            <Shield className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Public Servants</h1>
            <p className="text-muted-foreground">
              Connect with fellow public servants, share experiences, and read reviews
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
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
          No categories found.
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const Icon = categoryIcons[category.slug] || Shield;
              return (
                <Link key={category.id} href={`/public-servant/${category.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
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
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium">
                              {category.avgRating?.toFixed(1) || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{category.totalReviews} reviews</span>
                          </div>
                        </div>
                        {category.communityCount > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {category.communityCount} community
                          </Badge>
                        )}
                      </div>
                      <div className="mt-3 flex items-center text-primary text-sm font-medium">
                        View Details
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
