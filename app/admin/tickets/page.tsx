'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ticketsApi, type Ticket } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, X, RefreshCw } from 'lucide-react';

export default function AdminTicketsPage() {
  const { adminKey, adminUsername } = useAuth();
  const searchParams = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTickets = async () => {
    if (!adminKey || !adminUsername) return;
    setLoading(true);
    try {
      const result = await ticketsApi.list(adminUsername, adminKey);
      if (result.tickets) {
        setTickets(result.tickets);
        
        // Auto-select ticket from URL
        const ticketId = searchParams.get('id');
        if (ticketId) {
          const ticket = result.tickets.find((t: Ticket) => t.id === ticketId);
          if (ticket) setSelectedTicket(ticket);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tickets');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, [adminKey, adminUsername, searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey || !adminUsername || !selectedTicket || !replyMessage.trim()) return;

    setSending(true);
    try {
      const result = await ticketsApi.replyAsAdmin(adminUsername, adminKey, selectedTicket.id, replyMessage.trim());
      if (result.success) {
        setSelectedTicket(result.ticket);
        setReplyMessage('');
        fetchTickets();
      }
    } catch (error) {
      console.error('Failed to send reply');
    }
    setSending(false);
  };

  const handleCloseTicket = async () => {
    if (!adminKey || !adminUsername || !selectedTicket || !confirm('Close this ticket?')) return;

    try {
      await ticketsApi.close(adminUsername, adminKey, selectedTicket.id);
      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      console.error('Failed to close ticket');
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openTickets = tickets.filter(t => t.status === 'open');
  const closedTickets = tickets.filter(t => t.status === 'closed');

  return (
    <div className="p-8 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-muted-foreground">
            {openTickets.length} open, {closedTickets.length} closed
          </p>
        </div>
        <Button variant="outline" onClick={fetchTickets} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Ticket List */}
        <Card className="bg-card border-border overflow-hidden">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Tickets</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto max-h-[calc(100%-60px)]">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : tickets.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No tickets</div>
            ) : (
              <div className="divide-y divide-border">
                {/* Open Tickets */}
                {openTickets.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-secondary/50 text-xs font-semibold text-muted-foreground">
                      OPEN ({openTickets.length})
                    </div>
                    {openTickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`w-full p-4 text-left hover:bg-secondary/50 transition-colors ${
                          selectedTicket?.id === ticket.id ? 'bg-secondary' : ''
                        }`}
                      >
                        <p className="font-medium text-foreground truncate">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground">by {ticket.username}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ticket.messages.length} messages
                        </p>
                      </button>
                    ))}
                  </>
                )}
                
                {/* Closed Tickets */}
                {closedTickets.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-secondary/50 text-xs font-semibold text-muted-foreground">
                      CLOSED ({closedTickets.length})
                    </div>
                    {closedTickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`w-full p-4 text-left hover:bg-secondary/50 transition-colors opacity-60 ${
                          selectedTicket?.id === ticket.id ? 'bg-secondary' : ''
                        }`}
                      >
                        <p className="font-medium text-foreground truncate">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground">by {ticket.username}</p>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversation */}
        <Card className="lg:col-span-2 bg-card border-border flex flex-col overflow-hidden">
          {selectedTicket ? (
            <>
              <CardHeader className="py-3 border-b border-border flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm">{selectedTicket.subject}</CardTitle>
                  <p className="text-xs text-muted-foreground">from {selectedTicket.username}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedTicket.status === 'open' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCloseTicket}
                      className="text-destructive"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Close
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedTicket.messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${
                      msg.from === 'Admin' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.from === 'Admin'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold opacity-80">
                          {msg.from === 'Admin' ? 'You (Admin)' : msg.from}
                        </span>
                        <span className="text-xs opacity-60">{formatTime(msg.timestamp)}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </CardContent>
              {selectedTicket.status === 'open' && (
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
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a ticket to view conversation
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
