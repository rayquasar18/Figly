# Phase 8: Direct Messaging - Research

**Researched:** 2026-03-15
**Domain:** Real-time messaging, WebSocket, PostgreSQL chat schema, NestJS gateway
**Confidence:** HIGH

## Summary

Phase 8 implements a full direct messaging system for Figly, enabling 1-on-1 conversations, group chats by collection category/interest, media sharing within DMs, and read receipts. The project already has a working SSE-based real-time notification system (NotificationsGateway) using RxJS Subject per-user, but DMs require true bidirectional WebSocket communication for real-time message delivery and typing-like feedback. The existing infrastructure (Redis for BullMQ, MinIO for media, PostgreSQL for persistence) provides all necessary services.

The recommended approach uses NestJS `@nestjs/websockets` with `@nestjs/platform-socket.io` (Socket.IO) for the real-time transport layer, a PostgreSQL-backed conversation/message data model, and the existing media upload pipeline for DM media sharing. The SSE notification system will be extended to push "new message" notifications for users who are NOT connected to the messaging WebSocket. Block/mute filtering from ModerationService integrates into conversation creation and message sending guards.

**Primary recommendation:** Use Socket.IO WebSocket gateway for real-time DM delivery, with REST endpoints for conversation CRUD, message history, and read receipts. Keep SSE for notifications separate -- messaging gets its own WebSocket namespace.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MESG-01 | User can send and receive direct messages (1-on-1) | Conversation + Message Prisma models, MessagingGateway WebSocket, ConversationsController REST API, real-time delivery via Socket.IO rooms |
| MESG-02 | User can share media in DMs | Reuse existing MediaService upload pipeline, MessageMedia join table, presigned URL resolution in message responses |
| MESG-03 | User can see message read status | MessageReadReceipt model per-participant, PATCH endpoint to mark messages as read, WebSocket event broadcast for read receipts |
| MESG-04 | User can participate in group chats by category/interest | Conversation model with `isGroup` flag, ConversationParticipant join table, category/interest metadata fields, participant management endpoints |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @nestjs/websockets | ^10.4.0 | WebSocket gateway decorators | Official NestJS WebSocket integration |
| @nestjs/platform-socket.io | ^10.4.0 | Socket.IO adapter for NestJS | Most mature WS adapter for NestJS, supports rooms/namespaces |
| socket.io | ^4.7.0 | Server-side Socket.IO | Industry standard real-time library, auto-reconnect, fallback |
| socket.io-client | ^4.7.0 | Client-side Socket.IO | Pairs with server, auto-reconnect, binary support |
| @prisma/client | ^6.4.0 (existing) | ORM for message persistence | Already in use, Prisma migrations for new models |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| BullMQ | ^5.71.0 (existing) | Async push notifications for offline users | When recipient not connected to WebSocket |
| date-fns | ^4.1.0 (existing) | Message timestamps formatting | Frontend message time display |
| zustand | ^5.0.0 (existing) | Messaging state store | Conversation list, active conversation, unread counts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Socket.IO | Native WebSocket (ws) | ws is lighter but lacks auto-reconnect, rooms, namespaces, binary protocol negotiation -- Socket.IO is worth the overhead for a chat system |
| Socket.IO | Extend existing SSE | SSE is server-to-client only; chat needs bidirectional (client sends messages too). Would require POST+SSE hybrid which is clunky |
| PostgreSQL | Redis Streams for messages | Redis gives faster reads but loses durability/queryability. PostgreSQL with proper indexes is fast enough for the scale, and keeps one database |

**Installation:**
```bash
# Backend
cd backend && pnpm add @nestjs/websockets @nestjs/platform-socket.io socket.io

# Frontend
cd frontend && pnpm add socket.io-client
```

## Architecture Patterns

