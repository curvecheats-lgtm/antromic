'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [displayedChildren, setDisplayedChildren] = useState(children);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setDisplayedChildren(children);
      setIsLoading(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname, children]);

  return (
    <div className="relative min-h-screen">
      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm animate-fade-in">
          <div className="flex flex-col items-center gap-3">
            <p className="text-foreground text-lg font-medium tracking-wide">loading antromic</p>
            <Spinner className="w-5 h-5 text-primary" />
          </div>
        </div>
      )}
      
      {/* Page content */}
      <div className={`transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
        {displayedChildren}
      </div>
    </div>
  );
}

// Simplified loading screen component for use in layouts
export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <p className="text-foreground text-lg font-medium tracking-wide">loading antromic</p>
        <Spinner className="w-6 h-6 text-primary" />
      </div>
    </div>
  );
}

// Navigation progress bar
export function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    setProgress(0);
    
    const timer1 = setTimeout(() => setProgress(30), 50);
    const timer2 = setTimeout(() => setProgress(60), 150);
    const timer3 = setTimeout(() => setProgress(100), 300);
    const timer4 = setTimeout(() => setIsVisible(false), 400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [pathname]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-transparent">
      <div 
        className="h-full bg-primary shadow-[0_0_10px_rgba(220,38,38,0.5)] transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
