'use client';

import { useState, useEffect, useId } from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  src?: string;
}

export function Logo({ className = '', size = 'md', src }: LogoProps) {
  const [imgError, setImgError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const svgId = useId();

  useEffect(() => {
    // Try multiple logo paths
    const tryLoadImage = async () => {
      setImgError(false);
      const paths = [
        src,
        '/images/logo-full.png',
        '/images/logo-mini.png',
        '/images/logo.png',
        '/images/logo.webp',
        '/images/logo.jpg',
        '/logo.png',
        '/logo.webp',
      ].filter(Boolean);

      for (const path of paths) {
        try {
          const response = await fetch(path as string, { method: 'HEAD' });
          if (response.ok) {
            setImgSrc(path as string);
            return;
          }
        } catch {
          // Continue to next path
        }
      }
      setImgError(true);
    };

    if (!src) {
      tryLoadImage();
    } else {
      setImgError(false);
      setImgSrc(src);
    }
  }, [src]);

  const sizes = {
    sm: { width: 100, height: 30 },
    md: { width: 160, height: 48 },
    lg: { width: 240, height: 72 },
    xl: { width: 320, height: 96 },
  };

  const dim = sizes[size];
  const gradientId = `${svgId}-logo-gradient`;
  const glowId = `${svgId}-logo-glow`;

  // If we have an image source and no error, show the image
  if (imgSrc && !imgError) {
    return (
      <img
        src={imgSrc}
        alt="Antromic"
        className={`object-contain ${className}`}
        style={{ width: dim.width, height: dim.height }}
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback to SVG
  return (
    <div className={`flex items-center justify-center ${className}`} style={{ width: dim.width, height: dim.height }}>
      <svg viewBox="0 0 200 60" className="w-full h-full" fill="none" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {/* ANTROMIC text */}
        <text x="10" y="45" fill={`url(#${gradientId})`} fontSize="32" fontWeight="bold" fontFamily="Arial, sans-serif" filter={`url(#${glowId})`}>
          ANTROMIC
        </text>
      </svg>
    </div>
  );
}
