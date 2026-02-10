'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Globe,
  Mail,
  Shield,
  Bell,
  Save,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface Setting {
  key: string;
  value: any;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  label: string;
  description: string;
}

interface SettingsResponse {
  success: boolean;
  data: Record<string, Setting[]>;
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch all settings
  const { data, isLoading, refetch } = useQuery<SettingsResponse>({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const response = await api.get('/settings/admin');
      return response.data as SettingsResponse;
    },
  });

  // Initialize settings mutation (creates default settings if not exist)
  const initMutation = useMutation({
    mutationFn: async () => {
      return api.post('/settings/admin/initialize');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast({
        title: 'Success',
        description: 'Default settings have been initialized.',
      });
    },
  });

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (settings: Record<string, any>) => {
      return api.patch('/settings/admin', settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      setHasChanges(false);
      toast({
        title: 'Success',
        description: 'Settings have been saved.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save settings.',
        variant: 'destructive',
      });
    },
  });

  // Initialize local settings from fetched data
  useEffect(() => {
    if (data?.data) {
      const flat: Record<string, any> = {};
      for (const category of Object.values(data.data)) {
        for (const setting of category) {
          flat[setting.key] = setting.value;
        }
      }
      setLocalSettings(flat);
    }
  }, [data]);

  const updateSetting = (key: string, value: any) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(localSettings);
  };

  const getValue = (key: string, defaultValue: any = '') => {
    return localSettings[key] ?? defaultValue;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If no settings exist, show initialize button
  if (!data?.data || Object.keys(data.data).length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage site settings.
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Settings Initialization Required</h3>
            <p className="text-muted-foreground mb-4">
              Please initialize default settings.
            </p>
            <Button onClick={() => initMutation.mutate()} disabled={initMutation.isPending}>
              {initMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Initialize Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage site settings.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">
            <Globe className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Site Information</CardTitle>
                <CardDescription>
                  Configure basic site information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Site Name</Label>
                  <Input
                    value={getValue('site.name', '')}
                    onChange={(e) => updateSetting('site.name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Site Description</Label>
                  <Textarea
                    value={getValue('site.description', '')}
                    onChange={(e) => updateSetting('site.description', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operation Settings</CardTitle>
                <CardDescription>
                  Site operation related settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      When enabled, only admins can access the site.
                    </p>
                  </div>
                  <Switch
                    checked={getValue('site.maintenanceMode', false)}
                    onCheckedChange={(checked) =>
                      updateSetting('site.maintenanceMode', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Registration</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow new user registrations.
                    </p>
                  </div>
                  <Switch
                    checked={getValue('site.registrationEnabled', true)}
                    onCheckedChange={(checked) =>
                      updateSetting('site.registrationEnabled', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Limit Settings</CardTitle>
                <CardDescription>
                  Configure user activity limits.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Daily Post Limit</Label>
                    <Input
                      type="number"
                      value={getValue('site.maxPostsPerDay', 10)}
                      onChange={(e) =>
                        updateSetting('site.maxPostsPerDay', parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Daily Comment Limit</Label>
                    <Input
                      type="number"
                      value={getValue('site.maxCommentsPerDay', 50)}
                      onChange={(e) =>
                        updateSetting('site.maxCommentsPerDay', parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Site security related settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Verification Required</Label>
                  <p className="text-sm text-muted-foreground">
                    Require email verification during registration.
                  </p>
                </div>
                <Switch
                  checked={getValue('security.emailVerificationRequired', true)}
                  onCheckedChange={(checked) =>
                    updateSetting('security.emailVerificationRequired', checked)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum Password Length</Label>
                <Select
                  value={String(getValue('security.minPasswordLength', 8))}
                  onValueChange={(value) =>
                    updateSetting('security.minPasswordLength', parseInt(value))
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 characters</SelectItem>
                    <SelectItem value="8">8 characters</SelectItem>
                    <SelectItem value="10">10 characters</SelectItem>
                    <SelectItem value="12">12 characters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Session Expiration Time</Label>
                <Select
                  value={String(getValue('security.sessionExpireDays', 7))}
                  onValueChange={(value) =>
                    updateSetting('security.sessionExpireDays', parseInt(value))
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>
                Email delivery related settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>SMTP Server</Label>
                <Input
                  placeholder="smtp.example.com"
                  value={getValue('email.smtpHost', '')}
                  onChange={(e) => updateSetting('email.smtpHost', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input
                    placeholder="587"
                    value={getValue('email.smtpPort', 587)}
                    onChange={(e) =>
                      updateSetting('email.smtpPort', parseInt(e.target.value) || 587)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Security Type</Label>
                  <Select
                    value={getValue('email.smtpSecure', 'tls')}
                    onValueChange={(value) => updateSetting('email.smtpSecure', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                      <SelectItem value="tls">TLS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>From Email</Label>
                <Input
                  placeholder="noreply@example.com"
                  value={getValue('email.fromAddress', '')}
                  onChange={(e) => updateSetting('email.fromAddress', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>From Name</Label>
                <Input
                  placeholder="Blind"
                  value={getValue('email.fromName', '')}
                  onChange={(e) => updateSetting('email.fromName', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                System notification related settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>New Signup Notification</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify admins when a new user signs up.
                  </p>
                </div>
                <Switch
                  checked={getValue('notification.newSignup', true)}
                  onCheckedChange={(checked) =>
                    updateSetting('notification.newSignup', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Report Notification</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify admins when a new report is received.
                  </p>
                </div>
                <Switch
                  checked={getValue('notification.newReport', true)}
                  onCheckedChange={(checked) =>
                    updateSetting('notification.newReport', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Community Request Notification</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify admins when a new community request is submitted.
                  </p>
                </div>
                <Switch
                  checked={getValue('notification.communityRequest', true)}
                  onCheckedChange={(checked) =>
                    updateSetting('notification.communityRequest', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges || saveMutation.isPending}>
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
