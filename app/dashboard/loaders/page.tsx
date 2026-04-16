'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { loadersApi, type Loader } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Download, Clock, Star, AlertCircle, Upload, FileArchive, CheckCircle2, RefreshCw, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function LoadersPage() {
  const { user } = useAuth();
  const [loaders, setLoaders] = useState<Loader[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_role') === 'admin' || localStorage.getItem('user_role') === 'owner';
    }
    return false;
  });

  // Admin upload form state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [version, setVersion] = useState('');
  const [changelog, setChangelog] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchLoaders();
  }, []);

  const fetchLoaders = async () => {
    setLoading(true);
    try {
      const result = await loadersApi.list();
      if (result.loaders) {
        setLoaders(result.loaders);
      }
    } catch (error) {
      console.error('Failed to fetch loaders');
    }
    setLoading(false);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const currentLoader = loaders.find((l) => l.isCurrent);
  const previousLoaders = loaders.filter((l) => !l.isCurrent);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast.error('File too large. Max 50MB allowed.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!version || !selectedFile) {
      toast.error('Version and file are required');
      return;
    }
    
    setUploading(true);
    try {
      // In production, this would upload the actual file
      // For now, create a data URL or upload to storage
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('version', version);
      formData.append('changelog', changelog);
      
      // Mock success - in real app, send to API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Loader uploaded successfully!');
      setUploadDialogOpen(false);
      setVersion('');
      setChangelog('');
      setSelectedFile(null);
      fetchLoaders();
    } catch (error) {
      toast.error('Failed to upload loader');
    }
    setUploading(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Download className="w-6 h-6 text-primary" />
            Loader Versions
          </h1>
          <p className="text-muted-foreground">View loader changelog and version history</p>
        </div>
        {isAdmin && (
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Upload className="w-4 h-4 mr-2" />
                Upload Loader
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  Upload New Loader
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Version</label>
                  <Input
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="e.g., 2.1.0"
                    className="bg-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Changelog</label>
                  <Textarea
                    value={changelog}
                    onChange={(e) => setChangelog(e.target.value)}
                    placeholder="What's new in this version?"
                    className="bg-input min-h-[120px]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Loader File <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      accept=".exe,.zip"
                      onChange={handleFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <FileArchive className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    {selectedFile ? (
                      <div>
                        <p className="text-sm text-foreground font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground mt-1">.exe or .zip files only (Max 50MB)</p>
                      </>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={uploading || !version || !selectedFile}
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
                      Upload Loader
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : loaders.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <FileArchive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No loaders available</h3>
            <p className="text-muted-foreground">
              {isAdmin 
                ? 'Upload a loader using the button above.' 
                : 'Check back later for loader updates.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Current Version */}
          {currentLoader && (
            <Card className="bg-card border-primary border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Star className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        Version {currentLoader.version}
                        <span className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground">
                          LATEST
                        </span>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        Released {formatDate(currentLoader.createdAt)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => {
                        if (currentLoader.downloadUrl) {
                          // Create a temporary link to force download
                          const link = document.createElement('a');
                          link.href = currentLoader.downloadUrl;
                          link.download = currentLoader.downloadUrl.split('/').pop() || 'loader.exe';
                          link.target = '_blank';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        } else {
                          toast.info('Download available in Discord - check Support page');
                        }
                      }}
                    >
                      <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                      {currentLoader.downloadUrl ? 'Download EXE' : 'Get in Discord'}
                    </Button>
                    <span className="text-xs px-3 py-1.5 rounded bg-green-500/20 text-green-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                      Current
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="font-semibold mb-2 text-foreground">Changelog:</h4>
                <div className="bg-secondary/50 rounded-lg p-4 border border-border/50">
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-minecraft">
                    {currentLoader.changelog || 'No changelog provided.'}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Previous Versions */}
          {previousLoaders.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                Previous Versions
              </h3>
              <div className="space-y-3">
                {previousLoaders.map((loader) => (
                  <Card key={loader.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                            <FileArchive className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">
                              Version {loader.version}
                            </h4>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Released {formatDate(loader.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              if (loader.downloadUrl) {
                                // Create a temporary link to force download
                                const link = document.createElement('a');
                                link.href = loader.downloadUrl;
                                link.download = loader.downloadUrl.split('/').pop() || 'loader.exe';
                                link.target = '_blank';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              } else {
                                toast.info('Download available in Discord');
                              }
                            }}
                          >
                            <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                            {loader.downloadUrl ? 'Download' : 'Get in Discord'}
                          </Button>
                          <span className="text-xs px-2 py-1 rounded bg-secondary text-muted-foreground">
                            OUTDATED
                          </span>
                        </div>
                      </div>
                      {loader.changelog && (
                        <details className="mt-3">
                          <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1">
                            View changelog
                          </summary>
                          <pre className="mt-2 text-xs text-muted-foreground bg-secondary/50 rounded p-3 whitespace-pre-wrap font-minecraft">
                            {loader.changelog}
                          </pre>
                        </details>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Info Notice */}
          <Card className="bg-secondary/30 border-border">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-foreground mb-1">Important Notice</h4>
                <p className="text-sm text-muted-foreground">
                  Loader files are distributed through our Discord server or provided by administrators. 
                  Always use the latest version for the best experience and security updates.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
