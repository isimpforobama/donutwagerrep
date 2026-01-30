import React, { useState, useRef } from 'react';
import BetInput from '../components/BetInput';

interface CoinFlipProps {
  balance: number;
  onComplete: (win: boolean, amount: number) => void;
}

const CoinFlip: React.FC<CoinFlipProps> = ({ balance, onComplete }) => {
  const [bet, setBet] = useState(10000);
  const [lastBet, setLastBet] = useState(0);
  const [side, setSide] = useState<'heads' | 'tails'>('heads');
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [streak, setStreak] = useState(0);
  const coinRef = useRef<HTMLDivElement>(null);

  const triggerFlip = () => {
    if (bet > balance || flipping || bet <= 0) return;
    
    const outcome = Math.random() > 0.5 ? 'heads' : 'tails';
    
    setLastBet(bet); // Store the bet used for this flip
    setFlipping(true);
    setShowResult(false);
    setResult(null);

    // Reset coin rotation
    if (coinRef.current) {
      coinRef.current.style.transition = 'none';
      coinRef.current.style.transform = 'rotateX(0deg)';
      
      // Force reflow
      void coinRef.current.offsetHeight;
      
      // Apply flip animation
      coinRef.current.style.transition = 'transform 2s cubic-bezier(0.25, 0.1, 0.25, 1)';
      
      // 5 full rotations + final position
      const baseRotation = 1800; // 5 full spins (360 * 5)
      const finalRotation = outcome === 'tails' ? baseRotation + 180 : baseRotation;
      coinRef.current.style.transform = `rotateX(${finalRotation}deg)`;
    }

    setTimeout(() => {
      setResult(outcome);
      setFlipping(false);
      setShowResult(true);
      const won = outcome === side;
      if (won) {
        setStreak(prev => prev + 1);
      } else {
        setStreak(0);
      }
      onComplete(won, bet);
    }, 2000);
  };

  const isWin = result === side;

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start py-8 px-4">
      {/* Left Panel - Controls */}
      <div className="w-full lg:w-80 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-6 lg:sticky lg:top-24">
        <div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-amber-400 to-pink-500 bg-clip-text text-transparent">
            Monarch Flip
          </h2>
          <p className="text-slate-500 text-xs mt-1">Pick your side. Double or nothing.</p>
        </div>

        {/* Streak Counter */}
        {streak > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 to-pink-500/10 border border-amber-500/30 rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-pink-500/5 animate-pulse" />
            <div className="relative">
              <div className="text-xs text-amber-400 uppercase tracking-wider mb-1">🔥 Win Streak</div>
              <div className="text-3xl font-black text-amber-400">{streak} in a row!</div>
            </div>
          </div>
        )}

        {/* Side Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Choose Side</label>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => !flipping && setSide('heads')}
              disabled={flipping}
              className={`relative py-5 rounded-2xl border-2 transition-all duration-300 overflow-hidden group ${
                side === 'heads' 
                  ? 'border-amber-500 bg-gradient-to-br from-amber-500/20 to-amber-700/10 shadow-lg shadow-amber-500/20 scale-105' 
                  : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-102'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br from-amber-500/30 to-transparent opacity-0 transition-opacity ${side === 'heads' ? 'opacity-100' : 'group-hover:opacity-50'}`} />
              {side === 'heads' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent animate-shimmer" />
              )}
              <div className="relative flex flex-col items-center gap-2">
                <span className="text-4xl drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">👑</span>
                <span className={`font-black tracking-widest text-sm ${side === 'heads' ? 'text-amber-400' : 'text-slate-400'}`}>
                  HEADS
                </span>
              </div>
              {side === 'heads' && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-amber-500 rounded-full animate-pulse shadow-lg shadow-amber-500/50" />
              )}
            </button>
            
            <button 
              onClick={() => !flipping && setSide('tails')}
              disabled={flipping}
              className={`relative py-5 rounded-2xl border-2 transition-all duration-300 overflow-hidden group ${
                side === 'tails' 
                  ? 'border-slate-400 bg-gradient-to-br from-slate-400/20 to-slate-600/10 shadow-lg shadow-slate-400/20 scale-105' 
                  : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-102'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br from-slate-400/30 to-transparent opacity-0 transition-opacity ${side === 'tails' ? 'opacity-100' : 'group-hover:opacity-50'}`} />
              {side === 'tails' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-300/20 to-transparent animate-shimmer" />
              )}
              <div className="relative flex flex-col items-center gap-2">
                <span className="text-4xl drop-shadow-[0_0_20px_rgba(148,163,184,0.5)]">⚖️</span>
                <span className={`font-black tracking-widest text-sm ${side === 'tails' ? 'text-slate-300' : 'text-slate-400'}`}>
                  TAILS
                </span>
              </div>
              {side === 'tails' && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-slate-400 rounded-full animate-pulse shadow-lg shadow-slate-400/50" />
              )}
            </button>
          </div>
        </div>

        {/* Bet Amount */}
        <BetInput
          value={bet}
          onChange={setBet}
          maxValue={balance}
          disabled={flipping}
        />

        {/* Flip Button */}
        <button 
          onClick={triggerFlip}
          disabled={flipping || bet > balance || bet <= 0}
          className={`relative w-full py-4 rounded-2xl font-black tracking-wider uppercase overflow-hidden transition-all duration-300 group ${
            flipping 
              ? 'bg-slate-700 cursor-not-allowed' 
              : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-pink-500/25'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {!flipping && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          )}
          <span className="relative z-10 flex items-center justify-center gap-2">
            {flipping ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Flipping...
              </>
            ) : (
              <>🪙 Flip Coin</>
            )}
          </span>
        </button>

        {bet > balance && (
          <p className="text-red-400 text-sm text-center animate-pulse">Insufficient balance</p>
        )}
      </div>

      {/* Right Panel - Coin Display */}
      <div className="flex-1 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 min-h-[600px] relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 via-transparent to-purple-900/10 pointer-events-none" />
        <div className={`absolute inset-0 transition-all duration-1000 pointer-events-none ${
          flipping ? 'bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.2),transparent_70%)]' : 
          showResult && isWin ? 'bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.2),transparent_70%)]' :
          showResult && !isWin ? 'bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.15),transparent_70%)]' :
          'bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.1),transparent_70%)]'
        }`} />
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 rounded-full ${
                flipping ? 'bg-purple-400' : showResult && isWin ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: 0.3 + Math.random() * 0.4,
                animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Main Coin Area */}
        <div className="relative flex flex-col items-center justify-center min-h-[500px]">
          {/* Glow ring behind coin */}
          <div className={`absolute w-72 h-72 rounded-full transition-all duration-700 ${
            flipping 
              ? 'bg-purple-500/30 blur-[80px] scale-125 animate-pulse' 
              : showResult && isWin 
                ? 'bg-emerald-500/40 blur-[100px] scale-150' 
                : showResult && !isWin 
                  ? 'bg-red-500/30 blur-[80px] scale-110' 
                  : 'bg-amber-500/20 blur-[60px] scale-100'
          }`} />
          
          {/* Coin Container - Perspective */}
          <div className="relative" style={{ perspective: '1000px' }}>
            {/* The Coin */}
            <div
              ref={coinRef}
              className={`relative w-56 h-56 transition-shadow duration-500 ${
                flipping ? 'drop-shadow-[0_0_60px_rgba(168,85,247,0.6)]' : ''
              }`}
              style={{ 
                transformStyle: 'preserve-3d',
                transform: 'rotateX(0deg)'
              }}
            >
              {/* Heads Side */}
              <div 
                className="absolute inset-0 rounded-full flex items-center justify-center"
                style={{ 
                  backfaceVisibility: 'hidden',
                  background: 'linear-gradient(145deg, #fcd34d, #f59e0b, #d97706)',
                  boxShadow: `
                    inset 0 4px 30px rgba(255,255,255,0.5),
                    inset 0 -4px 30px rgba(0,0,0,0.3),
                    0 0 60px rgba(245,158,11,0.6),
                    0 20px 60px rgba(0,0,0,0.5)
                  `
                }}
              >
                {/* Inner ring */}
                <div className="absolute inset-3 rounded-full border-4 border-amber-300/50" />
                <div className="absolute inset-6 rounded-full border-2 border-amber-200/30" />
                
                {/* Crown icon */}
                <div className="flex flex-col items-center">
                  <span className="text-8xl filter drop-shadow-[0_0_20px_rgba(0,0,0,0.3)]">👑</span>
                  <span className="text-amber-900/70 font-black text-sm tracking-[0.4em] mt-2">HEADS</span>
                </div>
                
                {/* Shine effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/50 via-transparent to-transparent" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-tl from-black/20 via-transparent to-transparent" />
              </div>

              {/* Tails Side */}
              <div 
                className="absolute inset-0 rounded-full flex items-center justify-center"
                style={{ 
                  backfaceVisibility: 'hidden',
                  transform: 'rotateX(180deg)',
                  background: 'linear-gradient(145deg, #94a3b8, #64748b, #475569)',
                  boxShadow: `
                    inset 0 4px 30px rgba(255,255,255,0.4),
                    inset 0 -4px 30px rgba(0,0,0,0.4),
                    0 0 60px rgba(100,116,139,0.5),
                    0 20px 60px rgba(0,0,0,0.5)
                  `
                }}
              >
                {/* Inner ring */}
                <div className="absolute inset-3 rounded-full border-4 border-slate-400/50" />
                <div className="absolute inset-6 rounded-full border-2 border-slate-300/30" />
                
                {/* Scales icon */}
                <div className="flex flex-col items-center">
                  <span className="text-8xl filter drop-shadow-[0_0_20px_rgba(0,0,0,0.3)]">⚖️</span>
                  <span className="text-slate-900/70 font-black text-sm tracking-[0.4em] mt-2">TAILS</span>
                </div>
                
                {/* Shine effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 via-transparent to-transparent" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-tl from-black/20 via-transparent to-transparent" />
              </div>
            </div>
          </div>

          {/* Status Text Below Coin */}
          <div className="mt-12 h-32 flex items-center justify-center">
            {/* Spinning indicator */}
            {flipping && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-purple-400 mb-2">
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce shadow-lg shadow-purple-400/50" style={{ animationDelay: '0ms' }} />
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce shadow-lg shadow-purple-400/50" style={{ animationDelay: '150ms' }} />
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce shadow-lg shadow-purple-400/50" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-purple-300 font-bold text-lg tracking-wider uppercase">Flipping...</span>
              </div>
            )}
            
            {/* Result Text */}
            {showResult && (
              <div className="text-center animate-in zoom-in-75 fade-in duration-500">
                <div className={`text-6xl font-black tracking-wider mb-3 ${
                  isWin 
                    ? 'text-emerald-400 drop-shadow-[0_0_40px_rgba(52,211,153,0.6)]' 
                    : 'text-red-400 drop-shadow-[0_0_40px_rgba(248,113,113,0.6)]'
                }`}>
                  {isWin ? `+$${lastBet.toLocaleString()}` : `-$${lastBet.toLocaleString()}`}
                </div>
                <div className={`text-sm mt-2 font-bold uppercase tracking-widest ${isWin ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
                  Landed on {result}
                </div>
              </div>
            )}
            
            {/* Idle state */}
            {!flipping && !showResult && (
              <div className="text-center">
                <div className="text-slate-500 font-bold text-lg">
                  Pick <span className={side === 'heads' ? 'text-amber-400' : 'text-slate-300'}>{side.toUpperCase()}</span> to win
                </div>
                <div className="text-slate-600 text-sm mt-1">
                  ${bet.toLocaleString()} → ${(bet * 2).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Stats Bar */}
        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center text-sm">
          <div className="bg-slate-800/50 rounded-xl px-4 py-2 border border-white/5">
            <span className="text-slate-500">House Edge:</span>
            <span className="text-slate-300 font-bold ml-2">0%</span>
          </div>
          <div className="bg-slate-800/50 rounded-xl px-4 py-2 border border-white/5">
            <span className="text-slate-500">Odds:</span>
            <span className="text-emerald-400 font-bold ml-2">50/50</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinFlip;
