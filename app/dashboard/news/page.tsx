'use client';

import { useState, useEffect } from 'react';
import { newsApi, type NewsPost } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper, Clock } from 'lucide-react';

export default function NewsPage() {
  const [news, setNews] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchNews();
  }, []);

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">News & Updates</h1>
        <p className="text-muted-foreground">Stay up to date with the latest announcements</p>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12">Loading news...</div>
      ) : news.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No news posts yet. Check back later!</p>
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
                <div className="prose prose-invert max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">{post.content}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
