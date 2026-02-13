'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layouts/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import {
  HelpCircle,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const categoryLabels: Record<string, { label: string; description: string }> = {
  BUG_REPORT: { label: 'Bug Report', description: 'Report a bug or error' },
  FEATURE_REQUEST: { label: 'Feature Request', description: 'Suggest a new feature' },
  ACCOUNT_ISSUE: { label: 'Account Issue', description: 'Issues with your account' },
  REPORT_ISSUE: { label: 'Report Issue', description: 'Questions about reports/moderation' },
  GENERAL: { label: 'General Inquiry', description: 'General questions' },
  OTHER: { label: 'Other', description: 'Other inquiries' },
};

const statusLabels: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Loader2 },
  ANSWERED: { label: 'Answered', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CLOSED: { label: 'Closed', color: 'bg-gray-100 text-gray-700', icon: XCircle },
};

interface Inquiry {
  id: string;
  category: string;
  subject: string;
  content: string;
  status: string;
  adminReply?: string;
  createdAt: string;
  repliedAt?: string;
  admin?: {
    id: string;
    nickname: string;
  };
}

export default function InquiryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Form state
  const [category, setCategory] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  // Fetch user's inquiries
  const { data: inquiriesData, isLoading } = useQuery({
    queryKey: ['my-inquiries'],
    queryFn: async () => {
      const response = await api.get<Inquiry[]>('/inquiries/my', { limit: 50 });
      return response;
    },
    enabled: isAuthenticated,
  });

  // Create inquiry mutation
  const createMutation = useMutation({
    mutationFn: async (data: { category: string; subject: string; content: string }) => {
      return api.post('/inquiries', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-inquiries'] });
      setShowForm(false);
      setCategory('');
      setSubject('');
      setContent('');
      toast({
        title: 'Inquiry Submitted',
        description: 'Your inquiry has been submitted successfully. We will respond as soon as possible.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || subject.trim().length < 5 || content.trim().length < 10) return;
    createMutation.mutate({ category, subject: subject.trim(), content: content.trim() });
  };

  const handleViewInquiry = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setViewDialogOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto text-center py-16">
          <HelpCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Login Required</h1>
          <p className="text-muted-foreground mb-4">Please login to submit an inquiry.</p>
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const inquiries = inquiriesData?.data || [];

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Contact Us</h1>
            <p className="text-muted-foreground">Submit inquiries or questions to administrators</p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Inquiry
            </Button>
          )}
        </div>

        {/* New Inquiry Form */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>New Inquiry</CardTitle>
                  <CardDescription>Fill out the form below to contact administrators</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, { label, description }]) => (
                        <SelectItem key={key} value={key}>
                          <div>
                            <div className="font-medium">{label}</div>
                            <div className="text-xs text-muted-foreground">{description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="Brief summary of your inquiry (min. 5 characters)"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={200}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className={subject.length > 0 && subject.length < 5 ? 'text-red-500' : ''}>
                      {subject.length < 5 ? `Minimum 5 characters required` : ''}
                    </span>
                    <span>{subject.length}/200</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    placeholder="Please describe your inquiry in detail (min. 10 characters)"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                    maxLength={5000}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className={content.length > 0 && content.length < 10 ? 'text-red-500' : ''}>
                      {content.length < 10 ? `Minimum 10 characters required` : ''}
                    </span>
                    <span>{content.length}/5000</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!category || subject.trim().length < 5 || content.trim().length < 10 || createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Submit
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Inquiries List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              My Inquiries
            </CardTitle>
            <CardDescription>View your submitted inquiries and responses</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : inquiries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No inquiries yet.</p>
                <p className="text-sm">Submit your first inquiry using the button above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inquiries.map((inquiry: Inquiry) => {
                  const statusInfo = statusLabels[inquiry.status];
                  const StatusIcon = statusInfo?.icon || Clock;

                  return (
                    <div
                      key={inquiry.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleViewInquiry(inquiry)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {categoryLabels[inquiry.category]?.label || inquiry.category}
                            </Badge>
                            <Badge className={statusInfo?.color || 'bg-gray-100 text-gray-700'}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo?.label || inquiry.status}
                            </Badge>
                          </div>
                          <h3 className="font-medium line-clamp-1">{inquiry.subject}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {inquiry.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(inquiry.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        {inquiry.status === 'ANSWERED' && (
                          <Badge className="bg-green-100 text-green-700 shrink-0">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Reply
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Inquiry Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Inquiry Details</DialogTitle>
              <DialogDescription>View your inquiry and admin response</DialogDescription>
            </DialogHeader>
            {selectedInquiry && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">
                    {categoryLabels[selectedInquiry.category]?.label || selectedInquiry.category}
                  </Badge>
                  <Badge className={statusLabels[selectedInquiry.status]?.color || 'bg-gray-100'}>
                    {statusLabels[selectedInquiry.status]?.label || selectedInquiry.status}
                  </Badge>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm">Subject</Label>
                  <p className="font-medium mt-1">{selectedInquiry.subject}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm">Content</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">
                    {selectedInquiry.content}
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Submitted: {new Date(selectedInquiry.createdAt).toLocaleString('en-US')}
                </div>

                {selectedInquiry.adminReply && (
                  <div className="border-t pt-4">
                    <Label className="text-muted-foreground text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Admin Response
                    </Label>
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md whitespace-pre-wrap">
                      {selectedInquiry.adminReply}
                    </div>
                    {selectedInquiry.repliedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Replied: {new Date(selectedInquiry.repliedAt).toLocaleString('en-US')}
                        {selectedInquiry.admin && ` by ${selectedInquiry.admin.nickname}`}
                      </p>
                    )}
                  </div>
                )}

                {!selectedInquiry.adminReply && (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Waiting for admin response...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
