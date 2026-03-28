'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearchUsers } from '@/hooks/queries/search-queries';
import { useCreateConversation } from '@/hooks/queries/messaging-queries';
import { GroupChatCreate } from './group-chat-create';
import type { SearchUserResult } from '@figly/shared';

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewConversationDialog({
  open,
  onOpenChange,
}: NewConversationDialogProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<SearchUserResult | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: searchResults, isLoading: isSearching } = useSearchUsers(searchQuery);
  const createConversation = useCreateConversation();

  const handleCreateDm = async (user: SearchUserResult) => {
    setIsCreating(true);
    try {
      const conversation = await createConversation.mutateAsync({
        participantIds: [user.id],
      });
      onOpenChange(false);
      setSearchQuery('');
      setSelectedUser(null);
      router.push(`/messages/${conversation.id}`);
    } catch {
      // Error handled by mutation
    } finally {
      setIsCreating(false);
    }
  };

  const handleGroupCreated = (conversationId: string) => {
    onOpenChange(false);
    router.push(`/messages/${conversationId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tin nhan moi</DialogTitle>
          <DialogDescription>
            Bat dau cuoc tro chuyen moi
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dm" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="dm" className="flex-1">
              Tin nhan
            </TabsTrigger>
            <TabsTrigger value="group" className="flex-1">
              Nhom moi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dm" className="space-y-3">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tim nguoi dung..."
                className="pl-9"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedUser(null);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="size-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Search results */}
            <div className="max-h-64 overflow-y-auto">
              {isSearching && (
                <div className="flex justify-center py-4">
                  <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
              {searchResults && searchResults.length === 0 && searchQuery && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Khong tim thay nguoi dung
                </p>
              )}
              {searchResults?.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleCreateDm(user)}
                  disabled={isCreating}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted"
                >
                  <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-muted">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">
                        {user.displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="group">
            <GroupChatCreate onCreated={handleGroupCreated} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
