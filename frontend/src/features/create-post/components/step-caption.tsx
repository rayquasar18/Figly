'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Link, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useCreatePostStore } from '../stores/create-post-store';
import { ItemPicker } from '@/features/collection';
import { apiClient } from '@/lib/api-client';
import { POST_LIMITS } from '@figly/shared';
import type { LinkedItemResponse } from '@figly/shared';

interface HashtagSuggestion {
  id: string;
  name: string;
}

interface ProfileSuggestion {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
}

type AutocompleteMode = 'hashtag' | 'mention' | null;

export function StepCaption() {
  const images = useCreatePostStore((s) => s.images);
  const caption = useCreatePostStore((s) => s.caption);
  const setCaption = useCreatePostStore((s) => s.setCaption);
  const linkedItems = useCreatePostStore((s) => s.linkedItems);
  const linkedItemIds = useCreatePostStore((s) => s.linkedItemIds);
  const removeLinkedItem = useCreatePostStore((s) => s.removeLinkedItem);
  const setLinkedItems = useCreatePostStore((s) => s.setLinkedItems);

  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [autocompleteMode, setAutocompleteMode] =
    useState<AutocompleteMode>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hashtagResults, setHashtagResults] = useState<HashtagSuggestion[]>([]);
  const [profileResults, setProfileResults] = useState<ProfileSuggestion[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [triggerStart, setTriggerStart] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Preview first image (cropped blob or original preview)
  const firstImage = images[0];
  const previewSrc = firstImage?.croppedBlob
    ? URL.createObjectURL(firstImage.croppedBlob)
    : firstImage?.previewUrl;

  // Cleanup blob URL for caption preview
  useEffect(() => {
    return () => {
      if (firstImage?.croppedBlob && previewSrc) {
        URL.revokeObjectURL(previewSrc);
      }
    };
  }, [firstImage?.croppedBlob, previewSrc]);

  const handleCaptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setCaption(value);

      const cursorPos = e.target.selectionStart;
      const textBeforeCursor = value.slice(0, cursorPos);

      // Detect #hashtag or @mention trigger
      const hashMatch = textBeforeCursor.match(/#(\w*)$/);
      const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

      if (hashMatch) {
        setAutocompleteMode('hashtag');
        setSearchTerm(hashMatch[1]);
        setTriggerStart(cursorPos - hashMatch[0].length);
        if (hashMatch[1].length > 0) {
          debouncedSearch('hashtag', hashMatch[1]);
        } else {
          setPopoverOpen(false);
        }
      } else if (mentionMatch) {
        setAutocompleteMode('mention');
        setSearchTerm(mentionMatch[1]);
        setTriggerStart(cursorPos - mentionMatch[0].length);
        if (mentionMatch[1].length > 0) {
          debouncedSearch('mention', mentionMatch[1]);
        } else {
          setPopoverOpen(false);
        }
      } else {
        setAutocompleteMode(null);
        setPopoverOpen(false);
      }
    },
    [setCaption],
  );

  const debouncedSearch = useCallback(
    (mode: 'hashtag' | 'mention', query: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(async () => {
        try {
          if (mode === 'hashtag') {
            const res = await apiClient.get<HashtagSuggestion[]>(
              `/hashtags/search?q=${encodeURIComponent(query)}`,
            );
            setHashtagResults(res.data);
            setPopoverOpen(res.data.length > 0);
          } else {
            const res = await apiClient.get<ProfileSuggestion[]>(
              `/profiles/search?q=${encodeURIComponent(query)}`,
            );
            setProfileResults(res.data);
            setPopoverOpen(res.data.length > 0);
          }
        } catch {
          setPopoverOpen(false);
        }
      }, 300);
    },
    [],
  );

  const insertSuggestion = useCallback(
    (text: string) => {
      const before = caption.slice(0, triggerStart);
      const after = caption.slice(
        triggerStart + (autocompleteMode === 'hashtag' ? 1 : 1) + searchTerm.length,
      );
      const insertion =
        autocompleteMode === 'hashtag' ? `#${text} ` : `@${text} `;
      const newCaption = before + insertion + after;
      setCaption(newCaption);
      setPopoverOpen(false);
      setAutocompleteMode(null);

      // Restore focus to textarea
      setTimeout(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          const pos = before.length + insertion.length;
          textarea.focus();
          textarea.setSelectionRange(pos, pos);
        }
      }, 0);
    },
    [caption, triggerStart, autocompleteMode, searchTerm, setCaption],
  );

  const handleItemPickerSelect = useCallback(
    (ids: string[], items?: LinkedItemResponse[]) => {
      if (items) {
        setLinkedItems(ids, items);
      }
    },
    [setLinkedItems],
  );

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* Image preview */}
      {previewSrc && (
        <div className="flex w-full items-center justify-center bg-muted/50 p-4 md:w-1/2">
          <img
            src={previewSrc}
            alt="Xem truoc"
            className="max-h-[300px] rounded-md object-contain md:max-h-[400px]"
          />
          {images.length > 1 && (
            <span className="absolute bottom-6 right-6 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white md:bottom-auto md:right-auto">
              1/{images.length}
            </span>
          )}
        </div>
      )}

      {/* Caption input area */}
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={caption}
                onChange={handleCaptionChange}
                placeholder="Viet chu thich..."
                maxLength={POST_LIMITS.captionMaxLength}
                className="min-h-[150px] resize-none border-0 p-0 text-sm shadow-none focus-visible:ring-0"
                rows={6}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-64 p-1"
            align="start"
            side="bottom"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {autocompleteMode === 'hashtag' &&
              hashtagResults.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => insertSuggestion(tag.name)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <span className="text-primary">#{tag.name}</span>
                </button>
              ))}
            {autocompleteMode === 'mention' &&
              profileResults.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => insertSuggestion(profile.username)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <Avatar className="size-6">
                    {profile.avatarUrl ? (
                      <AvatarImage
                        src={profile.avatarUrl}
                        alt={profile.username}
                      />
                    ) : null}
                    <AvatarFallback className="text-[10px]">
                      {profile.name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-medium">{profile.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {profile.name}
                    </p>
                  </div>
                </button>
              ))}
          </PopoverContent>
        </Popover>

        {/* Link items section */}
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setItemPickerOpen(true)}
            className="gap-1.5"
          >
            <Link className="size-4" />
            Lien ket vat pham
          </Button>

          {linkedItems.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {linkedItems.map((item) => (
                <Badge
                  key={item.id}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {item.name}
                  <button
                    type="button"
                    onClick={() => removeLinkedItem(item.id)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <ItemPicker
          mode="multi"
          selectedItemIds={linkedItemIds}
          onSelect={handleItemPickerSelect}
          open={itemPickerOpen}
          onOpenChange={setItemPickerOpen}
        />

        {/* Character counter */}
        <p className="text-right text-xs text-muted-foreground">
          {caption.length}/{POST_LIMITS.captionMaxLength}
        </p>
      </div>
    </div>
  );
}
