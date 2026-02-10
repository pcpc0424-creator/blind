'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  Star,
  Users,
  MessageSquare,
  FileText,
  Heart,
  TrendingUp,
  Clock,
  ChevronRight,
  Loader2,
  Briefcase,
  Target,
  Flame,
  Stethoscope,
  GraduationCap,
  Landmark,
  Mail,
  Calculator,
  Swords,
  PenSquare,
} from 'lucide-react';
import { MainLayout } from '@/components/layouts/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { ReviewModal } from '@/components/features/review-modal';

interface PublicServantDetail {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  description: string | null;
  avgRating: number | null;
  totalReviews: number;
  avgWorkLife: number | null;
  avgSalary: number | null;
  avgStability: number | null;
  avgGrowth: number | null;
  communities: Array<{
    id: string;
    name: string;
    slug: string;
    memberCount: number;
    postCount: number;
  }>;
  recentReviews: Array<{
    id: string;
    title: string;
    overallRating: number;
    pros: string;
    cons: string;
    position: string | null;
    createdAt: string;
  }>;
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

function RatingBar({ label, value, icon: Icon }: { label: string; value: number | null; icon: any }) {
  const displayValue = value || 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span>{label}</span>
        </div>
        <span className="font-medium">{displayValue.toFixed(1)}</span>
      </div>
      <Progress value={displayValue * 20} className="h-2" />
    </div>
  );
}

export default function PublicServantDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { isAuthenticated } = useAuthStore();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-servant', slug],
    queryFn: async () => {
      const response = await api.get<PublicServantDetail>(`/public-servants/${slug}`);
      return response.data!;
    },
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', 'public-servant', data?.id],
    queryFn: async () => {
      const response = await api.get<{ reviews: any[]; meta: any }>(
        `/reviews/public-servant/${data!.id}`
      );
      return response.data!;
    },
    enabled: !!data?.id,
  });

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
            The category you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link href="/public-servants">Back to Public Servants</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const category = data;
  const Icon = categoryIcons[category.slug] || Shield;

  return (
    <MainLayout>
    <div className="max-w-6xl">
      {/* Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center shrink-0">
              <Icon className="h-10 w-10 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{category.name}</h1>
                <Badge className="bg-green-500">Public Servant</Badge>
              </div>
              {category.description && (
                <p className="text-muted-foreground">{category.description}</p>
              )}
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-xl min-w-[120px]">
              <div className="flex items-center gap-1 text-3xl font-bold text-yellow-500">
                <Star className="h-8 w-8 fill-yellow-500" />
                {category.avgRating?.toFixed(1) || 'N/A'}
              </div>
              <p className="text-sm text-muted-foreground">
                {category.totalReviews} reviews
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="community">Community</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Rating Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Rating Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RatingBar label="Work-Life Balance" value={category.avgWorkLife} icon={Heart} />
                  <RatingBar label="Salary & Benefits" value={category.avgSalary} icon={TrendingUp} />
                  <RatingBar label="Job Stability" value={category.avgStability} icon={Shield} />
                  <RatingBar label="Career Growth" value={category.avgGrowth} icon={Target} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4 mt-6">
              {isAuthenticated && (
                <Button onClick={() => setReviewModalOpen(true)} className="mb-4">
                  <Star className="h-4 w-4 mr-2" />
                  Write a Review
                </Button>
              )}
              {!reviewsData?.reviews || reviewsData.reviews.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No reviews yet. Be the first to write a review!
                  </CardContent>
                </Card>
              ) : (
                reviewsData.reviews.map((review) => (
                  <Card key={review.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{review.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            {review.position && <span>{review.position}</span>}
                            {review.isCurrentEmployee ? (
                              <Badge variant="outline" className="text-xs">Current</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Former</Badge>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime(review.createdAt)}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="h-5 w-5 fill-yellow-500" />
                          <span className="font-bold">{review.overallRating}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-green-600 mb-1">Pros</p>
                        <p className="text-sm text-muted-foreground">{review.pros}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-600 mb-1">Cons</p>
                        <p className="text-sm text-muted-foreground">{review.cons}</p>
                      </div>
                      {review.advice && (
                        <div>
                          <p className="text-sm font-medium text-blue-600 mb-1">Advice</p>
                          <p className="text-sm text-muted-foreground">{review.advice}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="community" className="space-y-4 mt-6">
              {category.communities.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No community available for this category.
                  </CardContent>
                </Card>
              ) : (
                category.communities.map((community) => (
                  <Link key={community.id} href={`/community/${community.slug}`}>
                    <Card className="hover:shadow-md transition-all hover:border-primary/50 cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-100">
                              <MessageSquare className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{community.name} Community</h3>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
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
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Reviews</span>
                <span className="font-semibold">{category.totalReviews}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Communities</span>
                <span className="font-semibold">{category.communities.length}</span>
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
              <Button
                className="w-full"
                variant="outline"
                onClick={() => isAuthenticated ? setReviewModalOpen(true) : window.location.href = '/login'}
              >
                <Star className="h-4 w-4 mr-2" />
                Write a Review
              </Button>
              {category.communities.length > 0 && (
                <Button className="w-full" variant="outline" asChild>
                  <Link href={`/community/${category.communities[0].slug}`}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Join Community
                  </Link>
                </Button>
              )}
              <Button className="w-full" variant="ghost" asChild>
                <Link href={`/request-community?type=PUBLIC_SERVANT&categoryId=${category.id}&categoryName=${encodeURIComponent(category.name)}`}>
                  <Users className="h-4 w-4 mr-2" />
                  Request New Community
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    {/* Review Modal */}
    <ReviewModal
      open={reviewModalOpen}
      onOpenChange={setReviewModalOpen}
      type="public-servant"
      targetId={category.id}
      targetName={category.name}
    />
    </MainLayout>
  );
}
