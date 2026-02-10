'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Building2, Search, Star, Users, ChevronRight, Loader2, Pin, Sparkles } from 'lucide-react';
import { MainLayout } from '@/components/layouts/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useDebounce } from '@/hooks/use-debounce';

interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  industry: string | null;
  size: string | null;
  isVerified: boolean;
  avgRating: number | null;
  totalReviews: number;
  isPinned?: boolean;
  isSponsored?: boolean;
}

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isVerified: boolean;
}

const sizeLabels: Record<string, string> = {
  STARTUP: '1-50',
  SMALL: '51-200',
  MEDIUM: '201-1000',
  LARGE: '1001-5000',
  ENTERPRISE: '5000+',
};

export default function CompaniesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(search, 300);

  // Main companies list query
  const { data, isLoading, error } = useQuery({
    queryKey: ['companies', debouncedSearch, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      params.append('page', page.toString());
      params.append('limit', '12');

      const response = await api.get<Company[]>(`/companies?${params.toString()}`);
      return response;
    },
  });

  // Search autocomplete query
  const { data: suggestions } = useQuery({
    queryKey: ['companySuggestions', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return [];
      const response = await api.get<SearchResult[]>(`/companies/search?q=${encodeURIComponent(debouncedSearch)}&limit=5`);
      return response.data || [];
    },
    enabled: debouncedSearch.length >= 2 && showSuggestions,
  });

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const companies = data?.data || [];
  const meta = data?.meta;

  return (
    <MainLayout>
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <Building2 className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Company Hall</h1>
            <p className="text-muted-foreground">
              Explore companies, read reviews, and join company communities
            </p>
          </div>
        </div>

        {/* Search with Autocomplete */}
        <div className="relative max-w-md" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            placeholder="Search company name..."
            className="pl-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
          />
          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 overflow-hidden">
              {suggestions.map((company) => (
                <Link
                  key={company.id}
                  href={`/company/${company.slug}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
                  onClick={() => setShowSuggestions(false)}
                >
                  <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center shrink-0">
                    {company.logoUrl ? (
                      <img src={company.logoUrl} alt="" className="w-5 h-5 object-contain" />
                    ) : (
                      <Building2 className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <span className="font-medium">{company.name}</span>
                  {company.isVerified && (
                    <Badge variant="secondary" className="text-xs">Verified</Badge>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Companies Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-muted-foreground">
          Failed to load companies. Please try again.
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No companies found.
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <Link key={company.id} href={`/company/${company.slug}`}>
                <Card className={`h-full hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer ${
                  company.isPinned ? 'border-yellow-400 bg-yellow-50/30' :
                  company.isSponsored ? 'border-blue-400 bg-blue-50/30' : ''
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center relative">
                          {company.logoUrl ? (
                            <img
                              src={company.logoUrl}
                              alt={company.name}
                              className="w-8 h-8 object-contain"
                            />
                          ) : (
                            <Building2 className="h-6 w-6 text-blue-500" />
                          )}
                          {company.isPinned && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                              <Pin className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {company.name}
                            {company.isVerified && (
                              <Badge variant="secondary" className="text-xs">
                                Verified
                              </Badge>
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {company.industry && (
                              <p className="text-sm text-muted-foreground">
                                {company.industry}
                              </p>
                            )}
                            {company.isSponsored && (
                              <Badge className="text-xs bg-blue-500 hover:bg-blue-600">
                                <Sparkles className="h-2.5 w-2.5 mr-1" />
                                AD
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">
                            {company.avgRating?.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{company.totalReviews} reviews</span>
                        </div>
                      </div>
                      {company.size && (
                        <Badge variant="outline" className="text-xs">
                          {sizeLabels[company.size] || company.size}
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
            ))}
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
