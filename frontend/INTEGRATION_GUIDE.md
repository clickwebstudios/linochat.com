# LinoChat Frontend Integration Guide

## 🚀 Быстрый старт интеграции Frontend

### 1. Базовая конфигурация API клиента

```typescript
// src/api/client.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('access_token', token);
  }

  getToken() {
    return this.token || localStorage.getItem('access_token');
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);
```

### 2. API сервисы по модулям

```typescript
// src/api/auth.ts
import { api } from './client';

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  website: string;
  company_name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    user: User;
    project: Project;
  };
}

export const authApi = {
  register: (data: RegisterData) => 
    api.post<AuthResponse>('/auth/register', data),
  
  login: (data: LoginData) => 
    api.post<AuthResponse>('/auth/login', data),
  
  logout: () => 
    api.post('/auth/logout', {}),
  
  me: () => 
    api.get<{ success: boolean; data: User }>('/auth/me'),
  
  refresh: (refreshToken: string) => 
    api.post<AuthResponse>('/auth/refresh', { refresh_token: refreshToken }),
};

// src/api/projects.ts
export const projectsApi = {
  list: () => 
    api.get<{ success: boolean; data: Project[] }>('/projects'),
  
  get: (id: string) => 
    api.get<{ success: boolean; data: Project }>(`/projects/${id}`),
  
  create: (data: Partial<Project>) => 
    api.post<{ success: boolean; data: Project }>('/projects', data),
  
  update: (id: string, data: Partial<Project>) => 
    api.put<{ success: boolean; data: Project }>(`/projects/${id}`, data),
  
  delete: (id: string) => 
    api.delete<{ success: boolean }>(`/projects/${id}`),
  
  getAgents: (id: string) => 
    api.get<{ success: boolean; data: User[] }>(`/projects/${id}/agents`),
  
  removeAgent: (projectId: string, agentId: string) => 
    api.delete<{ success: boolean }>(`/projects/${projectId}/agents/${agentId}`),
};

// src/api/chats.ts
export const chatsApi = {
  list: (status?: string) => 
    api.get<{ success: boolean; data: Chat[] }>(`/agent/chats${status ? `?status=${status}` : ''}`),
  
  get: (id: string) => 
    api.get<{ success: boolean; data: Chat }>(`/agent/chats/${id}`),
  
  take: (id: string) => 
    api.post<{ success: boolean }>(`/agent/chats/${id}/take`, {}),
  
  sendMessage: (id: string, message: string) => 
    api.post<{ success: boolean; data: ChatMessage }>(`/agent/chats/${id}/message`, { message }),
  
  close: (id: string) => 
    api.post<{ success: boolean }>(`/agent/chats/${id}/close`, {}),
  
  typing: (id: string, isTyping: boolean) => 
    api.post<{ success: boolean }>(`/agent/chats/${id}/typing`, { is_typing: isTyping }),
  
  getStats: () => 
    api.get<{ success: boolean; data: AgentStats }>('/agent/stats'),
};

// src/api/tickets.ts
export const ticketsApi = {
  list: (filters?: { status?: string; priority?: string; assigned_to?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to);
    return api.get<{ success: boolean; data: Ticket[] }>(`/agent/tickets?${params.toString()}`);
  },
  
  get: (id: string) => 
    api.get<{ success: boolean; data: Ticket }>(`/agent/tickets/${id}`),
  
  create: (data: Partial<Ticket>) => 
    api.post<{ success: boolean; data: Ticket }>('/agent/tickets', data),
  
  take: (id: string) => 
    api.post<{ success: boolean }>(`/agent/tickets/${id}/take`, {}),
  
  assign: (id: string, agentId?: string | null) => 
    api.post<{ success: boolean }>(`/agent/tickets/${id}/assign`, { agent_id: agentId }),
  
  updateStatus: (id: string, status: string) => 
    api.post<{ success: boolean }>(`/agent/tickets/${id}/status`, { status }),
  
  reply: (id: string, message: string, sendEmail: boolean = true) => 
    api.post<{ success: boolean }>(`/agent/tickets/${id}/reply`, { message, send_email: sendEmail }),
  
  delete: (id: string) => 
    api.delete<{ success: boolean }>(`/agent/tickets/${id}`),
  
  getStats: () => 
    api.get<{ success: boolean; data: TicketStats }>('/agent/tickets/stats'),
};

// src/api/widget.ts
export const widgetApi = {
  getConfig: (widgetId: string) => 
    fetch(`${API_BASE_URL}/widget/${widgetId}/config`).then(r => r.json()),
  
  init: (widgetId: string, data: { customer_email?: string; customer_name?: string; customer_id?: string }) => 
    fetch(`${API_BASE_URL}/widget/${widgetId}/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),
  
  sendMessage: (widgetId: string, data: { chat_id: string; customer_id: string; message: string }) => 
    fetch(`${API_BASE_URL}/widget/${widgetId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),
  
  getMessages: (widgetId: string, chatId: string, customerId: string) => 
    fetch(`${API_BASE_URL}/widget/${widgetId}/messages?chat_id=${chatId}&customer_id=${customerId}`)
      .then(r => r.json()),
  
  requestHandover: (widgetId: string, chatId: string, customerId: string) => 
    fetch(`${API_BASE_URL}/widget/${widgetId}/handover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, customer_id: customerId }),
    }).then(r => r.json()),
};
```

### 3. WebSocket подключение (Laravel Echo + Pusher)

```typescript
// src/websocket.ts
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const REVERB_APP_KEY = import.meta.env.VITE_REVERB_APP_KEY || 'local';
const REVERB_HOST = import.meta.env.VITE_REVERB_HOST || 'localhost';
const REVERB_PORT = import.meta.env.VITE_REVERB_PORT || '8080';

