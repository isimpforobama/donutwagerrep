
import React, { useState, useRef, useEffect } from 'react';
import { GameType } from '../types';

interface HeaderProps {
  balance: number;
  level: number;
  xp: number;
  onFaucet: () => void;
  activeTab: GameType;
  onHome: () => void;
  onAddBalance: (amount: number) => void;
}

const pageNames: Record<GameType, string> = {
  [GameType.DASHBOARD]: 'Dashboard',
  [GameType.COIN_FLIP]: 'Coin Flip',
  [GameType.TOWERS]: 'Towers',
  [GameType.MINES]: 'Mines',
  [GameType.BACCARAT]: 'Baccarat',
  [GameType.BLACKJACK]: 'Blackjack',
  [GameType.PLINKO]: 'Plinko',
  [GameType.CRATES]: 'Crates',
  [GameType.CHICKEN_CROSS]: 'Chicken Cross',
  [GameType.DEPOSIT]: 'Deposit',
  [GameType.WITHDRAW]: 'Withdraw',
  [GameType.TRANSACTION_HISTORY]: 'Transaction History',
};

const formatBalance = (num: number): string => {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B$';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M$';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K$';
  return num + '$';
};

const Header: React.FC<HeaderProps> = ({ balance, level, xp, onFaucet, activeTab, onHome, onAddBalance }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginTab, setLoginTab] = useState<'minecraft' | 'google'>('minecraft');
  const [username, setUsername] = useState('');
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const demoMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (demoMenuRef.current && !demoMenuRef.current.contains(e.target as Node)) {
        setShowDemoMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const generatedCommand = username.trim() ? `/pay DonutBank 100` : '';

  return (
    <>
      <header className="h-12 border-b border-white/5 bg-transparent backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <button
            onClick={onHome}
            className="w-7 h-7 rounded-md bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 flex items-center justify-center transition-colors"
            title="Home"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          <h1 className="text-sm font-semibold text-white">{pageNames[activeTab]}</h1>
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/50">
            DEMO MODE
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Balance with demo add button */}
          <div className="relative flex items-center" ref={demoMenuRef}>
            <span className="font-mono font-bold text-sm tabular-nums text-white">
              {formatBalance(balance)}
            </span>
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="ml-2 w-5 h-5 rounded bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 flex items-center justify-center text-green-400 text-xs font-bold transition-colors"
              title="Add demo balance"
            >
              +
            </button>
            
            {showDemoMenu && (
              <div className="absolute right-0 top-full mt-2 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-[100] overflow-hidden min-w-[140px]">
                <div className="px-3 py-2 text-xs text-slate-400 border-b border-white/10">Add Demo Balance</div>
                {[
                  { label: '+10K', amount: 10_000 },
                  { label: '+100K', amount: 100_000 },
                  { label: '+1M', amount: 1_000_000 },
                  { label: '+10M', amount: 10_000_000 },
                  { label: '+100M', amount: 100_000_000 },
                ].map(({ label, amount }) => (
                  <button
                    key={amount}
                    onClick={() => { onAddBalance(amount); setShowDemoMenu(false); }}
                    className="w-full px-3 py-2 text-sm font-bold text-left text-green-400 hover:bg-green-500/20 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setShowLoginModal(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 px-3 py-1.5 rounded-full font-semibold text-xs transition-all hover:scale-105 active:scale-95 shadow-md shadow-pink-500/25"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Login
          </button>

          <a 
            href="mailto:" 
            className="w-7 h-7 rounded-md bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 flex items-center justify-center transition-colors"
            title="Support"
          >
            <img 
              src="/images/logoimage.png" 
              alt="Support" 
              className="w-4 h-4 object-contain"
            />
          </a>
        </div>
      </header>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowLoginModal(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl shadow-purple-500/20 animate-in zoom-in-95 fade-in duration-200">
            {/* Close button */}
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              ✕
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black mb-2">Connect Account</h2>
              <p className="text-slate-500 text-sm">Choose how you want to connect</p>
            </div>

            {/* Login Type Tabs */}
            <div className="flex bg-slate-800/50 rounded-xl p-1 mb-6">
              <button
                onClick={() => setLoginTab('minecraft')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  loginTab === 'minecraft' 
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>⛏️</span>
                Minecraft
              </button>
              <button
                onClick={() => setLoginTab('google')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  loginTab === 'google' 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
            </div>

            {/* Minecraft Login Tab */}
            {loginTab === 'minecraft' && (
              <>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4">
                  <p className="text-emerald-400 text-xs font-medium text-center">🎮 Required to play casino games</p>
                </div>

                {/* Username Input */}
                <div className="mb-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Minecraft Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-600"
                  />
                </div>

                {/* Generated Command */}
                <div className="mb-5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Your Login Command</label>
                  <div className="relative">
                    <div className={`bg-slate-950 border border-white/10 rounded-xl px-4 py-4 font-mono text-sm select-all ${username.trim() ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {username.trim() ? `/pay DonutBank 100` : 'Enter username above...'}
                    </div>
                    {username.trim() && (
                      <button 
                        onClick={() => navigator.clipboard.writeText('/pay DonutBank 100')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                    <span className="text-slate-400">Enter your Minecraft username</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                    <span className="text-slate-400">Copy and run the command in-game</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                    <span className="text-slate-400">You'll be logged in automatically</span>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="flex items-center justify-center gap-2 mt-4 py-3 bg-slate-800/30 rounded-xl text-slate-500 text-sm">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                  Waiting for payment...
                </div>
              </>
            )}

            {/* Google Login Tab */}
            {loginTab === 'google' && (
              <>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-6">
                  <p className="text-blue-400 text-xs font-medium text-center">🎁 Get 500 bonus chips on signup!</p>
                </div>

                <button className="w-full bg-white hover:bg-slate-100 text-slate-900 rounded-xl py-4 font-bold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="mt-6 text-center">
                  <p className="text-slate-500 text-xs">
                    Sign up with Google to claim your <span className="text-yellow-400 font-bold">500 💎</span> welcome bonus
                  </p>
                </div>

                <div className="mt-4 p-3 bg-slate-800/30 rounded-xl">
                  <p className="text-slate-500 text-xs text-center">
                    ⚠️ You'll still need to connect your Minecraft account to play games
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
