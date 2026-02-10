'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Plus,
  MoreVertical,
  Building2,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Star,
  Pin,
  Megaphone,
  Users,
  Globe,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { api } from '@/lib/api';

interface Company {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  size: string | null;
  isVerified: boolean;
  isActive: boolean;
  isPinned: boolean;
  isSponsored: boolean;
  displayOrder: number;
  totalReviews: number;
  userCount: number;
  communityCount: number;
  createdAt: string;
}

interface CompanyStats {
  total: number;
  active: number;
  verified: number;
  pinned: number;
  sponsored: number;
}

interface CompanyFormData {
  name: string;
  industry: string;
  size: string;
  description: string;
  website: string;
}

interface CompanyDomain {
  id: string;
  domain: string;
  isPrimary: boolean;
  createdAt: string;
}

export default function AdminCompaniesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [domainCompany, setDomainCompany] = useState<Company | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    industry: '',
    size: '',
    description: '',
    website: '',
  });
  const queryClient = useQueryClient();

  // Fetch company list
  const { data, isLoading } = useQuery({
    queryKey: ['admin-companies', search, page],
    queryFn: async (): Promise<{ data: Company[]; meta: { total: number; totalPages: number } }> => {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');
      if (search) params.set('search', search);

      const response = await api.get(`/companies/admin/list?${params.toString()}`);
      return response as { data: Company[]; meta: { total: number; totalPages: number } };
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['admin-companies-stats'],
    queryFn: async (): Promise<{ data: CompanyStats }> => {
      const response = await api.get('/companies/admin/stats');
      return response as { data: CompanyStats };
    },
  });

  // Create company
  const createMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      return api.post('/companies/admin', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
      queryClient.invalidateQueries({ queryKey: ['admin-companies-stats'] });
      setIsCreateOpen(false);
      resetForm();
    },
  });

  // Update company
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Company> }) => {
      return api.patch(`/companies/admin/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
      queryClient.invalidateQueries({ queryKey: ['admin-companies-stats'] });
      setEditingCompany(null);
      resetForm();
    },
  });

  // Delete company
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/companies/admin/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
      queryClient.invalidateQueries({ queryKey: ['admin-companies-stats'] });
      setDeletingCompany(null);
    },
  });

  // Fetch company domains
  const { data: domainsData, isLoading: domainsLoading } = useQuery({
    queryKey: ['company-domains', domainCompany?.id],
    queryFn: async (): Promise<{ data: CompanyDomain[] }> => {
      const response = await api.get(`/companies/admin/${domainCompany!.id}/domains`);
      return response as { data: CompanyDomain[] };
    },
    enabled: !!domainCompany,
  });

  // Add domain
  const addDomainMutation = useMutation({
    mutationFn: async ({ companyId, domain }: { companyId: string; domain: string }) => {
      return api.post(`/companies/admin/${companyId}/domains`, { domain });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-domains', domainCompany?.id] });
      setNewDomain('');
    },
  });

  // Delete domain
  const deleteDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      return api.delete(`/companies/admin/domains/${domainId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-domains', domainCompany?.id] });
    },
  });

  // Set primary domain
  const setPrimaryMutation = useMutation({
    mutationFn: async (domainId: string) => {
      return api.patch(`/companies/admin/domains/${domainId}`, { isPrimary: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-domains', domainCompany?.id] });
    },
  });

  const companies = data?.data || [];
  const domains = domainsData?.data || [];
  const meta = data?.meta;
  const companyStats = stats?.data;

  const resetForm = () => {
    setFormData({ name: '', industry: '', size: '', description: '', website: '' });
  };

  const openEditDialog = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      industry: company.industry || '',
      size: company.size || '',
      description: '',
      website: '',
    });
  };

  const handleCreate = () => {
    if (!formData.name.trim()) return;
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!editingCompany) return;
    updateMutation.mutate({
      id: editingCompany.id,
      data: formData,
    });
  };

  const toggleStatus = (company: Company, field: 'isVerified' | 'isActive' | 'isPinned' | 'isSponsored') => {
    updateMutation.mutate({
      id: company.id,
      data: { [field]: !company[field] },
    });
  };

  const getSizeBadge = (size: string | null) => {
    const sizeLabels: Record<string, string> = {
      'STARTUP': 'Startup',
      'SMALL': 'Small',
      'MEDIUM': 'Medium',
      'LARGE': 'Large',
      'ENTERPRISE': 'Enterprise',
    };
    return size ? sizeLabels[size] || size : '-';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Companies</h1>
          <p className="text-muted-foreground">View and manage registered companies.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{companyStats?.total || 0}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{companyStats?.active || 0}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{companyStats?.verified || 0}</div>
                <div className="text-sm text-muted-foreground">Verified</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Pin className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{companyStats?.pinned || 0}</div>
                <div className="text-sm text-muted-foreground">Pinned</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <Megaphone className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{companyStats?.sponsored || 0}</div>
                <div className="text-sm text-muted-foreground">Sponsored</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="py-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No companies registered.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Reviews</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="font-medium">{company.name}</div>
                      <div className="text-xs text-muted-foreground">{company.slug}</div>
                    </TableCell>
                    <TableCell>{company.industry || '-'}</TableCell>
                    <TableCell>{getSizeBadge(company.size)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {company.isVerified && <Badge variant="secondary">Verified</Badge>}
                        {company.isPinned && <Badge className="bg-orange-500">Pinned</Badge>}
                        {company.isSponsored && <Badge className="bg-red-500">Sponsored</Badge>}
                        {!company.isActive && <Badge variant="destructive">Inactive</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {company.userCount}
                      </div>
                    </TableCell>
                    <TableCell>{company.totalReviews}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(company)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDomainCompany(company)}>
                            <Globe className="h-4 w-4 mr-2" />
                            Manage Domains
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toggleStatus(company, 'isVerified')}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {company.isVerified ? 'Unverify' : 'Verify'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(company, 'isPinned')}>
                            <Pin className="h-4 w-4 mr-2" />
                            {company.isPinned ? 'Unpin' : 'Pin'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(company, 'isSponsored')}>
                            <Megaphone className="h-4 w-4 mr-2" />
                            {company.isSponsored ? 'Remove Sponsor' : 'Sponsor'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(company, 'isActive')}>
                            {company.isActive ? <XCircle className="h-4 w-4 mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                            {company.isActive ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeletingCompany(company)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="flex items-center px-4">{page} / {meta.totalPages}</span>
          <Button variant="outline" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Company</DialogTitle>
            <DialogDescription>Register a new company.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Samsung Electronics"
              />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Input
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="IT/Electronics"
              />
            </div>
            <div className="space-y-2">
              <Label>Size</Label>
              <Select value={formData.size} onValueChange={(v) => setFormData({ ...formData, size: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STARTUP">Startup (1-50)</SelectItem>
                  <SelectItem value="SMALL">Small (51-200)</SelectItem>
                  <SelectItem value="MEDIUM">Medium (201-1000)</SelectItem>
                  <SelectItem value="LARGE">Large (1001-5000)</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise (5000+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Company introduction..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCompany} onOpenChange={() => setEditingCompany(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>Edit {editingCompany?.name} information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Input
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Size</Label>
              <Select value={formData.size} onValueChange={(v) => setFormData({ ...formData, size: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STARTUP">Startup (1-50)</SelectItem>
                  <SelectItem value="SMALL">Small (51-200)</SelectItem>
                  <SelectItem value="MEDIUM">Medium (201-1000)</SelectItem>
                  <SelectItem value="LARGE">Large (1001-5000)</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise (5000+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingCompany(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCompany} onOpenChange={() => setDeletingCompany(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingCompany?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deletingCompany && deleteMutation.mutate(deletingCompany.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Domain Management Dialog */}
      <Dialog open={!!domainCompany} onOpenChange={() => { setDomainCompany(null); setNewDomain(''); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Domains</DialogTitle>
            <DialogDescription>
              Manage email domains for {domainCompany?.name}. Users can register with these email domains.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Add new domain */}
            <div className="flex gap-2">
              <Input
                placeholder="example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newDomain.trim() && domainCompany) {
                    addDomainMutation.mutate({ companyId: domainCompany.id, domain: newDomain.trim() });
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (newDomain.trim() && domainCompany) {
                    addDomainMutation.mutate({ companyId: domainCompany.id, domain: newDomain.trim() });
                  }
                }}
                disabled={!newDomain.trim() || addDomainMutation.isPending}
              >
                {addDomainMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Domain list */}
            <div className="border rounded-lg divide-y">
              {domainsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : domains.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No domains registered.
                </div>
              ) : (
                domains.map((domain) => (
                  <div key={domain.id} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm">{domain.domain}</span>
                      {domain.isPrimary && (
                        <Badge variant="secondary" className="text-xs">Primary</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {!domain.isPrimary && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPrimaryMutation.mutate(domain.id)}
                          disabled={setPrimaryMutation.isPending}
                        >
                          Set Primary
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deleteDomainMutation.mutate(domain.id)}
                        disabled={deleteDomainMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDomainCompany(null); setNewDomain(''); }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
