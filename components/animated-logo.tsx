'use client';

import { useState, useRef } from 'react';
import { Logo } from './logo';

interface AnimatedLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function AnimatedLogo({ className = '', size = 'md' }: AnimatedLogoProps) {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0, scale: 1 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    const rotateY = (mouseX / (rect.width / 2)) * 25;
    const rotateX = -(mouseY / (rect.height / 2)) * 25;
    
    setTransform({ rotateX, rotateY, scale: 1.1 });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransform({ rotateX: 0, rotateY: 0, scale: 1 });
  };

  return (
    <div
      ref={containerRef}
      className={`relative cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        className="transition-all duration-200 ease-out"
        style={{
          transform: `rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale(${transform.scale})`,
          transformStyle: 'preserve-3d',
        }}
      >
        <Logo 
          size={size} 
          className={`transition-all duration-300 ${
            isHovered ? 'drop-shadow-[0_0_30px_rgba(220,38,38,0.6)]' : 'drop-shadow-[0_0_10px_rgba(220,38,38,0.3)]'
          }`}
        />
      </div>
      
      {/* Glow effect */}
      <div
        className={`absolute inset-0 bg-gradient-radial from-red-500/20 to-transparent rounded-full blur-xl transition-opacity duration-300 -z-10 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          transform: 'translateZ(-20px)',
        }}
      />
    </div>
  );
}
