'use client';

import { useState } from 'react';
import type { MessageMediaItem } from '@figly/shared';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface MediaMessageProps {
  media: MessageMediaItem[];
}

export function MediaMessage({ media }: MediaMessageProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (media.length === 0) return null;

  const isSingle = media.length === 1;

  return (
    <>
      <div
        className={
          isSingle
            ? 'mb-1'
            : 'mb-1 grid grid-cols-2 gap-1'
        }
      >
        {media.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(index);
            }}
            className="overflow-hidden rounded-lg"
          >
            <img
              src={item.thumbnailUrl || item.url}
              alt="Media"
              className={`object-cover ${
                isSingle ? 'max-h-64 w-full rounded-lg' : 'aspect-square w-full'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog
        open={lightboxIndex !== null}
        onOpenChange={() => setLightboxIndex(null)}
      >
        <DialogContent className="max-w-[90vw] border-none bg-transparent p-0 shadow-none sm:max-w-[90vw]">
          {lightboxIndex !== null && media[lightboxIndex] && (
            <img
              src={media[lightboxIndex].url}
              alt="Full size"
              className="max-h-[85vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
