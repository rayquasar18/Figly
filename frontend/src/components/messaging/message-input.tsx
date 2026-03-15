'use client';

import { useState, useRef, useCallback } from 'react';
import { Send, Image as ImageIcon, X } from 'lucide-react';
import { MESSAGING_LIMITS } from '@figly/shared';
import { apiClient } from '@/lib/api-client';

interface MessageInputProps {
  conversationId: string;
  onSend: (content?: string, mediaIds?: string[]) => void;
}

export function MessageInput({ conversationId, onSend }: MessageInputProps) {
  const [text, setText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MESSAGING_LIMITS.messageMaxLength) {
      setText(value);
      adjustHeight();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MESSAGING_LIMITS.maxMediaPerMessage - selectedFiles.length;
    const newFiles = files.slice(0, remaining);

    setSelectedFiles((prev) => [...prev, ...newFiles]);

    // Create previews
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    const content = text.trim();
    if (!content && selectedFiles.length === 0) return;

    try {
      let mediaIds: string[] | undefined;

      // Upload media if any
      if (selectedFiles.length > 0) {
        setIsUploading(true);
        const uploadedIds: string[] = [];

        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          const res = await apiClient.post<{ id: string }>(
            '/media/upload',
            formData,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
            },
          );
          uploadedIds.push(res.data.id);
        }

        mediaIds = uploadedIds;
        setIsUploading(false);
      }

      onSend(content || undefined, mediaIds);

      // Clear state
      setText('');
      setSelectedFiles([]);
      setPreviews([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch {
      setIsUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = (text.trim().length > 0 || selectedFiles.length > 0) && !isUploading;

  return (
    <div className="border-t bg-background p-3">
      {/* Media previews */}
      {previews.length > 0 && (
        <div className="mb-2 flex gap-2 overflow-x-auto">
          {previews.map((preview, index) => (
            <div key={index} className="relative shrink-0">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="size-16 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Photo attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-muted"
          disabled={selectedFiles.length >= MESSAGING_LIMITS.maxMediaPerMessage}
          aria-label="Dinh kem anh"
        >
          <ImageIcon className="size-5 text-muted-foreground" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Nhan tin..."
          rows={1}
          className="flex-1 resize-none rounded-xl border bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          style={{ maxHeight: '120px' }}
        />

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
          aria-label="Gui tin nhan"
        >
          {isUploading ? (
            <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <Send className="size-4" />
          )}
        </button>
      </div>
    </div>
  );
}
