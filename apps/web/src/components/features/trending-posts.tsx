'use client';

import Link from 'next/link';
import { TrendingUp, Flame, MessageSquare, ThumbsUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/utils';

interface TrendingPost {
  id: string;
  title: string;
  voteCount: number;
  commentCount: number;
  community: {
    name: string;
    slug: string;
  };
}

interface TrendingPostsProps {
  posts: TrendingPost[];
  isLoading?: boolean;
}

export function TrendingPosts({ posts, isLoading }: TrendingPostsProps) {
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flame className="h-5 w-5" />
            HOT Posts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-1" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flame className="h-5 w-5" />
            HOT Posts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center py-4">
            No trending posts yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-2.5 sm:py-3 px-3 sm:px-4">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Flame className="h-4 w-4 sm:h-5 sm:w-5" />
          HOT Posts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {posts.map((post, index) => (
            <li key={post.id}>
              <Link
                href={`/post/${post.id}`}
                className="flex gap-2 sm:gap-3 p-2.5 sm:p-3 hover:bg-muted/50 transition-colors"
              >
                <span className={`
                  flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-xs sm:text-sm font-bold shrink-0
                  ${index === 0 ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white' :
                    index === 1 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white' :
                    index === 2 ? 'bg-gradient-to-br from-yellow-400 to-orange-400 text-white' :
                    'bg-muted text-muted-foreground'}
                `}>
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium line-clamp-1 mb-0.5 sm:mb-1">
                    {post.title}
                  </p>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0">
                      {post.community.name}
                    </Badge>
                    <span className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
                      <ThumbsUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      {formatNumber(post.voteCount)}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground">
                      <MessageSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      {formatNumber(post.commentCount)}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