### Recommended Project Structure
```
backend/src/
├── messaging/
│   ├── messaging.module.ts          # Module wiring
│   ├── messaging.gateway.ts         # WebSocket gateway (Socket.IO)
│   ├── conversations.controller.ts  # REST: CRUD conversations, history
│   ├── conversations.service.ts     # Business logic: conversations
│   ├── messages.service.ts          # Business logic: messages, read receipts
│   ├── dto/
│   │   ├── create-conversation.dto.ts
│   │   ├── send-message.dto.ts
│   │   └── message-response.dto.ts
│   └── __tests__/
│       ├── conversations.service.spec.ts
│       └── messages.service.spec.ts

frontend/src/
├── app/(app)/messages/
│   ├── page.tsx                     # Conversation list
│   └── [conversationId]/
│       └── page.tsx                 # Chat view
├── components/messaging/
│   ├── conversation-list.tsx
│   ├── conversation-item.tsx
│   ├── chat-view.tsx
│   ├── message-bubble.tsx
│   ├── message-input.tsx
│   ├── new-conversation-dialog.tsx
│   └── group-chat-create.tsx
├── hooks/
│   ├── use-messaging-socket.ts      # Socket.IO connection hook
│   └── queries/
│       └── messaging-queries.ts     # React Query hooks
├── stores/
│   └── messaging-store.ts           # Zustand: active convo, unread counts
```

### Pattern 1: WebSocket Gateway with JWT Authentication
**What:** NestJS `@WebSocketGateway` with custom auth middleware that validates JWT from cookie/handshake
**When to use:** All real-time messaging connections
**Example:**
```typescript
// backend/src/messaging/messaging.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: '/messaging',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class MessagingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Set<string>>(); // userId -> socket ids

  async handleConnection(client: Socket) {
    // Extract JWT from cookie or auth header
    const token = this.extractToken(client);
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      // Track connection
      if (!this.userSockets.has(payload.sub)) {
        this.userSockets.set(payload.sub, new Set());
      }
      this.userSockets.get(payload.sub)!.add(client.id);
      // Join user's conversation rooms
      const conversationIds = await this.getConversationIds(payload.sub);
      conversationIds.forEach((id) => client.join(`conv:${id}`));
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string; mediaIds?: string[] },
  ) {
    // Validate, persist, broadcast via messagesService
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; messageId: string },
  ) {
    // Update read receipt, broadcast to conversation room
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  emitToUser(userId: string, event: string, data: any) {
    const socketIds = this.userSockets.get(userId);
    if (socketIds) {
      socketIds.forEach((sid) => this.server.to(sid).emit(event, data));
    }
  }
}
```

### Pattern 2: Conversation Model with Dual-Purpose (1-on-1 and Group)
**What:** Single Conversation model with `isGroup` flag, ConversationParticipant join table
**When to use:** All messaging features -- simplifies querying
**Example:**
```typescript
// Prisma schema approach
model Conversation {
  id          String   @id @default(cuid())
  isGroup     Boolean  @default(false)
  name        String?  @db.VarChar(100)  // null for 1-on-1
  categoryId  String?                     // optional: link to Category for interest groups
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  participants ConversationParticipant[]
  messages     Message[]

  @@index([updatedAt])  // For sorting conversation list by recent activity
  @@map("conversations")
}

model ConversationParticipant {
  id             String       @id @default(cuid())
  conversationId String
  userId         String
  joinedAt       DateTime     @default(now())
  lastReadAt     DateTime     @default(now())  // Simpler than per-message receipts

  conversation   Conversation @relation(...)
  user           User         @relation(...)

  @@unique([conversationId, userId])
  @@index([userId, conversationId])
  @@map("conversation_participants")
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  senderId       String
  content        String?      @db.VarChar(2000)
  createdAt      DateTime     @default(now())

  conversation   Conversation @relation(...)
  sender         User         @relation(...)
  media          MessageMedia[]

  @@index([conversationId, createdAt])
  @@map("messages")
}

model MessageMedia {
  id        String  @id @default(cuid())
  messageId String
  mediaId   String
  position  Int     @default(0)

  message   Message @relation(...)
  media     Media   @relation(...)

  @@unique([messageId, position])
  @@index([messageId])
  @@map("message_media")
}
```

