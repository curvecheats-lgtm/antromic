'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { keysApi, type Key } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Search,
  Edit,
  RotateCcw,
} from 'lucide-react';

export default function AdminKeysPage() {
  const { adminKey, adminUsername } = useAuth();
  const [keys, setKeys] = useState<Key[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'used' | 'expired'>('all');
  const [copied, setCopied] = useState<string | null>(null);

  // Create key dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createNote, setCreateNote] = useState('');
  const [createDuration, setCreateDuration] = useState('30');
  const [creating, setCreating] = useState(false);

  // Edit note dialog
  const [editKey, setEditKey] = useState<Key | null>(null);
  const [editNote, setEditNote] = useState('');

  const fetchKeys = async () => {
    if (!adminKey || !adminUsername) return;
    setLoading(true);
    try {
      const result = await keysApi.list(adminUsername, adminKey);
      if (result.keys) {
        setKeys(result.keys);
      }
    } catch (error) {
      console.error('Failed to fetch keys');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchKeys();
  }, [adminKey, adminUsername]);

  const handleCreateKey = async () => {
    if (!adminKey || !adminUsername) return;
    setCreating(true);
    try {
      const result = await keysApi.create(adminUsername, adminKey, createNote, parseInt(createDuration));
      if (result.success) {
        setCreateOpen(false);
        setCreateNote('');
        setCreateDuration('30');
        fetchKeys();
      }
    } catch (error) {
      console.error('Failed to create key');
    }
    setCreating(false);
  };

  const handleDeleteKey = async (key: string) => {
    if (!adminKey || !adminUsername || !confirm('Are you sure you want to delete this key?')) return;
    try {
      await keysApi.delete(adminUsername, adminKey, key);
      fetchKeys();
    } catch (error) {
      console.error('Failed to delete key');
    }
  };

  const handleResetHwid = async (key: string) => {
    if (!adminKey || !adminUsername || !confirm('Reset HWID for this key?')) return;
    try {
      await keysApi.resetHwid(adminUsername, adminKey, key);
      fetchKeys();
    } catch (error) {
      console.error('Failed to reset HWID');
    }
  };

  const handleUpdateNote = async () => {
    if (!adminKey || !adminUsername || !editKey) return;
    try {
      await keysApi.updateNote(adminUsername, adminKey, editKey.key, editNote);
      setEditKey(null);
      setEditNote('');
      fetchKeys();
    } catch (error) {
      console.error('Failed to update note');
    }
  };

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const filteredKeys = keys.filter((key) => {
    if (!key || !key.key) return false;
    const matchesSearch =
      key.key.toLowerCase().includes(search.toLowerCase()) ||
      key.note?.toLowerCase().includes(search.toLowerCase()) ||
      key.usedBy?.toLowerCase().includes(search.toLowerCase());

    const now = Date.now();
    const isExpired = now > key.expiresAt;
    const isActive = !key.used && !isExpired;

    switch (filter) {
      case 'active':
        return matchesSearch && isActive;
      case 'used':
        return matchesSearch && key.used;
      case 'expired':
        return matchesSearch && isExpired && !key.used;
      default:
        return matchesSearch;
    }
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getKeyStatus = (key: Key) => {
    if (key.used) return { label: 'Used', color: 'bg-blue-500/20 text-blue-500' };
    if (Date.now() > key.expiresAt) return { label: 'Expired', color: 'bg-destructive/20 text-destructive' };
    return { label: 'Active', color: 'bg-green-500/20 text-green-500' };
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Key Management</h1>
          <p className="text-muted-foreground">Create and manage license keys</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchKeys} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Key
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Create New Key</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Note (optional)</label>
                  <Input
                    value={createNote}
                    onChange={(e) => setCreateNote(e.target.value)}
                    placeholder="Add a note for this key"
                    className="bg-input"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Duration</label>
                  <Select value={createDuration} onValueChange={setCreateDuration}>
                    <SelectTrigger className="bg-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleCreateKey}
                  disabled={creating}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {creating ? 'Creating...' : 'Create Key'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search keys..."
            className="bg-input pl-10"
          />
        </div>
        <Select value={filter} onValueChange={(v: typeof filter) => setFilter(v)}>
          <SelectTrigger className="w-40 bg-input">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Keys</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="used">Used</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Used By</TableHead>
                <TableHead>HWID</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredKeys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No keys found
                  </TableCell>
                </TableRow>
              ) : (
                filteredKeys.map((key) => {
                  const status = getKeyStatus(key);
                  return (
                    <TableRow key={key.key}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm">{key.key}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyKey(key.key)}
                            className="h-6 w-6 p-0"
                          >
                            {copied === key.key ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded ${status.color}`}>
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {key.note || '-'}
                      </TableCell>
                      <TableCell>{key.usedBy || '-'}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {key.hwid ? key.hwid.substring(0, 10) + '...' : '-'}
                      </TableCell>
                      <TableCell>{formatDate(key.expiresAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditKey(key);
                              setEditNote(key.note || '');
                            }}
                            className="h-8 w-8 p-0"
                            title="Edit note"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetHwid(key.key)}
                            className="h-8 w-8 p-0"
                            title="Reset HWID"
                            disabled={!key.hwid}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteKey(key.key)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Delete key"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Note Dialog */}
      <Dialog open={!!editKey} onOpenChange={() => setEditKey(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Key Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Key</label>
              <code className="block font-mono text-sm bg-input rounded p-2 mt-1">
                {editKey?.key}
              </code>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Note</label>
              <Input
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Add a note"
                className="bg-input"
              />
            </div>
            <Button onClick={handleUpdateNote} className="w-full bg-primary hover:bg-primary/90">
              Save Note
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
