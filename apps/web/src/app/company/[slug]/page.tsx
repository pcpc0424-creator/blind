'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Star,
  Users,
  Globe,
  MessageSquare,
  FileText,
  Briefcase,
  Heart,
  TrendingUp,
  Clock,
  ChevronRight,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { MainLayout } from '@/components/layouts/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import { ReviewModal } from '@/components/features/review-modal';
import { useAuthStore } from '@/stores/auth.store';

interface CompanyDetail {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  industry: string | null;
  size: string | null;
  description: string | null;
  website: string | null;
  isVerified: boolean;
  avgRating: number | null;
  totalReviews: number;
  avgSalary: number | null;
  avgWorkLife: number | null;
  avgCulture: number | null;
  avgManagement: number | null;
  employeeCount: number;
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
    jobTitle: string | null;
    createdAt: string;
  }>;
}

const sizeLabels: Record<string, string> = {
  STARTUP: '1-50 employees',
  SMALL: '51-200 employees',
  MEDIUM: '201-1000 employees',
  LARGE: '1001-5000 employees',
  ENTERPRISE: '5000+ employees',
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

interface Review {
  id: string;
  overallRating: number;
  salaryRating: number | null;
  workLifeRating: number | null;
  cultureRating: number | null;
  managementRating: number | null;
  title: string;
  pros: string;
  cons: string;
  advice: string | null;
  jobTitle: string | null;
  department: string | null;
  isCurrentEmployee: boolean;
  yearsAtCompany: number | null;
  isAnonymous: boolean;
  author: { nickname: string } | null;
  createdAt: string;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { isAuthenticated } = useAuthStore();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['company', slug],
    queryFn: async () => {
      const response = await api.get<CompanyDetail>(`/companies/${slug}`);
      return response.data!;
    },
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', 'company', data?.id],
    queryFn: async () => {
      const response = await api.get<{ reviews: Review[]; meta: any }>(
        `/reviews/company/${data!.id}`
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
          <h1 className="text-2xl font-bold mb-2">Company not found</h1>
          <p className="text-muted-foreground mb-4">
            The company you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link href="/companies">Back to Companies</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const company = data;

  return (
    <MainLayout>
    <div className="max-w-6xl">
      {/* Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center shrink-0">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="w-12 h-12 object-contain"
                />
              ) : (
                <Building2 className="h-10 w-10 text-blue-500" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{company.name}</h1>
                {company.isVerified && (
                  <Badge className="bg-blue-500">Verified</Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                {company.industry && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {company.industry}
                  </span>
                )}
                {company.size && (
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {sizeLabels[company.size]}
                  </span>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              {company.description && (
                <p className="text-muted-foreground">{company.description}</p>
              )}
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-xl min-w-[120px]">
              <div className="flex items-center gap-1 text-3xl font-bold text-yellow-500">
                <Star className="h-8 w-8 fill-yellow-500" />
                {company.avgRating?.toFixed(1) || 'N/A'}
              </div>
              <p className="text-sm text-muted-foreground">
                {company.totalReviews} reviews
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
                  <RatingBar label="Salary & Benefits" value={company.avgSalary} icon={TrendingUp} />
                  <RatingBar label="Work-Life Balance" value={company.avgWorkLife} icon={Heart} />
                  <RatingBar label="Culture & Values" value={company.avgCulture} icon={Users} />
                  <RatingBar label="Management" value={company.avgManagement} icon={Briefcase} />
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
                            {review.jobTitle && <span>{review.jobTitle}</span>}
                            {review.isCurrentEmployee ? (
                              <Badge variant="outline" className="text-xs">Current Employee</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Former Employee</Badge>
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
                          <p className="text-sm font-medium text-blue-600 mb-1">Advice to Management</p>
                          <p className="text-sm text-muted-foreground">{review.advice}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="community" className="space-y-4 mt-6">
              {company.communities.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No community available for this company.
                  </CardContent>
                </Card>
              ) : (
                company.communities.map((community) => (
                  <Link key={community.id} href={`/community/${community.slug}`}>
                    <Card className="hover:shadow-md transition-all hover:border-primary/50 cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <MessageSquare className="h-5 w-5 text-primary" />
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
                <span className="font-semibold">{company.totalReviews}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Verified Employees</span>
                <span className="font-semibold">{company.employeeCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Communities</span>
                <span className="font-semibold">{company.communities.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => isAuthenticated ? setReviewModalOpen(true) : window.location.href = '/login'}
              >
                <Star className="h-4 w-4 mr-2" />
                Write a Review
              </Button>
              {company.communities.length > 0 && (
                <Button className="w-full" asChild>
                  <Link href={`/community/${company.communities[0].slug}`}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Join Community
                  </Link>
                </Button>
              )}
              <Button className="w-full" variant="ghost" asChild>
                <Link href={`/request-community?type=COMPANY&companyId=${company.id}&companyName=${encodeURIComponent(company.name)}`}>
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
      type="company"
      targetId={company.id}
      targetName={company.name}
    />
    </MainLayout>
  );
}
