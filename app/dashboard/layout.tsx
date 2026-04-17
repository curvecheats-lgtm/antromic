'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { LoadingScreen } from '@/components/page-transition';
import { Logo } from '@/components/logo';
import { chatApi } from '@/lib/api';
import {
  MessageSquare,
  Settings,
  Download,
  Newspaper,
  HelpCircle,
  LogOut,
  Home,
  User,
  ShoppingBag,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
  { href: '/dashboard/chat', icon: MessageSquare, label: 'Global Chat' },
  { href: '/dashboard/configs', icon: Settings, label: 'Configs' },
  { href: '/dashboard/news', icon: Newspaper, label: 'News' },
  { href: '/dashboard/loaders', icon: Download, label: 'Loader' },
  { href: '/dashboard/resell', icon: ShoppingBag, label: 'Resell' },
  { href: '/dashboard/tickets', icon: HelpCircle, label: 'Support' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({
    chat: 0,
    tickets: 0,
    news: 0,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    setIsPageLoading(true);
    const timer = setTimeout(() => setIsPageLoading(false), 150);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Fetch unread counts
  useEffect(() => {
    const fetchUnreadCounts = async () => {
      try {
        // Fetch chat messages to check for unread
        const chatResult = await chatApi.getMessages();
        if (chatResult.messages) {
          const lastRead = localStorage.getItem('chat_last_read');
          const lastReadTime = lastRead ? parseInt(lastRead) : 0;
          const unreadChat = chatResult.messages.filter((m: any) => m.timestamp > lastReadTime).length;
          setUnreadCounts(prev => ({ ...prev, chat: unreadChat }));
        }
      } catch (error) {
        // Silently fail
      }
    };

    fetchUnreadCounts();
    const interval = setInterval(fetchUnreadCounts, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Mark chat as read when viewing
  useEffect(() => {
    if (pathname === '/dashboard/chat') {
      localStorage.setItem('chat_last_read', Date.now().toString());
      setUnreadCounts(prev => ({ ...prev, chat: 0 }));
    }
  }, [pathname]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-56 bg-card border-r border-border flex flex-col fixed inset-y-0 left-0 z-30">
        <div className="p-3 border-b border-border">
          <Link href="/dashboard" className="flex justify-center">
            <img 
              src="/images/logo-mini.png" 
              alt="Antromic" 
              className="w-20 h-12 object-contain hover:opacity-80 transition-opacity cursor-pointer"
            />
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const unreadCount = item.href === '/dashboard/chat' ? unreadCounts.chat : 
                               item.href === '/dashboard/tickets' ? unreadCounts.tickets : 0;
            return (
              <Link key={item.href} href={item.href} className="block relative">
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start gap-2 transition-all items-center h-9 ${
                    isActive 
                      ? 'bg-primary/20 text-primary border-l-2 border-primary rounded-l-none' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <div className="relative">
                    <item.icon className="w-4 h-4 flex-shrink-0 self-center" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="truncate self-center text-sm">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="mb-3 p-2 bg-secondary/50 rounded-lg">
            <p className="text-[11px] text-muted-foreground">Logged in as</p>
            <p className="font-semibold text-foreground truncate text-sm">{user.username}</p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 items-center text-sm"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 flex-shrink-0 self-center" />
            <span className="self-center">Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-56 overflow-auto">
        <div className={`transition-opacity duration-200 ${isPageLoading ? 'opacity-50' : 'opacity-100'}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
