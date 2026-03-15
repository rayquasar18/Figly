'use client';

import { useState } from 'react';
import type { MessageResponse } from '@figly/shared';
import { MediaMessage } from './media-message';
import { Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: MessageResponse;
  isSent: boolean;
  isConsecutive: boolean;
  isGroup: boolean;
  showReadReceipt: boolean;
  isRead: boolean;
}

export function MessageBubble({
  message,
  isSent,
  isConsecutive,
  isGroup,
  showReadReceipt,
  isRead,
}: MessageBubbleProps) {
  const [showTimestamp, setShowTimestamp] = useState(false);

  const hasMedia = message.media.length > 0;
  const hasContent = !!message.content;

  return (
    <div
      className={`flex ${isSent ? 'justify-end' : 'justify-start'} ${
        isConsecutive ? 'mt-0.5' : 'mt-2'
      }`}
    >
      <div className={`flex max-w-[75%] flex-col ${isSent ? 'items-end' : 'items-start'}`}>
        {/* Sender name for group chats (received messages only) */}
        {isGroup && !isSent && !isConsecutive && (
          <div className="mb-0.5 flex items-center gap-1.5 px-1">
            {message.sender.avatarUrl ? (
              <img
                src={message.sender.avatarUrl}
                alt={message.sender.displayName}
                className="size-4 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-4 items-center justify-center rounded-full bg-muted">
                <span className="text-[8px] font-medium text-muted-foreground">
                  {message.sender.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-xs font-medium text-muted-foreground">
              {message.sender.displayName}
            </span>
          </div>
        )}

        {/* Message bubble */}
        <button
          type="button"
          onClick={() => setShowTimestamp((p) => !p)}
          className={`rounded-2xl px-3 py-2 text-sm ${
            isSent
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          } ${!hasContent && hasMedia ? 'bg-transparent p-0' : ''}`}
        >
          {hasMedia && <MediaMessage media={message.media} />}
          {hasContent && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
        </button>

        {/* Timestamp + read receipt */}
        {showTimestamp && (
          <div className="mt-0.5 flex items-center gap-1 px-1">
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(message.createdAt), 'HH:mm')}
            </span>
          </div>
        )}

        {/* Read receipt for last sent message */}
        {showReadReceipt && (
          <div className="mt-0.5 flex items-center gap-0.5 px-1">
            {isRead ? (
              <CheckCheck className="size-3.5 text-primary" />
            ) : (
              <Check className="size-3.5 text-muted-foreground" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
