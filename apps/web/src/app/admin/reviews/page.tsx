'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Star,
  Building2,
  Shield,
  MoreVertical,
  Check,
  X,
  Eye,
  Trash2,
  Loader2,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
};

interface CompanyReview {
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
  status: string;
  createdAt: string;
  company: {
    id: string;
    name: string;
    slug: string;
  };
  user: {
    id: string;
    nickname: string;
  };
}

interface PublicServantReview {
  id: string;
  overallRating: number;
  workLifeRating: number | null;
  salaryRating: number | null;
  stabilityRating: number | null;
  growthRating: number | null;
  title: string;
  pros: string;
  cons: string;
  advice: string | null;
  position: string | null;
  yearsWorked: number | null;
  isCurrentEmployee: boolean;
  status: string;
  createdAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  user: {
    id: string;
    nickname: string;
  };
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [reviewType, setReviewType] = useState<'company' | 'public-servant'>('company');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState<CompanyReview | PublicServantReview | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch reviews
  const { data: reviewsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-reviews', reviewType, statusFilter, page],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit: 20 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await api.get<{ reviews: any[]; meta: any }>(`/reviews/admin/${reviewType}`, params);
      return response.data;
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return api.patch(`/reviews/admin/${reviewType}/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/reviews/${reviewType}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setDeleteDialogOpen(false);
      setSelectedReview(null);
    },
  });

  const handleView = (review: CompanyReview | PublicServantReview) => {
    setSelectedReview(review);
    setViewDialogOpen(true);
  };

  const handleDelete = (review: CompanyReview | PublicServantReview) => {
    setSelectedReview(review);
    setDeleteDialogOpen(true);
  };

  const handleApprove = (id: string) => {
    updateStatusMutation.mutate({ id, status: 'APPROVED' });
  };

  const handleReject = (id: string) => {
    updateStatusMutation.mutate({ id, status: 'REJECTED' });
  };

  const reviews = reviewsData?.reviews || [];
  const meta = reviewsData?.meta;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Reviews</h1>
          <p className="text-sm text-muted-foreground">
            Manage company and public servant reviews.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={reviewType} onValueChange={(v) => { setReviewType(v as any); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" />
            Company Reviews
          </TabsTrigger>
          <TabsTrigger value="public-servant" className="gap-2">
            <Shield className="h-4 w-4" />
            Public Servant Reviews
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="mt-4">
          <CardContent className="py-4">
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Company Reviews */}
        <TabsContent value="company" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No reviews found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      reviews.map((review: CompanyReview) => (
                        <TableRow key={review.id}>
                          <TableCell>
                            <div className="font-medium">{review.company.name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px] line-clamp-1">{review.title}</div>
                          </TableCell>
                          <TableCell>
                            <StarRating value={review.overallRating} />
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{review.user.nickname}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusLabels[review.status]?.color || 'bg-gray-100'}>
                              {statusLabels[review.status]?.label || review.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(review.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {review.status === 'PENDING' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => handleApprove(review.id)}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleReject(review.id)}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleView(review)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  {review.status !== 'APPROVED' && (
                                    <DropdownMenuItem onClick={() => handleApprove(review.id)}>
                                      <Check className="h-4 w-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                  )}
                                  {review.status !== 'REJECTED' && (
                                    <DropdownMenuItem onClick={() => handleReject(review.id)}>
                                      <X className="h-4 w-4 mr-2" />
                                      Reject
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDelete(review)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Public Servant Reviews */}
        <TabsContent value="public-servant" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No reviews found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      reviews.map((review: PublicServantReview) => (
                        <TableRow key={review.id}>
                          <TableCell>
                            <div className="font-medium">{review.category.name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px] line-clamp-1">{review.title}</div>
                          </TableCell>
                          <TableCell>
                            <StarRating value={review.overallRating} />
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{review.user.nickname}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusLabels[review.status]?.color || 'bg-gray-100'}>
                              {statusLabels[review.status]?.label || review.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(review.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {review.status === 'PENDING' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => handleApprove(review.id)}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleReject(review.id)}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleView(review)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  {review.status !== 'APPROVED' && (
                                    <DropdownMenuItem onClick={() => handleApprove(review.id)}>
                                      <Check className="h-4 w-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                  )}
                                  {review.status !== 'REJECTED' && (
                                    <DropdownMenuItem onClick={() => handleReject(review.id)}>
                                      <X className="h-4 w-4 mr-2" />
                                      Reject
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDelete(review)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            {meta.page} / {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= meta.totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* View Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">
                    {reviewType === 'company' ? 'Company' : 'Category'}
                  </Label>
                  <p className="font-medium">
                    {(selectedReview as any).company?.name || (selectedReview as any).category?.name}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Author</Label>
                  <p className="font-medium">{selectedReview.user.nickname}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Overall Rating</Label>
                  <StarRating value={selectedReview.overallRating} />
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={statusLabels[selectedReview.status]?.color || 'bg-gray-100'}>
                    {statusLabels[selectedReview.status]?.label || selectedReview.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    {reviewType === 'company' ? 'Job Title' : 'Position'}
                  </Label>
                  <p>{(selectedReview as any).jobTitle || (selectedReview as any).position || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Employment</Label>
                  <p>{selectedReview.isCurrentEmployee ? 'Current Employee' : 'Former Employee'}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Title</Label>
                <p className="mt-1 font-medium">{selectedReview.title}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Pros</Label>
                <p className="mt-1 p-3 bg-green-50 rounded-md text-sm">{selectedReview.pros}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Cons</Label>
                <p className="mt-1 p-3 bg-red-50 rounded-md text-sm">{selectedReview.cons}</p>
              </div>

              {selectedReview.advice && (
                <div>
                  <Label className="text-muted-foreground">Advice to Management</Label>
                  <p className="mt-1 p-3 bg-blue-50 rounded-md text-sm">{selectedReview.advice}</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(selectedReview.createdAt).toLocaleString()}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {selectedReview && selectedReview.status === 'PENDING' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleApprove(selectedReview.id);
                    setViewDialogOpen(false);
                  }}
                  className="text-green-600"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleReject(selectedReview.id);
                    setViewDialogOpen(false);
                  }}
                  className="text-red-600"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedReview && deleteMutation.mutate(selectedReview.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
