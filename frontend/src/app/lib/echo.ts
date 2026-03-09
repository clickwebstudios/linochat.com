import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo?: Echo<'pusher'>;
  }
}

window.Pusher = Pusher;

let echoInstance: Echo<'pusher'> | null = null;

export function getEcho(): Echo<'pusher'> | null {
  return echoInstance;
}

export function initEcho(): Echo<'pusher'> | null {
  const token = localStorage.getItem('access_token');
  if (!token) return null;

  if (echoInstance) {
    return echoInstance;
  }

  // Use same origin for auth (vite proxies /broadcasting to backend in dev)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';

  const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;
  const useReverb = Boolean(reverbKey);

  const echoConfig: Record<string, unknown> = {
    broadcaster: 'pusher',
    key: useReverb ? reverbKey : (import.meta.env.VITE_PUSHER_APP_KEY || ''),
    forceTLS: useReverb ? (import.meta.env.VITE_REVERB_SCHEME === 'https' || import.meta.env.VITE_REVERB_SCHEME === 'wss') : true,
    authEndpoint: `${baseUrl}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  };

  if (useReverb) {
    echoConfig.wsHost = import.meta.env.VITE_REVERB_HOST || 'localhost';
    echoConfig.wsPort = Number(import.meta.env.VITE_REVERB_PORT) || 8081;
    echoConfig.wssPort = echoConfig.wsPort;
    echoConfig.disableStats = true;
    echoConfig.cluster = 'reverb'; // Required by Pusher client; ignored when wsHost is set
  } else {
    echoConfig.cluster = import.meta.env.VITE_PUSHER_APP_CLUSTER || 'us3';
  }

  echoInstance = new Echo(echoConfig as any);

  return echoInstance;
}

export function disconnectEcho(): void {
  if (echoInstance) {
    (echoInstance as any).disconnect?.();
    echoInstance = null;
  }
}
