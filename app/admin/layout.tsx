'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { LoadingScreen } from '@/components/page-transition';
import {
  Key,
  Newspaper,
  Download,
  HelpCircle,
  LogOut,
  Home,
  Shield,
  User,
  MessageSquare,
  Settings,
  Users,
} from 'lucide-react';

const navItems = [
  { href: '/admin', icon: Home, label: 'Dashboard' },
  { href: '/admin/chat', icon: MessageSquare, label: 'Global Chat' },
  { href: '/admin/configs', icon: Settings, label: 'Configs' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/keys', icon: Key, label: 'Keys' },
  { href: '/admin/tickets', icon: HelpCircle, label: 'Tickets' },
  { href: '/admin/news', icon: Newspaper, label: 'News' },
  { href: '/admin/loaders', icon: Download, label: 'Loaders' },
  { href: '/admin/settings', icon: Shield, label: 'Settings' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, adminSession, adminLogout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isPageLoading, setIsPageLoading] = useState(false);

  // Allow login page without auth
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!isLoading && !isAdmin && !isLoginPage) {
      router.push('/admin/login');
    }
  }, [isAdmin, isLoading, router, isLoginPage]);

  useEffect(() => {
    if (!isLoginPage) {
      setIsPageLoading(true);
      const timer = setTimeout(() => setIsPageLoading(false), 150);
      return () => clearTimeout(timer);
    }
  }, [pathname, isLoginPage]);

  if (isLoginPage) {
    return children;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAdmin) {
    return null;
  }

  const handleLogout = () => {
    adminLogout();
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-56 bg-card border-r border-border flex flex-col fixed inset-y-0 left-0 z-30">
        <div className="p-3 border-b border-border">
          <Link href="/admin" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img 
              src="/images/logo-mini.png" 
              alt="Antromic" 
              className="w-8 h-8 object-contain"
            />
            <div>
              <h2 className="font-bold text-foreground text-sm">Antromic</h2>
              <p className="text-[11px] text-muted-foreground">Admin</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-2 transition-all h-9 ${
                    isActive
                      ? 'bg-primary/20 text-primary border-l-2 border-primary rounded-l-none'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="mb-3 p-2 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium text-foreground truncate">{adminSession?.username}</p>
            </div>
            <p className="text-[11px] text-muted-foreground capitalize">
              {adminSession?.role || 'Admin'}
            </p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 text-sm"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Logout
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
