'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Key, CreditCard, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { PixelRain } from '@/components/pixel-rain';
import { AnimatedLogo } from '@/components/animated-logo';

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

type Mode = 'login' | 'register';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  
  const { login, register } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!key) {
      setError('Please enter your license key');
      setLoading(false);
      return;
    }

    const result = await register(username, password, key);
    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-background p-4 overflow-hidden">
      <PixelRain />
      <div className="max-w-md mx-auto relative z-10 px-4 py-8">
        <Card className="glass border-border/50 animate-slide-up">
          <CardContent className="p-8">
            <div className="flex flex-col items-center mb-8">
              <img 
                src="/images/logo-full.png" 
                alt="Curve.cc" 
                className="mb-4 h-24 w-auto object-contain"
              />
              <p className="text-xs text-muted-foreground uppercase tracking-widest animate-fade-in">Premium Software</p>
            </div>

            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4 animate-slide-up">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                    Username
                  </label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-input/80 border-border/50 focus:border-primary h-11 transition-all focus:shadow-lg focus:shadow-primary/20"
                    placeholder="Enter username"
                    required
                  />
                </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input/80 border-border/50 focus:border-primary h-11 transition-all focus:shadow-lg focus:shadow-primary/20"
                  placeholder="Enter password"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="keep-logged-in"
                  checked={keepLoggedIn}
                  onCheckedChange={(checked) => setKeepLoggedIn(checked as boolean)}
                />
                <label htmlFor="keep-logged-in" className="text-xs uppercase tracking-wider text-muted-foreground cursor-pointer">
                  Keep me logged in
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg border border-destructive/20 animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 transition-all hover:shadow-lg hover:shadow-primary/30"
                disabled={loading}
              >
                <LogIn className="w-4 h-4 mr-2" />
                {loading ? 'Logging in...' : 'Login'}
              </Button>

              <div className="text-center space-y-4 pt-4">
                <p className="text-muted-foreground text-sm">
                  {"Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-primary hover:underline transition-colors"
                  >
                    Register here
                  </button>
                </p>
                <Link href="/buy" className="block">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-primary/30 hover:bg-primary/10 hover:border-primary btn-realistic"
                  >
                    <CreditCard className="w-4 h-4 flex-shrink-0" />
                    <span className="ml-2">Buy a License Key</span>
                  </Button>
                </Link>
                <a
                  href="https://discord.gg/aqx7MfHXCJ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 text-[#5865F2] hover:text-[#5865F2]/80 transition-all py-2 hover:scale-105"
                >
                  <DiscordIcon className="w-5 h-5 flex-shrink-0 self-center" />
                  <span className="text-sm font-medium">Join our Discord</span>
                </a>
                <Link
                  href="/admin/login"
                  className="inline-block text-xs text-muted-foreground hover:text-primary transition-colors border-b border-transparent hover:border-primary/50"
                >
                  Admin Panel
                </Link>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4 animate-slide-up">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                  License Key
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={key}
                    onChange={(e) => setKey(e.target.value.toUpperCase())}
                    className="bg-input/80 border-border/50 focus:border-primary pl-10 uppercase tracking-widest h-11 transition-all focus:shadow-lg focus:shadow-primary/20"
                    placeholder="XXXXXXXXXXXX"
                    maxLength={12}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                  Username
                </label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-input/80 border-border/50 focus:border-primary h-11 transition-all focus:shadow-lg focus:shadow-primary/20"
                  placeholder="Choose username"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input/80 border-border/50 focus:border-primary h-11 transition-all focus:shadow-lg focus:shadow-primary/20"
                  placeholder="Choose password"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg border border-destructive/20 animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 transition-all hover:shadow-lg hover:shadow-primary/30"
                disabled={loading}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>

              <div className="text-center space-y-3 pt-4">
                <p className="text-muted-foreground text-sm">
                  {"Don't have a key?"}{' '}
                  <Link href="/buy" className="text-primary hover:underline transition-colors">
                    Buy one here
                  </Link>
                </p>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-muted-foreground hover:text-primary text-sm transition-colors"
                >
                  Back to login
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} curve.cc - All rights reserved.
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </main>
  );
}
