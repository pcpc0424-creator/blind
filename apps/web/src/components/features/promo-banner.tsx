'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

export interface PromoData {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  placement: string;
}

interface PromoBannerProps {
  promo: PromoData;
  className?: string;
  variant?: 'card' | 'inline' | 'full';
  showCloseButton?: boolean;
  onClose?: () => void;
}

export function PromoBanner({
  promo,
  className,
  variant = 'card',
  showCloseButton = false,
  onClose,
}: PromoBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Track impression when component mounts
  useEffect(() => {
    api.post(`/banners/${promo.id}/impression`).catch(() => {});
  }, [promo.id]);

  const handleClick = async () => {
    // Track click
    try {
      await api.post(`/banners/${promo.id}/click`);
    } catch (error) {
      // Ignore errors
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible || imageError) {
    return null;
  }

  const content = (
    <div
      className={cn(
        'relative overflow-hidden bg-muted rounded-lg transition-all hover:shadow-md',
        variant === 'card' && 'border',
        variant === 'inline' && 'border-y',
        variant === 'full' && 'w-full',
        className
      )}
    >
      {/* Sponsor Label */}
      <div className="absolute top-2 left-2 z-10">
        <span className="text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">
          Sponsored
        </span>
      </div>

      {/* Close Button */}
      {showCloseButton && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleClose();
          }}
          className="absolute top-2 right-2 z-10 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {/* Banner Image */}
      <img
        src={promo.imageUrl}
        alt={promo.title}
        className={cn(
          'w-full object-cover',
          variant === 'card' && 'h-32 sm:h-40',
          variant === 'inline' && 'h-20 sm:h-24',
          variant === 'full' && 'h-40 sm:h-48'
        )}
        onError={() => setImageError(true)}
      />

      {/* External Link Indicator */}
      {promo.linkUrl && (
        <div className="absolute bottom-2 right-2">
          <ExternalLink className="h-4 w-4 text-white drop-shadow-md" />
        </div>
      )}
    </div>
  );

  if (promo.linkUrl) {
    return (
      <a
        href={promo.linkUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={handleClick}
        className="block"
      >
        {content}
      </a>
    );
  }

  return content;
}

// Component to insert promos into a list every N items
interface PromoInsertedListProps<T> {
  items: T[];
  promos: PromoData[];
  insertEvery?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  promoVariant?: 'card' | 'inline' | 'full';
}

export function PromoInsertedList<T>({
  items,
  promos,
  insertEvery = 4,
  renderItem,
  promoVariant = 'card',
}: PromoInsertedListProps<T>) {
  const result: React.ReactNode[] = [];
  let promoIndex = 0;

  items.forEach((item, index) => {
    // Add the item
    result.push(
      <div key={`item-${index}`}>
        {renderItem(item, index)}
      </div>
    );

    // Insert promo after every N items (if we have promos available)
    if ((index + 1) % insertEvery === 0 && promos[promoIndex]) {
      result.push(
        <div key={`promo-${promoIndex}`} className="my-4">
          <PromoBanner promo={promos[promoIndex]} variant={promoVariant} />
        </div>
      );
      promoIndex = (promoIndex + 1) % promos.length; // Cycle through promos
    }
  });

  return <>{result}</>;
}

// Hook to fetch promos for a specific placement
import { useQuery } from '@tanstack/react-query';

export function usePromos(placement: string) {
  return useQuery({
    queryKey: ['promos', placement],
    queryFn: async () => {
      const response = await api.get<PromoData[]>(`/banners?placement=${placement}`);
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
