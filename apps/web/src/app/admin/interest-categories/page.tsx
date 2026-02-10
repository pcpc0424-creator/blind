'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  MoreVertical,
  Sparkles,
  Edit,
  Trash2,
  ChevronRight,
  Users,
  FolderTree,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  description: string | null;
  color: string | null;
  isActive: boolean;
  displayOrder: number;
  communityCount: number;
  children: Category[];
}

interface Stats {
  total: number;
  topLevel: number;
  children: number;
  totalCommunities: number;
}

const colorOptions = ['#8B5CF6', '#10B981', '#3B82F6', '#EC4899', '#F59E0B', '#EF4444'];

export default function AdminInterestCategoriesPage() {
  const queryClient = useQueryClient();
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formParentId, setFormParentId] = useState<string>('');
  const [formColor, setFormColor] = useState('#8B5CF6');
  const [formDescription, setFormDescription] = useState('');

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['admin', 'interest-categories', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get<Stats>('/interests/admin/stats');
      return res.data as Stats;
    },
  });

  // Fetch categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin', 'interest-categories'],
    queryFn: async () => {
      const res = await apiClient.get<Category[]>('/interests/admin/list');
      return res.data as Category[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.post('/interests/admin', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'interest-categories'] });
      closeDialog();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiClient.patch(`/interests/admin/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'interest-categories'] });
      closeDialog();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/interests/admin/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'interest-categories'] });
      setDeleteId(null);
    },
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const openAddDialog = (parentId: string | null = null) => {
    setFormName('');
    setFormSlug('');
    setFormParentId(parentId || '');
    setFormColor('#8B5CF6');
    setFormDescription('');
    setParentIdForNew(parentId);
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditCategory(category);
    setFormName(category.name);
    setFormSlug(category.slug);
    setFormColor(category.color || '#8B5CF6');
    setFormDescription(category.description || '');
  };

  const closeDialog = () => {
    setIsAddDialogOpen(false);
    setEditCategory(null);
    setFormName('');
    setFormSlug('');
    setFormParentId('');
    setFormColor('#8B5CF6');
    setFormDescription('');
    setParentIdForNew(null);
  };

  const handleCreate = () => {
    if (formName && formSlug) {
      createMutation.mutate({
        name: formName,
        slug: formSlug,
        parentId: formParentId || undefined,
        color: formColor,
        description: formDescription || undefined,
      });
    }
  };

  const handleUpdate = () => {
    if (editCategory && formName) {
      updateMutation.mutate({
        id: editCategory.id,
        data: {
          name: formName,
          slug: formSlug,
          color: formColor,
          description: formDescription || undefined,
        },
      });
    }
  };

  const handleNameChange = (name: string) => {
    setFormName(name);
    if (!editCategory) {
      setFormSlug(
        name
          .toLowerCase()
          .replace(/[^a-z0-9가-힣]+/g, '-')
          .replace(/^-|-$/g, '')
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Interest Categories</h1>
          <p className="text-muted-foreground">
            Manage interest categories.
          </p>
        </div>
        <Button onClick={() => openAddDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Stats */}
      {statsData && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{statsData.total}</div>
                  <div className="text-sm text-muted-foreground">Total Categories</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{statsData.topLevel}</div>
                  <div className="text-sm text-muted-foreground">Top Level</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100">
                  <FolderTree className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{statsData.children}</div>
                  <div className="text-sm text-muted-foreground">Sub Categories</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{statsData.totalCommunities}</div>
                  <div className="text-sm text-muted-foreground">Linked Communities</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Category List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !categories || categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No categories found.
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id}>
                  {/* Parent Category */}
                  <div className="flex items-center gap-2 p-3 rounded-lg border bg-background hover:bg-accent/50 transition-colors">
                    {category.children && category.children.length > 0 ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => toggleExpand(category.id)}
                      >
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${
                            expandedIds.includes(category.id) ? 'rotate-90' : ''
                          }`}
                        />
                      </Button>
                    ) : (
                      <div className="w-6" />
                    )}
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ backgroundColor: (category.color || '#6366F1') + '20' }}
                    >
                      <Sparkles className="h-4 w-4" style={{ color: category.color || '#6366F1' }} />
                    </div>
                    <span className="font-medium flex-1">{category.name}</span>
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color || '#6366F1' }}
                    />
                    <Badge variant="outline" className="text-xs">
                      /{category.slug}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {category.communityCount} communities
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openAddDialog(category.id)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Sub Category
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(category)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setDeleteId(category.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Children */}
                  {expandedIds.includes(category.id) && category.children && category.children.length > 0 && (
                    <div className="ml-8 mt-1 space-y-1">
                      {category.children.map((child) => (
                        <div
                          key={child.id}
                          className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30 hover:bg-accent/50 transition-colors"
                        >
                          <div className="w-6" />
                          <Sparkles className="h-4 w-4" style={{ color: category.color || '#6366F1' }} />
                          <span className="flex-1">{child.name}</span>
                          <Badge variant="outline" className="text-xs">
                            /{child.slug}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {child.communityCount}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(child)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDeleteId(child.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {parentIdForNew ? 'Add Sub Category' : 'Add Category'}
            </DialogTitle>
            <DialogDescription>
              Add a new interest category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category Name *</Label>
              <Input
                placeholder="e.g., Travel"
                value={formName}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input
                placeholder="e.g., travel"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
              />
            </div>
            {!parentIdForNew && (
              <div className="space-y-2">
                <Label>Parent Category</Label>
                <Select
                  value={formParentId || '__none__'}
                  onValueChange={(val) => setFormParentId(val === '__none__' ? '' : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (Top Level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None (Top Level)</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Category description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formColor === color ? 'border-gray-900' : 'border-transparent'
                    } hover:border-gray-400`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editCategory} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Edit category information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category Name *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formColor === color ? 'border-gray-900' : 'border-transparent'
                    } hover:border-gray-400`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? Cannot delete if it has sub categories or linked communities.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
