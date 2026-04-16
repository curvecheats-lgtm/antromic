'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { loadersApi, type Loader } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { 
  Plus, 
  Download, 
  Clock, 
  Star, 
  RefreshCw, 
  Trash2,
  Edit,
  User,
  Zap,
  Wrench,
  Upload,
  FileIcon,
  Link2
} from 'lucide-react';

// Allowed file extensions for loader uploads
const ALLOWED_EXTENSIONS = ['.exe', '.abcfg', '.json'];

export default function AdminLoadersPage() {
  const { adminKey, adminUsername } = useAuth();
  const [loaders, setLoaders] = useState<Loader[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editLoader, setEditLoader] = useState<Loader | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create/Edit form
  const [version, setVersion] = useState('');
  const [changelog, setChangelog] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [isCurrent, setIsCurrent] = useState(true);
  const [mode, setMode] = useState<'automatic' | 'manual'>('automatic');
  const [robloxVersion, setRobloxVersion] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');

  const resetForm = () => {
    setVersion('');
    setChangelog('');
    setDownloadUrl('');
    setIsCurrent(true);
    setMode('automatic');
    setRobloxVersion('');
    setEditLoader(null);
    setSelectedFile(null);
    setUploadMethod('url');
  };

  const fetchLoaders = async () => {
    setLoading(true);
    try {
      const result = await loadersApi.list();
      if (result.loaders) {
        setLoaders(result.loaders);
      }
    } catch (error) {
      console.error('Failed to fetch loaders');
      toast.error('Failed to fetch loaders');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLoaders();
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
    
    // Upload file to API
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        setDownloadUrl(result.url);
        toast.success('File uploaded successfully!');
      } else {
        toast.error(result.error || 'Failed to upload file');
      }
    } catch (error) {
      toast.error('Failed to upload file');
    }
  };

  const handleOpenEdit = (loader: Loader) => {
    setEditLoader(loader);
    setVersion(loader.version);
    setChangelog(loader.changelog);
    setDownloadUrl(loader.downloadUrl);
    setIsCurrent(loader.isCurrent);
    setMode(loader.mode || 'automatic');
    setRobloxVersion(loader.robloxVersion || '');
    setUploadMethod('url');
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!adminKey || !adminUsername || !version) {
      toast.error('Please fill in required fields');
      return;
    }

    // Require either download URL or file upload
    let finalDownloadUrl = downloadUrl;
    if (!finalDownloadUrl) {
      toast.error('Please provide a download URL or upload a file');
      return;
    }

    setSaving(true);
    try {
      if (editLoader) {
        // Update existing
        const result = await loadersApi.update(adminUsername, adminKey, editLoader.id, {
          version,
          changelog,
          downloadUrl: finalDownloadUrl,
          isCurrent,
          mode,
          robloxVersion: mode === 'manual' ? robloxVersion : undefined
        });
        if (result.success) {
          toast.success('Loader version updated!');
          setDialogOpen(false);
          resetForm();
          fetchLoaders();
        } else {
          toast.error(result.error || 'Failed to update loader');
        }
      } else {
        // Create new
        const result = await loadersApi.upload(
          adminUsername, 
          adminKey, 
          version, 
          changelog, 
          finalDownloadUrl, 
          isCurrent,
          mode,
          mode === 'manual' ? robloxVersion : undefined
        );
        if (result.success) {
          toast.success('Loader version uploaded!');
          setDialogOpen(false);
          resetForm();
          fetchLoaders();
        } else {
          toast.error(result.error || 'Failed to upload loader');
        }
      }
    } catch (error) {
      toast.error('Failed to save loader');
    }
    setSaving(false);
  };

  const handleDelete = async (loaderId: string) => {
    if (!adminKey || !adminUsername || !confirm('Are you sure you want to delete this version?')) return;

    try {
      const result = await loadersApi.delete(adminUsername, adminKey, loaderId);
      if (result.success) {
        toast.success('Loader version deleted');
        fetchLoaders();
      } else {
        toast.error(result.error || 'Failed to delete loader');
      }
    } catch (error) {
      toast.error('Failed to delete loader');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Download className="w-6 h-6 text-primary" />
            Loader Management
          </h1>
          <p className="text-muted-foreground text-sm">Upload and manage loader versions (.exe, .abcfg, .json)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLoaders} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Upload Version
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {editLoader ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {editLoader ? 'Edit Loader Version' : 'Upload New Version'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Version Input */}
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Version *</label>
                  <Input
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="e.g. 1.0.0"
                    className="bg-input"
                  />
                </div>

                {/* Download URL */}
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Download URL</label>
                  <Input
                    value={downloadUrl}
                    onChange={(e) => setDownloadUrl(e.target.value)}
                    placeholder="https://example.com/loader.exe"
                    className="bg-input mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Provide a direct download link for the loader file</p>
                </div>

                {/* File Upload (Optional) */}
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Or Upload File</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".exe,.zip"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileIcon className="w-5 h-5 text-primary" />
                        <span className="text-foreground">{selectedFile.name}</span>
                        <span className="text-xs text-muted-foreground">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Click to upload EXE or ZIP (optional)</p>
                        <p className="text-xs text-muted-foreground mt-1">.exe or .zip files only</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Mode Selection */}
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                    Update Mode
                  </label>
                  <Select value={mode} onValueChange={(v: 'automatic' | 'manual') => setMode(v)}>
                    <SelectTrigger className="bg-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automatic">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-green-500" />
                          <span>Automatic</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="manual">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-yellow-500" />
                          <span>Manual</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {mode === 'automatic' 
                      ? 'Auto-updates when Roblox updates' 
                      : 'Requires manual update with specific Roblox version'
                    }
                  </p>
                </div>

                {/* Roblox Version (only for manual) */}
                {mode === 'manual' && (
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Roblox Version <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={robloxVersion}
                      onChange={(e) => setRobloxVersion(e.target.value)}
                      placeholder="e.g. version-abc123"
                      className="bg-input"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the specific Roblox version this loader is compatible with
                    </p>
                  </div>
                )}

                {/* Changelog */}
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Changelog</label>
                  <Textarea
                    value={changelog}
                    onChange={(e) => setChangelog(e.target.value)}
                    placeholder={"What's new in this version...\n- Feature 1\n- Bug fix\n- etc."}
                    className="bg-input min-h-[100px]"
                  />
                </div>

                {/* Set as Current */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
                  <Checkbox
                    id="is-current"
                    checked={isCurrent}
                    onCheckedChange={(checked) => setIsCurrent(checked as boolean)}
                  />
                  <label htmlFor="is-current" className="text-sm text-foreground cursor-pointer flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary" />
                    Set as current version
                  </label>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleCreate}
                  disabled={saving || !version || (uploadMethod === 'url' ? !downloadUrl : !selectedFile) || (mode === 'manual' && !robloxVersion)}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : editLoader ? (
                    'Update Version'
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Version
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Versions</p>
              <p className="text-xl font-bold text-foreground">{loaders.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Automatic</p>
              <p className="text-xl font-bold text-foreground">
                {loaders.filter(l => l.mode !== 'manual').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Manual</p>
              <p className="text-xl font-bold text-foreground">
                {loaders.filter(l => l.mode === 'manual').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : loaders.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Download className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No loader versions yet</h3>
            <p className="text-muted-foreground">Upload your first loader version to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {loaders.map((loader) => (
            <Card
              key={loader.id}
              className={`bg-card ${loader.isCurrent ? 'border-primary border-2' : 'border-border'}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      loader.isCurrent ? 'bg-primary/20' : 'bg-secondary'
                    }`}>
                      {loader.isCurrent ? (
                        <Star className="w-6 h-6 text-primary" />
                      ) : (
                        <Download className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground flex items-center gap-2 flex-wrap">
                        Version {loader.version}
                        {loader.isCurrent && (
                          <span className="text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground">
                            CURRENT
                          </span>
                        )}
                        {loader.mode === 'manual' ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500 flex items-center gap-1">
                            <Wrench className="w-3 h-3" />
                            Manual
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-500 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Auto
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(loader.createdAt)}
                        </span>
                        {loader.uploadedBy && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {loader.uploadedBy}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(loader)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(loader.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Roblox Version (for manual) */}
                {loader.mode === 'manual' && loader.robloxVersion && (
                  <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-xs text-yellow-500 font-medium mb-1">Roblox Version Required:</p>
                    <code className="text-sm text-foreground">{loader.robloxVersion}</code>
                  </div>
                )}

                {loader.changelog && (
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Changelog
                    </h4>
                    <pre className="text-sm text-foreground whitespace-pre-wrap">
                      {loader.changelog}
                    </pre>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-border/50">
                  <a
                    href={loader.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Link
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
