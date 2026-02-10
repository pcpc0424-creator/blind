'use client';

import { MainLayout } from '@/components/layouts/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { User, Building2, Shield, Calendar, FileText, MessageSquare, ThumbsUp } from 'lucide-react';

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto text-center py-16">
          <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Login Required</h1>
          <p className="text-muted-foreground mb-4">Please login first to view your profile.</p>
          <Button asChild>
            <a href="/login">Login</a>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl bg-primary/10">
                  {user?.nickname?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">{user?.nickname}</h1>
                  {user?.role === 'ADMIN' && (
                    <Badge className="bg-red-500">Admin</Badge>
                  )}
                  {user?.companyVerified && (
                    <Badge className="bg-blue-500">Verified</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {user?.company && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {user.company.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined: {new Date(user?.createdAt || '').toLocaleDateString('en-US')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Posts Written</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Comments Written</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <ThumbsUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Likes Received</p>
            </CardContent>
          </Card>
        </div>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Nickname</span>
              <span className="font-medium">{user?.nickname}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium">{user?.role === 'ADMIN' ? 'Admin' : 'Regular User'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Company Verification</span>
              <span className="font-medium">{user?.companyVerified ? 'Verified' : 'Not Verified'}</span>
            </div>
            {user?.company && (
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Company</span>
                <span className="font-medium">{user.company.name}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
