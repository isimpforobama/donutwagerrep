import React, { useState, useEffect, useCallback, useRef } from 'react';
import BetInput from '../components/BetInput';

interface ChickenCrossProps {
  balance: number;
  onComplete: (win: boolean, amount: number) => void;
}

interface Tile {
  column: number;
  hasDanger: boolean;
  revealed: boolean;
  carsStopped: boolean;
}

interface Car {
  id: number;
  column: number;
  y: number;
  speed: number;
}

type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme';

const COLUMNS = 8; // 8 tiles to cross (first is safe, 7 have increasing danger)
const TILE_SIZE = 110;
const LANE_HEIGHT = 200; // Height of the entire lane where cars drive
const TILE_HEIGHT = 80; // Height of the clickable tile (smaller than lane)
const CHICKEN_SIZE = 60;
const DANGER_CHANCES = [0, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75]; // First tile is 0% (safe), increasing after

// Multipliers per difficulty (applied to each column)
const DIFFICULTY_MULTIPLIERS: Record<Difficulty, number[]> = {
  easy: [1.15, 1.35, 1.60, 1.95, 2.40, 3.00, 3.80, 5.00],
  medium: [1.20, 1.50, 2.00, 2.70, 3.50, 4.50, 6.00, 8.00],
  hard: [1.30, 1.80, 2.60, 3.70, 5.20, 7.40, 10.50, 15.00],
  extreme: [1.50, 2.50, 4.50, 8.00, 14.50, 26.00, 47.00, 85.00],
};

