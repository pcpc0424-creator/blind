'use client';

import { MainLayout } from '@/components/layouts/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Inbox, Send, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function MessagesPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Messages</h1>
          <p className="text-muted-foreground">Chat anonymously with other users</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-10"
          />
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
            <p className="text-muted-foreground mb-4">
              Send a message to comment authors from posts,<br />
              or receive messages from other users to see them here.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Anonymous Messages</span>
              </div>
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                <span>Quick Send</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Info */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-1">Complete Anonymity</h4>
              <p className="text-sm text-muted-foreground">
                Your information is not shared with the other party
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                <Send className="h-5 w-5 text-green-600" />
              </div>
              <h4 className="font-semibold mb-1">Real-time Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Get notified immediately when you receive a new message
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                <Inbox className="h-5 w-5 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-1">Conversation Management</h4>
              <p className="text-sm text-muted-foreground">
                Block unwanted conversations
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
