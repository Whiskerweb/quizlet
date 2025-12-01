'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils/cn';

export function ProgressChart({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const draw = () => {
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw grid lines
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = (height / 5) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw animated progress curve
      ctx.strokeStyle = '#60A5FA';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const points: number[] = [];
      const numPoints = 20;
      const amplitude = height * 0.3;
      const frequency = 0.02;

      for (let i = 0; i <= numPoints; i++) {
        const x = (width / numPoints) * i;
        const baseY = centerY - (i / numPoints) * amplitude * 0.6; // Upward trend
        const wave = Math.sin((i * frequency + timeRef.current * 0.5) * Math.PI) * amplitude * 0.3;
        const y = baseY + wave;
        points.push(y);
      }

      // Draw smooth curve
      ctx.beginPath();
      ctx.moveTo(0, points[0]);

      for (let i = 1; i < points.length; i++) {
        const x1 = ((i - 1) / numPoints) * width;
        const x2 = (i / numPoints) * width;
        const y1 = points[i - 1];
        const y2 = points[i];

        const cp1x = x1 + (x2 - x1) / 3;
        const cp1y = y1;
        const cp2x = x1 + (2 * (x2 - x1)) / 3;
        const cp2y = y2;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
      }

      ctx.stroke();

      // Draw gradient fill under curve
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(96, 165, 250, 0.2)');
      gradient.addColorStop(1, 'rgba(96, 165, 250, 0)');

      ctx.fillStyle = gradient;
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Draw animated dots on curve
      const dotIndices = [Math.floor(numPoints * 0.3), Math.floor(numPoints * 0.6), Math.floor(numPoints * 0.9)];
      dotIndices.forEach((index) => {
        const x = (index / numPoints) * width;
        const y = points[index];
        const pulse = Math.sin(timeRef.current * 2 + index) * 0.3 + 1;

        ctx.fillStyle = '#60A5FA';
        ctx.beginPath();
        ctx.arc(x, y, 4 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 8 * pulse);
        glowGradient.addColorStop(0, 'rgba(96, 165, 250, 0.6)');
        glowGradient.addColorStop(1, 'rgba(96, 165, 250, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, 8 * pulse, 0, Math.PI * 2);
        ctx.fill();
      });

      timeRef.current += 0.02;
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 w-full h-full', className)}
      style={{ imageRendering: 'auto' }}
    />
  );
}

