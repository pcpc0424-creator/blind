'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/stores/auth.store';

export type UserType = 'guest' | 'general' | 'company' | 'admin';

export interface Permissions {
  userType: UserType;
  isAdmin: boolean;
  isCompanyUser: boolean;
  isGeneralUser: boolean;
  isGuest: boolean;

  // Feature permissions
  canAccessCompanyHall: boolean;
  canAccessCompanyBoards: boolean;
  canAccessPublicServant: boolean;
  canAccessInterests: boolean;
  canAccessFreeTalk: boolean;
  canCreatePost: boolean;
  canRequestCommunity: boolean;
  canAccessAdmin: boolean;

  // Company-specific
  companySlug: string | null;
  companyName: string | null;
}

export function usePermissions(): Permissions {
  const { user, isAuthenticated } = useAuthStore();

  return useMemo(() => {
    // Determine user type
    let userType: UserType = 'guest';
    if (isAuthenticated && user) {
      if (user.role === 'ADMIN') {
        userType = 'admin';
      } else if (user.companyVerified && user.company) {
        userType = 'company';
      } else {
        userType = 'general';
      }
    }

    const isAdmin = userType === 'admin';
    const isCompanyUser = userType === 'company';
    const isGeneralUser = userType === 'general';
    const isGuest = userType === 'guest';

    return {
      userType,
      isAdmin,
      isCompanyUser,
      isGeneralUser,
      isGuest,

      // Feature permissions
      // Admin: full access to everything
      // Company user: can access company boards, interests, free talk
      // General user: can access interests, free talk (limited company hall)
      // Guest: view only, no posting

      canAccessCompanyHall: isAdmin || isCompanyUser || isGeneralUser,
      canAccessCompanyBoards: isAdmin || isCompanyUser,
      canAccessPublicServant: isAdmin || isCompanyUser || isGeneralUser,
      canAccessInterests: isAdmin || isCompanyUser || isGeneralUser,
      canAccessFreeTalk: isAdmin || isCompanyUser || isGeneralUser,
      canCreatePost: isAuthenticated,
      canRequestCommunity: isAuthenticated,
      canAccessAdmin: isAdmin,

      // Company info
      companySlug: user?.company?.slug || null,
      companyName: user?.company?.name || null,
    };
  }, [user, isAuthenticated]);
}

export function getAccessLabel(userType: UserType): string {
  switch (userType) {
    case 'admin':
      return 'Admin';
    case 'company':
      return 'Company Verified';
    case 'general':
      return 'Member';
    case 'guest':
      return 'Guest';
  }
}

export function getAccessBadgeColor(userType: UserType): string {
  switch (userType) {
    case 'admin':
      return 'bg-red-100 text-red-700';
    case 'company':
      return 'bg-blue-100 text-blue-700';
    case 'general':
      return 'bg-green-100 text-green-700';
    case 'guest':
      return 'bg-gray-100 text-gray-700';
  }
}
