'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { configsApi, type Config } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Download, Clock, Search, Copy, Check, Trash2, Shield, Rocket, Video, Award } from 'lucide-react';

const GAMES = ['General', 'Roblox', 'Fortnite', 'Minecraft', 'CS2', 'Valorant', 'Other'];

// Role badge configuration
const ROLE_BADGES: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  owner: { icon: Shield, color: 'text-red-500', label: 'Owner' },
  admin: { icon: Shield, color: 'text-red-500', label: 'Admin' },
  booster: { icon: Rocket, color: 'text-purple-500', label: 'Booster' },
  media: { icon: Video, color: 'text-pink-500', label: 'Media' },
  og: { icon: Award, color: 'text-green-500', label: 'OG' },
};

// Mock user roles
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

function UserWithBadge({ username }: { username: string }) {
  const role = USER_ROLES[username.toLowerCase()];
  return (
    <span className="flex items-center gap-1">
      {role && <RoleBadge role={role} />}
      {username}
    </span>
  );
}

export default function AdminConfigsPage() {
  const { token } = useAuth();
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewConfig, setViewConfig] = useState<Config | null>(null);
  const [copied, setCopied] = useState(false);

  // Upload form state
  const [uploadName, setUploadName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadGame, setUploadGame] = useState('General');
  const [uploading, setUploading] = useState(false);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const result = await configsApi.list();
      if (result.configs) {
        setConfigs(result.configs);
      }
    } catch (error) {
      console.error('Failed to fetch configs');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleUpload = async () => {
    if (!token || !uploadName || !uploadContent) return;

    setUploading(true);
    try {
      const result = await configsApi.upload(
        token,
        uploadName,
        uploadDescription,
        uploadContent,
        uploadGame
      );
      if (result.success) {
        setDialogOpen(false);
        setUploadName('');
        setUploadDescription('');
        setUploadContent('');
        setUploadGame('General');
        fetchConfigs();
      }
    } catch (error) {
      console.error('Failed to upload config');
    }
    setUploading(false);
  };

  const handleDelete = async (configId: string) => {
    // In production, this would call the API
    setConfigs(configs.filter(c => c.id !== configId));
  };

  const handleDownload = async (config: Config) => {
    try {
      await configsApi.download(config.id);
      const blob = new Blob([config.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.name}.cfg`;
      a.click();
      URL.revokeObjectURL(url);
      fetchConfigs();
    } catch (error) {
      console.error('Failed to download config');
    }
  };

  const copyContent = async (content: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredConfigs = configs.filter((config) => {
    if (!config || !config.name || !config.author) return false;
    const matchesSearch =
      config.name.toLowerCase().includes(search.toLowerCase()) ||
      config.author.toLowerCase().includes(search.toLowerCase());
    const matchesGame = gameFilter === 'all' || config.game === gameFilter;
    return matchesSearch && matchesGame;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-500" />
            Admin Config Manager
          </h1>
          <p className="text-muted-foreground">Manage and moderate configurations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Upload Config
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Upload Config</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Name</label>
                <Input
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="Config name"
                  className="bg-input"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Game</label>
                <Select value={uploadGame} onValueChange={setUploadGame}>
                  <SelectTrigger className="bg-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GAMES.map((game) => (
                      <SelectItem key={game} value={game}>
                        {game}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Description</label>
                <Input
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Short description"
                  className="bg-input"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Config Content</label>
                <Textarea
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  placeholder="Paste your config here..."
                  className="bg-input min-h-[200px] font-mono text-sm"
                />
              </div>
              <Button
                onClick={handleUpload}
                disabled={uploading || !uploadName || !uploadContent}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {uploading ? 'Uploading...' : 'Upload Config'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search configs..."
            className="bg-input pl-10"
          />
        </div>
        <Select value={gameFilter} onValueChange={setGameFilter}>
          <SelectTrigger className="w-48 bg-input">
            <SelectValue placeholder="Filter by game" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Games</SelectItem>
            {GAMES.map((game) => (
              <SelectItem key={game} value={game}>
                {game}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12">Loading configs...</div>
      ) : filteredConfigs.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          No configs found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConfigs.map((config) => (
            <Card key={config.id} className="bg-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{config.name}</CardTitle>
                    <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary">
                      {config.game}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(config.id)}
                    className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {config.description || 'No description provided'}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <UserWithBadge username={config.author} />
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    {config.downloads}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(config.createdAt)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setViewConfig(config)}
                  >
                    View
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={() => handleDownload(config)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Config Dialog */}
      <Dialog open={!!viewConfig} onOpenChange={() => setViewConfig(null)}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewConfig?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="px-2 py-1 rounded bg-primary/20 text-primary">
                {viewConfig?.game}
              </span>
              <span className="flex items-center gap-1">
                by <UserWithBadge username={viewConfig?.author || ''} />
              </span>
              <span>{viewConfig?.downloads} downloads</span>
            </div>
            <p className="text-muted-foreground">{viewConfig?.description}</p>
            <div className="relative">
              <pre className="bg-input rounded-lg p-4 text-sm font-mono overflow-x-auto max-h-[300px]">
                {viewConfig?.content}
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => viewConfig && copyContent(viewConfig.content)}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => viewConfig && handleDownload(viewConfig)}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Config
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
