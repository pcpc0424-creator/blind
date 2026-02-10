'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Building2,
  MessageSquare,
  FileText,
  Flag,
  Shield,
  Sparkles,
  Tags,
  Settings,
  ChevronLeft,
  Loader2,
  Crown,
  Megaphone,
  MessagesSquare,
  Bell,
  Menu,
  X,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuthStore } from '@/stores/auth.store';

const adminMenus = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'User Management',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Company Management',
    href: '/admin/companies',
    icon: Building2,
  },
  {
    title: 'Community Management',
    href: '/admin/communities',
    icon: MessageSquare,
  },
  {
    title: 'Community Requests',
    href: '/admin/community-requests',
    icon: FileText,
  },
  {
    title: 'Post Management',
    href: '/admin/posts',
    icon: FileText,
  },
  {
    title: 'Comment Management',
    href: '/admin/comments',
    icon: MessagesSquare,
  },
  {
    title: 'Report Management',
    href: '/admin/reports',
    icon: Flag,
  },
  {
    title: 'Review Management',
    href: '/admin/reviews',
    icon: Star,
  },
  {
    title: 'Notification Management',
    href: '/admin/notifications',
    icon: Bell,
  },
  {
    title: 'Public Servant Categories',
    href: '/admin/public-servant-categories',
    icon: Shield,
  },
  {
    title: 'Interest Categories',
    href: '/admin/interest-categories',
    icon: Sparkles,
  },
  {
    title: 'Tag Management',
    href: '/admin/tags',
    icon: Tags,
  },
  {
    title: 'Ad Management',
    href: '/admin/ads',
    icon: Megaphone,
  },
  {
    title: 'Ad Inquiries',
    href: '/admin/ad-inquiries',
    icon: Megaphone,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const { isAdmin } = usePermissions();
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (hasHydrated && !isLoading && !isAdmin) {
      router.push('/');
    }
  }, [hasHydrated, isLoading, isAdmin, router]);

  // 페이지 이동 시 모바일 사이드바 닫기
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // 항상 같은 로딩 UI를 보여줘서 hydration 불일치 방지
  if (!hasHydrated || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading admin...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Access denied. User role: {user?.role || 'none'}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-background border-b flex items-center justify-between px-4 z-40 md:hidden">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-500">
            <Crown className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm">Admin</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed md:sticky top-0 left-0 h-screen w-64 bg-background border-r flex flex-col z-50 transition-transform duration-200',
        'md:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold">Admin</h1>
              <p className="text-xs text-muted-foreground">{user?.nickname}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {adminMenus.map((menu) => {
              const isActive = pathname === menu.href ||
                (menu.href !== '/admin' && pathname.startsWith(menu.href));

              return (
                <Link
                  key={menu.href}
                  href={menu.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <menu.icon className="h-4 w-4" />
                  {menu.title}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Site
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
