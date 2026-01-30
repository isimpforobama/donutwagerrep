
import React, { useState } from 'react';
import { Card } from '../types';
import BetInput from '../components/BetInput';

interface BaccaratProps {
  balance: number;
  onComplete: (win: boolean, amount: number) => void;
}

const Baccarat: React.FC<BaccaratProps> = ({ balance, onComplete }) => {
  const [betType, setBetType] = useState<'player' | 'banker' | 'tie'>('player');
  const [betAmount, setBetAmount] = useState(10000);
  const [playing, setPlaying] = useState(false);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [bankerHand, setBankerHand] = useState<Card[]>([]);
  const [resultMsg, setResultMsg] = useState('');
  const [winner, setWinner] = useState<'player' | 'banker' | 'tie' | null>(null);
  const [dealId, setDealId] = useState(0);

  const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const getCard = (): Card => {
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const value = values[Math.floor(Math.random() * values.length)];
    let points = parseInt(value);
    if (value === 'A') points = 1;
    if (['10', 'J', 'Q', 'K'].includes(value)) points = 0;
    return { suit, value, points };
  };

  const calculateScore = (hand: Card[]) => {
    const sum = hand.reduce((acc, card) => acc + card.points, 0);
    return sum % 10;
  };

  const deal = () => {
    if (betAmount > balance || playing || betAmount <= 0) return;
    setPlaying(true);
    setResultMsg('');
    setWinner(null);
    setPlayerHand([]);
    setBankerHand([]);
    setDealId(prev => prev + 1);
    
    setTimeout(() => {
      const p1 = getCard();
      const b1 = getCard();
      const p2 = getCard();
      const b2 = getCard();
      
      setPlayerHand([p1]);
      setTimeout(() => setBankerHand([b1]), 400);
      setTimeout(() => setPlayerHand([p1, p2]), 800);
      setTimeout(() => setBankerHand([b1, b2]), 1200);

      setTimeout(() => {
        let currentP = [p1, p2];
        let currentB = [b1, b2];
        let pScore = calculateScore(currentP);
        let bScore = calculateScore(currentB);

        let delay = 0;
        if (pScore <= 5) {
          const p3 = getCard();
          currentP.push(p3);
          setTimeout(() => setPlayerHand([...currentP]), 400);
          pScore = calculateScore(currentP);
          delay += 600;
        }

        if (bScore <= 5) {
          const b3 = getCard();
          currentB.push(b3);
          setTimeout(() => setBankerHand([...currentB]), delay + 400);
          bScore = calculateScore(currentB);
          delay += 600;
        }

        setTimeout(() => {
          let outcome: 'player' | 'banker' | 'tie';
          if (pScore > bScore) outcome = 'player';
          else if (bScore > pScore) outcome = 'banker';
          else outcome = 'tie';

          const won = outcome === betType;
          setWinner(outcome);
          setResultMsg(`${outcome.toUpperCase()} WINS`);
          onComplete(won, won ? (betType === 'tie' ? betAmount * 8 : betAmount) : betAmount);
          setPlaying(false);
        }, delay + 1000);
      }, 1600);
    }, 400);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-1000 p-6">
      {/* Main Table */}
      <div className="relative rounded-[3rem] p-12 overflow-hidden border border-emerald-900/50 min-h-[500px] flex flex-col justify-center shadow-2xl"
        style={{
          background: 'radial-gradient(ellipse at center, #0d3320 0%, #052e16 50%, #022c22 100%)',
        }}
      >
        {/* Felt texture overlay */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }} />
        
        {/* Table edge glow */}
        <div className="absolute inset-0 rounded-[3rem] shadow-[inset_0_0_100px_rgba(16,185,129,0.1)]" />
        
        {/* Golden trim line */}
        <div className="absolute inset-4 rounded-[2.5rem] border border-amber-500/20" />
        
        {/* Hands Display */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-32">
          {/* Player Side */}
          <div className={`flex flex-col items-center transition-all duration-500 ${winner === 'player' ? 'scale-105' : winner && winner !== 'player' ? 'opacity-50 scale-95' : ''}`}>
            <div className={`relative mb-8 px-8 py-2 rounded-full border transition-all duration-500 ${
              winner === 'player' 
                ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.4)]' 
                : 'bg-emerald-900/30 border-emerald-500/30'
            }`}>
              <h3 className={`text-xs font-black uppercase tracking-[0.4em] ${
                winner === 'player' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                Player
              </h3>
              {winner === 'player' && (
                <div className="absolute -top-1 -right-1 text-lg">👑</div>
              )}
            </div>
            
            <div className="flex justify-center -space-x-16 perspective-1000 min-h-[200px] items-center">
              {playerHand.map((card, i) => <CardUI key={`${dealId}-p-${i}`} card={card} index={i} highlight={winner === 'player'} />)}
              {playerHand.length === 0 && <CardPlaceholder />}
            </div>
            
            <div className={`mt-8 transition-all duration-500 ${playerHand.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className={`px-8 py-3 rounded-2xl font-mono text-4xl font-black transition-all ${
                winner === 'player' 
                  ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)]' 
                  : 'bg-emerald-900/30 text-emerald-400'
              }`}>
                {calculateScore(playerHand)}
              </div>
            </div>
          </div>

          {/* Banker Side */}
          <div className={`flex flex-col items-center transition-all duration-500 ${winner === 'banker' ? 'scale-105' : winner && winner !== 'banker' ? 'opacity-50 scale-95' : ''}`}>
            <div className={`relative mb-8 px-8 py-2 rounded-full border transition-all duration-500 ${
              winner === 'banker' 
                ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.4)]' 
                : 'bg-rose-900/30 border-rose-500/30'
            }`}>
              <h3 className={`text-xs font-black uppercase tracking-[0.4em] ${
                winner === 'banker' ? 'text-amber-400' : 'text-rose-400'
              }`}>
                Banker
              </h3>
              {winner === 'banker' && (
                <div className="absolute -top-1 -right-1 text-lg">👑</div>
              )}
            </div>
            
            <div className="flex justify-center -space-x-16 perspective-1000 min-h-[200px] items-center">
              {bankerHand.map((card, i) => <CardUI key={`${dealId}-b-${i}`} card={card} index={i} highlight={winner === 'banker'} />)}
              {bankerHand.length === 0 && <CardPlaceholder />}
            </div>
            
            <div className={`mt-8 transition-all duration-500 ${bankerHand.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className={`px-8 py-3 rounded-2xl font-mono text-4xl font-black transition-all ${
                winner === 'banker' 
                  ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)]' 
                  : 'bg-rose-900/30 text-rose-400'
              }`}>
                {calculateScore(bankerHand)}
              </div>
            </div>
          </div>
        </div>

        {/* Result Announcement */}
        {resultMsg && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="relative">
              {/* Glow rings */}
              <div className="absolute inset-0 -m-20 rounded-full bg-amber-500/10 animate-ping" />
              <div className="absolute inset-0 -m-12 rounded-full bg-amber-500/20 animate-pulse" />
              
              <div className={`px-16 py-8 rounded-3xl backdrop-blur-xl border-2 ${
                winner === betType 
                  ? 'bg-emerald-900/80 border-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.5)]' 
                  : 'bg-rose-900/80 border-rose-500 shadow-[0_0_60px_rgba(244,63,94,0.5)]'
              }`}>
                <div className="text-6xl font-black tracking-wider text-white drop-shadow-lg">
                  {resultMsg}
                </div>
                <div className={`text-center mt-2 text-xl font-bold ${
                  winner === betType ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {winner === betType 
                    ? `+$${(betType === 'tie' ? betAmount * 8 : betAmount).toLocaleString()}` 
                    : `-$${betAmount.toLocaleString()}`
                  }
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls Panel */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-xl">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Bet Type Selection */}
          <div className="flex flex-wrap justify-center gap-4">
            <BetBtn 
              active={betType === 'player'} 
              onClick={() => setBetType('player')} 
              label="PLAYER" 
              odds="1:1" 
              color="indigo" 
              disabled={playing}
            />
            <BetBtn 
              active={betType === 'tie'} 
              onClick={() => setBetType('tie')} 
              label="TIE" 
              odds="8:1" 
              color="emerald" 
              disabled={playing}
            />
            <BetBtn 
              active={betType === 'banker'} 
              onClick={() => setBetType('banker')} 
              label="BANKER" 
              odds="0.95:1" 
              color="rose" 
              disabled={playing}
            />
          </div>

          {/* Bet Amount & Deal */}
          <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-end">
            <div className="flex-1">
              <BetInput
                value={betAmount}
                onChange={setBetAmount}
                maxValue={balance}
                disabled={playing}
              />
            </div>
            
            <button 
              onClick={deal}
              disabled={playing || betAmount > balance || betAmount <= 0}
              className="px-12 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 font-black tracking-widest uppercase shadow-2xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {playing ? '⏳ DEALING...' : '🎴 DEAL'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BetBtn = ({ active, onClick, label, odds, color, disabled }: any) => {
  const colors: any = {
    indigo: { border: 'border-indigo-500', bg: 'bg-indigo-500/20', text: 'text-indigo-400', glow: 'shadow-indigo-500/30' },
    emerald: { border: 'border-emerald-500', bg: 'bg-emerald-500/20', text: 'text-emerald-400', glow: 'shadow-emerald-500/30' },
    rose: { border: 'border-rose-500', bg: 'bg-rose-500/20', text: 'text-rose-400', glow: 'shadow-rose-500/30' },
  };
  const c = colors[color];
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`group relative w-32 h-24 rounded-2xl border-2 transition-all duration-300 disabled:opacity-50 ${
        active 
          ? `${c.border} ${c.bg} shadow-lg ${c.glow}` 
          : 'border-white/10 bg-white/5 hover:bg-white/10'
      }`}
    >
      <div className="flex flex-col items-center justify-center gap-1">
        <span className={`text-xs font-black tracking-widest transition-colors ${active ? 'text-white' : 'text-slate-400'}`}>
          {label}
        </span>
        <span className={`text-lg font-mono font-bold ${active ? c.text : 'text-slate-600'}`}>
          {odds}
        </span>
      </div>
      {active && (
        <div className={`absolute -top-1.5 -right-1.5 w-4 h-4 ${c.bg} ${c.border} border-2 rounded-full animate-pulse`} />
      )}
    </button>
  );
};

const CardPlaceholder = () => (
  <div className="w-32 h-48 rounded-2xl border-2 border-dashed border-emerald-500/20 flex items-center justify-center bg-emerald-900/10">
    <span className="text-emerald-500/20 text-5xl">♠</span>
  </div>
);

const CardUI: React.FC<{ card: Card, index: number, highlight?: boolean }> = ({ card, index, highlight }) => {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const symbols: any = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
  const [animated, setAnimated] = React.useState(false);
  
  React.useEffect(() => {
    // Start invisible, then animate in
    const timer = setTimeout(() => setAnimated(true), 10);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div 
      className={`w-32 h-48 rounded-2xl shadow-2xl flex flex-col justify-between p-4 hover:-translate-y-2 ${
        highlight 
          ? 'ring-4 ring-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.4)]' 
          : 'ring-1 ring-white/20'
      }`}
      style={{
        background: 'linear-gradient(145deg, #ffffff 0%, #f0f0f0 50%, #e8e8e8 100%)',
        transform: animated ? 'translateY(0) scale(1)' : 'translateY(-80px) scale(0.5)',
        opacity: animated ? 1 : 0,
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div className={`text-xl font-black flex justify-between ${isRed ? 'text-red-600' : 'text-slate-800'}`}>
        <span>{card.value}</span>
        <span className="text-sm">{symbols[card.suit]}</span>
      </div>
      <div className={`text-6xl self-center drop-shadow-sm ${isRed ? 'text-red-600' : 'text-slate-800'}`}>
        {symbols[card.suit]}
      </div>
      <div className={`text-xl font-black flex justify-between rotate-180 ${isRed ? 'text-red-600' : 'text-slate-800'}`}>
        <span>{card.value}</span>
        <span className="text-sm">{symbols[card.suit]}</span>
      </div>
    </div>
  );
};

export default Baccarat;
