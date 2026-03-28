'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearchUsers } from '@/hooks/queries/search-queries';
import { useCategories } from '@/hooks/queries/collection-queries';
import { useCreateConversation } from '@/hooks/queries/messaging-queries';
import { MESSAGING_LIMITS } from '@figly/shared';
import type { SearchUserResult } from '@figly/shared';

interface GroupChatCreateProps {
  onCreated: (conversationId: string) => void;
}

export function GroupChatCreate({ onCreated }: GroupChatCreateProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<SearchUserResult[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const { data: searchResults } = useSearchUsers(searchQuery);
  const { data: categories } = useCategories();
  const createConversation = useCreateConversation();

  const toggleUser = (user: SearchUserResult) => {
    setSelectedUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      if (exists) {
        return prev.filter((u) => u.id !== user.id);
      }
      if (prev.length >= MESSAGING_LIMITS.maxGroupParticipants - 1) return prev;
      return [...prev, user];
    });
  };

  const removeUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleCreate = async () => {
    if (!name.trim() || selectedUsers.length === 0) return;
    setIsCreating(true);
    try {
      const conversation = await createConversation.mutateAsync({
        participantIds: selectedUsers.map((u) => u.id),
        isGroup: true,
        name: name.trim(),
        description: description.trim() || undefined,
        categoryId: categoryId || undefined,
      });
      onCreated(conversation.id);
    } catch {
      // Error handled by mutation
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Group name */}
      <div>
        <label htmlFor="group-name" className="mb-1 block text-sm font-medium">
          Ten nhom <span className="text-destructive">*</span>
        </label>
        <Input
          id="group-name"
          value={name}
          onChange={(e) =>
            setName(e.target.value.slice(0, MESSAGING_LIMITS.conversationNameMaxLength))
          }
          placeholder="Nhap ten nhom..."
          maxLength={MESSAGING_LIMITS.conversationNameMaxLength}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="group-desc" className="mb-1 block text-sm font-medium">
          Mo ta
        </label>
        <Input
          id="group-desc"
          value={description}
          onChange={(e) =>
            setDescription(
              e.target.value.slice(0, MESSAGING_LIMITS.conversationDescriptionMaxLength),
            )
          }
          placeholder="Mo ta nhom (tuy chon)..."
          maxLength={MESSAGING_LIMITS.conversationDescriptionMaxLength}
        />
      </div>

      {/* Category selector */}
      {categories && categories.length > 0 && (
        <div>
          <label htmlFor="group-category" className="mb-1 block text-sm font-medium">
            Danh muc
          </label>
          <select
            id="group-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">Khong co</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Selected users chips */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedUsers.map((user) => (
            <span
              key={user.id}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
            >
              {user.displayName}
              <button
                type="button"
                onClick={() => removeUser(user.id)}
                className="rounded-full p-0.5 hover:bg-primary/20"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* User search */}
      <div>
        <label className="mb-1 block text-sm font-medium">
          Thanh vien ({selectedUsers.length}/{MESSAGING_LIMITS.maxGroupParticipants - 1})
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tim nguoi dung..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Search results */}
      <div className="max-h-40 overflow-y-auto">
        {searchResults?.map((user) => {
          const isSelected = selectedUsers.some((u) => u.id === user.id);
          return (
            <button
              key={user.id}
              type="button"
              onClick={() => toggleUser(user)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted ${
                isSelected ? 'bg-primary/5' : ''
              }`}
            >
              <div className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-muted">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-medium text-muted-foreground">
                    {user.displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{user.displayName}</p>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>
              {isSelected && (
                <div className="flex size-5 items-center justify-center rounded-full bg-primary">
                  <span className="text-xs text-primary-foreground">&#10003;</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Create button */}
      <Button
        onClick={handleCreate}
        disabled={!name.trim() || selectedUsers.length === 0 || isCreating}
        className="w-full"
      >
        {isCreating ? 'Dang tao...' : 'Tao nhom'}
      </Button>
    </div>
  );
}