const ChickenCross: React.FC<ChickenCrossProps> = ({ balance, onComplete }) => {
  const [bet, setBet] = useState(10000);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [chickenColumn, setChickenColumn] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [isHit, setIsHit] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const gameLoopRef = useRef<number>();
  const carIdRef = useRef(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  
  // Multipliers for each column crossed (based on difficulty)
  const multipliers = DIFFICULTY_MULTIPLIERS[difficulty];
  
  const currentMultiplier = chickenColumn > 0 ? multipliers[chickenColumn - 1] : 1;
  const currentWinnings = Math.floor(bet * currentMultiplier);

  const generateTiles = useCallback(() => {
    const newTiles: Tile[] = [];
    for (let col = 0; col < COLUMNS; col++) {
      const dangerChance = DANGER_CHANCES[col];
      const hasDanger = col === 0 ? false : Math.random() < dangerChance; // First column always safe
      newTiles.push({
        column: col,
        hasDanger,
        revealed: col === 0, // First column is revealed
        carsStopped: col === 0, // Cars don't drive in first column
      });
    }
    return newTiles;
  }, []);

  const spawnCar = useCallback((column: number) => {
    return {
      id: carIdRef.current++,
      column,
      y: -80,
      speed: 5.5 + Math.random() * 2.5,
    };
  }, []);

  const startGame = () => {
    if (bet > balance || bet <= 0) return;
    
    setGameStarted(true);
    setGameOver(false);
    setChickenColumn(0);
    setIsHit(false);
    setIsWin(false);
    carIdRef.current = 0;
    const newTiles = generateTiles();
    setTiles(newTiles);
    
    // Start spawning cars for unrevealed columns
    const initialCars: Car[] = [];
    for (let col = 1; col < COLUMNS; col++) {
      if (Math.random() < 0.5) {
        initialCars.push(spawnCar(col));
      }
    }
    setCars(initialCars);
  };

  const getTile = useCallback((col: number) => {
    return tiles.find(t => t.column === col);
  }, [tiles]);

  const selectTile = useCallback((targetCol: number) => {
    if (!gameStarted || gameOver || isHit) return; // Block if already hit
    if (targetCol !== chickenColumn + 1) return; // Can only select next tile
    
    const targetTile = getTile(targetCol);
    if (!targetTile || targetTile.revealed) return;

    // Check if hit danger
    if (targetTile.hasDanger) {
      // Move chicken to bad tile so camera follows and we can see the hit
      setChickenColumn(targetCol);
      
      // Reveal tile and show cars hitting
      setTiles(prev => prev.map(t => 
        t.column === targetCol 
          ? { ...t, revealed: true }
          : t
      ));
      
      // Spawn a car that will hit the chicken
      const hitCar = {
        id: carIdRef.current++,
        column: targetCol,
        y: -80,
        speed: 12, // Fast car to hit the chicken
      };
      setCars(prev => [...prev, hitCar]);
      
      // Set hit state to prevent further movement
      setIsHit(true);
      
      setTimeout(() => {
        setGameOver(true);
        onComplete(false, bet);
      }, 800);
      return;
    }

    // Move chicken forward on safe selection
    setChickenColumn(targetCol);

    // Safe tile - reveal it and stop cars in that column
    setTiles(prev => prev.map(t => 
      t.column === targetCol 
        ? { ...t, revealed: true, carsStopped: true }
        : t
    ));

    // Remove all cars from this column
    setCars(prev => prev.filter(c => c.column !== targetCol));

    // Check win condition (reached last column)
    if (targetCol === COLUMNS - 1) {
      setTimeout(() => {
        setIsWin(true);
        setGameOver(true);
        const winAmount = Math.floor(bet * multipliers[COLUMNS - 1]) - bet;
        onComplete(true, winAmount);
      }, 500);
    }
  }, [gameStarted, gameOver, chickenColumn, tiles, getTile, bet, onComplete, multipliers]);

  const cashOut = () => {
    if (!gameStarted || gameOver || chickenColumn === 0) return;
    setGameOver(true);
    setIsWin(true);
    const winAmount = Math.floor(bet * multipliers[chickenColumn - 1]) - bet;
    onComplete(true, winAmount);
  };

  // Game loop for car movement
  useEffect(() => {
    if (!gameStarted || gameOver) {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      return;
    }

    let lastTime = performance.now();
    
    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      setCars(prevCars => {
        // Move cars down with delta time for smooth animation
        let newCars = prevCars.map(car => ({
          ...car,
          y: car.y + (car.speed * deltaTime / 16.67), // Normalize to 60fps
        })).filter(car => car.y < LANE_HEIGHT + 100); // Remove cars that went off screen

        const columnsWithCars = new Set(newCars.map(car => car.column));

        // Spawn new cars in columns that still have cars running (one car per lane)
        tiles.forEach(tile => {
          if (!tile.carsStopped && tile.column > chickenColumn && !columnsWithCars.has(tile.column)) {
            if (Math.random() < 0.02) {
              const newCar = spawnCar(tile.column);
              newCars.push(newCar);
              columnsWithCars.add(tile.column);
            }
          }
        });

        return newCars;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameStarted, gameOver, tiles, chickenColumn, spawnCar]);

  // Camera follow effect
  useEffect(() => {
    if (viewportRef.current && gameStarted) {
      const viewportWidth = viewportRef.current.clientWidth;
      const chickenX = chickenColumn * TILE_SIZE + (TILE_SIZE / 2);
      const scrollX = chickenX - (viewportWidth / 2);
      
      viewportRef.current.scrollTo({
        left: Math.max(0, scrollX),
        behavior: 'smooth'
      });
    }
  }, [chickenColumn, gameStarted]);

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start py-8 px-4">
      {/* Left Panel - Controls */}
      <div className="w-full lg:w-80 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-6 lg:sticky lg:top-24">
        <div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Chicken Cross
          </h2>
          <p className="text-slate-500 text-xs mt-1">Cross safely while dodging cars!</p>
        </div>

        {/* Current Progress */}
        {gameStarted && !gameOver && chickenColumn > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
            <div className="text-xs text-emerald-400 uppercase tracking-wider mb-1">Current Winnings</div>
            <div className="text-3xl font-black text-emerald-400">${currentWinnings.toLocaleString()}</div>
            <div className="text-sm text-emerald-400/60">{currentMultiplier}x multiplier</div>
          </div>
        )}

        {/* Bet Input */}
        <BetInput
          value={bet}
          onChange={setBet}
          maxValue={balance}
          disabled={gameStarted && !gameOver}
        />

        {/* Difficulty Selector */}
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            disabled={gameStarted && !gameOver}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-yellow-500 transition-colors disabled:opacity-50"
          >
            <option value="easy">Easy (Lower Risk)</option>
            <option value="medium">Medium (Balanced)</option>
            <option value="hard">Hard (High Risk)</option>
            <option value="extreme">Extreme (Max Risk)</option>
          </select>
        </div>

        {/* Action Button */}
        {!gameStarted || gameOver ? (
          <button 
            onClick={startGame}
            disabled={bet > balance || bet <= 0}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-600 to-orange-600 font-black tracking-wider uppercase hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {gameOver ? 'Play Again' : 'Start Game'}
          </button>
        ) : (
          <button 
            onClick={cashOut}
            disabled={chickenColumn === 0}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 font-black tracking-wider uppercase hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 animate-pulse"
          >
            Cash Out ${currentWinnings.toLocaleString()}
          </button>
        )}
      </div>

      {/* Right Panel - Game Area */}
      <div className="flex-1 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/10 via-transparent to-orange-900/10 pointer-events-none" />
        
        {/* Scrollable Viewport */}
        <div 
          ref={viewportRef}
          className="relative mx-auto rounded-2xl overflow-x-auto overflow-y-hidden border-2 border-white/10"
          style={{ 
            maxWidth: '100%', 
            height: LANE_HEIGHT + 40,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            div::-webkit-scrollbar { display: none; }
          ` }} />
          {/* Game Board */}
          <div 
            className="relative bg-gradient-to-b from-slate-800 to-slate-900"
            style={{ width: COLUMNS * TILE_SIZE + 20, height: LANE_HEIGHT + 20, padding: 10 }}
          >
          {/* Lane Background with Road Markings */}
          <div className="absolute inset-0 p-[10px]">
            {/* Road surface */}
            <div className="w-full h-full bg-slate-800 relative">
              {/* Vertical dashed center lines for each lane */}
              {Array.from({ length: COLUMNS }).map((_, i) => (
                <div
                  key={`dash-${i}`}
                  className="absolute top-0 bottom-0 w-[4px] opacity-40"
                  style={{
                    left: i * TILE_SIZE + (TILE_SIZE / 2) - 2,
                    backgroundImage: 'repeating-linear-gradient(180deg, #fbbf24 0px, #fbbf24 20px, transparent 20px, transparent 45px)',
                  }}
                />
              ))}

              {/* Vertical lane dividers between columns */}
              {Array.from({ length: COLUMNS - 1 }).map((_, i) => (
                <div
                  key={`divider-${i}`}
                  className="absolute top-0 bottom-0 w-[2px] bg-white/5"
                  style={{ left: (i + 1) * TILE_SIZE }}
                />
              ))}
            </div>
          </div>

          {/* Tiles Row */}
          <div className="relative w-full h-full">
            {tiles.map((tile) => {
              const tileWinnings = tile.column > 0 ? Math.floor(bet * multipliers[tile.column - 1]) : bet;
              
              return (
              <button
                key={tile.column}
                onClick={() => selectTile(tile.column)}
                disabled={
                  !gameStarted || 
                  gameOver || 
                  tile.column !== chickenColumn + 1 ||
                  tile.revealed
                }
                className={`absolute transition-all duration-300 rounded-xl border-2 flex flex-col items-center justify-center ${
                  tile.revealed
                    ? tile.hasDanger
                      ? 'bg-red-900/90 border-red-600 cursor-not-allowed'
                      : 'bg-emerald-900/90 border-emerald-500 cursor-not-allowed'
                    : tile.column === chickenColumn + 1 && gameStarted && !gameOver
                      ? 'bg-slate-900/90 border-emerald-500 hover:bg-slate-800/90 hover:border-emerald-400 cursor-pointer hover:scale-105'
                      : tile.column === 0
                        ? 'bg-slate-900/70 border-emerald-500/50 cursor-not-allowed'
                        : 'bg-slate-900/70 border-emerald-500/30 cursor-not-allowed'
                }`}
                style={{
                  left: tile.column * TILE_SIZE + (TILE_SIZE - TILE_SIZE + 10) / 2,
                  top: (LANE_HEIGHT - TILE_HEIGHT) / 2,
                  width: TILE_SIZE - 10,
                  height: TILE_HEIGHT,
                }}
              >
                {/* Tile Content */}
                {tile.revealed && !tile.hasDanger && (
                  <div className="absolute inset-0 flex items-center justify-center text-3xl animate-in zoom-in duration-300">
                    ✓
                  </div>
                )}
                
                {/* Winnings Amount */}
                {!tile.revealed && gameStarted && tile.column > 0 && (
                  <div className="flex flex-col items-center">
                    <div className="text-emerald-400 font-bold text-sm">
                      ${tileWinnings.toLocaleString()}
                    </div>
                    <div className="text-emerald-400/60 text-xs">
                      {multipliers[tile.column - 1]}x
                    </div>
                  </div>
                )}
                
                {/* START label for first tile */}
                {tile.column === 0 && (
                  <div className="text-emerald-400/60 font-bold text-xs uppercase">
                    Start
                  </div>
                )}
              </button>
            );
            })}

            {/* Cars */}
            {cars.map(car => (
              <div
                key={car.id}
                className="absolute pointer-events-none z-20 will-change-transform"
                style={{
                  left: car.column * TILE_SIZE + (TILE_SIZE - 50) / 2 - 2.5,
                  transform: `translateY(${car.y}px)`,
                  width: 50,
                  height: 70,
                }}
              >
                {/* Car body */}
                <div className="w-full h-full rounded-lg bg-gradient-to-b from-red-500 to-red-700 shadow-xl border-2 border-red-600 relative">
                  {/* Windshield */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-5 bg-slate-900/50 rounded" />
                  {/* Headlights */}
                  <div className="absolute bottom-2 left-1.5 w-2.5 h-2.5 bg-yellow-300 rounded-full shadow-lg shadow-yellow-300/50" />
                  <div className="absolute bottom-2 right-1.5 w-2.5 h-2.5 bg-yellow-300 rounded-full shadow-lg shadow-yellow-300/50" />
                  {/* Wheels */}
                  <div className="absolute bottom-1 left-0 w-3 h-3 bg-slate-900 rounded-full" />
                  <div className="absolute bottom-1 right-0 w-3 h-3 bg-slate-900 rounded-full" />
                </div>
              </div>
            ))}

            {/* Chicken */}
            <div
              className={`absolute pointer-events-none z-10 transition-all duration-500 ease-out will-change-transform ${
                isHit ? 'scale-0 opacity-0' : ''
              } ${isWin ? 'animate-bounce' : ''}`}
              style={{
                transform: `translateX(${chickenColumn * TILE_SIZE + (TILE_SIZE - CHICKEN_SIZE) / 2 - 2.5}px) translateY(${(LANE_HEIGHT - CHICKEN_SIZE) / 2 - 2.5}px)`,
                width: CHICKEN_SIZE,
                height: CHICKEN_SIZE,
              }}
            >
              {/* Chicken body */}
              <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-200 to-orange-300 shadow-xl relative overflow-hidden border-3 border-orange-400">
                {/* Beak */}
                <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-4 h-3 bg-orange-500 rounded-r-full" />
                {/* Eye */}
                <div className="absolute top-3 right-3 w-3 h-3 bg-slate-900 rounded-full">
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-white rounded-full" />
                </div>
                {/* Wing */}
                <div className="absolute bottom-2 left-2 w-5 h-4 bg-orange-200 rounded-full" />
                {/* Comb */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-3 bg-red-500 rounded-t-full" />
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Instructions */}
        {!gameStarted && (
          <div className="mt-8 text-center text-slate-500 space-y-2">
            <p className="text-lg font-bold text-slate-400">How to Play</p>
            <p>Click tiles to cross the road. Watch out for cars!</p>
            <p className="text-sm">Cars drive across dangerous tiles. Pick a safe tile and the cars stop!</p>
            <p className="text-sm text-emerald-400">The first tile is always safe. Each tile after gets more dangerous.</p>
            <p className="text-sm">Cash out anytime to secure your winnings!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChickenCross;
