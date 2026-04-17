import { useCallback, useEffect, useState } from 'react';

type Permission = 'default' | 'granted' | 'denied' | 'unsupported';

function currentPermission(): Permission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as Permission;
}

export interface ShowNotificationOptions {
  title: string;
  body?: string;
  tag?: string;
  icon?: string;
  onClick?: () => void;
}

export function useDesktopNotifications() {
  const [permission, setPermission] = useState<Permission>(() => currentPermission());

  useEffect(() => {
    setPermission(currentPermission());
  }, []);

  const requestPermission = useCallback(async (): Promise<Permission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      setPermission(Notification.permission as Permission);
      return Notification.permission as Permission;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result as Permission);
      return result as Permission;
    } catch {
      return currentPermission();
    }
  }, []);

  const show = useCallback((opts: ShowNotificationOptions): void => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    // Skip when the tab is already focused — the in-app toast/sound is enough.
    if (typeof document !== 'undefined' && document.visibilityState === 'visible' && document.hasFocus()) {
      return;
    }
    try {
      const n = new Notification(opts.title, {
        body: opts.body,
        tag: opts.tag,
        icon: opts.icon ?? '/favicon.ico',
      });
      if (opts.onClick) {
        n.onclick = () => {
          window.focus();
          opts.onClick?.();
          n.close();
        };
      }
    } catch {
      // Notification constructor can throw in some sandboxed contexts; ignore.
    }
  }, []);

  return { permission, requestPermission, show };
}
