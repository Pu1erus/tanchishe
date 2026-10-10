import { useRef, useEffect } from 'react';
import { Position, GameStatus } from '../hooks/useSnakeGame';

interface GameCanvasProps {
  snake: Position[];
  food: Position;
  gridSize: number;
  status: GameStatus;
  direction: string;
}

export default function GameCanvas({ snake, food, gridSize, status, direction }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const size = Math.min(container.clientWidth, container.clientHeight);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = size / gridSize;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw background grid
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    // Draw grid lines (subtle)
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(size, i * cellSize);
      ctx.stroke();
    }

    // Draw food with glow effect
    const foodX = food.x * cellSize + cellSize / 2;
    const foodY = food.y * cellSize + cellSize / 2;
    const foodRadius = cellSize * 0.4;

    // Glow
    const gradient = ctx.createRadialGradient(foodX, foodY, 0, foodX, foodY, cellSize);
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(food.x * cellSize - cellSize / 2, food.y * cellSize - cellSize / 2, cellSize * 2, cellSize * 2);

    // Food body
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();

    // Food highlight
    ctx.beginPath();
    ctx.arc(foodX - foodRadius * 0.3, foodY - foodRadius * 0.3, foodRadius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();

    // Draw snake
    snake.forEach((segment, index) => {
      const x = segment.x * cellSize;
      const y = segment.y * cellSize;
      const padding = 1;

      if (index === 0) {
        // Head - brighter with rounded corners
        const headGradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
        headGradient.addColorStop(0, '#4ade80');
        headGradient.addColorStop(1, '#22c55e');
        ctx.fillStyle = headGradient;
        roundRect(ctx, x + padding, y + padding, cellSize - padding * 2, cellSize - padding * 2, cellSize * 0.3);
        ctx.fill();

        // Eyes
        const eyeSize = cellSize * 0.12;
        ctx.fillStyle = '#fff';
        let eye1X: number, eye1Y: number, eye2X: number, eye2Y: number;
        const centerX = x + cellSize / 2;
        const centerY = y + cellSize / 2;

        switch (direction) {
          case 'UP':
            eye1X = centerX - cellSize * 0.2;
            eye1Y = centerY - cellSize * 0.15;
            eye2X = centerX + cellSize * 0.2;
            eye2Y = centerY - cellSize * 0.15;
            break;
          case 'DOWN':
            eye1X = centerX - cellSize * 0.2;
            eye1Y = centerY + cellSize * 0.15;
            eye2X = centerX + cellSize * 0.2;
            eye2Y = centerY + cellSize * 0.15;
            break;
          case 'LEFT':
            eye1X = centerX - cellSize * 0.15;
            eye1Y = centerY - cellSize * 0.2;
            eye2X = centerX - cellSize * 0.15;
            eye2Y = centerY + cellSize * 0.2;
            break;
          case 'RIGHT':
          default:
            eye1X = centerX + cellSize * 0.15;
            eye1Y = centerY - cellSize * 0.2;
            eye2X = centerX + cellSize * 0.15;
            eye2Y = centerY + cellSize * 0.2;
            break;
        }

        ctx.beginPath();
        ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(eye1X, eye1Y, eyeSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eye2X, eye2Y, eyeSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Body segments with gradient
        const progress = index / snake.length;
        const green = Math.floor(180 - progress * 60);
        const blue = Math.floor(80 + progress * 40);
        ctx.fillStyle = `rgb(34, ${green}, ${blue})`;

        const radius = cellSize * 0.2;
        roundRect(ctx, x + padding + 1, y + padding + 1, cellSize - (padding + 1) * 2, cellSize - (padding + 1) * 2, radius);
        ctx.fill();
      }
    });

    // Overlay for non-playing states
    if (status === 'paused') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${size * 0.06}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⏸ 已暂停', size / 2, size / 2 - size * 0.04);
      ctx.font = `${size * 0.03}px sans-serif`;
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('点击继续或按空格键', size / 2, size / 2 + size * 0.04);
    }

    if (status === 'gameover') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#ef4444';
      ctx.font = `bold ${size * 0.07}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('游戏结束', size / 2, size / 2 - size * 0.06);
      ctx.fillStyle = '#fff';
      ctx.font = `${size * 0.035}px sans-serif`;
      ctx.fillText('点击或按空格键重新开始', size / 2, size / 2 + size * 0.04);
    }

    if (status === 'idle') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#4ade80';
      ctx.font = `bold ${size * 0.06}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐍 贪吃蛇', size / 2, size / 2 - size * 0.04);
      ctx.fillStyle = '#94a3b8';
      ctx.font = `${size * 0.03}px sans-serif`;
      ctx.fillText('点击开始游戏', size / 2, size / 2 + size * 0.05);
    }
  }, [snake, food, gridSize, status, direction]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const size = Math.min(container.clientWidth, container.clientHeight);
      canvas.width = size;
      canvas.height = size;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={containerRef} className="w-full aspect-square max-w-[min(80vw,500px)] mx-auto">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-xl shadow-2xl shadow-green-500/10 border border-slate-700/50"
      />
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
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
