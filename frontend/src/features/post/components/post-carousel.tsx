'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import type { PostMediaItem } from '@figly/shared';

interface PostCarouselProps {
  media: PostMediaItem[];
  onDoubleTap?: () => void;
}

export function PostCarousel({ media, onDoubleTap }: PostCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [lastTap, setLastTap] = useState(0);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap < 300) {
      onDoubleTap?.();
    }
    setLastTap(now);
  }, [lastTap, onDoubleTap]);

  // Single image: no carousel, just render the image
  if (media.length === 1) {
    return (
      <div
        className="relative aspect-square w-full overflow-hidden bg-muted"
        onClick={handleTap}
      >
        <img
          src={media[0].url}
          alt=""
          className="size-full object-cover"
          draggable={false}
        />
      </div>
    );
  }

  // Multi-image carousel
  return (
    <div className="relative">
      <Carousel
        setApi={setApi}
        opts={{ align: 'start', loop: false }}
        className="w-full"
      >
        <CarouselContent className="ml-0">
          {media.map((item) => (
            <CarouselItem key={item.id} className="pl-0">
              <div
                className="aspect-square w-full overflow-hidden bg-muted"
                onClick={handleTap}
              >
                <img
                  src={item.url}
                  alt=""
                  className="size-full object-cover"
                  draggable={false}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
        {media.map((_, index) => (
          <div
            key={index}
            className={cn(
              'size-1.5 rounded-full transition-colors',
              index === current ? 'bg-primary' : 'bg-white/60',
            )}
          />
        ))}
      </div>
    </div>
  );
}