### Pattern 3: Read Receipts via lastReadAt on Participant
**What:** Track read status per conversation participant using `lastReadAt` timestamp, NOT per-message read flags
**When to use:** Read receipts for both 1-on-1 and group conversations
**Why:** Per-message read receipts create N*M rows (N messages * M participants). Using `lastReadAt` on ConversationParticipant means: "all messages before this timestamp are read." One row per participant per conversation -- vastly simpler and faster.

```typescript
// Unread count = messages in conversation where createdAt > participant.lastReadAt
async getUnreadCount(userId: string, conversationId: string): Promise<number> {
  const participant = await this.prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant) return 0;

  return this.prisma.message.count({
    where: {
      conversationId,
      createdAt: { gt: participant.lastReadAt },
      senderId: { not: userId }, // Don't count own messages
    },
  });
}

// Mark as read: update lastReadAt to now
async markConversationRead(userId: string, conversationId: string) {
  await this.prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  });
}
```

### Pattern 4: Socket.IO Client Hook (Frontend)
**What:** React hook managing Socket.IO connection lifecycle with auth
**When to use:** Frontend messaging pages
```typescript
// frontend/src/hooks/use-messaging-socket.ts
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';

const WS_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';

export function useMessagingSocket() {
  const socketRef = useRef<Socket | null>(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;

    const socket = io(`${WS_URL}/messaging`, {
      withCredentials: true,  // Send cookies for JWT
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => { /* connected */ });
    socket.on('disconnect', () => { /* disconnected */ });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const sendMessage = useCallback((conversationId: string, content: string, mediaIds?: string[]) => {
    socketRef.current?.emit('send_message', { conversationId, content, mediaIds });
  }, []);

  const markRead = useCallback((conversationId: string) => {
    socketRef.current?.emit('mark_read', { conversationId });
  }, []);

  return { socket: socketRef, sendMessage, markRead };
}
```

### Anti-Patterns to Avoid
- **Polling for new messages:** Do NOT use REST polling for real-time message delivery. WebSocket is mandatory for chat UX.
- **Per-message read receipt rows:** Do NOT create a MessageReadReceipt row per (message, reader). Use `lastReadAt` on ConversationParticipant instead.
- **Separate SSE stream for messaging:** Do NOT extend the existing notification SSE. Messaging needs bidirectional transport (WebSocket). The existing SSE continues to handle notifications only.
- **Storing messages in Redis only:** Do NOT skip PostgreSQL persistence. All messages must be in PostgreSQL for durability, history search, and compliance. Redis is only for pub/sub.
- **Unbounded message history loading:** Always use cursor-based pagination for message history, loading newest first.
- **Typing indicators:** Out of scope per REQUIREMENTS.md ("Real-time typing indicators" is listed in Out of Scope).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebSocket transport | Raw ws with reconnect logic | Socket.IO | Auto-reconnect, room management, binary frames, fallback to polling |
| JWT extraction from WS handshake | Custom cookie parsing | cookie-parser + JwtService.verify | Already in use, consistent auth pattern |
| Media upload for DMs | New upload pipeline | Existing MediaService + MediaModule | Already handles upload, processing, presigned URLs |
| Message delivery guarantee | Custom ACK system | Socket.IO acknowledgements + PostgreSQL persist-first | Socket.IO has built-in callback ACK; persist before broadcast ensures no message loss |
| Online status tracking | Custom heartbeat system | Socket.IO connection/disconnection events | Gateway's handleConnection/handleDisconnect with userSockets Map |

**Key insight:** The existing media pipeline (MediaService -> BullMQ -> Sharp processing -> MinIO storage -> presigned URLs) already handles everything needed for DM media. Messages simply reference Media records via MessageMedia join table, identical to PostMedia pattern.

