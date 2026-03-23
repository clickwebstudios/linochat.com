import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, UserCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { motion, AnimatePresence } from 'motion/react';
import { Avatar, AvatarFallback } from './ui/avatar';
import AiTypingIndicator from './AiTypingIndicator';

interface Message {
  id: string;
  content: string;
  sender_type: 'customer' | 'ai' | 'agent';
  created_at: string;
  metadata?: {
    request_contact?: boolean;
    actions?: string[];
  };
}

interface ChatWidgetProps {
  widgetId?: string;
  apiBase?: string;
}

export default function ChatWidget({ 
  widgetId = import.meta.env.VITE_WIDGET_ID,
  apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactInfo, setContactInfo] = useState({ name: '', email: '' });
  const [isAiTyping, setIsAiTyping] = useState(false);
  // True when the AI has detected the customer wants a human agent
  const [isTransferring, setIsTransferring] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingSentRef = useRef(false);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiTyping]);

  // WebSocket connection for AI typing events
  useEffect(() => {
    if (chatId && widgetId) {
      const wsUrl = `${apiBase.replace('http', 'ws')}/widget/${widgetId}/chat/${chatId}/ws`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        // WebSocket connected
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ai.typing') {
            setIsAiTyping(true);
          } else if (data.type === 'ai.typing.stop') {
            setIsAiTyping(false);
          } else if (data.type === 'message' && data.message) {
            setMessages(prev => [...prev, data.message]);
            setIsAiTyping(false);
            if (data.message.metadata?.request_transfer || data.message.metadata?.request_human) {
              setIsTransferring(true);
            }
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = () => {
        // WebSocket disconnected
      };
      
      wsRef.current = ws;
      
      return () => {
        ws.close();
        wsRef.current = null;
      };
    }
  }, [chatId, widgetId, apiBase]);

  // Initialize chat when opened
  useEffect(() => {
    if (isOpen && !chatId && widgetId) {
      initChat();
    }
  }, [isOpen, widgetId]);

  // Poll for new messages every 5s (fallback when WebSocket is unavailable)
  useEffect(() => {
    if (!chatId || !customerId || !widgetId || !isOpen) return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`${apiBase}/widget/${widgetId}/messages?chat_id=${chatId}&customer_id=${customerId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setMessages(prev => {
            if (data.data.length > prev.length) {
              return data.data;
            }
            return prev;
          });
        }
      } catch {}
    }, 5000);
    return () => clearInterval(poll);
  }, [chatId, customerId, widgetId, isOpen, apiBase]);

  const sendCustomerTyping = (isTyping: boolean) => {
    if (!chatId || !customerId || !widgetId) return;
    fetch(`${apiBase}/widget/${widgetId}/typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, customer_id: customerId, is_typing: isTyping }),
    }).catch(() => {});
    typingSentRef.current = isTyping;
  };

  const initChat = async () => {
    if (!widgetId) {
      setError('Widget ID not configured');
      return;
    }

    try {
      setError(null);
      const sessionMeta = {
        current_page: typeof window !== 'undefined' ? window.location.href : '',
        referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      };
      const response = await fetch(`${apiBase}/widget/${widgetId}/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionMeta),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to initialize chat: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setChatId(data.data.chat_id);
        setCustomerId(data.data.customer_id);
        if (data.data.messages?.length) {
          setMessages(data.data.messages);
        }
      }
    } catch (error: any) {
      console.error('Failed to init chat:', error);
      setError(error.message || 'Failed to connect to chat service');
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !chatId || !customerId || !widgetId) return;

    if (typingSentRef.current) sendCustomerTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    const messageText = inputValue;
    setInputValue('');
    setIsLoading(true);
    setIsAiTyping(true); // Show AI typing indicator

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      sender_type: 'customer',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch(`${apiBase}/widget/${widgetId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          customer_id: customerId,
          message: messageText,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success && data.data.message) {
        setMessages(prev => [...prev, data.data.message]);
        setIsAiTyping(false); // Hide AI typing indicator when response received
        
        // Check if AI is requesting contact info
        if (data.data.message.metadata?.request_contact) {
          setShowContactForm(true);
        }
        // Check if AI is transferring to a human agent
        if (data.data.message.metadata?.request_transfer || data.data.message.metadata?.request_human) {
          setIsTransferring(true);
        }
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setIsAiTyping(false); // Hide AI typing indicator on error
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: 'Sorry, failed to send message. Please try again.',
        sender_type: 'ai',
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!contactInfo.name || !contactInfo.email || !chatId || !customerId || !widgetId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${apiBase}/widget/${widgetId}/create-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          customer_id: customerId,
          name: contactInfo.name,
          email: contactInfo.email,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create ticket: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: `Thank you! A support ticket has been created. We'll get back to you at ${contactInfo.email} soon.`,
          sender_type: 'ai',
          created_at: new Date().toISOString(),
        }]);
        setShowContactForm(false);
        setContactInfo({ name: '', email: '' });
      }
    } catch (error: any) {
      console.error('Failed to create ticket:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: 'Sorry, failed to create ticket. Please try again.',
        sender_type: 'ai',
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if no widgetId
  if (!widgetId) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4 w-[360px] rounded-lg border bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4 text-primary-foreground rounded-t-lg bg-primary">
              <div className="flex items-center gap-3">
                <img src="/logo-icon.svg" alt="LinoChat" className="h-8 w-8 rounded-md" />
                <div>
                  <h3 className="font-semibold">LinoChat</h3>
                  <p className="text-xs text-primary-foreground/70">Online • AI Powered</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground hover:bg-primary/90"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-b border-red-100 p-3">
                <p className="text-sm text-red-600">{error}</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={initChat}
                  className="text-red-600 p-0 h-auto"
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Messages */}
            <div className="h-[400px] overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && !error && (
                <div className="text-center text-muted-foreground py-8">
                  <p>How can we help you today?</p>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-[80%]">
                    {/* AI Assistant Label */}
                    {message.sender_type === 'ai' && (
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center bg-secondary">
                          <Bot className="h-3 w-3 text-secondary-foreground" />
                        </div>
                        <span className="text-xs font-medium text-secondary">AI Assistant</span>
                      </div>
                    )}
                    <div
                      className={`rounded-lg p-3 ${
                        message.sender_type === 'customer'
                          ? 'bg-primary text-primary-foreground'
                          : message.sender_type === 'ai'
                          ? 'text-foreground border bg-secondary/10 border-secondary/20'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>                  </div>
                </div>
              ))}
              
              {/* AI Typing Indicator */}
              {isAiTyping && <AiTypingIndicator />}
              
              {/* Human Transfer Banner - shown when AI routes to a human agent */}
              {isTransferring && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-primary/20 bg-primary/10 p-4 mt-2 flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-primary">
                    <UserCheck className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">Connecting you to an agent</p>
                    <p className="text-xs text-primary mt-0.5">
                      A human agent will join the chat shortly. Please hold on…
                    </p>
                    <div className="flex gap-1 mt-2">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="inline-block w-2 h-2 rounded-full animate-bounce bg-primary"
                          style={{
                            animationDelay: `${i * 0.15}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Contact Form - Only shown when AI/agent requests it */}
              {showContactForm && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4"
                >
                  <p className="text-sm text-foreground mb-3">
                    Please provide your contact info to create a support ticket:
                  </p>
                  <div className="space-y-2">
                    <Input
                      placeholder="Your Name *"
                      value={contactInfo.name}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
                      className="text-sm"
                    />
                    <Input
                      type="email"
                      placeholder="Email Address *"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="text-sm"
                    />
                    <Button
                      onClick={handleCreateTicket}
                      disabled={!contactInfo.name || !contactInfo.email || isLoading}
                      className="w-full bg-primary text-primary-foreground"
                      size="sm"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Create Ticket'
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {!showContactForm && !isTransferring && !error && (
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                      if (!typingSentRef.current) sendCustomerTyping(true);
                      typingTimeoutRef.current = setTimeout(() => {
                        sendCustomerTyping(false);
                        typingTimeoutRef.current = null;
                      }, 2000);
                    }}
                    onBlur={() => {
                      if (typingTimeoutRef.current) {
                        clearTimeout(typingTimeoutRef.current);
                        typingTimeoutRef.current = null;
                      }
                      if (typingSentRef.current) sendCustomerTyping(false);
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    className="shrink-0 bg-primary text-primary-foreground"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-colors"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </motion.button>
    </div>
  );
}
