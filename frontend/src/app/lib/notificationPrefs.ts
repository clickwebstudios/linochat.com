import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'lino.notificationPrefs.v1';

export interface NotificationPrefs {
  sound: boolean;
  desktop: boolean;
}

const defaults: NotificationPrefs = { sound: true, desktop: false };

function read(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

let cached: NotificationPrefs = read();
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

export function getNotificationPrefs(): NotificationPrefs {
  return cached;
}

export function setNotificationPrefs(patch: Partial<NotificationPrefs>): void {
  cached = { ...cached, ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore quota / private-mode errors; in-memory value still works for this tab.
  }
  emit();
}

export function subscribeNotificationPrefs(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useNotificationPrefs(): NotificationPrefs {
  return useSyncExternalStore(subscribeNotificationPrefs, getNotificationPrefs, getNotificationPrefs);
}
