import { useEffect, useCallback, useRef } from 'react';
import { useSnakeGame, Direction } from './hooks/useSnakeGame';
import GameCanvas from './components/GameCanvas';

export default function App() {
  const {
    snake,
    food,
    direction,
    status,
    score,
    highScore,
    difficulty,
    gridSize,
    setDifficulty,
    startGame,
    togglePause,
    resetGame,
    changeDirection,
  } = useSnakeGame();

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Keyboard controls
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const keyMap: Record<string, Direction> = {
        ArrowUp: 'UP',
        ArrowDown: 'DOWN',
        ArrowLeft: 'LEFT',
        ArrowRight: 'RIGHT',
        w: 'UP',
        s: 'DOWN',
        a: 'LEFT',
        d: 'RIGHT',
        W: 'UP',
        S: 'DOWN',
        A: 'LEFT',
        D: 'RIGHT',
      };

      if (keyMap[e.key]) {
        e.preventDefault();
        if (status === 'idle') {
          startGame();
        }
        if (status === 'playing') {
          changeDirection(keyMap[e.key]);
        }
      }

      if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        if (status === 'idle') {
          startGame();
        } else if (status === 'gameover') {
          resetGame();
          setTimeout(() => startGame(), 50);
        } else {
          togglePause();
        }
      }
    },
    [status, startGame, togglePause, resetGame, changeDirection]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Touch controls (swipe)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const minSwipe = 30;

      if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) {
        // Tap - start or toggle pause
        if (status === 'idle') {
          startGame();
        } else if (status === 'gameover') {
          resetGame();
          setTimeout(() => startGame(), 50);
        } else {
          togglePause();
        }
        return;
      }

      if (status !== 'playing') return;

      if (Math.abs(dx) > Math.abs(dy)) {
        changeDirection(dx > 0 ? 'RIGHT' : 'LEFT');
      } else {
        changeDirection(dy > 0 ? 'DOWN' : 'UP');
      }
      touchStartRef.current = null;
    },
    [status, startGame, togglePause, resetGame, changeDirection]
  );

  const handleCanvasClick = useCallback(() => {
    if (status === 'idle') {
      startGame();
    } else if (status === 'gameover') {
      resetGame();
      setTimeout(() => startGame(), 50);
    } else {
      togglePause();
    }
  }, [status, startGame, togglePause, resetGame]);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="w-full max-w-lg mb-4">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 mb-2">
          🐍 贪吃蛇
        </h1>

        {/* Score Board */}
        <div className="flex justify-between items-center bg-slate-800/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-slate-700/50">
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase tracking-wider">分数</div>
            <div className="text-2xl font-bold text-green-400 tabular-nums">{score}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase tracking-wider">最高分</div>
            <div className="text-2xl font-bold text-amber-400 tabular-nums">{highScore}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase tracking-wider">长度</div>
            <div className="text-2xl font-bold text-blue-400 tabular-nums">{snake.length}</div>
          </div>
        </div>
      </div>

      {/* Game Canvas */}
      <div onClick={handleCanvasClick} className="cursor-pointer">
        <GameCanvas
          snake={snake}
          food={food}
          gridSize={gridSize}
          status={status}
          direction={direction}
        />
      </div>

      {/* Controls */}
      <div className="w-full max-w-lg mt-4 space-y-3">
        {/* Difficulty Selector */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-slate-400">难度:</span>
          {(['easy', 'medium', 'hard'] as const).map((d) => (
            <button
              key={d}
              onClick={() => {
                if (status === 'idle' || status === 'gameover') {
                  setDifficulty(d);
                  if (status === 'gameover') resetGame();
                }
              }}
              disabled={status === 'playing' || status === 'paused'}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                difficulty === d
                  ? d === 'easy'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                    : d === 'medium'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                    : 'bg-red-500/20 text-red-400 border border-red-500/50'
                  : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {d === 'easy' ? '简单' : d === 'medium' ? '中等' : '困难'}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3">
          {status === 'idle' && (
            <button
              onClick={() => startGame()}
              className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              ▶ 开始游戏
            </button>
          )}
          {(status === 'playing' || status === 'paused') && (
            <button
              onClick={() => togglePause()}
              className="px-6 py-2.5 bg-slate-700 text-white font-semibold rounded-xl border border-slate-600 hover:bg-slate-600 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {status === 'playing' ? '⏸ 暂停' : '▶ 继续'}
            </button>
          )}
          {(status === 'playing' || status === 'paused') && (
            <button
              onClick={() => {
                resetGame();
              }}
              className="px-6 py-2.5 bg-slate-700 text-white font-semibold rounded-xl border border-slate-600 hover:bg-slate-600 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              🔄 重新开始
            </button>
          )}
          {status === 'gameover' && (
            <button
              onClick={() => {
                resetGame();
                setTimeout(() => startGame(), 50);
              }}
              className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              🔄 再来一局
            </button>
          )}
        </div>

        {/* Mobile D-Pad */}
        <div className="md:hidden flex flex-col items-center gap-1 mt-4">
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              if (status === 'playing') changeDirection('UP');
            }}
            className="w-14 h-14 bg-slate-700/80 border border-slate-600 rounded-xl flex items-center justify-center text-2xl text-slate-300 active:bg-slate-600 active:scale-95 transition-all"
          >
            ↑
          </button>
          <div className="flex gap-1">
            <button
              onTouchStart={(e) => {
                e.stopPropagation();
                if (status === 'playing') changeDirection('LEFT');
              }}
              className="w-14 h-14 bg-slate-700/80 border border-slate-600 rounded-xl flex items-center justify-center text-2xl text-slate-300 active:bg-slate-600 active:scale-95 transition-all"
            >
              ←
            </button>
            <button
              onTouchStart={(e) => {
                e.stopPropagation();
                if (status === 'playing') changeDirection('DOWN');
              }}
              className="w-14 h-14 bg-slate-700/80 border border-slate-600 rounded-xl flex items-center justify-center text-2xl text-slate-300 active:bg-slate-600 active:scale-95 transition-all"
            >
              ↓
            </button>
            <button
              onTouchStart={(e) => {
                e.stopPropagation();
                if (status === 'playing') changeDirection('RIGHT');
              }}
              className="w-14 h-14 bg-slate-700/80 border border-slate-600 rounded-xl flex items-center justify-center text-2xl text-slate-300 active:bg-slate-600 active:scale-95 transition-all"
            >
              →
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center text-xs text-slate-500 mt-3 space-y-1">
          <p>⌨️ 方向键 / WASD 控制方向 | 空格键 暂停/继续</p>
          <p>📱 滑动控制方向 | 点击暂停/继续</p>
        </div>
      </div>
    </div>
  );
}
