'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { chatApi, type ChatMessage } from '@/lib/api';
import { ROLES, type RoleKey } from '@/lib/roles';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, RefreshCw, Shield, Trash2 } from 'lucide-react';

function normalizeRole(role?: string): RoleKey {
  if (!role) return 'user';
  return role in ROLES ? (role as RoleKey) : 'user';
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
    if (!newMessage.trim() || !adminSession) return;

    setSending(true);
    try {
      const result = await chatApi.sendAsAdmin(adminSession.username, adminSession.adminKey, newMessage.trim());
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
              const isCurrentUser = msg.username === adminSession?.username;
              const roleConfig = ROLES[normalizeRole(msg.role || (isCurrentUser ? adminSession?.role : undefined))];
              const RoleIcon = roleConfig.icon;
              const roleTextColor = roleConfig.color.split(' ')[1] || 'text-foreground';
              
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg border p-3 relative group ${
                      isCurrentUser
                        ? 'bg-card text-card-foreground border-primary/30'
                        : 'bg-card text-card-foreground border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {!isCurrentUser && <RoleIcon className={`w-3.5 h-3.5 ${roleTextColor}`} title={roleConfig.label} />}
                      <span className="text-xs font-semibold opacity-85">
                        {msg.username}
                      </span>
                      {isCurrentUser && <RoleIcon className={`w-3.5 h-3.5 ${roleTextColor}`} title={roleConfig.label} />}
                      <span className="text-xs text-muted-foreground opacity-70">
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
              disabled={sending || !newMessage.trim() || !adminSession}
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
