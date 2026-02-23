'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Briefcase,
  Users,
  TrendingUp,
  MessageSquare,
  Bookmark,
  Home,
  Hash,
  Flame,
  Coffee,
  PieChart,
  Laptop,
  Banknote,
  MapPin,
  LogIn,
  UserPlus,
  X,
  Eye,
  Sparkles,
  Lock,
  Shield,
  Crown,
  Megaphone,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { usePermissions, getAccessLabel, getAccessBadgeColor } from '@/hooks/use-permissions';

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

type AccessLevel = 'public' | 'authenticated' | 'company' | 'admin';

interface NavLink {
  href: string;
  label: string;
  icon: any;
  color: string;
  badge?: string;
  access?: AccessLevel;
  restrictedBadge?: string;
}

const mainLinks: NavLink[] = [
  { href: '/', label: 'Home', icon: Home, color: 'text-blue-500', access: 'public' },
  { href: '/companies', label: 'Company Hall', icon: Building2, color: 'text-blue-600', access: 'company', restrictedBadge: 'Company Verified' },
  { href: '/public-servants', label: 'Public Servants', icon: Users, color: 'text-green-500', access: 'authenticated' },
  { href: '/interests', label: 'Interests', icon: Sparkles, color: 'text-purple-500', access: 'authenticated' },
  { href: '/community/free-talk', label: 'Free Talking', icon: Coffee, color: 'text-orange-500', badge: 'HOT', access: 'authenticated' },
];

const categoryLinks = [
  { href: '/community/career', label: 'Career', icon: Briefcase, color: 'text-green-500' },
  { href: '/community/stock', label: 'Stocks & Investing', icon: PieChart, color: 'text-emerald-500' },
  { href: '/community/it-industry', label: 'IT Industry', icon: Laptop, color: 'text-indigo-500' },
  { href: '/community/finance-industry', label: 'Finance Industry', icon: Banknote, color: 'text-yellow-600' },
  { href: '/community/tech-talk', label: 'Tech Lounge', icon: Hash, color: 'text-cyan-500' },
  { href: '/community/local', label: 'Local', icon: MapPin, color: 'text-red-500' },
];

