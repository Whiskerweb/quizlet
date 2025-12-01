'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface FileItem {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'folder' | 'file';
  color: string;
  targetX: number;
  targetY: number;
  speed: number;
}

export function FileOrganization({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const timeRef = useRef(0);
  const filesRef = useRef<FileItem[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      // Initialize files in organized grid
      const cols = 3;
      const rows = 3;
      const padding = 20;
      const fileWidth = (canvas.width - padding * (cols + 1)) / cols;
      const fileHeight = (canvas.height - padding * (rows + 1)) / rows;
      
      filesRef.current = [];
      const colors = [
        'rgba(96, 165, 250, 0.6)', // blue
        'rgba(52, 211, 153, 0.6)', // green
        'rgba(251, 191, 36, 0.6)', // yellow
        'rgba(244, 114, 182, 0.6)', // pink
      ];
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const targetX = padding + col * (fileWidth + padding);
          const targetY = padding + row * (fileHeight + padding);
          
          filesRef.current.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            width: fileWidth,
            height: fileHeight,
            type: Math.random() > 0.3 ? 'folder' : 'file',
            color: colors[Math.floor(Math.random() * colors.length)],
            targetX,
            targetY,
            speed: 0.02 + Math.random() * 0.03,
          });
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      if (ctx.roundRect) {
        ctx.roundRect(x, y, w, h, r);
      } else {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      }
    };

    const drawFolder = (x: number, y: number, width: number, height: number, color: string) => {
      ctx.fillStyle = color;
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.8)';
      ctx.lineWidth = 2;
      
      // Folder body
      ctx.beginPath();
      roundRect(x, y, width, height, 4);
      ctx.fill();
      ctx.stroke();
      
      // Folder tab
      const tabWidth = width * 0.4;
      const tabHeight = height * 0.15;
      ctx.beginPath();
      roundRect(x + (width - tabWidth) / 2, y - tabHeight * 0.5, tabWidth, tabHeight, 2);
      ctx.fill();
      ctx.stroke();
      
      // Folder lines
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const lineY = y + height * 0.3 + i * (height * 0.2);
        ctx.beginPath();
        ctx.moveTo(x + width * 0.2, lineY);
        ctx.lineTo(x + width * 0.8, lineY);
        ctx.stroke();
      }
    };

    const drawFile = (x: number, y: number, width: number, height: number, color: string) => {
      ctx.fillStyle = color;
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.8)';
      ctx.lineWidth = 2;
      
      // File body
      ctx.beginPath();
      roundRect(x, y, width, height, 2);
      ctx.fill();
      ctx.stroke();
      
      // File corner fold
      const foldSize = width * 0.15;
      ctx.fillStyle = 'rgba(96, 165, 250, 0.3)';
      ctx.beginPath();
      ctx.moveTo(x + width - foldSize, y);
      ctx.lineTo(x + width, y);
      ctx.lineTo(x + width, y + foldSize);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // File lines
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 2; i++) {
        const lineY = y + height * 0.4 + i * (height * 0.2);
        ctx.beginPath();
        ctx.moveTo(x + width * 0.2, lineY);
        ctx.lineTo(x + width * 0.7, lineY);
        ctx.stroke();
      }
    };

    const draw = () => {
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas with blue dark background
      ctx.fillStyle = '#0f172a'; // slate-900 (bleu foncé)
      ctx.fillRect(0, 0, width, height);

      // Draw grid lines (subtle)
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.15)';
      ctx.lineWidth = 1;
      const gridSize = 30;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Animate and draw files
      filesRef.current.forEach((file) => {
        // Smooth movement towards target
        const dx = file.targetX - file.x;
        const dy = file.targetY - file.y;
        file.x += dx * file.speed;
        file.y += dy * file.speed;

        // Add slight floating animation
        const floatY = Math.sin(timeRef.current * 2 + file.x * 0.01) * 2;
        const floatX = Math.cos(timeRef.current * 1.5 + file.y * 0.01) * 1;

        if (file.type === 'folder') {
          drawFolder(file.x + floatX, file.y + floatY, file.width, file.height, file.color);
        } else {
          drawFile(file.x + floatX, file.y + floatY, file.width, file.height, file.color);
        }
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

