import React, { useState } from 'react';
import BetInput from '../components/BetInput';

interface MinesProps {
  balance: number;
  onComplete: (win: boolean, amount: number) => void;
}

const Mines: React.FC<MinesProps> = ({ balance, onComplete }) => {
  const [bet, setBet] = useState(10000);
  const [mineCount, setMineCount] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [grid, setGrid] = useState<('mine' | 'gem' | null)[]>(Array(25).fill(null));
  const [revealed, setRevealed] = useState<boolean[]>(Array(25).fill(false));
  const [lastClickedMine, setLastClickedMine] = useState<number | null>(null);
  const [gemsFound, setGemsFound] = useState(0);

  // Multipliers based on mines count and gems revealed
  const calculateMultiplier = (gems: number, mines: number): number => {
    if (gems === 0) return 1;
    // House edge formula - higher mines = higher multipliers
    const safeSpots = 25 - mines;
    let multiplier = 1;
    for (let i = 0; i < gems; i++) {
      multiplier *= (safeSpots - i) / (safeSpots - mines - i);
    }
    return Math.max(1, multiplier * 0.97); // 3% house edge
  };

  const startGame = () => {
    if (bet > balance || bet <= 0) return;
    
    // Place mines randomly
    const newGrid: ('mine' | 'gem' | null)[] = Array(25).fill('gem');
    const minePositions = new Set<number>();
    while (minePositions.size < mineCount) {
      minePositions.add(Math.floor(Math.random() * 25));
    }
    minePositions.forEach(pos => {
      newGrid[pos] = 'mine';
    });
    
    setGrid(newGrid);
    setRevealed(Array(25).fill(false));
    setGameStarted(true);
    setGameOver(false);
    setLastClickedMine(null);
    setGemsFound(0);
  };

  const revealTile = (index: number) => {
    if (!gameStarted || gameOver || revealed[index]) return;
    
    const newRevealed = [...revealed];
    newRevealed[index] = true;
    setRevealed(newRevealed);
    
    if (grid[index] === 'mine') {
      // Hit a mine - lose!
      setLastClickedMine(index);
      setGameOver(true);
      // Reveal all mines
      const allRevealed = grid.map((cell, i) => cell === 'mine' || newRevealed[i]);
      setRevealed(allRevealed);
      onComplete(false, bet);
    } else {
      // Found a gem!
      const newGemsFound = gemsFound + 1;
      setGemsFound(newGemsFound);
      
      // Check if all gems found (auto-win)
      const totalGems = 25 - mineCount;
      if (newGemsFound === totalGems) {
        setGameOver(true);
        const winAmount = Math.floor(bet * calculateMultiplier(newGemsFound, mineCount)) - bet;
        onComplete(true, winAmount);
      }
    }
  };

  const cashOut = () => {
    if (!gameStarted || gameOver || gemsFound === 0) return;
    setGameOver(true);
    // Reveal all mines
    const allRevealed = grid.map((cell, i) => cell === 'mine' || revealed[i]);
    setRevealed(allRevealed);
    const winAmount = Math.floor(bet * calculateMultiplier(gemsFound, mineCount)) - bet;
    onComplete(true, winAmount);
  };

  const currentMultiplier = calculateMultiplier(gemsFound, mineCount);
  const nextMultiplier = calculateMultiplier(gemsFound + 1, mineCount);
  const currentWinnings = Math.floor(bet * currentMultiplier);

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start py-8 px-4">
      {/* Left Panel - Controls */}
      <div className="w-full lg:w-80 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-6 lg:sticky lg:top-24">
        <div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Mines
          </h2>
          <p className="text-slate-500 text-xs mt-1">Uncover gems. Avoid the mines. Cash out anytime.</p>
        </div>

        {/* Current Progress */}
        {gameStarted && !gameOver && gemsFound > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
            <div className="text-xs text-emerald-400 uppercase tracking-wider mb-1">Current Winnings</div>
            <div className="text-3xl font-black text-emerald-400">${currentWinnings.toLocaleString()}</div>
            <div className="text-sm text-emerald-400/60">{currentMultiplier.toFixed(2)}x multiplier</div>
          </div>
        )}

        {/* Next Multiplier Preview */}
        {gameStarted && !gameOver && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
            <div className="text-xs text-amber-400 uppercase tracking-wider mb-1">Next Gem</div>
            <div className="text-2xl font-black text-amber-400">{nextMultiplier.toFixed(2)}x</div>
            <div className="text-sm text-amber-400/60">+${(Math.floor(bet * nextMultiplier) - currentWinnings).toLocaleString()}</div>
          </div>
        )}

        {/* Bet Input */}
        <BetInput
          value={bet}
          onChange={setBet}
          maxValue={balance}
          disabled={gameStarted && !gameOver}
        />

        {/* Mine Count Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Number of Mines</label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 3, 5, 10, 15].map(count => (
              <button
                key={count}
                onClick={() => !(gameStarted && !gameOver) && setMineCount(count)}
                disabled={gameStarted && !gameOver}
                className={`py-3 rounded-xl text-sm font-bold transition-all ${
                  mineCount === count 
                    ? 'bg-red-500/20 border-2 border-red-500 text-red-400' 
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
                } disabled:opacity-50`}
              >
                {count}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-600 text-center">More mines = Higher multipliers</p>
        </div>

        {/* Action Button */}
        {!gameStarted || gameOver ? (
          <button 
            onClick={startGame}
            disabled={bet > balance || bet <= 0}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 font-black tracking-wider uppercase hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {gameOver ? 'Play Again' : 'Start Game'}
          </button>
        ) : (
          <button 
            onClick={cashOut}
            disabled={gemsFound === 0}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 font-black tracking-wider uppercase hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 animate-pulse"
          >
            Cash Out ${currentWinnings.toLocaleString()}
          </button>
        )}
      </div>

      {/* Right Panel - Mine Grid */}
      <div className="flex-1 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-transparent to-orange-900/10 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.1),transparent_70%)] pointer-events-none" />
        
        {/* Grid */}
        <div className="relative grid grid-cols-5 gap-3 max-w-md mx-auto">
          {grid.map((cell, index) => {
            const isRevealed = revealed[index];
            const isMine = isRevealed && cell === 'mine';
            const isGem = isRevealed && cell === 'gem';
            const isClickedMine = lastClickedMine === index;
            const isActive = gameStarted && !gameOver && !isRevealed;

            return (
              <TileButton
                key={index}
                onClick={() => revealTile(index)}
                disabled={!isActive}
                isRevealed={isRevealed}
                isMine={isMine}
                isGem={isGem}
                isClickedMine={isClickedMine}
                isActive={isActive}
                gameStarted={gameStarted}
              />
            );
          })}
        </div>

      </div>
    </div>
  );
};

