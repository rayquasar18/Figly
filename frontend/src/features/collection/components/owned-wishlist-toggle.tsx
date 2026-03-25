'use client';

import { Check, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import {
  useToggleOwned,
  useToggleWishlist,
} from '@/hooks/queries/collection-queries';

interface OwnedWishlistToggleProps {
  itemId: string;
  isOwned: boolean;
  isWishlisted: boolean;
}

export function OwnedWishlistToggle({
  itemId,
  isOwned,
  isWishlisted,
}: OwnedWishlistToggleProps) {
  const router = useRouter();
  const toggleOwned = useToggleOwned();
  const toggleWishlist = useToggleWishlist();

  const requireAuth = () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      router.push('/login');
      return false;
    }
    return true;
  };

  const handleToggleOwned = () => {
    if (!requireAuth()) return;
    toggleOwned.mutate({ itemId });
  };

  const handleToggleWishlist = () => {
    if (!requireAuth()) return;
    toggleWishlist.mutate({ itemId });
  };

  return (
    <div className="flex gap-2">
      <Button
        variant={isOwned ? 'default' : 'outline'}
        size="sm"
        onClick={handleToggleOwned}
        disabled={toggleOwned.isPending || toggleWishlist.isPending}
        className={
          isOwned
            ? 'bg-green-600 text-white hover:bg-green-700 transition-colors'
            : 'transition-colors'
        }
      >
        <Check className="mr-1 size-4" />
        So huu
      </Button>
      <Button
        variant={isWishlisted ? 'default' : 'outline'}
        size="sm"
        onClick={handleToggleWishlist}
        disabled={toggleOwned.isPending || toggleWishlist.isPending}
        className={
          isWishlisted
            ? 'bg-rose-500 text-white hover:bg-rose-600 transition-colors'
            : 'transition-colors'
        }
      >
        <Heart className={`mr-1 size-4 ${isWishlisted ? 'fill-current' : ''}`} />
        Muon co
      </Button>
    </div>
  );
}
