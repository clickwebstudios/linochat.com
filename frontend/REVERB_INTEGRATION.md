# LinoChat Frontend Integration - Laravel Reverb

## 🚀 Быстрый старт с Laravel Reverb

Laravel Reverb работает напрямую через WebSocket API без Pusher.

### 1. Подключение к Reverb WebSocket

```typescript
// src/websocket/reverb.ts
export interface ReverbConfig {
  appKey: string;
  host: string;
  port: string | number;
  forceTLS?: boolean;
}

class ReverbConnection {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;
  private subscriptions = new Map<string, Set<(data: any) => void>>();
  private config: ReverbConfig;

  constructor(config: ReverbConfig) {
    this.config = config;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const protocol = this.config.forceTLS ? 'wss' : 'ws';
      const url = `${protocol}://${this.config.host}:${this.config.port}/app/${this.config.appKey}`;
      
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[Reverb] Connected');
        this.reconnectAttempts = 0;
        this.resubscribeAll();
        resolve();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.ws.onclose = () => {
        console.log('[Reverb] Disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[Reverb] Error:', error);
        reject(error);
      };
    });
  }

  private handleMessage(payload: any) {
    // Reverb protocol: { event: "App\\Events\\EventName", data: {...}, channel: "channel-name" }
    if (payload.event && payload.data) {
      const channel = payload.channel;
      const listeners = this.subscriptions.get(channel);
      if (listeners) {
        listeners.forEach(callback => callback(payload.data));
      }
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[Reverb] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  private resubscribeAll() {
    this.subscriptions.forEach((_, channel) => {
      this.sendSubscribe(channel);
    });
  }

  private sendSubscribe(channel: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        event: 'pusher:subscribe',
        data: { channel }
      }));
    }
  }

  private sendUnsubscribe(channel: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        event: 'pusher:unsubscribe',
        data: { channel }
      }));
    }
  }

  subscribe(channel: string, callback: (data: any) => void): () => void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
      this.sendSubscribe(channel);
    }
    
    this.subscriptions.get(channel)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.subscriptions.get(channel);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.subscriptions.delete(channel);
          this.sendUnsubscribe(channel);
        }
      }
    };
  }

  disconnect() {
    this.ws?.close();
    this.subscriptions.clear();
  }
}

// Singleton instance
const reverbConfig: ReverbConfig = {
  appKey: import.meta.env.VITE_REVERB_APP_KEY || 'local',
  host: import.meta.env.VITE_REVERB_HOST || 'localhost',
  port: import.meta.env.VITE_REVERB_PORT || '8080',
  forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
};

export const reverb = new ReverbConnection(reverbConfig);
```

### 2. React Hook для WebSocket

```typescript
// src/hooks/useReverb.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { reverb } from '../websocket/reverb';

export function useReverb() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    reverb.connect()
      .then(() => setIsConnected(true))
      .catch(err => setError(err));

    return () => {
      reverb.disconnect();
    };
  }, []);

  const subscribe = useCallback((channel: string, callback: (data: any) => void) => {
    return reverb.subscribe(channel, callback);
  }, []);

  return { isConnected, error, subscribe };
}

// Hook для подписки на чат
export function useChatRealtime(chatId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const { subscribe, isConnected } = useReverb();

  useEffect(() => {
    if (!chatId || !isConnected) return;

    const unsubMessage = subscribe(`chat.${chatId}`, (data) => {
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
      }
    });

    const unsubTyping = subscribe(`chat.${chatId}`, (data) => {
      if (data.user_id && data.is_typing !== undefined) {
        setTypingUsers(prev => 
          data.is_typing 
            ? [...new Set([...prev, data.user_id])]
            : prev.filter(id => id !== data.user_id)
        );
      }
    });

    const unsubStatus = subscribe(`chat.${chatId}`, (data) => {
      if (data.status) {
        // Обновить статус чата
        console.log('Chat status changed:', data.status);
      }
    });

    return () => {
      unsubMessage();
      unsubTyping();
      unsubStatus();
    };
  }, [chatId, isConnected, subscribe]);

  return { messages, setMessages, typingUsers, isConnected };
}