## Common Pitfalls

### Pitfall 1: WebSocket Auth Without Cookie Forwarding
**What goes wrong:** Socket.IO client doesn't send cookies by default, so JWT auth fails on the WebSocket handshake.
**Why it happens:** Socket.IO uses its own transport, not the browser's fetch API. `withCredentials: true` must be set on both client AND server CORS config.
**How to avoid:** Set `cors: { origin, credentials: true }` in `@WebSocketGateway` options, AND `withCredentials: true` on the Socket.IO client. Parse the `access_token` cookie from `client.handshake.headers.cookie` in `handleConnection`.
**Warning signs:** All WebSocket connections disconnect immediately after connect.

### Pitfall 2: Race Condition on Message Order
**What goes wrong:** Messages arrive out of order when multiple are sent rapidly.
**Why it happens:** Async database writes complete in different order than sends.
**How to avoid:** Persist message to PostgreSQL FIRST, get the `createdAt` timestamp, THEN broadcast. Frontend sorts by `createdAt`. Never rely on WebSocket delivery order alone.
**Warning signs:** Messages appear in wrong order in chat view.

### Pitfall 3: Duplicate 1-on-1 Conversations
**What goes wrong:** Two users each create a conversation with each other, resulting in duplicate 1-on-1 conversations.
**Why it happens:** No uniqueness constraint on "conversation between user A and user B."
**How to avoid:** Before creating a 1-on-1 conversation, query for existing: find Conversation where isGroup=false AND has exactly 2 participants matching both user IDs. Use a transaction with SELECT FOR UPDATE or a query-then-create-in-transaction pattern.
**Warning signs:** Same 2 users appear in multiple separate chat threads.

