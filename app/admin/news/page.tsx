'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { newsApi, type NewsPost } from '@/lib/api';
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
import { Plus, Newspaper, Clock, RefreshCw } from 'lucide-react';

export default function AdminNewsPage() {
  const { adminKey, adminUsername } = useAuth();
  const [news, setNews] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Create form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const result = await newsApi.list();
      if (result.news) {
        setNews(result.news);
      }
    } catch (error) {
      console.error('Failed to fetch news');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleCreate = async () => {
    if (!adminKey || !adminUsername || !title || !content) return;

    setCreating(true);
    try {
      const result = await newsApi.create(adminUsername, adminKey, title, content);
      if (result.success) {
        setDialogOpen(false);
        setTitle('');
        setContent('');
        fetchNews();
      }
    } catch (error) {
      console.error('Failed to create news');
    }
    setCreating(false);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">News Management</h1>
          <p className="text-muted-foreground">Post announcements and updates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchNews} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Create News Post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Post title"
                    className="bg-input"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Content</label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your announcement..."
                    className="bg-input min-h-[200px]"
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={creating || !title || !content}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {creating ? 'Publishing...' : 'Publish Post'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12">Loading...</div>
      ) : news.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No news posts yet. Create one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {news.map((post) => (
            <Card key={post.id} className="bg-card border-border">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{post.title}</CardTitle>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatDate(post.createdAt)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{post.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
