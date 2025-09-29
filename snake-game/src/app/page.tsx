'use client';

import { useState, useEffect, useCallback } from 'react';

// 游戏常量
const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;
const MIN_SPEED = 50;
const SPEED_INCREMENT = 5;

// 方向枚举
const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

// 游戏状态枚举
const GAME_STATES = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  GAME_OVER: 'game-over'
};

export default function SnakeGame() {
  // 游戏状态
  const [gameState, setGameState] = useState(GAME_STATES.IDLE);
  // 蛇的位置
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  // 食物位置
  const [food, setFood] = useState({ x: 5, y: 5 });
  // 当前方向
  const [direction, setDirection] = useState(DIRECTIONS.RIGHT);
  // 下一个方向
  const [nextDirection, setNextDirection] = useState(DIRECTIONS.RIGHT);
  // 分数
  const [score, setScore] = useState(0);
  // 游戏速度
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  // 最高分
  const [highScore, setHighScore] = useState(0);

  // 生成随机食物位置
  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };

    // 确保食物不会生成在蛇身上
    const isOnSnake = snake.some((segment: { x: number; y: number }) => 
      segment.x === newFood.x && segment.y === newFood.y
    );

    if (isOnSnake) {
      return generateFood();
    }

    return newFood;
  }, [snake]);

  // 初始化游戏
  const initGame = useCallback(() => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood());
    setDirection(DIRECTIONS.RIGHT);
    setNextDirection(DIRECTIONS.RIGHT);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setGameState(GAME_STATES.RUNNING);
  }, [generateFood]);

  // 处理键盘输入
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // WASD 控制
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
      if (direction !== DIRECTIONS.DOWN) setNextDirection(DIRECTIONS.UP);
    } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
      if (direction !== DIRECTIONS.UP) setNextDirection(DIRECTIONS.DOWN);
    } else if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
      if (direction !== DIRECTIONS.RIGHT) setNextDirection(DIRECTIONS.LEFT);
    } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
      if (direction !== DIRECTIONS.LEFT) setNextDirection(DIRECTIONS.RIGHT);
    }
    
    // 空格键暂停/继续
    if (e.key === ' ') {
      if (gameState === GAME_STATES.RUNNING) {
        setGameState(GAME_STATES.PAUSED);
      } else if (gameState === GAME_STATES.PAUSED) {
        setGameState(GAME_STATES.RUNNING);
      }
    }
    
    // 回车键开始游戏
    if (e.key === 'Enter') {
      if (gameState === GAME_STATES.IDLE || gameState === GAME_STATES.GAME_OVER) {
        initGame();
      }
    }
  }, [direction, gameState, initGame]);

  // 游戏循环
  useEffect(() => {
    if (gameState !== GAME_STATES.RUNNING) return;

    const moveSnake = () => {
      setDirection(nextDirection);
      
      setSnake((prevSnake: { x: number; y: number }[]) => {
        const head = { ...prevSnake[0] };
        const dir = nextDirection;
        
        // 移动蛇头
        head.x += dir.x;
        head.y += dir.y;
        
        // 检查边界碰撞
        if (
          head.x < 0 || 
          head.x >= GRID_SIZE || 
          head.y < 0 || 
          head.y >= GRID_SIZE
        ) {
          setGameState(GAME_STATES.GAME_OVER);
          return prevSnake;
        }
        
        // 检查自身碰撞
        if (prevSnake.some((segment: { x: number; y: number }) => segment.x === head.x && segment.y === head.y)) {
          setGameState(GAME_STATES.GAME_OVER);
          return prevSnake;
        }
        
        const newSnake = [head, ...prevSnake];
        
        // 检查是否吃到食物
        if (head.x === food.x && head.y === food.y) {
          // 增加分数
          const newScore = score + 10;
          setScore(newScore);
          
          // 更新最高分
          if (newScore > highScore) {
            setHighScore(newScore);
            // 这里可以考虑将最高分保存到本地存储
            // localStorage.setItem('snakeHighScore', newScore.toString());
          }
          
          // 生成新食物
          setFood(generateFood());
          
          // 增加速度
          if (speed > MIN_SPEED) {
            setSpeed((prev: number) => Math.max(MIN_SPEED, prev - SPEED_INCREMENT));
          }
        } else {
          // 移除蛇尾
          newSnake.pop();
        }
        
        return newSnake;
      });
    };

    const gameInterval = setInterval(moveSnake, speed);
    
    return () => {
      clearInterval(gameInterval);
    };
  }, [gameState, nextDirection, food, score, highScore, speed, generateFood]);

  // 添加键盘事件监听器
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // 渲染游戏网格
  const renderGrid = () => {
    const grid = [];
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const isSnakeHead = snake[0].x === x && snake[0].y === y;
        const isSnakeBody = snake.slice(1).some((segment: { x: number; y: number }) => segment.x === x && segment.y === y);
        const isFood = food.x === x && food.y === y;
        
        let cellClass = 'border border-gray-100 dark:border-gray-800 ';
        
        if (isSnakeHead) {
          cellClass += 'bg-green-600 dark:bg-green-500 rounded-full';
        } else if (isSnakeBody) {
          cellClass += 'bg-green-500 dark:bg-green-400 rounded';
        } else if (isFood) {
          cellClass += 'bg-red-500 dark:bg-red-400 rounded-full animate-pulse';
        } else {
          // 创建棋盘格效果
          const isEvenCell = (x + y) % 2 === 0;
          cellClass += isEvenCell 
            ? 'bg-gray-50 dark:bg-gray-900' 
            : 'bg-gray-100 dark:bg-gray-800';
        }
        
        grid.push(
          <div
            key={`${x}-${y}`}
            className={cellClass}
            style={{
              width: `${CELL_SIZE}px`,
              height: `${CELL_SIZE}px`
            }}
          />
        );
      }
    }
    
    return grid;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">贪吃蛇</h1>
          <div className="flex justify-between items-center mb-4">
            <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              分数: <span className="text-green-600 dark:text-green-400">{score}</span>
            </div>
            <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              最高分: <span className="text-purple-600 dark:text-purple-400">{highScore}</span>
            </div>
          </div>
        </div>
        
        <div 
          className="relative bg-white dark:bg-gray-700 rounded-xl shadow-2xl overflow-hidden border-4 border-gray-300 dark:border-gray-600"
          style={{
            width: `${GRID_SIZE * CELL_SIZE + 8}px`,
            height: `${GRID_SIZE * CELL_SIZE + 8}px`
          }}
        >
          <div className="grid grid-cols-20 grid-rows-20">
            {renderGrid()}
          </div>
          
          {/* 游戏状态覆盖层 */}
          {gameState !== GAME_STATES.RUNNING && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center rounded-xl">
              {gameState === GAME_STATES.IDLE && (
                <>
                  <h2 className="text-2xl font-bold text-white mb-4">贪吃蛇游戏</h2>
                  <p className="text-white mb-2">使用 WASD 或方向键控制</p>
                  <p className="text-white mb-6">按回车开始游戏</p>
                  <button
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-full transition duration-200 transform hover:scale-105"
                    onClick={initGame}
                  >
                    开始游戏
                  </button>
                </>
              )}
              
              {gameState === GAME_STATES.PAUSED && (
                <>
                  <h2 className="text-2xl font-bold text-white mb-6">游戏暂停</h2>
                  <button
                    className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-full transition duration-200 transform hover:scale-105"
                    onClick={() => setGameState(GAME_STATES.RUNNING)}
                  >
                    继续游戏
                  </button>
                </>
              )}
              
              {gameState === GAME_STATES.GAME_OVER && (
                <>
                  <h2 className="text-2xl font-bold text-white mb-2">游戏结束</h2>
                  <p className="text-xl text-white mb-6">最终分数: {score}</p>
                  <button
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full transition duration-200 transform hover:scale-105"
                    onClick={initGame}
                  >
                    重新开始
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-6 text-center">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">控制说明</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                WASD 或方向键: 移动
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                空格: 暂停/继续
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                回车: 开始/重新开始
              </p>
            </div>
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">游戏规则</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                吃到食物增加分数
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                碰到边界或自身游戏结束
              </p>
            </div>
          </div>
          
          <div className="flex justify-center gap-4">
            <button
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition"
              onClick={initGame}
            >
              重新开始
            </button>
            <button
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition"
              onClick={() => setGameState(gameState === GAME_STATES.PAUSED ? GAME_STATES.RUNNING : GAME_STATES.PAUSED)}
              disabled={gameState === GAME_STATES.IDLE || gameState === GAME_STATES.GAME_OVER}
            >
              {gameState === GAME_STATES.PAUSED ? '继续' : '暂停'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}