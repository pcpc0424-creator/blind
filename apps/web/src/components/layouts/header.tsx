'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  MessageSquare,
  User,
  LogOut,
  Menu,
  PenSquare,
  Settings,
  Bookmark,
  Eye,
  Sparkles,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/use-auth';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

interface HeaderProps {
  onMenuClick?: () => void;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: {
    postId?: string;
    commentId?: string;
  };
  isRead: boolean;
  createdAt: string;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const logout = useLogout();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get<{ notifications: Notification[]; total: number }>('/notifications');
      return response.data;
    },
    enabled: isAuthenticated,
  });

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Mark notification as read
  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      return api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
    if (notification.data?.postId) {
      router.push(`/post/${notification.data.postId}`);
    } else {
      router.push('/notifications');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout.mutate();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-background via-background to-primary/5 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 pt-[env(safe-area-inset-top)]">
      <div className="container px-2 sm:px-4 md:px-6 flex h-14 sm:h-16 items-center gap-2 sm:gap-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-9 w-9 md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/25">
            <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              bulag
            </span>
            <p className="text-[10px] text-muted-foreground -mt-1">Anonymous Workplace Community</p>
          </div>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-1 sm:mx-4">
          <div className={`relative transition-all duration-200 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
            <Search className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isSearchFocused ? 'text-primary' : 'text-muted-foreground'}`} />
            <Input
              type="search"
              placeholder="Search..."
              className={`pl-8 sm:pl-10 pr-2 sm:pr-4 h-9 sm:h-10 text-sm rounded-full border-2 transition-all ${isSearchFocused ? 'border-primary bg-background shadow-lg shadow-primary/10' : 'border-muted bg-muted/50'}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            {searchQuery && (
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                Enter
              </kbd>
            )}
          </div>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-1 sm:gap-2">
          {isAuthenticated ? (
            <>
              {/* Write button */}
              <Button
                size="sm"
                className="hidden md:flex gap-2 rounded-full px-4 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/25"
                asChild
              >
                <Link href="/write">
                  <PenSquare className="h-4 w-4" />
                  Write
                </Link>
              </Button>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-full h-9 w-9">
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-red-500 text-[9px] sm:text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="text-xs">{unreadCount} new</Badge>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No notifications
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((notification) => (
                        <DropdownMenuItem
                          key={notification.id}
                          className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notification.isRead ? 'bg-primary/5' : ''}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''}`}>{notification.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{notification.body}</p>
                          <p className="text-xs text-primary">{formatRelativeTime(notification.createdAt)}</p>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="justify-center text-primary cursor-pointer">
                    <Link href="/notifications">View all notifications</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Messages */}
              <Button variant="ghost" size="icon" className="relative rounded-full hidden sm:flex" asChild>
                <Link href="/messages">
                  <MessageSquare className="h-5 w-5" />
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    2
                  </span>
                </Link>
              </Button>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all p-0">
                    <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white font-bold text-sm sm:text-base">
                        {user?.nickname?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-purple-600/10 rounded-t-md -m-1 mb-1">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-lg font-bold">
                        {user?.nickname?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="font-semibold">{user?.nickname}</p>
                      <p className="text-xs text-muted-foreground">
                        {user?.company?.name || 'Unverified'}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Sparkles className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs text-muted-foreground">Lv.1 Newbie</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bookmarks" className="cursor-pointer">
                      <Bookmark className="mr-2 h-4 w-4" />
                      Bookmarks
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  {user?.role === 'ADMIN' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer text-red-600">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" className="hidden sm:flex rounded-full h-9" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button className="rounded-full h-8 sm:h-9 px-3 sm:px-4 text-sm bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/25" asChild>
                <Link href="/register">
                  <Sparkles className="h-4 w-4 mr-1 hidden sm:block" />
                  <span className="sm:hidden">Join</span>
                  <span className="hidden sm:inline">Get Started</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
