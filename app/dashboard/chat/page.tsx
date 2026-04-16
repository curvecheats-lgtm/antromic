'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { chatApi, type ChatMessage } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Send, RefreshCw, Shield, Rocket, Video, Award, MessageSquare, Users } from 'lucide-react';

// Role badge configuration
const ROLE_BADGES: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  owner: { icon: Shield, color: 'text-red-500', bgColor: 'bg-red-500/20', label: 'Owner' },
  admin: { icon: Shield, color: 'text-red-500', bgColor: 'bg-red-500/20', label: 'Admin' },
  booster: { icon: Rocket, color: 'text-purple-500', bgColor: 'bg-purple-500/20', label: 'Booster' },
  media: { icon: Video, color: 'text-pink-500', bgColor: 'bg-pink-500/20', label: 'Media' },
  og: { icon: Award, color: 'text-green-500', bgColor: 'bg-green-500/20', label: 'OG' },
};

// User roles - get from localStorage or default to 'user'
const getUserRole = (username: string): string => {
  // Check localStorage for role
  const storedRole = localStorage.getItem('user_role');
  if (storedRole) return storedRole;
  
  // Hardcoded for specific users (fallback)
  const USER_ROLES: Record<string, string> = {
    'koni': 'owner',
    'weird': 'owner',
    'weirdposer': 'owner',
  };
  return USER_ROLES[username.toLowerCase()] || 'user';
};

function RoleBadge({ role }: { role: string }) {
  const badge = ROLE_BADGES[role];
  if (!badge) return null;
  
  const Icon = badge.icon;
  return (
    <span className={`inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded ${badge.bgColor} ${badge.color}`} title={badge.label}>
      <Icon className="w-3 h-3 flex-shrink-0 self-center" />
      <span className="text-xs font-medium leading-none">{badge.label}</span>
    </span>
  );
}

export default function ChatPage() {
  const { user, token, adminSession } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  
  // Use user token or admin key for auth
  const authToken = token || adminSession?.adminKey || null;
  const username = user?.username || adminSession?.username || 'Unknown';

  const fetchMessages = useCallback(async () => {
    try {
      const result = await chatApi.getMessages();
      if (result.messages) {
        setMessages(result.messages);
      }
    } catch (error) {
      console.error('Failed to fetch messages');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setAutoScroll(isAtBottom);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !authToken) {
      toast.error('You must be logged in to send messages');
      return;
    }

    setSending(true);
    try {
      const result = await chatApi.send(authToken, newMessage.trim());
      if (result.success) {
        setNewMessage('');
        setAutoScroll(true);
        fetchMessages();
      } else {
        toast.error(result.error || 'Failed to send message');
      }
    } catch (error) {
      toast.error('Failed to send message');
    }
    setSending(false);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const date = formatDate(msg.timestamp);
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {} as Record<string, ChatMessage[]>);

  const uniqueUsers = new Set(messages.map(m => m.username)).size;

  return (
    <div className="p-8 h-[calc(100vh-2rem)] flex flex-col animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-primary flex-shrink-0 self-center" />
            <span>Global Chat</span>
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Users className="w-4 h-4 flex-shrink-0 self-center" />
            <span>{uniqueUsers} users have chatted</span>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setLoading(true); fetchMessages(); }}
          disabled={loading}
          className="btn-realistic"
        >
          <RefreshCw className={`w-4 h-4 mr-2 flex-shrink-0 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="flex-1 flex flex-col bg-card border-border overflow-hidden min-h-0">
        <div 
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4"
        >
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm">Be the first to say something!</p>
            </div>
          ) : (
            Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date}>
                <div className="flex items-center justify-center my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="px-3 text-xs text-muted-foreground uppercase tracking-wider">{date}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="space-y-3">
                  {dateMessages.map((msg) => {
                    const isOwn = msg.username === user?.username;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                            isOwn
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-secondary text-secondary-foreground rounded-bl-md'
                          }`}
                        >
                          <div className={`flex items-center gap-2 mb-1 flex-wrap ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            {(() => {
                              const userRole = getUserRole(msg.username);
                              return userRole !== 'user' ? <RoleBadge role={userRole} /> : null;
                            })()}
                            <span className={`text-xs font-semibold ${isOwn ? 'opacity-90' : 'opacity-80'}`}>
                              {msg.username}
                            </span>
                            <span className={`text-xs ${isOwn ? 'opacity-70' : 'opacity-50'}`}>
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm break-words whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border bg-card/50">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="bg-input flex-1 h-11"
              maxLength={500}
              disabled={sending}
            />
            <Button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="bg-primary hover:bg-primary/90 px-4 btn-realistic h-11"
            >
              {sending ? (
                <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
              ) : (
                <Send className="w-4 h-4 flex-shrink-0" />
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {500 - newMessage.length} characters remaining
          </p>
        </div>
      </Card>
    </div>
  );
}
