'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Spinner } from '@/components/ui/spinner';

export default function Home() {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAdmin) {
        router.push('/admin');
      } else if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, isAdmin, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <img
          src="/images/logo.webp"
          alt="Antromic"
          className="w-32 h-auto"
        />
        <Spinner className="w-8 h-8 text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </main>
  );
}
