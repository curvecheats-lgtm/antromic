'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ticketsApi, type Ticket } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { HelpCircle, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function TicketsPage() {
  const { token, user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create ticket form
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Reply form
  const [replyMessage, setReplyMessage] = useState('');

  const fetchTicket = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await ticketsApi.myTicket(token);
      setTicket(result.ticket);
    } catch (error) {
      console.error('Failed to fetch ticket');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTicket();
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !subject || !message) return;

    setCreating(true);
    setError('');
    try {
      const result = await ticketsApi.create(token, subject, message);
      if (result.success) {
        setTicket(result.ticket);
        setSubject('');
        setMessage('');
      } else {
        setError(result.error || 'Failed to create ticket');
      }
    } catch (error) {
      setError('Failed to create ticket');
    }
    setCreating(false);
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !ticket || !replyMessage.trim()) return;

    setSending(true);
    try {
      const result = await ticketsApi.reply(token, ticket.id, replyMessage.trim());
      if (result.success) {
        setTicket(result.ticket);
        setReplyMessage('');
      }
    } catch (error) {
      console.error('Failed to send reply');
    }
    setSending(false);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-muted-foreground py-12">Loading...</div>
      </div>
    );
  }

  // No ticket - show create form
  if (!ticket) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-muted-foreground">Get help from our support team</p>
        </div>

        <Card className="bg-card border-border max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Create Support Ticket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  className="bg-input"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Message</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  className="bg-input min-h-[150px]"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={creating || !subject || !message}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {creating ? 'Creating...' : 'Create Ticket'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Note: You can only have one open ticket at a time. Please wait for your current
                ticket to be resolved before creating a new one.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Has ticket - show conversation
  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Support Ticket</h1>
            <p className="text-muted-foreground">{ticket.subject}</p>
          </div>
          <span
            className={`px-3 py-1 rounded text-sm ${
              ticket.status === 'open'
                ? 'bg-green-500/20 text-green-500'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {ticket.status === 'open' ? 'Open' : 'Closed'}
          </span>
        </div>
      </div>

      <Card className="flex-1 flex flex-col bg-card border-border overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {ticket.messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                msg.from === 'Admin' ? 'items-start' : 'items-end'
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.from === 'Admin'
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold opacity-80">
                    {msg.from === 'Admin' ? 'Support Team' : msg.from}
                  </span>
                  <span className="text-xs opacity-60">{formatTime(msg.timestamp)}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </CardContent>

        {ticket.status === 'open' ? (
          <div className="p-4 border-t border-border">
            <form onSubmit={handleReply} className="flex gap-2">
              <Input
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply..."
                className="bg-input"
              />
              <Button
                type="submit"
                disabled={sending || !replyMessage.trim()}
                className="bg-primary hover:bg-primary/90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        ) : (
          <div className="p-4 border-t border-border bg-secondary/30">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">This ticket has been closed</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