// Hook для уведомлений агента
export function useAgentRealtime(userId: string | null) {
  const [newChats, setNewChats] = useState<Chat[]>([]);
  const { subscribe, isConnected } = useReverb();

  useEffect(() => {
    if (!userId || !isConnected) return;

    const unsubscribe = subscribe(`agent.${userId}`, (data) => {
      if (data.chat) {
        setNewChats(prev => [data.chat, ...prev]);
      }
    });

    return unsubscribe;
  }, [userId, isConnected, subscribe]);

  return { newChats, isConnected };
}
```

### 3. Упрощенный API Client

```typescript
// src/api/client.ts
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('access_token');
  
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// Auth
export const auth = {
  login: (email: string, password: string) =>
    apiRequest<{ data: { access_token: string; user: User } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  register: (data: RegisterData) =>
    apiRequest<{ data: { access_token: string; user: User; project: Project } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  me: () =>
    apiRequest<{ data: User }>('/auth/me'),
  
  logout: () =>
    apiRequest('/auth/logout', { method: 'POST' }),
};

// Chats
export const chats = {
  list: (status?: string) =>
    apiRequest<{ data: Chat[] }>(`/agent/chats${status ? `?status=${status}` : ''}`),
  
  get: (id: string) =>
    apiRequest<{ data: Chat }>(`/agent/chats/${id}`),
  
  take: (id: string) =>
    apiRequest(`/agent/chats/${id}/take`, { method: 'POST' }),
  
  send: (id: string, message: string) =>
    apiRequest(`/agent/chats/${id}/message`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  
  typing: (id: string, isTyping: boolean) =>
    apiRequest(`/agent/chats/${id}/typing`, {
      method: 'POST',
      body: JSON.stringify({ is_typing: isTyping }),
    }),
  
  close: (id: string) =>
    apiRequest(`/agent/chats/${id}/close`, { method: 'POST' }),
  
  stats: () =>
    apiRequest<{ data: any }>('/agent/stats'),
};

// Tickets
export const tickets = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiRequest<{ data: Ticket[] }>(`/agent/tickets${query}`);
  },
  
  get: (id: string) =>
    apiRequest<{ data: Ticket }>(`/agent/tickets/${id}`),
  
  create: (data: Partial<Ticket>) =>
    apiRequest<{ data: Ticket }>('/agent/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  reply: (id: string, message: string, sendEmail = true) =>
    apiRequest(`/agent/tickets/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message, send_email: sendEmail }),
    }),
  
  updateStatus: (id: string, status: string) =>
    apiRequest(`/agent/tickets/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
};

// Projects
export const projects = {
  list: () =>
    apiRequest<{ data: Project[] }>('/projects'),
  
  get: (id: string) =>
    apiRequest<{ data: Project }>(`/projects/${id}`),
  
  create: (data: Partial<Project>) =>
    apiRequest<{ data: Project }>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<Project>) =>
    apiRequest<{ data: Project }>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    apiRequest(`/projects/${id}`, { method: 'DELETE' }),
  
  agents: (id: string) =>
    apiRequest<{ data: any[] }>(`/projects/${id}/agents`),
  
  widgetSettings: (id: string) =>
    apiRequest<{ data: any }>(`/projects/${id}/widget-settings`),
  
  updateWidgetSettings: (id: string, settings: any) =>
    apiRequest(`/projects/${id}/widget-settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
};
```

### 4. Types

```typescript
// src/types/index.ts
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'agent' | 'superadmin';
  status: 'Active' | 'Away' | 'Offline' | 'Deactivated' | 'Invited';
  avatar_url?: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  widget_id: string;
  website: string;
  color: string;
  status: 'active' | 'inactive' | 'archived';
  description?: string;
  widget_settings?: {
    color?: string;
    position?: 'bottom-right' | 'bottom-left';
    welcome_message?: string;
    button_text?: string;
  };
}

export interface Chat {
  id: string;
  project_id: string;
  agent_id?: string;
  customer_email?: string;
  customer_name?: string;
  status: 'active' | 'waiting' | 'ai_handling' | 'closed';
  priority?: 'low' | 'medium' | 'high';
  last_message_at?: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_type: 'customer' | 'agent' | 'ai' | 'system';
  sender_id?: string;
  content: string;
  is_ai: boolean;
  created_at: string;
}

export interface Ticket {
  id: string;
  project_id: string;
  assigned_to?: string;
  customer_email: string;
  customer_name?: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  created_at: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  website: string;
  company_name: string;
}
```

### 5. Environment

```bash
# .env
VITE_API_URL=http://localhost:8000/api
VITE_REVERB_APP_KEY=local
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http  # или https для production
```

### 6. Пример использования в компоненте

```tsx
// src/components/ChatView.tsx
import { useEffect, useState } from 'react';
import { chats } from '../api/client';
import { useChatRealtime } from '../hooks/useReverb';

export function ChatView({ chatId }: { chatId: string }) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [input, setInput] = useState('');
  const { messages, setMessages, typingUsers, isConnected } = useChatRealtime(chatId);

  useEffect(() => {
    chats.get(chatId).then(({ data }) => {
      setChat(data);
      setMessages(data.messages || []);
    });
  }, [chatId, setMessages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    await chats.send(chatId, input);
    setInput('');
  };

  const handleTyping = (isTyping: boolean) => {
    chats.typing(chatId, isTyping);
  };

  return (
    <div>
      <div className="messages">
        {messages.map(m => (
          <div key={m.id} className={m.sender_type}>
            {m.content}
          </div>
        ))}
      </div>
      
      {typingUsers.length > 0 && (
        <div>Agent is typing...</div>
      )}
      
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onFocus={() => handleTyping(true)}
        onBlur={() => handleTyping(false)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

## 📋 Event Names от Backend

```typescript
// События Laravel Reverb (channel: chat.{id})
const EVENTS = {
  MESSAGE_SENT: 'App\\Events\\MessageSent',
  AGENT_TYPING: 'App\\Events\\AgentTyping',  
  CHAT_STATUS_UPDATED: 'App\\Events\\ChatStatusUpdated',
  NEW_CHAT_FOR_AGENT: 'App\\Events\\NewChatForAgent',
};

// Структура payload
interface WebSocketPayload {
  event: string;      // 'App\\Events\\MessageSent'
  data: any;          // { message: ChatMessage }
  channel: string;    // 'chat.123e4567...'
}
```

## 🔧 Проверка WebSocket

Открой `http://localhost:8000/ws-test.html` для теста WebSocket соединения.
