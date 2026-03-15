'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSavePushSubscription } from '@/hooks/queries/notification-queries';

const SESSION_KEY = 'figly_sessions';
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    arr[i] = raw.charCodeAt(i);
  }
  return arr.buffer as ArrayBuffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function usePushPermission() {
  const [canPrompt, setCanPrompt] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null,
  );
  const saveSub = useSavePushSubscription();

  // Increment session count
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const count = parseInt(localStorage.getItem(SESSION_KEY) || '0', 10);
    localStorage.setItem(SESSION_KEY, String(count + 1));
  }, []);

  // Check push capability
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (!VAPID_PUBLIC_KEY) return;

    const sessionCount = parseInt(
      localStorage.getItem(SESSION_KEY) || '0',
      10,
    );
    // Only prompt after 2+ sessions (sessionCount >= 2 since we already incremented)
    if (sessionCount < 2) return;

    const perm = Notification.permission;
    setPermission(perm);

    if (perm === 'denied') return;

    if (perm === 'granted') {
      // Auto-subscribe if not already
      autoSubscribe();
      return;
    }

    // permission === 'default' -- can prompt
    setCanPrompt(true);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  async function autoSubscribe() {
    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const p256dh = subscription.getKey('p256dh');
      const auth = subscription.getKey('auth');
      if (p256dh && auth) {
        saveSub.mutate({
          endpoint: subscription.endpoint,
          p256dh: arrayBufferToBase64(p256dh),
          auth: arrayBufferToBase64(auth),
        });
      }
    } catch {
      // Push subscription failed -- ignore silently
    }
  }

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setCanPrompt(false);
      if (result === 'granted') {
        await autoSubscribe();
      }
    } catch {
      // Permission request failed
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return { canPrompt, permission, requestPermission };
}
