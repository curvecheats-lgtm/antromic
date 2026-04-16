'use client';

import { useEffect, useRef } from 'react';

interface PixelDrop {
  x: number;
  y: number;
  speed: number;
  size: number;
  brightness: number;
}

export function PixelRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let drops: PixelDrop[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createDrop = (): PixelDrop => ({
      x: Math.floor(Math.random() * (canvas.width / 4)) * 4, // Pixel-aligned
      y: Math.floor(Math.random() * -canvas.height),
      speed: Math.floor(Math.random() * 3) + 2, // 2-5px per frame
      size: Math.random() > 0.7 ? 4 : 2, // 2px or 4px pixels
      brightness: Math.random() > 0.5 ? 1 : 0.7,
    });

    const init = () => {
      resize();
      drops = Array.from({ length: 60 }, createDrop);
    };

    const drawPixel = (x: number, y: number, size: number, brightness: number) => {
      // Draw sharp pixels instead of smooth gradients
      const alpha = brightness;
      ctx.fillStyle = `rgba(220, 38, 38, ${alpha})`;
      ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
      
      // Add glow effect for larger pixels
      if (size >= 4) {
        ctx.fillStyle = `rgba(239, 68, 68, ${alpha * 0.5})`;
        ctx.fillRect(Math.floor(x) - 1, Math.floor(y) - 1, size + 2, 1);
        ctx.fillRect(Math.floor(x) - 1, Math.floor(y) + size, size + 2, 1);
        ctx.fillRect(Math.floor(x) - 1, Math.floor(y), 1, size);
        ctx.fillRect(Math.floor(x) + size, Math.floor(y), 1, size);
      }
    };

    const animate = () => {
      // Clear with fade effect for trails
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drops.forEach((drop) => {
        // Draw pixel
        drawPixel(drop.x, drop.y, drop.size, drop.brightness);

        // Move down
        drop.y += drop.speed;

        // Reset if below screen
        if (drop.y > canvas.height) {
          drop.y = -drop.size;
          drop.x = Math.floor(Math.random() * (canvas.width / 4)) * 4;
          drop.speed = Math.floor(Math.random() * 3) + 2;
          drop.brightness = Math.random() > 0.5 ? 1 : 0.7;
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ 
        background: 'transparent',
        imageRendering: 'pixelated'
      }}
    />
  );
}
