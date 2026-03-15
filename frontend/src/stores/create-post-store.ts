import { create } from 'zustand';
import { POST_LIMITS } from '@figly/shared';

export interface ImageItem {
  file: File;
  previewUrl: string;
  croppedAreaPixels: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  rotation: number;
  croppedBlob: Blob | null;
  mediaId: string | null;
}

interface CreatePostState {
  isOpen: boolean;
  step: 'gallery' | 'edit' | 'caption';
  images: ImageItem[];
  caption: string;
  isPublishing: boolean;
  activeImageIndex: number;

  // Actions
  open: () => void;
  close: () => void;
  setStep: (step: CreatePostState['step']) => void;
  addImages: (files: File[]) => void;
  removeImage: (index: number) => void;
  updateImageCrop: (
    index: number,
    crop: { x: number; y: number; width: number; height: number },
    rotation: number,
  ) => void;
  setCroppedBlob: (index: number, blob: Blob) => void;
  setMediaId: (index: number, mediaId: string) => void;
  setCaption: (caption: string) => void;
  setPublishing: (publishing: boolean) => void;
  setActiveImageIndex: (index: number) => void;
  reset: () => void;
}

const initialState = {
  isOpen: false,
  step: 'gallery' as const,
  images: [] as ImageItem[],
  caption: '',
  isPublishing: false,
  activeImageIndex: 0,
};

export const useCreatePostStore = create<CreatePostState>((set, get) => ({
  ...initialState,

  open: () => set({ isOpen: true }),

  close: () => {
    // Revoke all preview URLs to prevent memory leaks
    const { images } = get();
    images.forEach((img) => {
      URL.revokeObjectURL(img.previewUrl);
    });
    set({ ...initialState });
  },

  setStep: (step) => set({ step }),

  addImages: (files: File[]) => {
    const { images } = get();
    const remaining = POST_LIMITS.maxImages - images.length;
    const filesToAdd = files.slice(0, remaining);

    const newImages: ImageItem[] = filesToAdd.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      croppedAreaPixels: null,
      rotation: 0,
      croppedBlob: null,
      mediaId: null,
    }));

    set({ images: [...images, ...newImages] });
  },

  removeImage: (index: number) => {
    const { images, activeImageIndex } = get();
    const removed = images[index];
    if (removed) {
      URL.revokeObjectURL(removed.previewUrl);
    }
    const newImages = images.filter((_, i) => i !== index);
    // Adjust active index if needed
    const newActiveIndex =
      activeImageIndex >= newImages.length
        ? Math.max(0, newImages.length - 1)
        : activeImageIndex;
    set({ images: newImages, activeImageIndex: newActiveIndex });
  },

  updateImageCrop: (index, crop, rotation) => {
    const { images } = get();
    const updated = [...images];
    if (updated[index]) {
      updated[index] = {
        ...updated[index],
        croppedAreaPixels: crop,
        rotation,
      };
      set({ images: updated });
    }
  },

  setCroppedBlob: (index, blob) => {
    const { images } = get();
    const updated = [...images];
    if (updated[index]) {
      updated[index] = { ...updated[index], croppedBlob: blob };
      set({ images: updated });
    }
  },

  setMediaId: (index, mediaId) => {
    const { images } = get();
    const updated = [...images];
    if (updated[index]) {
      updated[index] = { ...updated[index], mediaId };
      set({ images: updated });
    }
  },

  setCaption: (caption) => set({ caption }),

  setPublishing: (publishing) => set({ isPublishing: publishing }),

  setActiveImageIndex: (index) => set({ activeImageIndex: index }),

  reset: () => {
    // Revoke all preview URLs to prevent memory leaks
    const { images } = get();
    images.forEach((img) => {
      URL.revokeObjectURL(img.previewUrl);
    });
    set({ ...initialState });
  },
}));
