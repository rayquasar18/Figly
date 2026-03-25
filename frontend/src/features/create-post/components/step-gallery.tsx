'use client';

import { useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreatePostStore } from '../stores/create-post-store';
import { POST_LIMITS } from '@figly/shared';

export function StepGallery() {
  const images = useCreatePostStore((s) => s.images);
  const addImages = useCreatePostStore((s) => s.addImages);
  const removeImage = useCreatePostStore((s) => s.removeImage);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addImages(Array.from(files));
    }
    // Reset input so the same files can be selected again
    e.target.value = '';
  };

  const handleDropzoneClick = () => {
    inputRef.current?.click();
  };

  const canAddMore = images.length < POST_LIMITS.maxImages;

  return (
    <div className="flex h-full flex-col">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {images.length === 0 ? (
        /* Empty state: large dropzone */
        <button
          type="button"
          onClick={handleDropzoneClick}
          className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground"
        >
          <ImagePlus className="size-16 stroke-1" />
          <div className="text-center">
            <p className="text-lg font-medium">Chon anh</p>
            <p className="text-sm">Nhan de chon anh tu thu vien</p>
          </div>
          <Button variant="default" size="sm" className="mt-2">
            Chon tu may
          </Button>
        </button>
      ) : (
        /* Thumbnails grid with selected images */
        <div className="flex flex-1 flex-col gap-4 p-4">
          {/* Count indicator */}
          <p className="text-center text-sm text-muted-foreground">
            {images.length}/{POST_LIMITS.maxImages} anh da chon
          </p>

          {/* Grid */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((img, index) => (
              <div key={img.previewUrl} className="group relative aspect-square">
                <img
                  src={img.previewUrl}
                  alt={`Anh ${index + 1}`}
                  className="size-full rounded-md object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={`Xoa anh ${index + 1}`}
                >
                  <X className="size-3.5" />
                </button>
                {/* Position indicator */}
                <span className="absolute bottom-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-[10px] font-medium text-white">
                  {index + 1}
                </span>
              </div>
            ))}

            {/* Add more button */}
            {canAddMore && (
              <button
                type="button"
                onClick={handleDropzoneClick}
                className="flex aspect-square items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/30 text-muted-foreground transition-colors hover:border-muted-foreground/50"
                aria-label="Them anh"
              >
                <ImagePlus className="size-8 stroke-1" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
