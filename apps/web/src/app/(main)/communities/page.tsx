'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { MainLayout } from '@/components/layouts/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Search,
  Users,
  MessageSquare,
  TrendingUp,
  Loader2,
  Coffee,
  Briefcase,
  PieChart,
  Laptop,
  Banknote,
  Hash,
  MapPin,
  Building2,
  Flame,
} from 'lucide-react';
import { api } from '@/lib/api';

const communityCategories = [
  {
    slug: 'free-talk',
    name: 'Free Talk',
    description: 'A space for free discussions',
    icon: Coffee,
    color: 'bg-orange-500',
    memberCount: 15420,
    postCount: 3240,
  },
  {
    slug: 'career',
    name: 'Career',
    description: 'Job changes, salary, career advice',
    icon: Briefcase,
    color: 'bg-green-500',
    memberCount: 12350,
    postCount: 2180,
  },
  {
    slug: 'stock',
    name: 'Stocks & Investing',
    description: 'Stocks, crypto, real estate discussions',
    icon: PieChart,
    color: 'bg-emerald-500',
    memberCount: 8920,
    postCount: 1560,
  },
  {
    slug: 'it-industry',
    name: 'IT Industry',
    description: 'Stories from IT/Tech professionals',
    icon: Laptop,
    color: 'bg-purple-500',
    memberCount: 21340,
    postCount: 4520,
  },
  {
    slug: 'finance-industry',
    name: 'Finance Industry',
    description: 'Community for finance professionals',
    icon: Banknote,
    color: 'bg-yellow-500',
    memberCount: 9870,
    postCount: 1890,
  },
  {
    slug: 'tech-talk',
    name: 'Tech Lounge',
    description: 'Technical discussions for developers',
    icon: Hash,
    color: 'bg-cyan-500',
    memberCount: 18650,
    postCount: 3890,
  },
  {
    slug: 'local',
    name: 'Local',
    description: 'Local discussions and movie uploads',
    icon: MapPin,
    color: 'bg-red-500',
    memberCount: 25430,
    postCount: 5120,
  },
];

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export default function CommunitiesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCommunities = communityCategories.filter(
    (community) =>
      community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      community.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          All Communities
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Join communities you're interested in and share stories
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search communities..."
            className="pl-10 h-10 rounded-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10">
          <CardContent className="p-3 sm:p-4 text-center">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 text-primary" />
            <p className="text-lg sm:text-xl font-bold">112K+</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Total Members</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10">
          <CardContent className="p-3 sm:p-4 text-center">
            <Flame className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 text-orange-500" />
            <p className="text-lg sm:text-xl font-bold">7</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Active Communities</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
          <CardContent className="p-3 sm:p-4 text-center">
            <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 text-green-500" />
            <p className="text-lg sm:text-xl font-bold">22K+</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Posts Today</p>
          </CardContent>
        </Card>
      </div>

      {/* Community List */}
      <div className="space-y-3">
        {filteredCommunities.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold mb-2">No results found</p>
              <p className="text-muted-foreground">Try searching with different keywords</p>
            </CardContent>
          </Card>
        ) : (
          filteredCommunities.map((community) => (
            <Link key={community.slug} href={`/community/${community.slug}`}>
              <Card className="hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${community.color} flex items-center justify-center shrink-0`}>
                      <community.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm sm:text-base">{community.name}</h3>
                        {community.slug === 'free-talk' && (
                          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px]">
                            HOT
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mb-2">
                        {community.description}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] sm:text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {formatNumber(community.memberCount)} members
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {formatNumber(community.postCount)} posts
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0 hidden sm:flex">
                      Visit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </MainLayout>
  );
}