// Separate tile component for pop animation
const TileButton: React.FC<{
  onClick: () => void;
  disabled: boolean;
  isRevealed: boolean;
  isMine: boolean;
  isGem: boolean;
  isClickedMine: boolean;
  isActive: boolean;
  gameStarted: boolean;
}> = ({ onClick, disabled, isRevealed, isMine, isGem, isClickedMine, isActive, gameStarted }) => {
  const [animated, setAnimated] = React.useState(!isRevealed);
  
  React.useEffect(() => {
    if (isRevealed && !animated) {
      // Already revealed on mount, don't animate
    } else if (isRevealed) {
      setAnimated(true);
    }
  }, [isRevealed]);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative aspect-square rounded-2xl font-bold text-2xl
        transition-all duration-300 transform
        flex items-center justify-center
        overflow-hidden
        ${isGem 
          ? 'bg-gradient-to-br from-emerald-500/30 to-emerald-700/30 border-2 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)] scale-105' 
          : isMine
            ? `bg-gradient-to-br from-red-500/30 to-red-900/30 border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] ${isClickedMine ? 'scale-110 animate-pulse' : ''}`
            : isActive 
              ? 'bg-slate-800/80 border-2 border-amber-500/30 hover:border-amber-400 hover:bg-slate-700/80 hover:scale-105 cursor-pointer shadow-lg shadow-amber-500/10' 
              : 'bg-slate-900/60 border border-white/5'
        }
        disabled:cursor-default
      `}
    >
      {/* Gem Icon */}
      {isGem && (
        <GemReveal />
      )}
      
      {/* Mine Icon */}
      {isMine && (
        <MineReveal isClicked={isClickedMine} />
      )}
      
      {/* Active tile shimmer */}
      {isActive && !isRevealed && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent" style={{ animation: 'shimmer 2s infinite' }} />
          <span className="text-amber-400/40 text-xl">?</span>
        </>
      )}
      
      {/* Inactive tile */}
      {!gameStarted && !isRevealed && (
        <span className="text-slate-700 text-xl">🔒</span>
      )}
    </button>
  );
};

const GemReveal: React.FC = () => {
  const [animated, setAnimated] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className="relative"
      style={{
        transform: animated ? 'scale(1) rotateZ(0deg)' : 'scale(0) rotateZ(-180deg)',
        opacity: animated ? 1 : 0,
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <span className="text-4xl drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">💎</span>
      {animated && (
        <div className="absolute inset-0 animate-ping opacity-30">
          <span className="text-4xl">💎</span>
        </div>
      )}
    </div>
  );
};

const MineReveal: React.FC<{ isClicked: boolean }> = ({ isClicked }) => {
  const [animated, setAnimated] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className="relative"
      style={{
        transform: animated ? 'scale(1) rotateZ(0deg)' : 'scale(0) rotateZ(180deg)',
        opacity: animated ? 1 : 0,
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <span className={`text-4xl ${isClicked ? 'animate-bounce' : ''}`}>💣</span>
      {isClicked && (
        <div className="absolute -inset-4 bg-red-500/30 rounded-full animate-ping" />
      )}
    </div>
  );
};

export default Mines;
