import { create } from 'zustand';

type StoryStep = 'idle' | 'select' | 'preview' | 'uploading';

interface CreateStoryState {
  step: StoryStep;
  file: File | null;
  previewUrl: string | null;
  mediaType: 'image' | 'video' | null;

  openFlow: () => void;
  setFile: (file: File) => void;
  setStep: (step: StoryStep) => void;
  reset: () => void;
}

export const useCreateStoryStore = create<CreateStoryState>((set, get) => ({
  step: 'idle',
  file: null,
  previewUrl: null,
  mediaType: null,

  openFlow: () => set({ step: 'select' }),

  setFile: (file: File) => {
    // Revoke previous preview URL to prevent memory leaks
    const prev = get().previewUrl;
    if (prev) URL.revokeObjectURL(prev);

    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
    set({
      file,
      previewUrl: URL.createObjectURL(file),
      mediaType,
      step: 'preview',
    });
  },

  setStep: (step: StoryStep) => set({ step }),

  reset: () => {
    const prev = get().previewUrl;
    if (prev) URL.revokeObjectURL(prev);
    set({
      step: 'idle',
      file: null,
      previewUrl: null,
      mediaType: null,
    });
  },
}));
