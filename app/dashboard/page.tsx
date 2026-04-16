'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { keysApi, newsApi, type NewsPost } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Key, Clock, User, Shield, MessageSquare, Settings, Download, HelpCircle, Newspaper, ChevronRight, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [keyInfo, setKeyInfo] = useState<{ expiresAt: number; duration: number } | null>(null);
  const [news, setNews] = useState<NewsPost[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (user?.key) {
        try {
          const result = await keysApi.validate(user.key);
          if (result.success && result.key) {
            setKeyInfo({ expiresAt: result.key.expiresAt, duration: result.key.duration });
          }
        } catch (e) {
          console.error('Failed to fetch key info');
        }
      }
      
      try {
        const newsResult = await newsApi.list();
        if (newsResult.news) {
          setNews(newsResult.news.slice(0, 3));
        }
      } catch (e) {
        console.error('Failed to fetch news');
      }
    };
    
    fetchData();
  }, [user?.key]);

  if (!user) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysRemaining = () => {
    if (!keyInfo) return null;
    const days = Math.ceil((keyInfo.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const daysRemaining = getDaysRemaining();

  const quickLinks = [
    { href: '/dashboard/chat', icon: MessageSquare, title: 'Global Chat', description: 'Chat with other users', color: 'text-blue-500' },
    { href: '/dashboard/configs', icon: Settings, title: 'Configs', description: 'Browse and share configs', color: 'text-green-500' },
    { href: '/dashboard/loaders', icon: Download, title: 'Loader', description: 'Download the latest loader', color: 'text-purple-500' },
    { href: '/dashboard/tickets', icon: HelpCircle, title: 'Support', description: 'Open a support ticket', color: 'text-yellow-500' },
  ];

  return (
    <div className="p-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative mb-8 p-6 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/20 overflow-hidden noise-overlay">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-2">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0 self-center" />
            <span className="text-xs uppercase tracking-wider text-primary">Welcome back</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground text-depth">{user.username}</h1>
          <p className="text-muted-foreground">Manage your account and access features</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card border-border card-realistic hover-card">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-primary flex-shrink-0" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Username</p>
                <p className="font-semibold text-foreground text-sm">{user.username}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border card-realistic hover-card">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Key className="w-6 h-6 text-primary flex-shrink-0" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">License Key</p>
                <p className="font-mono text-xs text-foreground truncate">{user.key}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border card-realistic hover-card">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-primary flex-shrink-0" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
                  {daysRemaining !== null ? 'Days Remaining' : 'Member Since'}
                </p>
                <p className={`font-semibold text-sm ${daysRemaining !== null && daysRemaining <= 7 ? 'text-yellow-500' : 'text-foreground'}`}>
                  {daysRemaining !== null ? `${daysRemaining} days` : formatDate(user.createdAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border card-realistic hover-card">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-green-500 flex-shrink-0" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Status</p>
                <p className="font-semibold text-green-500 text-sm">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Links */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <div className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 border border-border/50 hover:border-primary/30 transition-all group cursor-pointer card-realistic">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <link.icon className={`w-5 h-5 ${link.color} flex-shrink-0`} />
                        <p className="font-medium text-foreground">{link.title}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground pl-8">{link.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Latest News */}
        <Card className="bg-card border-border card-realistic">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-primary flex-shrink-0 self-center" />
                <span>Latest News</span>
              </CardTitle>
              <Link href="/dashboard/news">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {news.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No news yet</p>
            ) : (
              <div className="space-y-3">
                {news.map((post) => (
                  <div key={post.id} className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <p className="font-medium text-foreground text-sm line-clamp-1">{post.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(post.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
