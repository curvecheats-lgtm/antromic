'use client';

import { useState, useEffect, useRef } from 'react';
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
import { toast } from 'sonner';
import { Plus, Download, User, Clock, Search, Copy, Check, Shield, Rocket, Video, Award, Upload, FileText, RefreshCw, Trash2 } from 'lucide-react';

// Games for Curve.cc
const GAMES = [
  { value: 'dahood', label: 'Da Hood' },
  { value: 'datrack', label: 'Da Track' },
  { value: 'hoodcustoms', label: 'Hood Customs' },
];

// Role badge configuration
const ROLE_BADGES: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  owner: { icon: Shield, color: 'text-red-500', bgColor: 'bg-red-500/20', label: 'Owner' },
  admin: { icon: Shield, color: 'text-red-500', bgColor: 'bg-red-500/20', label: 'Admin' },
  booster: { icon: Rocket, color: 'text-purple-500', bgColor: 'bg-purple-500/20', label: 'Booster' },
  media: { icon: Video, color: 'text-pink-500', bgColor: 'bg-pink-500/20', label: 'Media' },
  og: { icon: Award, color: 'text-green-500', bgColor: 'bg-green-500/20', label: 'OG' },
};

// User roles
const USER_ROLES: Record<string, string> = {
  'koni': 'owner',
  'weird': 'owner',
};

function RoleBadge({ role }: { role: string }) {
  const badge = ROLE_BADGES[role];
  if (!badge) return null;
  
  const Icon = badge.icon;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded ${badge.bgColor} ${badge.color}`} title={badge.label}>
      <Icon className="w-3 h-3 mr-1" />
      <span className="text-xs">{badge.label}</span>
    </span>
  );
}

function UserWithBadge({ username }: { username: string }) {
  const role = USER_ROLES[username.toLowerCase()];
  return (
    <span className="flex items-center gap-1">
      {role && <RoleBadge role={role} />}
      <span className="text-foreground">{username}</span>
    </span>
  );
}

// Allowed file extensions for configs
const ALLOWED_EXTENSIONS = ['.abcfg', '.json'];

export default function ConfigsPage() {
  const { token, user } = useAuth();
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewConfig, setViewConfig] = useState<Config | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload form state
  const [uploadName, setUploadName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadGame, setUploadGame] = useState('dahood');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`Only ${ALLOWED_EXTENSIONS.join(', ')} files are allowed`);
      return;
    }

    setSelectedFile(file);
    setUploadName(file.name.replace(/\.[^/.]+$/, '')); // Remove extension for name

    // Read file content
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setUploadContent(content);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!token || !uploadName || !uploadContent) {
      toast.error('Please fill in all required fields');
      return;
    }

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
        setUploadGame('dahood');
        setSelectedFile(null);
        toast.success('Config uploaded successfully!');
        fetchConfigs();
      } else {
        toast.error(result.error || 'Failed to upload config');
      }
    } catch (error) {
      toast.error('Failed to upload config');
    }
    setUploading(false);
  };

  const handleDownload = async (config: Config) => {
    try {
      await configsApi.download(config.id);
      // Determine file extension based on content
      let ext = '.json';
      try {
        JSON.parse(config.content);
      } catch {
        ext = '.abcfg';
      }
      
      const blob = new Blob([config.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.name}${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Config downloaded!');
      fetchConfigs();
    } catch (error) {
      toast.error('Failed to download config');
    }
  };

  const copyContent = async (content: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Config copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const getGameLabel = (value: string) => {
    return GAMES.find(g => g.value === value)?.label || value;
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
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Config Sharing
          </h1>
          <p className="text-muted-foreground">Browse and share configurations for Da Hood, Da Track, and Hood Customs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchConfigs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
                {/* File Upload */}
                <div>
                  <label className="text-sm text-muted-foreground">Config File (.abcfg or .json)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".abcfg,.json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="text-foreground">{selectedFile.name}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground mt-1">.abcfg or .json files only</p>
                      </>
                    )}
                  </div>
                </div>

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
                        <SelectItem key={game.value} value={game.value}>
                          {game.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm text-muted-foreground">Description (optional)</label>
                  <Input
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Short description of your config"
                    className="bg-input"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-muted-foreground">Config Content</label>
                  <Textarea
                    value={uploadContent}
                    onChange={(e) => setUploadContent(e.target.value)}
                    placeholder="Paste your config here or upload a file above..."
                    className="bg-input min-h-[150px] font-mono text-sm"
                  />
                </div>
                
                <Button
                  onClick={handleUpload}
                  disabled={uploading || !uploadName || !uploadContent}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Config
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search configs by name or author..."
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
              <SelectItem key={game.value} value={game.value}>
                {game.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Config Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredConfigs.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No configs found</h3>
            <p className="text-muted-foreground">Be the first to upload a config for this game!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConfigs.map((config) => (
            <Card key={config.id} className="bg-card border-border hover-card">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg line-clamp-1">{config.name}</CardTitle>
                    <span className="inline-block text-xs px-2 py-1 rounded bg-primary/20 text-primary">
                      {getGameLabel(config.game)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
                  {config.description || 'No description provided'}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 flex-wrap">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <UserWithBadge username={config.author} />
                  </div>
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
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {viewConfig?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              <span className="px-2 py-1 rounded bg-primary/20 text-primary">
                {viewConfig && getGameLabel(viewConfig.game)}
              </span>
              <span className="flex items-center gap-1">
                by <UserWithBadge username={viewConfig?.author || ''} />
              </span>
              <span className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                {viewConfig?.downloads} downloads
              </span>
            </div>
            {viewConfig?.description && (
              <p className="text-muted-foreground">{viewConfig.description}</p>
            )}
            <div className="relative">
              <pre className="bg-secondary/50 rounded-lg p-4 text-sm font-mono overflow-auto max-h-[300px] border border-border">
                {viewConfig?.content}
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => viewConfig && copyContent(viewConfig.content)}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
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
