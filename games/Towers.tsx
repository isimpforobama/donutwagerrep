import React, { useState } from 'react';
import BetInput from '../components/BetInput';

interface TowersProps {
  balance: number;
  onComplete: (win: boolean, amount: number) => void;
}

const LEVELS = 8;
const SLOTS_PER_LEVEL = 3;

const Towers: React.FC<TowersProps> = ({ balance, onComplete }) => {
  const [bet, setBet] = useState(10000);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [levelConfig, setLevelConfig] = useState<number[][]>([]);
  const [revealed, setRevealed] = useState<{ [key: string]: boolean }>({});
  const [gameOver, setGameOver] = useState(false);
  const [lastClickedMine, setLastClickedMine] = useState<string | null>(null);

  const multipliers = [1.4, 2.1, 3.2, 4.8, 7.2, 11, 17, 26];

  const startGame = () => {
    if (bet > balance || bet <= 0) return;
    const config = Array.from({ length: LEVELS }, () => {
      const mineIndex = Math.floor(Math.random() * SLOTS_PER_LEVEL);
      return Array.from({ length: SLOTS_PER_LEVEL }, (_, i) => i === mineIndex ? 0 : 1);
    });
    setLevelConfig(config);
    setGameStarted(true);
    setCurrentLevel(0);
    setRevealed({});
    setGameOver(false);
    setLastClickedMine(null);
  };

  const handleChoice = (slotIndex: number) => {
    if (!gameStarted || gameOver) return;
    
    const key = `${currentLevel}-${slotIndex}`;
    const isWin = levelConfig[currentLevel][slotIndex] === 1;
    setRevealed(prev => ({ ...prev, [key]: true }));

    if (isWin) {
      if (currentLevel === LEVELS - 1) {
        // Reveal all remaining
        const allRevealed: { [key: string]: boolean } = { ...revealed, [key]: true };
        for (let l = 0; l < LEVELS; l++) {
          for (let s = 0; s < SLOTS_PER_LEVEL; s++) {
            allRevealed[`${l}-${s}`] = true;
          }
        }
        setRevealed(allRevealed);
        setGameOver(true);
        onComplete(true, Math.floor(bet * multipliers[currentLevel]) - bet);
      } else {
        setCurrentLevel(prev => prev + 1);
      }
    } else {
      setLastClickedMine(key);
      // Reveal all on loss
      const allRevealed: { [key: string]: boolean } = { ...revealed, [key]: true };
      for (let l = 0; l < LEVELS; l++) {
        for (let s = 0; s < SLOTS_PER_LEVEL; s++) {
          allRevealed[`${l}-${s}`] = true;
        }
      }
      setRevealed(allRevealed);
      setGameOver(true);
      onComplete(false, bet);
    }
  };

  const cashOut = () => {
    if (!gameStarted || gameOver || currentLevel === 0) return;
    // Reveal all tiles on cashout (like when hitting a mine)
    const allRevealed: { [key: string]: boolean } = { ...revealed };
    for (let l = 0; l < LEVELS; l++) {
      for (let s = 0; s < SLOTS_PER_LEVEL; s++) {
        allRevealed[`${l}-${s}`] = true;
      }
    }
    setRevealed(allRevealed);
    setGameOver(true);
    const winAmount = Math.floor(bet * multipliers[currentLevel - 1]) - bet;
    onComplete(true, winAmount);
  };

  const currentMultiplier = currentLevel > 0 ? multipliers[currentLevel - 1] : 1;
  const currentWinnings = Math.floor(bet * currentMultiplier);

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start py-8 px-4">
      {/* Left Panel - Controls */}
      <div className="w-full lg:w-80 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-6 lg:sticky lg:top-24">
        <div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Tower Climb
          </h2>
          <p className="text-slate-500 text-xs mt-1">Avoid the mines. Climb higher for bigger rewards.</p>
        </div>

        {/* Current Progress */}
        {gameStarted && !gameOver && currentLevel > 0 && (
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

        {/* Action Button */}
        {!gameStarted || gameOver ? (
          <button 
            onClick={startGame}
            disabled={bet > balance || bet <= 0}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 font-black tracking-wider uppercase hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {gameOver ? 'Play Again' : 'Start Climb'}
          </button>
        ) : (
          <button 
            onClick={cashOut}
            disabled={currentLevel === 0}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 font-black tracking-wider uppercase hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 animate-pulse"
          >
            Cash Out ${currentWinnings.toLocaleString()}
          </button>
        )}

        {/* Multiplier Ladder */}
        <div className="space-y-1.5">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Multiplier Ladder</div>
          {multipliers.slice().reverse().map((m, i) => {
            const levelIdx = LEVELS - 1 - i;
            const isPassed = levelIdx < currentLevel;
            const isCurrent = levelIdx === currentLevel && gameStarted && !gameOver;
            
            return (
              <div 
                key={i} 
                className={`flex justify-between items-center px-4 py-2.5 rounded-xl text-sm font-mono transition-all duration-300 ${
                  isCurrent 
                    ? 'bg-pink-500/20 border border-pink-500/50 text-pink-300 scale-105 shadow-lg shadow-pink-500/20' 
                    : isPassed 
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                      : 'bg-slate-800/50 border border-white/5 text-slate-600'
                }`}
              >
                <span className="font-bold">Level {levelIdx + 1}</span>
                <span className={`font-black ${isCurrent ? 'text-pink-400' : isPassed ? 'text-emerald-400' : ''}`}>
                  {m}x
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel - Tower Grid */}
      <div className="flex-1 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 min-h-[700px] relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(168,85,247,0.15),transparent_70%)] pointer-events-none" />
        
        {/* Tower Grid */}
        <div className="relative flex flex-col-reverse gap-3">
          {Array.from({ length: LEVELS }).map((_, levelIndex) => {
            const isActive = levelIndex === currentLevel && gameStarted && !gameOver;
            const isPassed = levelIndex < currentLevel;
            const isLocked = !gameStarted || (levelIndex > currentLevel && !gameOver);
            
            return (
              <div 
                key={levelIndex} 
                className={`flex gap-4 justify-center transition-all duration-500 ${
                  isLocked && !gameOver ? 'opacity-30 scale-95' : 'opacity-100 scale-100'
                }`}
              >
                {/* Level indicator */}
                <div className={`w-12 flex items-center justify-center text-sm font-bold rounded-xl transition-all ${
                  isActive ? 'bg-pink-500/20 text-pink-400' : isPassed ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-600'
                }`}>
                  L{levelIndex + 1}
                </div>
                
                {/* Tiles */}
                {Array.from({ length: SLOTS_PER_LEVEL }).map((_, slotIndex) => {
                  const key = `${levelIndex}-${slotIndex}`;
                  const isRevealed = revealed[key];
                  const isMine = isRevealed && levelConfig[levelIndex]?.[slotIndex] === 0;
                  const isGem = isRevealed && levelConfig[levelIndex]?.[slotIndex] === 1;
                  const isClickedMine = lastClickedMine === key;

                  return (
                    <button
                      key={slotIndex}
                      onClick={() => handleChoice(slotIndex)}
                      disabled={levelIndex !== currentLevel || gameOver || !gameStarted}
                      className={`
                        relative w-24 h-20 rounded-2xl font-bold text-2xl
                        transition-all duration-300 transform
                        flex items-center justify-center
                        overflow-hidden
                        ${isGem 
                          ? 'bg-gradient-to-br from-emerald-500/30 to-emerald-700/30 border-2 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)] scale-105' 
                          : isMine
                            ? `bg-gradient-to-br from-red-500/30 to-red-900/30 border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] ${isClickedMine ? 'scale-110 animate-pulse' : ''}`
                            : isActive 
                              ? 'bg-slate-800/80 border-2 border-pink-500/50 hover:border-pink-400 hover:bg-slate-700/80 hover:scale-105 cursor-pointer shadow-lg shadow-pink-500/10' 
                              : isPassed 
                                ? 'bg-slate-800/40 border border-emerald-500/20' 
                                : 'bg-slate-900/60 border border-white/5'
                        }
                        disabled:cursor-default
                      `}
                    >
                      {/* Gem Icon */}
                      {isGem && (
                        <div className="relative">
                          <span className="text-4xl drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">💎</span>
                          <div className="absolute inset-0 animate-ping opacity-30">
                            <span className="text-4xl">💎</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Mine Icon */}
                      {isMine && (
                        <div className="relative">
                          <span className={`text-4xl ${isClickedMine ? 'animate-bounce' : ''}`}>💣</span>
                          {isClickedMine && (
                            <div className="absolute -inset-4 bg-red-500/30 rounded-full animate-ping" />
                          )}
                        </div>
                      )}
                      
                      {/* Active tile shimmer */}
                      {isActive && !isRevealed && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-500/20 to-transparent" style={{ animation: 'shimmer 2s infinite' }} />
                          <span className="text-pink-400/60 text-2xl">?</span>
                        </>
                      )}
                      
                      {/* Locked tile */}
                      {!gameStarted && !isRevealed && (
                        <span className="text-slate-700 text-xl">🔒</span>
                      )}
                    </button>
                  );
                })}
                
                {/* Multiplier for this level */}
                <div className={`w-16 flex items-center justify-center text-sm font-mono font-bold rounded-xl transition-all ${
                  isActive ? 'bg-pink-500/20 text-pink-400' : isPassed ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-600'
                }`}>
                  {multipliers[levelIndex]}x
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default Towers;
