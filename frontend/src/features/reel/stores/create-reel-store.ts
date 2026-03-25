import { create } from 'zustand';

interface CreateReelState {
  isOpen: boolean;
  file: File | null;
  previewUrl: string | null;
  duration: number;
  width: number;
  height: number;
  step: 'select' | 'preview' | 'processing';
  open: () => void;
  close: () => void;
  setFile: (
    file: File,
    previewUrl: string,
    duration: number,
    width: number,
    height: number,
  ) => void;
  setStep: (step: 'select' | 'preview' | 'processing') => void;
  reset: () => void;
}

export const useCreateReelStore = create<CreateReelState>((set, get) => ({
  isOpen: false,
  file: null,
  previewUrl: null,
  duration: 0,
  width: 0,
  height: 0,
  step: 'select',
  open: () => set({ isOpen: true, step: 'select' }),
  close: () => {
    const { previewUrl } = get();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    set({
      isOpen: false,
      file: null,
      previewUrl: null,
      duration: 0,
      width: 0,
      height: 0,
      step: 'select',
    });
  },
  setFile: (file, previewUrl, duration, width, height) =>
    set({ file, previewUrl, duration, width, height, step: 'preview' }),
  setStep: (step) => set({ step }),
  reset: () => {
    const { previewUrl } = get();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    set({
      isOpen: false,
      file: null,
      previewUrl: null,
      duration: 0,
      width: 0,
      height: 0,
      step: 'select',
    });
  },
}));
