'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Star, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'company' | 'public-servant';
  targetId: string;
  targetName: string;
}

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  required?: boolean;
}

function StarRating({ value, onChange, label, required }: StarRatingProps) {
  const [hover, setHover] = useState(0);

  return (
    <div className="space-y-1">
      <Label className="text-sm">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="p-0.5 transition-transform hover:scale-110"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
          >
            <Star
              className={cn(
                'h-6 w-6 transition-colors',
                (hover || value) >= star
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              )}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {value > 0 ? `${value}/5` : ''}
        </span>
      </div>
    </div>
  );
}

export function ReviewModal({
  open,
  onOpenChange,
  type,
  targetId,
  targetName,
}: ReviewModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    overallRating: 0,
    salaryRating: 0,
    workLifeRating: 0,
    cultureRating: 0,
    managementRating: 0,
    stabilityRating: 0,
    growthRating: 0,
    title: '',
    pros: '',
    cons: '',
    advice: '',
    jobTitle: '',
    department: '',
    position: '',
    yearsAtCompany: '',
    yearsWorked: '',
    isCurrentEmployee: true,
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      const endpoint =
        type === 'company'
          ? `/reviews/company/${targetId}`
          : `/reviews/public-servant/${targetId}`;

      const payload =
        type === 'company'
          ? {
              overallRating: formData.overallRating,
              salaryRating: formData.salaryRating || undefined,
              workLifeRating: formData.workLifeRating || undefined,
              cultureRating: formData.cultureRating || undefined,
              managementRating: formData.managementRating || undefined,
              title: formData.title,
              pros: formData.pros,
              cons: formData.cons,
              advice: formData.advice || undefined,
              jobTitle: formData.jobTitle || undefined,
              department: formData.department || undefined,
              isCurrentEmployee: formData.isCurrentEmployee,
              yearsAtCompany: formData.yearsAtCompany
                ? parseInt(formData.yearsAtCompany)
                : undefined,
            }
          : {
              overallRating: formData.overallRating,
              workLifeRating: formData.workLifeRating || undefined,
              salaryRating: formData.salaryRating || undefined,
              stabilityRating: formData.stabilityRating || undefined,
              growthRating: formData.growthRating || undefined,
              title: formData.title,
              pros: formData.pros,
              cons: formData.cons,
              advice: formData.advice || undefined,
              position: formData.position || undefined,
              isCurrentEmployee: formData.isCurrentEmployee,
              yearsWorked: formData.yearsWorked
                ? parseInt(formData.yearsWorked)
                : undefined,
            };

      return api.post(endpoint, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', type, targetId] });
      queryClient.invalidateQueries({ queryKey: [type, targetId] });
      onOpenChange(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      overallRating: 0,
      salaryRating: 0,
      workLifeRating: 0,
      cultureRating: 0,
      managementRating: 0,
      stabilityRating: 0,
      growthRating: 0,
      title: '',
      pros: '',
      cons: '',
      advice: '',
      jobTitle: '',
      department: '',
      position: '',
      yearsAtCompany: '',
      yearsWorked: '',
      isCurrentEmployee: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReview.mutate();
  };

  const isValid =
    formData.overallRating > 0 &&
    formData.title.length >= 5 &&
    formData.pros.length >= 10 &&
    formData.cons.length >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>
            Share your experience at {targetName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ratings */}
          <div className="space-y-4">
            <h3 className="font-semibold">Ratings</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <StarRating
                label="Overall Rating"
                value={formData.overallRating}
                onChange={(v) => setFormData({ ...formData, overallRating: v })}
                required
              />
              <StarRating
                label="Salary & Benefits"
                value={formData.salaryRating}
                onChange={(v) => setFormData({ ...formData, salaryRating: v })}
              />
              <StarRating
                label="Work-Life Balance"
                value={formData.workLifeRating}
                onChange={(v) => setFormData({ ...formData, workLifeRating: v })}
              />
              {type === 'company' ? (
                <>
                  <StarRating
                    label="Culture & Values"
                    value={formData.cultureRating}
                    onChange={(v) =>
                      setFormData({ ...formData, cultureRating: v })
                    }
                  />
                  <StarRating
                    label="Management"
                    value={formData.managementRating}
                    onChange={(v) =>
                      setFormData({ ...formData, managementRating: v })
                    }
                  />
                </>
              ) : (
                <>
                  <StarRating
                    label="Job Stability"
                    value={formData.stabilityRating}
                    onChange={(v) =>
                      setFormData({ ...formData, stabilityRating: v })
                    }
                  />
                  <StarRating
                    label="Career Growth"
                    value={formData.growthRating}
                    onChange={(v) =>
                      setFormData({ ...formData, growthRating: v })
                    }
                  />
                </>
              )}
            </div>
          </div>

          {/* Review Content */}
          <div className="space-y-4">
            <h3 className="font-semibold">Your Review</h3>

            <div className="space-y-2">
              <Label htmlFor="title">
                Review Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Summarize your experience in a few words"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                minLength={5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pros">
                Pros <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="pros"
                placeholder="What do you like about working here?"
                value={formData.pros}
                onChange={(e) =>
                  setFormData({ ...formData, pros: e.target.value })
                }
                rows={3}
                minLength={10}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cons">
                Cons <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="cons"
                placeholder="What could be improved?"
                value={formData.cons}
                onChange={(e) =>
                  setFormData({ ...formData, cons: e.target.value })
                }
                rows={3}
                minLength={10}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="advice">Advice to Management (Optional)</Label>
              <Textarea
                id="advice"
                placeholder="Any suggestions for the management?"
                value={formData.advice}
                onChange={(e) =>
                  setFormData({ ...formData, advice: e.target.value })
                }
                rows={2}
              />
            </div>
          </div>

          {/* Employment Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Your Position (Optional)</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              {type === 'company' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      placeholder="e.g., Software Engineer"
                      value={formData.jobTitle}
                      onChange={(e) =>
                        setFormData({ ...formData, jobTitle: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      placeholder="e.g., Engineering"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearsAtCompany">Years at Company</Label>
                    <Input
                      id="yearsAtCompany"
                      type="number"
                      min="0"
                      max="50"
                      placeholder="e.g., 3"
                      value={formData.yearsAtCompany}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          yearsAtCompany: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      placeholder="e.g., Police Officer"
                      value={formData.position}
                      onChange={(e) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearsWorked">Years Worked</Label>
                    <Input
                      id="yearsWorked"
                      type="number"
                      min="0"
                      max="50"
                      placeholder="e.g., 5"
                      value={formData.yearsWorked}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          yearsWorked: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isCurrentEmployee"
                checked={formData.isCurrentEmployee}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    isCurrentEmployee: checked,
                  })
                }
              />
              <Label htmlFor="isCurrentEmployee" className="text-sm">
                I currently work here
              </Label>
            </div>
          </div>

          {/* Error Message */}
          {submitReview.isError && (
            <p className="text-sm text-destructive">
              {(submitReview.error as any)?.response?.data?.message ||
                'Failed to submit review. Please try again.'}
            </p>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || submitReview.isPending}>
              {submitReview.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit Review
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
