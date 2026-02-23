'use client';

import { useState } from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
}

export function MainLayout({ children, rightPanel }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        {/* Desktop sidebar */}
        <Sidebar className="hidden md:flex sticky top-14" />

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile sidebar */}
        <Sidebar
          className={cn(
            'fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out md:hidden',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content */}
        <main className="flex-1 min-h-[calc(100vh-3.5rem)]">
          <div className="container px-3 sm:px-4 md:px-6 py-4 md:py-6 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="flex gap-4 md:gap-6">
              {/* Main feed area */}
              <div className="flex-1 min-w-0">{children}</div>

              {/* Right panel (desktop only) */}
              {rightPanel && (
                <aside className="hidden lg:block w-72 xl:w-80 shrink-0">
                  {rightPanel}
                </aside>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
