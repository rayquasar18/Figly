'use client';

import { useState } from 'react';
import { MessageCircle, Plus } from 'lucide-react';
import { useConversations } from '@/hooks/queries/messaging-queries';
import { ConversationList } from '@/components/messaging/conversation-list';
import { NewConversationDialog } from '@/components/messaging/new-conversation-dialog';

export default function MessagesPage() {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useConversations();

  const conversations = data?.conversations ?? [];

  return (
    <div className="mx-auto max-w-lg">
      {/* Page header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h1 className="text-lg font-semibold">Tin nhan</h1>
        <button
          type="button"
          onClick={() => setShowNewDialog(true)}
          className="flex size-8 items-center justify-center rounded-full hover:bg-muted"
          aria-label="Tin nhan moi"
        >
          <Plus className="size-5" />
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && conversations.length === 0 && (
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <MessageCircle className="size-8 text-muted-foreground" />
          </div>
          <h2 className="mb-1 text-lg font-semibold">Chua co tin nhan nao</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Bat dau cuoc tro chuyen voi ban be
          </p>
          <button
            type="button"
            onClick={() => setShowNewDialog(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Gui tin nhan
          </button>
        </div>
      )}

      {/* Conversation list */}
      {!isLoading && conversations.length > 0 && (
        <ConversationList
          conversations={conversations}
          hasMore={!!hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
        />
      )}

      {/* New conversation dialog */}
      <NewConversationDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
      />
    </div>
  );
}
