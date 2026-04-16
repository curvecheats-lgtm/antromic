'use client';

import { useState, useEffect } from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  src?: string;
}

export function Logo({ className = '', size = 'md', src }: LogoProps) {
  const [imgError, setImgError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    // Try multiple logo paths
    const tryLoadImage = async () => {
      const paths = [
        src,
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
      setImgSrc(src);
    }
  }, [src]);

  const sizes = {
    sm: { width: 96, height: 60 },
    md: { width: 160, height: 100 },
    lg: { width: 240, height: 150 },
    xl: { width: 320, height: 200 },
  };

  const dim = sizes[size];

  // If we have an image source and no error, show the image
  if (imgSrc && !imgError) {
    return (
      <img
        src={imgSrc}
        alt="Curve.cc"
        className={`object-contain ${className}`}
        style={{ width: dim.width, height: dim.height }}
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback to SVG
  return (
    <div className={`flex items-center justify-center ${className}`} style={{ width: dim.width, height: dim.height }}>
      <svg viewBox="0 0 200 60" className="w-full h-full" fill="none">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {/* CURVE text */}
        <text x="10" y="45" fill="url(#logoGradient)" fontSize="40" fontWeight="bold" fontFamily="Arial, sans-serif" filter="url(#glow)">
          CURVE
        </text>
        {/* .cc */}
        <text x="165" y="50" fill="#dc2626" fontSize="20" fontWeight="bold" fontFamily="monospace">.cc</text>
      </svg>
    </div>
  );
}
