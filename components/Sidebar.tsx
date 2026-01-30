import React, { useState } from 'react';
import { GameType } from '../types';

interface SidebarProps {
  activeTab: GameType;
  setActiveTab: (tab: GameType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [gamesOpen, setGamesOpen] = useState(true);
  const [skillGamesOpen, setSkillGamesOpen] = useState(true);
  const [fundsOpen, setFundsOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'profile' | 'leaderboard' | 'settings' | 'game' | 'skillgame'>('dashboard');

  const games = [
    { id: GameType.COIN_FLIP, name: 'Coin Flip' },
    { id: GameType.TOWERS, name: 'Towers' },
    { id: GameType.MINES, name: 'Mines' },
    { id: GameType.PLINKO, name: 'Plinko' },
    { id: GameType.CRATES, name: 'Crates' },
    { id: GameType.CHICKEN_CROSS, name: 'Chicken Cross' },
    { id: GameType.BACCARAT, name: 'Baccarat' },
    { id: GameType.BLACKJACK, name: 'Blackjack' },
  ];

  const skillGames = [
    { id: 'poker', name: 'Poker', available: false },
  ];

  const handleGameClick = (gameId: GameType) => {
    setActiveTab(gameId);
    setActiveSection('game');
  };

  const handleSectionClick = (section: 'dashboard' | 'profile' | 'leaderboard' | 'settings') => {
    setActiveSection(section);
    if (section === 'dashboard') {
      setActiveTab(GameType.DASHBOARD);
    }
  };

  return (
    <div className="relative w-56 flex flex-col py-4 z-50 overflow-y-auto custom-scrollbar">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #000000;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
          transition: background 0.3s ease;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
      {/* Gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-pink-500 via-purple-500 to-blue-500 opacity-30" />
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl m-[1px]" />
      
      {/* Content */}
      <div className="relative flex flex-col flex-1">
      {/* Logo */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-center">
          <h1 className="font-black text-lg leading-tight">donutwager.com</h1>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2 space-y-1">
        {/* Dashboard */}
        <button
          onClick={() => handleSectionClick('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeSection === 'dashboard'
              ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white border border-pink-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </button>

        {/* Games Dropdown */}
        <div>
          <button
            onClick={() => setGamesOpen(!gamesOpen)}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeSection === 'game'
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-white border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Games
            </div>
            <svg className={`w-4 h-4 transition-transform ${gamesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Games List */}
          <div className={`overflow-hidden transition-all duration-300 ${gamesOpen ? 'max-h-96 mt-1' : 'max-h-0'}`}>
            <div className="pl-4 space-y-0.5">
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleGameClick(game.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeTab === game.id && activeSection === 'game'
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    activeTab === game.id && activeSection === 'game' ? 'bg-emerald-400' : 'bg-slate-600'
                  }`} />
                  {game.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Skill Based Dropdown */}
        <div>
          <button
            onClick={() => setSkillGamesOpen(!skillGamesOpen)}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeSection === 'skillgame'
                ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-white border border-violet-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Skill Based
            </div>
            <svg className={`w-4 h-4 transition-transform ${skillGamesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Skill Games List */}
          <div className={`overflow-hidden transition-all duration-300 ${skillGamesOpen ? 'max-h-96 mt-1' : 'max-h-0'}`}>
            <div className="pl-4 space-y-0.5">
              {skillGames.map((game) => (
                <button
                  key={game.id.toString()}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-slate-600 cursor-not-allowed"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  {game.name}
                  <span className="ml-auto text-[10px] text-violet-400 bg-violet-500/20 px-1.5 py-0.5 rounded">Soon</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Funds Dropdown */}
        <div>
          <button
            onClick={() => setFundsOpen(!fundsOpen)}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-slate-400 hover:text-white hover:bg-white/5`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Funds
            </div>
            <svg className={`w-4 h-4 transition-transform ${fundsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Funds List */}
          <div className={`overflow-hidden transition-all duration-300 ${fundsOpen ? 'max-h-96 mt-1' : 'max-h-0'}`}>
            <div className="pl-4 space-y-0.5">
              <button 
                onClick={() => handleGameClick(GameType.DEPOSIT)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  activeTab === GameType.DEPOSIT && activeSection === 'game'
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${
                  activeTab === GameType.DEPOSIT && activeSection === 'game' ? 'bg-emerald-400' : 'bg-slate-600'
                }`} />
                Deposit
              </button>
              <button 
                onClick={() => handleGameClick(GameType.WITHDRAW)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  activeTab === GameType.WITHDRAW && activeSection === 'game'
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${
                  activeTab === GameType.WITHDRAW && activeSection === 'game' ? 'bg-emerald-400' : 'bg-slate-600'
                }`} />
                Withdraw
              </button>
              <button 
                onClick={() => handleGameClick(GameType.TRANSACTION_HISTORY)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  activeTab === GameType.TRANSACTION_HISTORY && activeSection === 'game'
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${
                  activeTab === GameType.TRANSACTION_HISTORY && activeSection === 'game' ? 'bg-emerald-400' : 'bg-slate-600'
                }`} />
                Transaction History
              </button>
            </div>
          </div>
        </div>

        {/* Profile */}
        <button
          onClick={() => handleSectionClick('profile')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeSection === 'profile'
              ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-white border border-blue-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Profile
        </button>

        {/* Leaderboard */}
        <button
          onClick={() => handleSectionClick('leaderboard')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-slate-400 hover:text-white hover:bg-white/5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Leaderboard
        </button>

        {/* Settings */}
        <button
          onClick={() => handleSectionClick('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeSection === 'settings'
              ? 'bg-gradient-to-r from-slate-500/20 to-slate-400/20 text-white border border-slate-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
      </nav>

      {/* Bottom Status */}
      <div className="px-4 pt-4 mt-auto border-t border-white/5">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
          <span>Online</span>
          <span className="ml-auto text-slate-600">v1.0.2</span>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Sidebar;
