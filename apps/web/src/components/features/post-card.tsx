'use client';

import Link from 'next/link';
import { MessageSquare, Eye, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn, formatRelativeTime, formatNumber, maskCompanyName } from '@/lib/utils';

interface PostCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    isAnonymous: boolean;
    viewCount: number;
    voteCount: number;
    commentCount: number;
    createdAt: string;
    author: {
      id: string;
      nickname: string;
      isAnonymous: boolean;
      company?: {
        id: string;
        name: string;
        slug: string;
        industry?: string | null;
      } | null;
    };
    community: {
      name: string;
      slug: string;
    };
    tags?: { name: string; slug: string }[];
    hasMedia?: boolean;
  };
}

export function PostCard({ post }: PostCardProps) {
  const isHot = post.commentCount >= 10;

  return (
    <Card className={cn(
      'group hover:shadow-lg transition-all duration-200 overflow-hidden',
      isHot && 'ring-1 ring-orange-200 bg-gradient-to-r from-orange-50/50 to-transparent'
    )}>
      <CardContent className="p-0">
        <div className="flex">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <Link href={`/post/${post.id}`} className="block p-3 sm:p-4">
              {/* Header */}
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-[10px] sm:text-xs font-medium px-1.5 sm:px-2',
                    post.community.slug === 'free-talk' && 'bg-orange-100 text-orange-700',
                    post.community.slug === 'career' && 'bg-green-100 text-green-700',
                    post.community.slug === 'tech-talk' && 'bg-cyan-100 text-cyan-700',
                    post.community.slug === 'stock' && 'bg-emerald-100 text-emerald-700',
                    post.community.slug === 'it-industry' && 'bg-purple-100 text-purple-700',
                    post.community.slug === 'finance-industry' && 'bg-yellow-100 text-yellow-700',
                  )}
                >
                  {post.community.name}
                </Badge>
                {isHot && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2">
                    HOT
                  </Badge>
                )}
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  {formatRelativeTime(post.createdAt)}
                </span>
                {post.hasMedia && (
                  <ImageIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground ml-auto" />
                )}
              </div>

              {/* Title */}
              <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
                {post.title}
              </h3>

              {/* Content Preview */}
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2 sm:mb-3">
                {post.content}
              </p>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2 sm:mb-3">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag.slug}
                      className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-primary/5 text-primary rounded-full hover:bg-primary/10 transition-colors"
                    >
                      #{tag.name}
                    </span>
                  ))}
                  {post.tags.length > 3 && (
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      +{post.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                    <AvatarFallback className={cn(
                      'text-[9px] sm:text-[10px]',
                      post.author.isAnonymous ? 'bg-muted' : 'bg-primary/10 text-primary'
                    )}>
                      {post.author.isAnonymous
                        ? post.author.company?.name?.charAt(0) || 'A'
                        : post.author.nickname.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    {post.author.isAnonymous
                      ? post.author.company
                        ? maskCompanyName(post.author.company.name, post.author.company.industry)
                        : 'Anonymous'
                      : post.author.nickname}
                  </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground">
                  <span className="flex items-center gap-0.5 sm:gap-1">
                    <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    {formatNumber(post.commentCount)}
                  </span>
                  <span className="flex items-center gap-0.5 sm:gap-1">
                    <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    {formatNumber(post.viewCount)}
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
