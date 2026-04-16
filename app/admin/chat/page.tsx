'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { chatApi, type ChatMessage } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, RefreshCw, Shield, Rocket, Video, Award, Trash2 } from 'lucide-react';

// Role badge configuration
const ROLE_BADGES: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  owner: { icon: Shield, color: 'text-red-500', label: 'Owner' },
  admin: { icon: Shield, color: 'text-red-500', label: 'Admin' },
  booster: { icon: Rocket, color: 'text-purple-500', label: 'Booster' },
  media: { icon: Video, color: 'text-pink-500', label: 'Media' },
  og: { icon: Award, color: 'text-green-500', label: 'OG' },
};

// Mock user roles for demonstration (in production this would come from the API)
const USER_ROLES: Record<string, string> = {
  'koni': 'owner',
  'weird': 'owner',
};

function RoleBadge({ role }: { role: string }) {
  const badge = ROLE_BADGES[role];
  if (!badge) return null;
  
  const Icon = badge.icon;
  return (
    <span className={`inline-flex items-center ${badge.color}`} title={badge.label}>
      <Icon className="w-3 h-3" />
    </span>
  );
}

export default function AdminChatPage() {
  const { adminSession, token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const result = await chatApi.getMessages();
      if (result.messages) {
        setMessages(result.messages);
      }
    } catch (error) {
      console.error('Failed to fetch messages');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !token) return;

    setSending(true);
    try {
      const result = await chatApi.send(token, newMessage.trim());
      if (result.success) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (error) {
      console.error('Failed to send message');
    }
    setSending(false);
  };

  const handleDeleteMessage = async (messageId: string) => {
    // In production, this would call the API to delete the message
    setMessages(messages.filter(m => m.id !== messageId));
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserRole = (username: string): string | null => {
    return USER_ROLES[username.toLowerCase()] || null;
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-500" />
            Admin Global Chat
          </h1>
          <p className="text-muted-foreground">Monitor and moderate chat messages</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchMessages}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="flex-1 flex flex-col bg-card border-border overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No messages yet.
            </div>
          ) : (
            messages.map((msg) => {
              const role = getUserRole(msg.username);
              const isCurrentUser = msg.username === adminSession?.username;
              
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 relative group ${
                      isCurrentUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {role && <RoleBadge role={role} />}
                      <span className="text-xs font-semibold opacity-80">
                        {msg.username}
                      </span>
                      <span className="text-xs opacity-60">
                        {formatTime(msg.timestamp)}
                      </span>
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3 text-destructive hover:text-destructive/80" />
                      </button>
                    </div>
                    <p className="text-sm break-words">{msg.message}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        <div className="p-4 border-t border-border">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message as admin..."
              className="bg-input"
              maxLength={500}
            />
            <Button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
