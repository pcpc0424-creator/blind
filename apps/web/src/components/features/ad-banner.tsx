'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

export interface AdData {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  placement: string;
}

interface AdBannerProps {
  ad: AdData;
  className?: string;
  variant?: 'card' | 'inline' | 'full';
  showCloseButton?: boolean;
  onClose?: () => void;
}

export function AdBanner({
  ad,
  className,
  variant = 'card',
  showCloseButton = false,
  onClose,
}: AdBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Track impression when component mounts (in real implementation)
  // useEffect(() => {
  //   api.post(`/ads/${ad.id}/impression`).catch(() => {});
  // }, [ad.id]);

  const handleClick = async () => {
    // Track click
    try {
      await api.post(`/ads/${ad.id}/click`);
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
      {/* Ad Label */}
      <div className="absolute top-2 left-2 z-10">
        <span className="text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">
          AD
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
        src={ad.imageUrl}
        alt={ad.title}
        className={cn(
          'w-full object-cover',
          variant === 'card' && 'h-32 sm:h-40',
          variant === 'inline' && 'h-20 sm:h-24',
          variant === 'full' && 'h-40 sm:h-48'
        )}
        onError={() => setImageError(true)}
      />

      {/* External Link Indicator */}
      {ad.linkUrl && (
        <div className="absolute bottom-2 right-2">
          <ExternalLink className="h-4 w-4 text-white drop-shadow-md" />
        </div>
      )}
    </div>
  );

  if (ad.linkUrl) {
    return (
      <a
        href={ad.linkUrl}
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

// Component to insert ads into a list every N items
interface AdInsertedListProps<T> {
  items: T[];
  ads: AdData[];
  insertEvery?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  adVariant?: 'card' | 'inline' | 'full';
}

export function AdInsertedList<T>({
  items,
  ads,
  insertEvery = 4,
  renderItem,
  adVariant = 'card',
}: AdInsertedListProps<T>) {
  const result: React.ReactNode[] = [];
  let adIndex = 0;

  items.forEach((item, index) => {
    // Add the item
    result.push(
      <div key={`item-${index}`}>
        {renderItem(item, index)}
      </div>
    );

    // Insert ad after every N items (if we have ads available)
    if ((index + 1) % insertEvery === 0 && ads[adIndex]) {
      result.push(
        <div key={`ad-${adIndex}`} className="my-4">
          <AdBanner ad={ads[adIndex]} variant={adVariant} />
        </div>
      );
      adIndex = (adIndex + 1) % ads.length; // Cycle through ads
    }
  });

  return <>{result}</>;
}

// Hook to fetch ads for a specific placement
import { useQuery } from '@tanstack/react-query';

export function useAds(placement: string) {
  return useQuery({
    queryKey: ['ads', placement],
    queryFn: async () => {
      const response = await api.get<AdData[]>(`/ads?placement=${placement}`);
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
