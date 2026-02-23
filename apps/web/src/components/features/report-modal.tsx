'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam/Advertising' },
  { value: 'HARASSMENT', label: 'Harassment/Threats' },
  { value: 'HATE_SPEECH', label: 'Hate Speech' },
  { value: 'MISINFORMATION', label: 'Misinformation' },
  { value: 'PRIVACY_VIOLATION', label: 'Privacy Violation' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate Content' },
  { value: 'OTHER', label: 'Other' },
] as const;

type ReportReason = (typeof REPORT_REASONS)[number]['value'];

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId?: string;
  commentId?: string;
  onSuccess?: () => void;
}

export function ReportModal({
  open,
  onOpenChange,
  postId,
  commentId,
  onSuccess,
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const reportMutation = useMutation({
    mutationFn: async () => {
      return api.post('/reports', {
        postId,
        commentId,
        reason,
        description: description.trim() || undefined,
      });
    },
    onSuccess: () => {
      onOpenChange(false);
      setReason('');
      setDescription('');
      toast({
        title: 'Report Submitted',
        description: 'Thank you for your report. We will review it soon.',
      });
      onSuccess?.();
    },
  });

  const handleSubmit = () => {
    if (!reason) return;
    reportMutation.mutate();
  };

  const handleClose = () => {
    if (!reportMutation.isPending) {
      onOpenChange(false);
      setReason('');
      setDescription('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Report
          </DialogTitle>
          <DialogDescription>
            Report inappropriate content. Admins will review and take appropriate action.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Report Reason *</Label>
            <RadioGroup
              value={reason}
              onValueChange={(value) => setReason(value as ReportReason)}
            >
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Please provide more details about the report reason..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/1000
            </p>
          </div>

          {reportMutation.isError && (
            <p className="text-sm text-destructive">
              {(reportMutation.error as Error)?.message || 'An error occurred while processing the report.'}
            </p>
          )}

          {reportMutation.isSuccess && (
            <p className="text-sm text-green-600">
              Report submitted. Thank you.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={reportMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || reportMutation.isPending}
            variant="destructive"
          >
            {reportMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
