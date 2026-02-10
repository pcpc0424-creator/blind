'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, Shield, Sparkles, MessageSquare, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layouts/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCreateRequest } from '@/hooks/use-community-request';
import { useAuth } from '@/hooks/use-auth';

type TargetType = 'COMPANY' | 'PUBLIC_SERVANT' | 'INTEREST' | 'GENERAL';

const targetTypeInfo: Record<TargetType, { label: string; icon: any; description: string }> = {
  COMPANY: {
    label: 'Company',
    icon: Building2,
    description: 'Community for a specific company',
  },
  PUBLIC_SERVANT: {
    label: 'Public Servant',
    icon: Shield,
    description: 'Community for public servants',
  },
  INTEREST: {
    label: 'Interest',
    icon: Sparkles,
    description: 'Hobby and interest-based community',
  },
  GENERAL: {
    label: 'General',
    icon: MessageSquare,
    description: 'General topic community',
  },
};

export default function RequestCommunityPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const createRequest = useCreateRequest();

  // Get initial values from URL params
  const initialType = (searchParams.get('type') as TargetType) || 'GENERAL';
  const categoryId = searchParams.get('categoryId');
  const categoryName = searchParams.get('categoryName');
  const companyId = searchParams.get('companyId');
  const companyName = searchParams.get('companyName');

  const [targetType, setTargetType] = useState<TargetType>(initialType);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Set default name based on context
  useEffect(() => {
    if (categoryName && targetType === 'PUBLIC_SERVANT') {
      setName(`${categoryName} Community`);
    } else if (categoryName && targetType === 'INTEREST') {
      setName(`${categoryName} Community`);
    } else if (companyName && targetType === 'COMPANY') {
      setName(`${companyName} Community`);
    }
  }, [categoryName, companyName, targetType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createRequest.mutateAsync({
      name,
      description: description || undefined,
      targetType,
      companyId: targetType === 'COMPANY' ? companyId || undefined : undefined,
      publicServantCategoryId: targetType === 'PUBLIC_SERVANT' ? categoryId || undefined : undefined,
      interestCategoryId: targetType === 'INTEREST' ? categoryId || undefined : undefined,
    });

    // Redirect to my requests page
    router.push('/my-requests');
  };

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="py-12 text-center">
          <h1 className="text-2xl font-bold mb-2">Login Required</h1>
          <p className="text-muted-foreground mb-4">
            Please login first to request a community.
          </p>
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" className="mb-4" asChild>
          <Link href="javascript:history.back()">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Community Request</CardTitle>
            <CardDescription>
              Can't find the community you want? Request a new community.
              It will be created after admin approval.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Target Type Selection */}
              <div className="space-y-3">
                <Label>Community Type</Label>
                <RadioGroup
                  value={targetType}
                  onValueChange={(value) => setTargetType(value as TargetType)}
                  className="grid grid-cols-2 gap-3"
                >
                  {(Object.keys(targetTypeInfo) as TargetType[]).map((type) => {
                    const info = targetTypeInfo[type];
                    const Icon = info.icon;
                    return (
                      <Label
                        key={type}
                        htmlFor={type}
                        className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                          targetType === type
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <RadioGroupItem value={type} id={type} className="sr-only" />
                        <Icon className={`h-5 w-5 ${targetType === type ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div>
                          <p className="font-medium">{info.label}</p>
                          <p className="text-xs text-muted-foreground">{info.description}</p>
                        </div>
                      </Label>
                    );
                  })}
                </RadioGroup>
              </div>

              {/* Context Info */}
              {(categoryName || companyName) && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {targetType === 'PUBLIC_SERVANT' && categoryName && (
                      <>
                        <Shield className="h-4 w-4 inline mr-1" />
                        Requesting a community for the <strong>{categoryName}</strong> category.
                      </>
                    )}
                    {targetType === 'INTEREST' && categoryName && (
                      <>
                        <Sparkles className="h-4 w-4 inline mr-1" />
                        Requesting a community for <strong>{categoryName}</strong> interest.
                      </>
                    )}
                    {targetType === 'COMPANY' && companyName && (
                      <>
                        <Building2 className="h-4 w-4 inline mr-1" />
                        Requesting a community for <strong>{companyName}</strong> company.
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* Community Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Community Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Police Officers Community, Samsung New Employees"
                  required
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  {name.length}/50 characters
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please briefly describe what this community is about."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {description.length}/500 characters
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!name.trim() || createRequest.isPending}
                >
                  {createRequest.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </div>

              {/* Info Note */}
              <p className="text-xs text-muted-foreground text-center">
                Requests are approved after admin review. You can check the approval status in My Requests.
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Link to My Requests */}
        <div className="mt-4 text-center">
          <Button variant="link" asChild>
            <Link href="/my-requests">View My Requests</Link>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
