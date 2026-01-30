
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { GameType, UserStats, HistoryItem } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CoinFlip from './games/CoinFlip';
import Towers from './games/Towers';
import Baccarat from './games/Baccarat';
import Blackjack from './games/Blackjack';
import Mines from './games/Mines';
import PlinkoMatter from './games/PlinkoMatter';
import Crates from './games/Crates';
import ChickenCross from './games/ChickenCross';
import Deposit from './components/Deposit';
import Withdraw from './components/Withdraw';
import TransactionHistory from './components/TransactionHistory';
import AIConcierge from './components/AIConcierge';
import WelcomePage from './components/WelcomePage';

const INITIAL_BALANCE = 5000;

// Map routes to GameType
const routeToGameType: Record<string, GameType> = {
  '/home': GameType.DASHBOARD,
  '/coinflip': GameType.COIN_FLIP,
  '/towers': GameType.TOWERS,
  '/mines': GameType.MINES,
  '/baccarat': GameType.BACCARAT,
  '/blackjack': GameType.BLACKJACK,
  '/plinko': GameType.PLINKO,
  '/crates': GameType.CRATES,
  '/chickencross': GameType.CHICKEN_CROSS,
  '/deposit': GameType.DEPOSIT,
  '/withdraw': GameType.WITHDRAW,
  '/transactionhistory': GameType.TRANSACTION_HISTORY,
};

// Map GameType to routes
const gameTypeToRoute: Record<GameType, string> = {
  [GameType.DASHBOARD]: '/home',
  [GameType.COIN_FLIP]: '/coinflip',
  [GameType.TOWERS]: '/towers',
  [GameType.MINES]: '/mines',
  [GameType.BACCARAT]: '/baccarat',
  [GameType.BLACKJACK]: '/blackjack',
  [GameType.PLINKO]: '/plinko',
  [GameType.CRATES]: '/crates',
  [GameType.CHICKEN_CROSS]: '/chickencross',
  [GameType.DEPOSIT]: '/deposit',
  [GameType.WITHDRAW]: '/withdraw',
  [GameType.TRANSACTION_HISTORY]: '/transactionhistory',
};

// Main lounge layout component
const LoungeLayout: React.FC<{
  stats: UserStats;
  history: HistoryItem[];
  updateStats: (win: boolean, amount: number, game: GameType) => void;
  faucet: () => void;
  addBalance: (amount: number) => void;
}> = ({ stats, history, updateStats, faucet, addBalance }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const activeTab = routeToGameType[location.pathname] || GameType.DASHBOARD;
  
  const setActiveTab = useCallback((tab: GameType) => {
    navigate(gameTypeToRoute[tab]);
  }, [navigate]);

  return (
    <div className="flex w-full h-screen bg-transparent text-slate-100 selection:bg-pink-500/30 overflow-hidden relative">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Header balance={stats.balance} level={stats.level} xp={stats.xp} onFaucet={faucet} activeTab={activeTab} onHome={() => setActiveTab(GameType.DASHBOARD)} onAddBalance={addBalance} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
          <Routes>
            <Route path="home" element={<Dashboard stats={stats} history={history} onGameSelect={setActiveTab} />} />
            <Route path="coinflip" element={<CoinFlip balance={stats.balance} onComplete={(win, amount) => updateStats(win, amount, GameType.COIN_FLIP)} />} />
            <Route path="towers" element={<Towers balance={stats.balance} onComplete={(win, amount) => updateStats(win, amount, GameType.TOWERS)} />} />
            <Route path="mines" element={<Mines balance={stats.balance} onComplete={(win, amount) => updateStats(win, amount, GameType.MINES)} />} />
            <Route path="baccarat" element={<Baccarat balance={stats.balance} onComplete={(win, amount) => updateStats(win, amount, GameType.BACCARAT)} />} />
            <Route path="crates" element={<Crates balance={stats.balance} onComplete={(win, amount) => updateStats(win, amount, GameType.CRATES)} />} />
            <Route path="blackjack" element={<Blackjack balance={stats.balance} onComplete={(win, amount) => updateStats(win, amount, GameType.BLACKJACK)} />} />
            <Route path="plinko" element={<PlinkoMatter balance={stats.balance} onComplete={(win, amount) => updateStats(win, amount, GameType.PLINKO)} />} />
            <Route path="chickencross" element={<ChickenCross balance={stats.balance} onComplete={(win, amount) => updateStats(win, amount, GameType.CHICKEN_CROSS)} />} />
            <Route path="deposit" element={<Deposit />} />
            <Route path="withdraw" element={<Withdraw />} />
            <Route path="transactionhistory" element={<TransactionHistory />} />
          </Routes>
        </main>
      </div>

      <AIConcierge stats={stats} history={history} />
    </div>
  );
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('zenith_stats');
    return saved ? JSON.parse(saved) : {
      balance: INITIAL_BALANCE,
      totalWon: 0,
      totalLost: 0,
      gamesPlayed: 0,
      level: 1,
      xp: 0
    };
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('zenith_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('zenith_stats', JSON.stringify(stats));
    localStorage.setItem('zenith_history', JSON.stringify(history));
  }, [stats, history]);

  const updateStats = useCallback((win: boolean, amount: number, game: GameType) => {
    setStats(prev => {
      const netChange = win ? amount : -amount;
      const newXp = prev.xp + 10;
      const newLevel = Math.floor(newXp / 500) + 1;
      
      return {
        ...prev,
        balance: prev.balance + netChange,
        totalWon: win ? prev.totalWon + amount : prev.totalWon,
        totalLost: !win ? prev.totalLost + (amount < 0 ? 0 : amount) : prev.totalLost,
        gamesPlayed: prev.gamesPlayed + 1,
        level: newLevel,
        xp: newXp
      };
    });

    setHistory(prev => [
      {
        id: Math.random().toString(36).substr(2, 9),
        game,
        amount,
        result: win ? 'win' : 'loss',
        timestamp: Date.now()
      },
      ...prev
    ].slice(0, 50));
  }, []);

  const faucet = () => {
    if (stats.balance < 100) {
      setStats(prev => ({ ...prev, balance: prev.balance + 1000 }));
      alert("Donut Concierge: Here are 1,000 complimentary chips to get you back in the game.");
    }
  };

  const addBalance = useCallback((amount: number) => {
    setStats(prev => ({ ...prev, balance: prev.balance + amount }));
  }, []);

  const handleEnterLounge = () => {
    navigate('/home');
  };

  return (
    <Routes>
      {/* Root redirects to welcome */}
      <Route path="/" element={<Navigate to="/welcome" replace />} />
      
      {/* Welcome page */}
      <Route path="/welcome" element={<WelcomePage onEnter={handleEnterLounge} />} />
      
      {/* All lounge routes */}
      <Route path="/*" element={
        <LoungeLayout 
          stats={stats} 
          history={history} 
          updateStats={updateStats} 
          faucet={faucet}
          addBalance={addBalance}
        />
      } />
    </Routes>
  );
};

export default App;