export function Sidebar({ className, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const permissions = usePermissions();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || pathname === '/blind';
    return pathname.startsWith(href);
  };

  const hasAccess = (access?: AccessLevel): boolean => {
    if (!access || access === 'public') return true;
    if (access === 'authenticated') return isAuthenticated;
    if (access === 'company') return permissions.isAdmin || permissions.isCompanyUser;
    if (access === 'admin') return permissions.isAdmin;
    return false;
  };

  return (
    <aside
      className={cn(
        'flex flex-col w-[280px] md:w-64 border-r bg-background md:bg-gradient-to-b md:from-background md:to-muted/20 h-screen md:h-[calc(100vh-3.5rem)] shadow-xl md:shadow-none',
        className
      )}
    >
      {/* Mobile Header */}
      {onClose && (
        <div className="flex items-center justify-between p-3 border-b md:hidden pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-purple-600">
              <Eye className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              bulag
            </span>
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto py-3 md:py-4 px-2 md:px-3">
        {/* User Profile Card */}
        {isAuthenticated && user ? (
          <Card className="mb-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {user.nickname.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {permissions.isAdmin && (
                    <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5">
                      <Crown className="h-3 w-3 text-white" />
                    </div>
                  )}
                  {permissions.isCompanyUser && !permissions.isAdmin && (
                    <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
                      <Building2 className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{user.nickname}</p>
                  </div>
                  <Badge className={cn('text-[10px] px-1.5 py-0 mt-1', getAccessBadgeColor(permissions.userType))}>
                    {getAccessLabel(permissions.userType)}
                  </Badge>
                </div>
              </div>
              {user.company && (
                <div className="mt-3 pt-3 border-t border-primary/10">
                  <Link
                    href={`/company/${user.company.slug}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Building2 className="h-4 w-4" />
                    {user.company.name}
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-4 bg-gradient-to-br from-muted/50 to-muted/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-3">
                Sign in to join the community!
              </p>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" asChild>
                  <Link href="/login">
                    <LogIn className="h-4 w-4 mr-1" />
                    Sign In
                  </Link>
                </Button>
                <Button size="sm" variant="outline" className="flex-1" asChild>
                  <Link href="/register">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Join
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Navigation */}
        <div className="mb-4">
          <h3 className="mb-2 px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Flame className="h-3 w-3 text-orange-500" />
            Main
          </h3>
          <nav className="space-y-1">
            {mainLinks.map((link) => {
              const canAccess = hasAccess(link.access);
              const showRestricted = !canAccess && link.restrictedBadge;

              return (
                <Link
                  key={link.href}
                  href={canAccess ? link.href : (link.access === 'authenticated' ? '/login' : '/register?type=company')}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive(link.href)
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : canAccess
                        ? 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        : 'text-muted-foreground/50 hover:bg-muted/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <link.icon className={cn('h-4 w-4', !isActive(link.href) && (canAccess ? link.color : 'text-muted-foreground/50'))} />
                    {link.label}
                    {!canAccess && <Lock className="h-3 w-3 opacity-50" />}
                  </div>
                  {link.badge && !isActive(link.href) && canAccess && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-600">
                      {link.badge}
                    </Badge>
                  )}
                  {showRestricted && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-600">
                      {link.restrictedBadge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* More Communities */}
        <div className="mb-4">
          <h3 className="mb-2 px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Hash className="h-3 w-3 text-purple-500" />
            More
          </h3>
          <nav className="space-y-1">
            {categoryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive(link.href)
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <link.icon className={cn('h-4 w-4', !isActive(link.href) && link.color)} />
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Admin Section */}
        {permissions.isAdmin && (
          <div className="mb-4">
            <h3 className="mb-2 px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Crown className="h-3 w-3 text-red-500" />
              Admin
            </h3>
            <nav className="space-y-1">
              <Link
                href="/admin"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive('/admin')
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Shield className={cn('h-4 w-4', !isActive('/admin') && 'text-red-500')} />
                Admin Dashboard
              </Link>
              <Link
                href="/admin/community-requests"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive('/admin/community-requests')
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <MessageSquare className={cn('h-4 w-4', !isActive('/admin/community-requests') && 'text-orange-500')} />
                Community Requests
              </Link>
            </nav>
          </div>
        )}

        {/* User Activity */}
        {isAuthenticated && (
          <div className="mb-4">
            <h3 className="mb-2 px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Users className="h-3 w-3 text-blue-500" />
              My Activity
            </h3>
            <nav className="space-y-1">
              <Link
                href="/my-requests"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive('/my-requests')
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <MessageSquare className={cn('h-4 w-4', !isActive('/my-requests') && 'text-purple-500')} />
                My Requests
              </Link>
              <Link
                href="/bookmarks"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive('/bookmarks')
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Bookmark className={cn('h-4 w-4', !isActive('/bookmarks') && 'text-yellow-500')} />
                Bookmarks
              </Link>
              <Link
                href="/messages"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive('/messages')
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <MessageSquare className={cn('h-4 w-4', !isActive('/messages') && 'text-green-500')} />
                Messages
              </Link>
              <Link
                href="/inquiry"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive('/inquiry')
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <HelpCircle className={cn('h-4 w-4', !isActive('/inquiry') && 'text-teal-500')} />
                Contact Us
              </Link>
            </nav>
          </div>
        )}

        {/* Trending Topics */}
        <div className="mb-4">
          <h3 className="mb-2 px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="h-3 w-3 text-red-500" />
            Trending Now
          </h3>
          <div className="space-y-1 px-3">
            {['Salary', 'Job Change', 'Remote Work', 'AI', 'Stocks'].map((tag, i) => (
              <Link
                key={tag}
                href={`/search?q=${tag}`}
                className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <span className="text-xs font-bold text-primary/60">{i + 1}</span>
                <span>#{tag}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-3 bg-muted/30 space-y-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link href="/communities">
            <Users className="mr-2 h-4 w-4 text-primary" />
            View All Communities
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link href="/advertise">
            <Megaphone className="mr-2 h-4 w-4 text-orange-500" />
            Advertise with Us
          </Link>
        </Button>
      </div>
    </aside>
  );
}
