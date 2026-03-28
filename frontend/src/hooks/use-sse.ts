'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '@/stores/notification-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const RECONNECT_DELAY = 30_000; // 30s polling fallback

export function useSSE(enabled: boolean) {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    if (!enabled) {
      // Clean up if disabled
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      useNotificationStore.getState().setSseConnected(false);
      return;
    }

    function connect() {
      if (!enabledRef.current) return;

      const es = new EventSource(`${API_URL}/notifications/stream`, {
        withCredentials: true,
      });
      eventSourceRef.current = es;

      es.onopen = () => {
        useNotificationStore.getState().setSseConnected(true);
      };

      es.onmessage = (event) => {
        try {
          JSON.parse(event.data);
          useNotificationStore.getState().incrementUnread();
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        } catch {
          // Ignore parse errors (heartbeat, etc.)
        }
      };

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;
        useNotificationStore.getState().setSseConnected(false);

        // Reconnect after delay (polling fallback)
        if (enabledRef.current) {
          reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY);
        }
      };
    }

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      useNotificationStore.getState().setSseConnected(false);
    };
  }, [enabled, queryClient]);
}