(window as any).Pusher = Pusher;

export const echo = new Echo({
  broadcaster: 'reverb',
  key: REVERB_APP_KEY,
  wsHost: REVERB_HOST,
  wsPort: parseInt(REVERB_PORT),
  wssPort: parseInt(REVERB_PORT),
  forceTLS: false,
  enabledTransports: ['ws', 'wss'],
});

// Подписка на события чата
export function subscribeToChat(chatId: string, callbacks: {
  onMessage?: (message: ChatMessage) => void;
  onTyping?: (data: { user_id: string; is_typing: boolean }) => void;
  onStatusChange?: (status: string) => void;
}) {
  const channel = echo.channel(`chat.${chatId}`);
  
  channel.listen('MessageSent', (e: { message: ChatMessage }) => {
    callbacks.onMessage?.(e.message);
  });
  
  channel.listen('AgentTyping', (e: { user_id: string; is_typing: boolean }) => {
    callbacks.onTyping?.(e);
  });
  
  channel.listen('ChatStatusUpdated', (e: { status: string }) => {
    callbacks.onStatusChange?.(e.status);
  });
  
  return () => {
    channel.stopListening('MessageSent');
    channel.stopListening('AgentTyping');
    channel.stopListening('ChatStatusUpdated');
    echo.leaveChannel(`chat.${chatId}`);
  };
}

// Подписка на уведомления агента
export function subscribeToAgent(userId: string, callbacks: {
  onNewChat?: (chat: Chat) => void;
}) {
  const channel = echo.private(`agent.${userId}`);
  
  channel.listen('NewChatForAgent', (e: { chat: Chat }) => {
    callbacks.onNewChat?.(e.chat);
  });
  
  return () => {
    channel.stopListening('NewChatForAgent');
    echo.leaveChannel(`agent.${userId}`);
  };
}
```

### 4. React Hooks

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect, createContext, useContext } from 'react';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      authApi.me()
        .then(({ data }) => setUser(data))
        .catch(() => localStorage.removeItem('access_token'))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    setUser(data.user);
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const register = async (data: RegisterData) => {
    const response = await authApi.register(data);
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);
    setUser(response.data.user);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// src/hooks/useChats.ts
import { useState, useEffect, useCallback } from 'react';
import { chatsApi } from '../api/chats';
import { subscribeToChat } from '../websocket';

export function useChats(status?: string) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchChats = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await chatsApi.list(status);
      setChats(data);
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  return { chats, isLoading, refetch: fetchChats };
}

export function useChat(chatId: string | null) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!chatId) return;

    // Загрузка чата
    chatsApi.get(chatId).then(({ data }) => {
      setChat(data);
      setMessages(data.messages || []);
    });

    // Подписка на WebSocket
    const unsubscribe = subscribeToChat(chatId, {
      onMessage: (message) => {
        setMessages((prev) => [...prev, message]);
      },
    });

    return unsubscribe;
  }, [chatId]);

  const sendMessage = async (text: string) => {
    if (!chatId) return;
    await chatsApi.sendMessage(chatId, text);
  };

  return { chat, messages, sendMessage };
}
```

### 5. Компоненты

```typescript
// src/components/LoginForm.tsx
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
    </form>
  );
}

// src/components/ChatList.tsx
import { useChats } from '../hooks/useChats';

export function ChatList() {
  const { chats, isLoading } = useChats('active');

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="chat-list">
      {chats.map((chat) => (
        <div key={chat.id} className="chat-item">
          <span>{chat.customer_name || 'Anonymous'}</span>
          <span className={`status ${chat.status}`}>{chat.status}</span>
        </div>
      ))}
    </div>
  );
}
```

### 6. Типы

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
  join_date: string;
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
  created_at: string;
}

export interface Chat {
  id: string;
  project_id: string;
  agent_id?: string;
  customer_email?: string;
  customer_name?: string;
  status: 'active' | 'waiting' | 'ai_handling' | 'closed';
  priority?: string;
  last_message_at?: string;
  messages?: ChatMessage[];
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
  resolved_at?: string;
}
```

### 7. Environment Variables

```bash
# .env
VITE_API_URL=http://localhost:8000/api
VITE_REVERB_APP_KEY=local
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
```

## 📝 Порядок интеграции:

1. **Auth** → Login/Register формы
2. **Dashboard** → Projects list, stats
3. **Chats** → Chat list, real-time messages
4. **Tickets** → Ticket management
5. **Settings** → Widget settings, project config

## 🔗 Полезные ссылки:
- Swagger UI: http://localhost:8000/api/docs
- WebSocket тест: http://localhost:8000/ws-test.html
