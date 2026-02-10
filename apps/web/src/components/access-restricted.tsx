'use client';

import Link from 'next/link';
import { Lock, Building2, UserPlus, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePermissions, UserType } from '@/hooks/use-permissions';

interface AccessRestrictedProps {
  requiredAccess: 'company' | 'authenticated' | 'admin';
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function AccessRestricted({
  requiredAccess,
  title,
  description,
  children,
}: AccessRestrictedProps) {
  const permissions = usePermissions();
  const { userType, isAdmin, isCompanyUser, isGuest } = permissions;

  // Check if user has required access
  let hasAccess = false;
  if (requiredAccess === 'authenticated') {
    hasAccess = !isGuest;
  } else if (requiredAccess === 'company') {
    hasAccess = isAdmin || isCompanyUser;
  } else if (requiredAccess === 'admin') {
    hasAccess = isAdmin;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show restricted access message
  const getDefaultMessage = () => {
    switch (requiredAccess) {
      case 'authenticated':
        return {
          title: 'Login Required',
          description: 'Please login to use this feature.',
          action: { label: 'Login', href: '/login' },
          icon: UserPlus,
        };
      case 'company':
        return {
          title: 'Company Verification Required',
          description: 'Only users verified with a company email can access this.',
          action: { label: 'Verify Company', href: '/register?type=company' },
          icon: Building2,
        };
      case 'admin':
        return {
          title: 'Admin Access Required',
          description: 'Only administrators can access this page.',
          action: null,
          icon: Shield,
        };
    }
  };

  const defaultMsg = getDefaultMessage();
  const Icon = defaultMsg.icon;

  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title || defaultMsg.title}</h3>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
          {description || defaultMsg.description}
        </p>
        {defaultMsg.action && (
          <Button asChild>
            <Link href={defaultMsg.action.href}>
              <Icon className="h-4 w-4 mr-2" />
              {defaultMsg.action.label}
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface RestrictedLinkProps {
  href: string;
  requiredAccess: 'company' | 'authenticated' | 'admin';
  children: React.ReactNode;
  className?: string;
  showLockIcon?: boolean;
  onClick?: () => void;
}

export function RestrictedLink({
  href,
  requiredAccess,
  children,
  className,
  showLockIcon = true,
  onClick,
}: RestrictedLinkProps) {
  const { userType, isAdmin, isCompanyUser } = usePermissions();

  let hasAccess = false;
  if (requiredAccess === 'authenticated') {
    hasAccess = userType !== 'guest';
  } else if (requiredAccess === 'company') {
    hasAccess = isAdmin || isCompanyUser;
  } else if (requiredAccess === 'admin') {
    hasAccess = isAdmin;
  }

  if (hasAccess) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }

  // Redirect to login or show lock icon
  const redirectHref = requiredAccess === 'authenticated' ? '/login' : '/register?type=company';

  return (
    <Link href={redirectHref} className={className} onClick={onClick}>
      {children}
      {showLockIcon && <Lock className="h-3 w-3 ml-1 inline opacity-50" />}
    </Link>
  );
}