### Pitfall 4: Block/Mute Not Enforced in DMs
**What goes wrong:** Blocked users can still send messages to each other.
**Why it happens:** ModerationService not integrated into message send flow.
**How to avoid:** Check `moderationService.isBlocked(senderId, recipientId)` before creating a message. For group chats, filter message visibility (don't broadcast to users who have blocked the sender). Also prevent creating new 1-on-1 conversations with blocked users.
**Warning signs:** Blocked user receives messages from blocker.

### Pitfall 5: N+1 Query on Conversation List
**What goes wrong:** Loading conversation list triggers a query per conversation for last message, participants, and unread count.
**Why it happens:** Naive implementation queries each conversation separately.
**How to avoid:** Use Prisma `include` with `take: 1, orderBy: { createdAt: 'desc' }` for last message. Compute unread counts in a single aggregation query grouped by conversationId. Batch resolve participant avatars.
**Warning signs:** Conversation list loads slowly with many conversations.

### Pitfall 6: WebSocket Gateway Port Conflict with HTTP
**What goes wrong:** Socket.IO gateway runs on a different port than the HTTP server, breaking in Docker/proxy setups.
**Why it happens:** By default, `@WebSocketGateway()` with no port argument attaches to the same HTTP server. But specifying a port creates a separate server.
**How to avoid:** Do NOT specify a port in `@WebSocketGateway()`. Let it attach to the same NestJS HTTP server (port 4000). The namespace `/messaging` differentiates it from HTTP routes.
**Warning signs:** WebSocket connections fail in Docker but work locally.

### Pitfall 7: Missing Conversation Room Join on New Conversation
**What goes wrong:** User creates a new conversation but doesn't receive messages in it until reconnection.
**Why it happens:** Socket.IO rooms are only joined at connection time. New conversations created via REST don't auto-join.
**How to avoid:** After creating a conversation via REST, emit a `conversation_created` event from the gateway that tells all online participants to join the new room. OR: the REST endpoint calls `gateway.joinConversationRoom(userId, conversationId)`.
**Warning signs:** New conversation works for sender but recipient only sees messages after page refresh.

## Code Examples

Verified patterns from the existing Figly codebase:

### Adapting main.ts for WebSocket Support
```typescript
// backend/src/main.ts -- Socket.IO works with no changes needed
// NestJS automatically attaches WebSocket gateway to the same HTTP server
// when no port is specified in @WebSocketGateway()
// The existing CORS config in enableCors() handles HTTP only.
// WebSocket CORS is configured in @WebSocketGateway({ cors: {...} })
```

### Message Send Flow (Persist-First)
```typescript
// backend/src/messaging/messages.service.ts
async sendMessage(senderId: string, conversationId: string, content: string, mediaIds?: string[]) {
  // 1. Verify sender is participant
  const participant = await this.prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: senderId } },
  });
  if (!participant) throw new ForbiddenException('Ban khong phai thanh vien hoi thoai nay');

  // 2. Check blocks (for 1-on-1)
  const conversation = await this.prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: { select: { userId: true } } },
  });
  if (!conversation.isGroup) {
    const otherUserId = conversation.participants.find(p => p.userId !== senderId)?.userId;
    if (otherUserId) {
      const blocked = await this.moderationService.isBlocked(senderId, otherUserId);
      if (blocked) throw new ForbiddenException('Khong the gui tin nhan');
    }
  }

  // 3. Persist message
  const message = await this.prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: {
        conversationId,
        senderId,
        content,
      },
      include: {
        sender: { select: { id: true, username: true, name: true, avatar: { select: { mediumKey: true } } } },
      },
    });

    // 4. Attach media if any
    if (mediaIds?.length) {
      await tx.messageMedia.createMany({
        data: mediaIds.map((mediaId, index) => ({
          messageId: msg.id,
          mediaId,
          position: index,
        })),
      });
    }

    // 5. Update conversation.updatedAt for sort order
    await tx.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return msg;
  });

  return message;
}
```

### Conversation List Query Pattern
```typescript
// backend/src/messaging/conversations.service.ts
async getConversations(userId: string, cursor?: string, limit = 20) {
  const blockedIds = await this.moderationService.getBlockedUserIds(userId);

  const conversations = await this.prisma.conversation.findMany({
    where: {
      participants: { some: { userId } },
    },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, username: true, name: true, avatar: { select: { mediumKey: true } } },
          },
        },
        where: blockedIds.length > 0
          ? { userId: { notIn: blockedIds } }
          : undefined,
      },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, username: true, name: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  const hasMore = conversations.length > limit;
  const items = conversations.slice(0, limit);
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return { items, nextCursor, hasMore };
}
```

### Frontend Message Store Pattern
```typescript
// frontend/src/stores/messaging-store.ts
import { create } from 'zustand';

interface MessagingState {
  activeConversationId: string | null;
  unreadCounts: Record<string, number>; // conversationId -> count
  totalUnread: number;
  setActiveConversation: (id: string | null) => void;
  setUnreadCount: (conversationId: string, count: number) => void;
  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
}

export const useMessagingStore = create<MessagingState>((set, get) => ({
  activeConversationId: null,
  unreadCounts: {},
  totalUnread: 0,
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setUnreadCount: (conversationId, count) =>
    set((state) => {
      const newCounts = { ...state.unreadCounts, [conversationId]: count };
      return {
        unreadCounts: newCounts,
        totalUnread: Object.values(newCounts).reduce((a, b) => a + b, 0),
      };
    }),
  incrementUnread: (conversationId) =>
    set((state) => {
      // Don't increment if viewing this conversation
      if (state.activeConversationId === conversationId) return state;
      const current = state.unreadCounts[conversationId] || 0;
      const newCounts = { ...state.unreadCounts, [conversationId]: current + 1 };
      return {
        unreadCounts: newCounts,
        totalUnread: Object.values(newCounts).reduce((a, b) => a + b, 0),
      };
    }),
  clearUnread: (conversationId) =>
    set((state) => {
      const newCounts = { ...state.unreadCounts, [conversationId]: 0 };
      return {
        unreadCounts: newCounts,
        totalUnread: Object.values(newCounts).reduce((a, b) => a + b, 0),
      };
    }),
}));
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Polling REST for new messages | WebSocket (Socket.IO) for real-time | Standard since 2020+ | Essential for chat UX |
| Per-message read receipt rows | lastReadAt timestamp on participant | Performance optimization | Avoids N*M table growth |
| Separate message DB (MongoDB) | PostgreSQL with proper indexes | Prisma ecosystem maturity | Single DB simplifies operations |
| Custom reconnect logic | Socket.IO built-in reconnect | Socket.IO v4+ | Reliability without custom code |

**Deprecated/outdated:**
- Long polling for chat: replaced by WebSocket everywhere
- `@nestjs/platform-ws` (raw ws): works but lacks room/namespace abstractions needed for chat
- Firebase/Supabase Realtime: not applicable since Figly self-hosts everything

## Prisma Schema Design

### New Models Required

```prisma
// Add to existing schema.prisma

// ─── Messaging System ─────────────────────────────────────────────────────────

model Conversation {
  id          String    @id @default(cuid())
  isGroup     Boolean   @default(false)
  name        String?   @db.VarChar(100)
  description String?   @db.VarChar(500)
  categoryId  String?                     // Link to Category for interest-based groups
  createdById String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  createdBy    User                       @relation("conversationCreator", fields: [createdById], references: [id])
  category     Category?                  @relation(fields: [categoryId], references: [id])
  participants ConversationParticipant[]
  messages     Message[]

  @@index([updatedAt])
  @@map("conversations")
}

model ConversationParticipant {
  id             String       @id @default(cuid())
  conversationId String
  userId         String
  role           String       @default("member") // "admin" | "member" -- for group management
  lastReadAt     DateTime     @default(now())
  joinedAt       DateTime     @default(now())

  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([conversationId, userId])
  @@index([userId])
  @@map("conversation_participants")
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  senderId       String
  content        String?      @db.VarChar(2000)
  createdAt      DateTime     @default(now())

  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender         User         @relation("messageSender", fields: [senderId], references: [id], onDelete: Cascade)
  media          MessageMedia[]

  @@index([conversationId, createdAt])
  @@map("messages")
}

model MessageMedia {
  id        String  @id @default(cuid())
  messageId String
  mediaId   String
  position  Int     @default(0)

  message   Message @relation(fields: [messageId], references: [id], onDelete: Cascade)
  media     Media   @relation(fields: [mediaId], references: [id], onDelete: Cascade)

  @@unique([messageId, position])
  @@index([messageId])
  @@map("message_media")
}
```

### User Model Extensions Required
```prisma
// Add to existing User model:
  conversationsCreated ConversationParticipant[]
  conversations        ConversationParticipant[] // via join table
  messagesSent         Message[] @relation("messageSender")
```

### Category Model Extension Required
```prisma
// Add to existing Category model:
  conversations Conversation[]
```

### Media Model Extension Required
```prisma
// Add to existing Media model:
  messageMedia MessageMedia[]
```

## API Design

### REST Endpoints (ConversationsController)
| Method | Path | Purpose |
|--------|------|---------|
| GET | /conversations | List user's conversations (paginated) |
| POST | /conversations | Create conversation (1-on-1 or group) |
| GET | /conversations/:id | Get conversation details + participants |
| GET | /conversations/:id/messages | Get message history (cursor paginated, newest first) |
| PATCH | /conversations/:id/read | Mark conversation as read (update lastReadAt) |
| POST | /conversations/:id/participants | Add participant to group chat |
| DELETE | /conversations/:id/participants/:userId | Remove participant from group |
| DELETE | /conversations/:id | Leave conversation (or delete if creator of group) |
| GET | /conversations/unread-total | Get total unread message count |

### WebSocket Events (MessagingGateway)
| Direction | Event | Payload | Purpose |
|-----------|-------|---------|---------|
| Client -> Server | `send_message` | `{ conversationId, content, mediaIds? }` | Send a message |
| Client -> Server | `mark_read` | `{ conversationId }` | Mark conversation as read |
| Server -> Client | `new_message` | `{ message, conversationId }` | New message received |
| Server -> Client | `message_read` | `{ conversationId, userId, readAt }` | Read receipt update |
| Server -> Client | `conversation_created` | `{ conversation }` | New conversation (join room) |
| Server -> Client | `participant_joined` | `{ conversationId, user }` | New group member |
| Server -> Client | `participant_left` | `{ conversationId, userId }` | Member left group |

## Integration Points

### With Existing NotificationsModule
- When a user is NOT connected to the messaging WebSocket but receives a DM, enqueue a BullMQ notification job to send push notification
- New notification type: `MESSAGE` added to NotificationType enum
- SSE notification emitted for "new message" when recipient is not on messaging pages

### With Existing ModerationModule
- `ModerationService.isBlocked()` called before: creating 1-on-1 conversation, sending message in 1-on-1
- `ModerationService.getBlockedUserIds()` used to filter conversation list and hide messages from blocked users in group chats
- Blocked users cannot be added to group chats by the blocker

### With Existing MediaModule
- `MediaService.upload()` reused for DM media uploads (same endpoint: POST /media/upload)
- `StorageService.getPresignedUrl()` resolves message media URLs in responses
- MessageMedia join table follows same pattern as PostMedia

### With Header/Navigation
- DM icon added to top header bar (Send/MessageCircle icon from lucide-react), replacing or alongside notification bell
- Unread DM badge shown on the icon
- Mobile: DM accessed from header, not bottom nav (Instagram pattern)

## Shared Package Extensions

### New Constants
```typescript
// packages/shared/src/constants/messaging.constants.ts
export const MESSAGING_LIMITS = {
  messageMaxLength: 2000,
  conversationNameMaxLength: 100,
  conversationDescriptionMaxLength: 500,
  messagesPageSize: 30,
  conversationsPageSize: 20,
  maxGroupParticipants: 50,
  maxMediaPerMessage: 5,
} as const;
```

### New DTOs
```typescript
// packages/shared/src/dto/messaging.dto.ts
import { z } from 'zod';

export const createConversationSchema = z.object({
  participantIds: z.array(z.string()).min(1).max(49),
  isGroup: z.boolean().optional().default(false),
  name: z.string().max(100).optional(),
  categoryId: z.string().optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().max(2000).optional(),
  mediaIds: z.array(z.string()).max(5).optional(),
}).refine((data) => data.content || (data.mediaIds && data.mediaIds.length > 0), {
  message: 'Tin nhan can co noi dung hoac media',
});
```

### New Types
```typescript
// packages/shared/src/types/messaging.types.ts
export interface ConversationResponse {
  id: string;
  isGroup: boolean;
  name: string | null;
  categoryId: string | null;
  participants: ConversationParticipantResponse[];
  lastMessage: MessageResponse | null;
  unreadCount: number;
  updatedAt: string;
}

export interface ConversationParticipantResponse {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  lastReadAt: string;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  sender: MessageSender;
  content: string | null;
  media: MessageMediaItem[];
  createdAt: string;
}

export interface MessageSender {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface MessageMediaItem {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  mimeType: string;
}
```

## Open Questions

1. **Group chat participant limit for interest-based groups**
   - What we know: MESG-04 says "group chats organized by collection category or interest" -- this could mean small groups (5-50) or large community channels (100+)
   - What's unclear: Scale target for interest-based groups
   - Recommendation: Start with 50-person limit (MESSAGING_LIMITS.maxGroupParticipants). Large community features (channels, etc.) deferred to v2. Interest groups are user-created, not auto-generated per category.

2. **Navigation placement for DMs**
   - What we know: Instagram puts DM icon in top-right header. Current Figly bottom nav has 5 tabs (Home, Search, Create, Notifications, Profile).
   - What's unclear: Whether to add DM to bottom nav (6th tab) or keep in header.
   - Recommendation: Follow Instagram pattern -- DM icon (Send or MessageCircle) in top header bar, next to notification bell. Bottom nav stays 5 tabs.

3. **Message deletion**
   - What we know: Requirements don't mention message deletion ("unsend").
   - What's unclear: Whether users expect to delete sent messages.
   - Recommendation: Defer message deletion to v2. Keep it simple for initial implementation.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + ts-jest |
| Config file | backend/jest.config.ts |
| Quick run command | `cd backend && npx jest --testPathPattern=messaging --forceExit` |
| Full suite command | `cd backend && npx jest --forceExit` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MESG-01 | Send/receive 1-on-1 messages | unit | `cd backend && npx jest src/messaging/__tests__/messages.service.spec.ts -x` | Wave 0 |
| MESG-01 | Create 1-on-1 conversation, prevent duplicates | unit | `cd backend && npx jest src/messaging/__tests__/conversations.service.spec.ts -x` | Wave 0 |
| MESG-01 | WebSocket message delivery | integration | `cd backend && npx jest src/messaging/__tests__/messaging.gateway.spec.ts -x` | Wave 0 |
| MESG-02 | Attach media to message | unit | `cd backend && npx jest src/messaging/__tests__/messages.service.spec.ts -x` | Wave 0 |
| MESG-03 | Read receipts (lastReadAt update + unread count) | unit | `cd backend && npx jest src/messaging/__tests__/messages.service.spec.ts -x` | Wave 0 |
| MESG-04 | Group conversation CRUD + participant management | unit | `cd backend && npx jest src/messaging/__tests__/conversations.service.spec.ts -x` | Wave 0 |
| ALL | Block/mute enforcement in messaging | unit | `cd backend && npx jest src/messaging/__tests__/conversations.service.spec.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd backend && npx jest --testPathPattern=messaging --forceExit`
- **Per wave merge:** `cd backend && npx jest --forceExit`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `backend/src/messaging/__tests__/conversations.service.spec.ts` -- covers MESG-01 (1-on-1 creation, duplicate prevention), MESG-04 (group CRUD, participant management), block enforcement
- [ ] `backend/src/messaging/__tests__/messages.service.spec.ts` -- covers MESG-01 (send/receive), MESG-02 (media attachment), MESG-03 (read receipts, unread counts)
- [ ] `backend/src/messaging/__tests__/messaging.gateway.spec.ts` -- covers WebSocket connection, auth, room management, message broadcast
- [ ] `@nestjs/websockets` and `@nestjs/platform-socket.io` packages need install

## Sources

### Primary (HIGH confidence)
- Figly codebase inspection: Prisma schema, NestJS modules, NotificationsGateway SSE pattern, MediaModule upload pipeline, ModerationService block/mute APIs
- NestJS official documentation (training knowledge, verified against codebase patterns): WebSocket gateways, @nestjs/websockets, Socket.IO adapter
- Socket.IO v4 documentation (training knowledge): rooms, namespaces, CORS, auto-reconnect
- PostgreSQL chat schema patterns (training knowledge, cross-verified with existing Figly Prisma patterns)

### Secondary (MEDIUM confidence)
- Instagram DM UX patterns: navigation placement, read receipts, group chat behavior (general UI/UX knowledge)

### Tertiary (LOW confidence)
- None -- all recommendations verified against existing codebase patterns or well-established documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Socket.IO + @nestjs/websockets is the canonical NestJS WebSocket solution, well-documented
- Architecture: HIGH - Conversation/Message/Participant model is a proven chat schema pattern, verified against existing Figly Prisma patterns
- Pitfalls: HIGH - Based on direct codebase analysis (block/mute integration, SSE pattern, media pipeline) and common WebSocket gotchas
- Integration: HIGH - All integration points verified by reading existing service code

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable domain, established patterns)
