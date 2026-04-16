'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertCircle, ArrowLeft, User, Lock, Loader2 } from 'lucide-react';
import { PixelRain } from '@/components/pixel-rain';
import { AnimatedLogo } from '@/components/animated-logo';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { adminLogin } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password');
      setLoading(false);
      return;
    }

    const result = await adminLogin(username.trim(), password);
    if (result.success) {
      router.push('/admin');
    } else {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden">
      <PixelRain />

      <Card className="w-full max-w-md glass border-border/50 relative z-10 shadow-2xl shadow-primary/20 animate-scale-in">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <AnimatedLogo size="md" />
          </div>
          <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Panel</CardTitle>
          <p className="text-muted-foreground text-sm mt-1">
            Authorized personnel only
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleLogin} className="space-y-4 animate-slide-up">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <User className="w-3 h-3" />
                Username
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-input/80 border-border/50 focus:border-primary h-11 transition-all focus:shadow-lg focus:shadow-primary/20"
                placeholder="Enter admin username"
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Lock className="w-3 h-3" />
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input/80 border-border/50 focus:border-primary h-11 transition-all focus:shadow-lg focus:shadow-primary/20"
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20 animate-shake">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 transition-all hover:shadow-lg hover:shadow-primary/30"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Access Panel'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border/50 text-center">
            <Link 
              href="/login" 
              className="text-muted-foreground hover:text-foreground text-sm flex items-center justify-center gap-2 transition-all hover:translate-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to User Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
