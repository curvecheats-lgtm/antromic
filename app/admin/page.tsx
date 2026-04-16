'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { keysApi, ticketsApi, adminApi, type Key, type Ticket, type Stats } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Key as KeyIcon, Users, HelpCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { adminUsername, adminKey } = useAuth();
  const [keys, setKeys] = useState<Key[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!adminKey || !adminUsername) return;
      
      try {
        const [keysResult, ticketsResult, statsResult] = await Promise.all([
          keysApi.list(adminUsername, adminKey),
          ticketsApi.list(adminUsername, adminKey),
          adminApi.getStats(adminUsername, adminKey),
        ]);
        
        if (keysResult.keys) setKeys(keysResult.keys);
        if (ticketsResult.tickets) setTickets(ticketsResult.tickets);
        if (statsResult.totalKeys !== undefined) setStats(statsResult);
      } catch (error) {
        console.error('Failed to fetch data');
      }
      setLoading(false);
    };

    fetchData();
  }, [adminKey, adminUsername]);

  const activeKeys = keys.filter(k => !k.used && Date.now() < k.expiresAt);
  const usedKeys = keys.filter(k => k.used);
  const openTickets = tickets.filter(t => t.status === 'open');

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Welcome back, <span className="text-primary">{adminUsername}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <KeyIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Keys</p>
                <p className="text-2xl font-bold text-foreground">{stats?.totalKeys || keys.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Keys</p>
                <p className="text-2xl font-bold text-foreground">{stats?.activeKeys || activeKeys.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Used Keys</p>
                <p className="text-2xl font-bold text-foreground">{stats?.usedKeys || usedKeys.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Open Tickets</p>
                <p className="text-2xl font-bold text-foreground">{stats?.openTickets || openTickets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Keys */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Recent Keys</CardTitle>
            <Link href="/admin/keys" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : keys.length === 0 ? (
              <p className="text-muted-foreground text-sm">No keys created yet</p>
            ) : (
              <div className="space-y-2">
                {keys.slice(0, 5).map((key, index) => (
                  <div
                    key={key?.key || `key-${index}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <code className="font-mono text-xs text-foreground">{key?.key || 'Unknown'}</code>
                      {key?.note && (
                        <p className="text-xs text-muted-foreground mt-0.5">{key.note}</p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        key?.used
                          ? 'bg-blue-500/20 text-blue-400'
                          : Date.now() > (key?.expiresAt || 0)
                          ? 'bg-destructive/20 text-destructive'
                          : 'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {key?.used ? 'Used' : Date.now() > (key?.expiresAt || 0) ? 'Expired' : 'Active'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Open Tickets */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Open Tickets</CardTitle>
            <Link href="/admin/tickets" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : openTickets.length === 0 ? (
              <p className="text-muted-foreground text-sm">No open tickets</p>
            ) : (
              <div className="space-y-2">
                {openTickets.slice(0, 5).map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/admin/tickets?id=${ticket.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div>
                      <p className="font-medium text-foreground text-sm">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground">by {ticket.username}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">
                      {ticket.messages.length} msgs
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
