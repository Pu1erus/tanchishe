import { useState, useCallback, useEffect, useRef } from 'react';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Position {
  x: number;
  y: number;
}

const GRID_SIZE = 20;
const SPEED_MAP: Record<Difficulty, number> = {
  easy: 150,
  medium: 100,
  hard: 60,
};

function getRandomPosition(snake: Position[]): Position {
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(seg => seg.x === pos.x && seg.y === pos.y));
  return pos;
}

function getInitialSnake(): Position[] {
  const mid = Math.floor(GRID_SIZE / 2);
  return [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
}

export function useSnakeGame() {
  const [snake, setSnake] = useState<Position[]>(getInitialSnake());
  const [food, setFood] = useState<Position>(() => getRandomPosition(getInitialSnake()));
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [status, setStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snake-high-score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const directionRef = useRef<Direction>('RIGHT');
  const gameLoopRef = useRef<number | null>(null);
  const lastMoveTimeRef = useRef<number>(0);
  const statusRef = useRef<GameStatus>('idle');

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  const resetGame = useCallback(() => {
    const initialSnake = getInitialSnake();
    setSnake(initialSnake);
    setFood(getRandomPosition(initialSnake));
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setScore(0);
    setStatus('idle');
  }, []);

  const startGame = useCallback(() => {
    if (status === 'gameover') {
      resetGame();
    }
    setStatus('playing');
  }, [status, resetGame]);

  const pauseGame = useCallback(() => {
    if (status === 'playing') {
      setStatus('paused');
    }
  }, [status]);

  const resumeGame = useCallback(() => {
    if (status === 'paused') {
      setStatus('playing');
    }
  }, [status]);

  const togglePause = useCallback(() => {
    if (status === 'playing') {
      setStatus('paused');
    } else if (status === 'paused') {
      setStatus('playing');
    }
  }, [status]);

  const changeDirection = useCallback((newDir: Direction) => {
    const current = directionRef.current;
    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
    };
    if (opposites[newDir] !== current) {
      setDirection(newDir);
      directionRef.current = newDir;
    }
  }, []);

  // Game loop
  useEffect(() => {
    if (status !== 'playing') {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    const speed = SPEED_MAP[difficulty];

    const gameLoop = (timestamp: number) => {
      if (statusRef.current !== 'playing') return;

      if (timestamp - lastMoveTimeRef.current >= speed) {
        lastMoveTimeRef.current = timestamp;

        setSnake(prevSnake => {
          const head = { ...prevSnake[0] };

          switch (directionRef.current) {
            case 'UP':
              head.y -= 1;
              break;
            case 'DOWN':
              head.y += 1;
              break;
            case 'LEFT':
              head.x -= 1;
              break;
            case 'RIGHT':
              head.x += 1;
              break;
          }

          // Check wall collision
          if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
            setStatus('gameover');
            return prevSnake;
          }

          // Check self collision
          if (prevSnake.some(seg => seg.x === head.x && seg.y === head.y)) {
            setStatus('gameover');
            return prevSnake;
          }

          const newSnake = [head, ...prevSnake];

          // Check food
          setFood(prevFood => {
            if (head.x === prevFood.x && head.y === prevFood.y) {
              setScore(prev => {
                const newScore = prev + 10;
                setHighScore(currentHigh => {
                  if (newScore > currentHigh) {
                    localStorage.setItem('snake-high-score', String(newScore));
                    return newScore;
                  }
                  return currentHigh;
                });
                return newScore;
              });
              const newFood = getRandomPosition(newSnake);
              return newFood;
            } else {
              newSnake.pop();
              return prevFood;
            }
          });

          return newSnake;
        });
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [status, difficulty]);

  // Update high score on game over
  useEffect(() => {
    if (status === 'gameover') {
      setHighScore(currentHigh => {
        if (score > currentHigh) {
          localStorage.setItem('snake-high-score', String(score));
          return score;
        }
        return currentHigh;
      });
    }
  }, [status, score]);

  return {
    snake,
    food,
    direction,
    status,
    score,
    highScore,
    difficulty,
    gridSize: GRID_SIZE,
    setDifficulty,
    startGame,
    pauseGame,
    resumeGame,
    togglePause,
    resetGame,
    changeDirection,
  };
}
