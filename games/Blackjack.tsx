import React, { useState } from 'react';
import { Card } from '../types';
import BetInput from '../components/BetInput';

interface BlackjackProps {
  balance: number;
  onComplete: (win: boolean, amount: number) => void;
}

const Blackjack: React.FC<BlackjackProps> = ({ balance, onComplete }) => {
  const [bet, setBet] = useState(10000);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'dealerTurn' | 'finished'>('betting');
  const [dealerRevealed, setDealerRevealed] = useState(false);
  const [result, setResult] = useState<{ message: string; win: boolean; amount: number } | null>(null);
  const [dealId, setDealId] = useState(0);

  const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const getCard = (): Card => {
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const value = values[Math.floor(Math.random() * values.length)];
    let points = parseInt(value);
    if (value === 'A') points = 11;
    if (['10', 'J', 'Q', 'K'].includes(value)) points = 10;
    return { suit, value, points };
  };

  const calculateScore = (hand: Card[]): number => {
    let score = hand.reduce((acc, card) => acc + card.points, 0);
    let aces = hand.filter(card => card.value === 'A').length;
    
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }
    return score;
  };

  const isBlackjack = (hand: Card[]): boolean => {
    return hand.length === 2 && calculateScore(hand) === 21;
  };

  const startGame = () => {
    if (bet > balance || bet <= 0) return;
    
    setDealId(prev => prev + 1);
    setResult(null);
    setDealerRevealed(false);
    setPlayerHand([]);
    setDealerHand([]);
    
    const p1 = getCard();
    const d1 = getCard();
    const p2 = getCard();
    const d2 = getCard();
    
    setTimeout(() => setPlayerHand([p1]), 100);
    setTimeout(() => setDealerHand([d1]), 400);
    setTimeout(() => setPlayerHand([p1, p2]), 700);
    setTimeout(() => setDealerHand([d1, d2]), 1000);
    
    setTimeout(() => {
      const playerScore = calculateScore([p1, p2]);
      const dealerScore = calculateScore([d1, d2]);
      
      // Check for blackjacks
      if (playerScore === 21 && dealerScore === 21) {
        setDealerRevealed(true);
        setGameState('finished');
        setResult({ message: 'Push - Both Blackjack!', win: false, amount: 0 });
      } else if (playerScore === 21) {
        setDealerRevealed(true);
        setGameState('finished');
        const winAmount = Math.floor(bet * 1.5);
        setResult({ message: 'BLACKJACK!', win: true, amount: winAmount });
        onComplete(true, winAmount);
      } else if (dealerScore === 21) {
        setDealerRevealed(true);
        setGameState('finished');
        setResult({ message: 'Dealer Blackjack!', win: false, amount: bet });
        onComplete(false, bet);
      } else {
        setGameState('playing');
      }
    }, 1300);
  };

  const hit = () => {
    if (gameState !== 'playing') return;
    
    const newCard = getCard();
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand);
    
    const score = calculateScore(newHand);
    if (score > 21) {
      setTimeout(() => {
        setDealerRevealed(true);
        setGameState('finished');
        setResult({ message: 'BUST!', win: false, amount: bet });
        onComplete(false, bet);
      }, 500);
    }
  };

  const stand = () => {
    if (gameState !== 'playing') return;
    setGameState('dealerTurn');
    setDealerRevealed(true);
    
    // Dealer draws
    let currentDealerHand = [...dealerHand];
    let dealerScore = calculateScore(currentDealerHand);
    
    const drawDealerCards = (hand: Card[], delay: number) => {
      const score = calculateScore(hand);
      if (score < 17) {
        const newCard = getCard();
        const newHand = [...hand, newCard];
        setTimeout(() => {
          setDealerHand(newHand);
          drawDealerCards(newHand, 600);
        }, delay);
      } else {
        setTimeout(() => finishGame(hand), delay);
      }
    };
    
    drawDealerCards(currentDealerHand, 600);
  };

  const doubleDown = () => {
    if (gameState !== 'playing' || playerHand.length !== 2 || bet * 2 > balance) return;
    
    const newCard = getCard();
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand);
    setBet(bet * 2);
    
    const score = calculateScore(newHand);
    if (score > 21) {
      setTimeout(() => {
        setDealerRevealed(true);
        setGameState('finished');
        setResult({ message: 'BUST!', win: false, amount: bet * 2 });
        onComplete(false, bet * 2);
      }, 500);
    } else {
      setTimeout(() => {
        setGameState('dealerTurn');
        setDealerRevealed(true);
        
        let currentDealerHand = [...dealerHand];
        const drawDealerCards = (hand: Card[], delay: number) => {
          const dealerScore = calculateScore(hand);
          if (dealerScore < 17) {
            const newCard = getCard();
            const newHand = [...hand, newCard];
            setTimeout(() => {
              setDealerHand(newHand);
              drawDealerCards(newHand, 600);
            }, delay);
          } else {
            setTimeout(() => finishGame(hand, bet * 2), delay);
          }
        };
        
        drawDealerCards(currentDealerHand, 600);
      }, 500);
    }
  };

  const finishGame = (finalDealerHand: Card[], finalBet: number = bet) => {
    const playerScore = calculateScore(playerHand);
    const dealerScore = calculateScore(finalDealerHand);
    
    setGameState('finished');
    
    if (dealerScore > 21) {
      setResult({ message: 'Dealer Busts! You Win!', win: true, amount: finalBet });
      onComplete(true, finalBet);
    } else if (playerScore > dealerScore) {
      setResult({ message: 'You Win!', win: true, amount: finalBet });
      onComplete(true, finalBet);
    } else if (dealerScore > playerScore) {
      setResult({ message: 'Dealer Wins', win: false, amount: finalBet });
      onComplete(false, finalBet);
    } else {
      setResult({ message: 'Push', win: false, amount: 0 });
    }
  };

  const newGame = () => {
    setGameState('betting');
    setPlayerHand([]);
    setDealerHand([]);
    setResult(null);
    setDealerRevealed(false);
  };

  const playerScore = calculateScore(playerHand);
  const dealerScore = dealerRevealed ? calculateScore(dealerHand) : (dealerHand[0]?.points || 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Game Table */}
      <div 
        className="relative rounded-[3rem] p-8 md:p-12 overflow-hidden border border-emerald-900/50 min-h-[450px] flex flex-col justify-between shadow-2xl"
        style={{
          background: 'radial-gradient(ellipse at center, #0d3320 0%, #052e16 50%, #022c22 100%)',
        }}
      >
        {/* Felt texture */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }} />
        
        {/* Table edge glow */}
        <div className="absolute inset-0 rounded-[3rem] shadow-[inset_0_0_80px_rgba(16,185,129,0.1)]" />
        <div className="absolute inset-4 rounded-[2.5rem] border border-amber-500/20" />

        {/* Dealer Section */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="px-6 py-2 rounded-full bg-rose-900/30 border border-rose-500/30">
              <span className="text-xs font-black uppercase tracking-widest text-rose-400">Dealer</span>
            </div>
            {dealerHand.length > 0 && (
              <div className={`px-4 py-2 rounded-xl font-mono text-2xl font-black transition-all ${
                dealerRevealed && dealerScore > 21 ? 'bg-red-500/20 text-red-400' : 'bg-slate-800/50 text-white'
              }`}>
                {dealerRevealed ? dealerScore : dealerHand[0]?.points || '?'}
                {!dealerRevealed && ' + ?'}
              </div>
            )}
          </div>
          <div className="flex justify-center -space-x-12 min-h-[140px] items-center">
            {dealerHand.map((card, i) => (
              <CardUI 
                key={`${dealId}-d-${i}`} 
                card={card} 
                hidden={i === 1 && !dealerRevealed}
                highlight={result?.win === false && gameState === 'finished'}
              />
            ))}
            {dealerHand.length === 0 && <CardPlaceholder />}
          </div>
        </div>

        {/* Center - Result Display */}
        {result && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className={`px-12 py-6 rounded-3xl backdrop-blur-xl border-2 ${
              result.win 
                ? 'bg-emerald-900/80 border-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.5)]' 
                : result.amount === 0
                  ? 'bg-amber-900/80 border-amber-500 shadow-[0_0_60px_rgba(245,158,11,0.5)]'
                  : 'bg-rose-900/80 border-rose-500 shadow-[0_0_60px_rgba(244,63,94,0.5)]'
            }`}>
              <div className="text-4xl md:text-5xl font-black tracking-wider text-white text-center">
                {result.message}
              </div>
              {result.amount > 0 && (
                <div className={`text-center mt-2 text-xl font-bold ${
                  result.win ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {result.win ? `+$${result.amount.toLocaleString()}` : `-$${result.amount.toLocaleString()}`}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Player Section */}
        <div className="relative z-10">
          <div className="flex justify-center -space-x-12 min-h-[140px] items-center mb-4">
            {playerHand.map((card, i) => (
              <CardUI 
                key={`${dealId}-p-${i}`} 
                card={card}
                highlight={result?.win === true && gameState === 'finished'}
              />
            ))}
            {playerHand.length === 0 && <CardPlaceholder />}
          </div>
          <div className="flex items-center justify-between">
            <div className="px-6 py-2 rounded-full bg-indigo-900/30 border border-indigo-500/30">
              <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Your Hand</span>
            </div>
            {playerHand.length > 0 && (
              <div className={`px-4 py-2 rounded-xl font-mono text-2xl font-black transition-all ${
                playerScore > 21 
                  ? 'bg-red-500/20 text-red-400' 
                  : playerScore === 21 
                    ? 'bg-amber-500/20 text-amber-400' 
                    : 'bg-slate-800/50 text-white'
              }`}>
                {playerScore}
                {playerScore === 21 && playerHand.length === 2 && ' 🎰'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl">
        {gameState === 'betting' ? (
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Bet Input */}
            <div className="flex-1 w-full">
              <BetInput
                value={bet}
                onChange={setBet}
                maxValue={balance}
                disabled={false}
              />
            </div>
            
            {/* Deal Button */}
            <button 
              onClick={startGame}
              disabled={bet > balance || bet <= 0}
              className="px-12 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 font-black tracking-widest uppercase shadow-2xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              🎴 Deal
            </button>
          </div>
        ) : gameState === 'playing' ? (
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={hit}
              className="px-10 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 font-black tracking-widest uppercase shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              👆 Hit
            </button>
            <button 
              onClick={stand}
              className="px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 font-black tracking-widest uppercase shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              ✋ Stand
            </button>
            <button 
              onClick={doubleDown}
              disabled={playerHand.length !== 2 || bet * 2 > balance}
              className="px-10 py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 font-black tracking-widest uppercase shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              💰 Double
            </button>
          </div>
        ) : gameState === 'dealerTurn' ? (
          <div className="text-center py-4">
            <span className="text-xl font-bold text-amber-400 animate-pulse">Dealer drawing...</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <button 
              onClick={newGame}
              className="px-12 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 font-black tracking-widest uppercase shadow-2xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              🔄 New Hand
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const CardPlaceholder = () => (
  <div className="w-28 h-40 rounded-2xl border-2 border-dashed border-emerald-500/20 flex items-center justify-center bg-emerald-900/10">
    <span className="text-emerald-500/20 text-4xl">♠</span>
  </div>
);

const CardUI: React.FC<{ card: Card, hidden?: boolean, highlight?: boolean }> = ({ card, hidden, highlight }) => {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const symbols: any = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
  const [animated, setAnimated] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 10);
    return () => clearTimeout(timer);
  }, []);
  
  if (hidden) {
    return (
      <div 
        className="w-28 h-40 rounded-2xl shadow-2xl ring-1 ring-white/20"
        style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2744 50%, #0a1f35 100%)',
          backgroundImage: `
            linear-gradient(135deg, #1e3a5f 0%, #0f2744 50%, #0a1f35 100%),
            repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)
          `,
          transform: animated ? 'translateY(0) scale(1)' : 'translateY(-80px) scale(0.5)',
          opacity: animated ? 1 : 0,
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-3xl text-blue-400/30">?</span>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`w-28 h-40 rounded-2xl shadow-2xl flex flex-col justify-between p-3 hover:-translate-y-1 ${
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
      <div className={`text-lg font-black flex justify-between ${isRed ? 'text-red-600' : 'text-slate-800'}`}>
        <span>{card.value}</span>
        <span className="text-sm">{symbols[card.suit]}</span>
      </div>
      <div className={`text-5xl self-center drop-shadow-sm ${isRed ? 'text-red-600' : 'text-slate-800'}`}>
        {symbols[card.suit]}
      </div>
      <div className={`text-lg font-black flex justify-between rotate-180 ${isRed ? 'text-red-600' : 'text-slate-800'}`}>
        <span>{card.value}</span>
        <span className="text-sm">{symbols[card.suit]}</span>
      </div>
    </div>
  );
};

export default Blackjack;
