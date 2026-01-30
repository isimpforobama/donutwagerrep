
import React from 'react';
import { GameType, UserStats, HistoryItem } from '../types';

interface DashboardProps {
  stats: UserStats;
  history: HistoryItem[];
  onGameSelect: (tab: GameType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, history, onGameSelect }) => {
  
  const games = [
    {
      id: GameType.COIN_FLIP,
      title: 'Flip',
      desc: '50/50 odds. Double or nothing.',
      icon: '🪙',
      gradient: 'from-amber-500 via-yellow-500 to-orange-600',
      glow: 'shadow-amber-500/30',
      image: '/images/coinflipimage.png'
    },
    {
      id: GameType.TOWERS,
      title: 'Towers',
      desc: 'Climb higher. Risk more.',
      icon: '🗼',
      gradient: 'from-pink-500 via-purple-500 to-indigo-600',
      glow: 'shadow-purple-500/30',
      image: '/images/towersimage.png'
    },
    {
      id: GameType.MINES,
      title: 'Mines',
      desc: 'Find gems. Avoid bombs.',
      icon: '💎',
      gradient: 'from-cyan-500 via-blue-500 to-indigo-600',
      glow: 'shadow-cyan-500/30',
      image: '/images/minesimage.png'
    },
    {
      id: GameType.PLINKO,
      title: 'Plinko',
      desc: 'Drop and watch it bounce.',
      icon: '🎱',
      gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
      glow: 'shadow-emerald-500/30',
      image: '/images/plinkoimage.png'
    },
    {
      id: GameType.CHICKEN_CROSS,
      title: 'Chicken Cross',
      desc: 'Cross the road without getting hit.',
      icon: '🐔',
      gradient: 'from-yellow-500 via-orange-500 to-red-600',
      glow: 'shadow-yellow-500/30',
      image: '/images/chickencrossimage.png'
    },
    {
      id: GameType.CRATES,
      title: 'Crates',
      desc: 'Open mystery boxes.',
      icon: '📦',
      gradient: 'from-orange-500 via-red-500 to-pink-600',
      glow: 'shadow-orange-500/30',
      image: '/images/cratesimage.png'
    },
    {
      id: GameType.BACCARAT,
      title: 'Baccarat',
      desc: 'Classic card game.',
      icon: '♠️',
      gradient: 'from-slate-400 via-zinc-500 to-slate-600',
      glow: 'shadow-slate-400/30',
      image: '/images/baccaratimage.png'
    },
    {
      id: GameType.BLACKJACK,
      title: 'Blackjack',
      desc: 'Beat the dealer to 21.',
      icon: '🃏',
      gradient: 'from-red-500 via-rose-500 to-pink-600',
      glow: 'shadow-red-500/30',
      image: '/images/blackjackimage.png'
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 bg-transparent">
      {/* Hero Header */}
      <header className="relative py-12 animate-in slide-up">
        {/* Background Effects */}
        <div className="absolute -left-20 top-0 w-40 h-40 bg-pink-500/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute right-20 top-10 w-32 h-32 bg-purple-500/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute left-1/2 -top-10 w-24 h-24 bg-amber-500/15 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        
        <div className="relative">
          {/* Hero Video Banner with Overlaid Text */}
          <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden mb-6">
            <video 
              autoPlay
              muted 
              playsInline
              loop
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src="/videos/herobanneraniomation.mp4" type="video/mp4" />
            </video>
            {/* Text Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col justify-center p-6 md:p-10 bg-gradient-to-r from-black/60 via-black/30 to-transparent">
              <p className="text-slate-300 text-sm uppercase tracking-widest mb-1">Welcome back</p>
              <h1 className="text-4xl md:text-5xl font-black text-white">
                Player <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">#7291</span>
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Games Grid */}
      <section className="animate-in slide-up [animation-delay:200ms]">
        <h2 className="text-2xl font-bold text-white mb-5">Featured Games</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {games.map((game, idx) => (
            <button
              key={game.id}
              onClick={() => onGameSelect(game.id)}
              style={{ animationDelay: `${100 + (idx * 50)}ms` }}
              className={`group relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-500 text-left animate-in slide-up hover:scale-[1.02] active:scale-[0.98] shadow-2xl ${game.glow} hover:shadow-xl`}
            >
              {/* Background Image with zoom effect */}
              <div className="absolute inset-0 overflow-hidden">
                <img 
                  src={game.image} 
                  alt={game.title}
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
                />
              </div>
              
              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 group-hover:from-black/80 group-hover:via-black/30 transition-all duration-500" />
              
              {/* Glow effect on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
              
              {/* Shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              <div className="relative p-5 h-full flex flex-col justify-end z-10">
                {/* Text */}
                <div>
                  <h4 className="text-2xl md:text-3xl font-black mb-1 text-white drop-shadow-lg">{game.title}</h4>
                  <p className="text-slate-300 text-xs md:text-sm group-hover:text-white transition-colors">{game.desc}</p>
                </div>
              </div>
              
              {/* Play indicator */}
              <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110 border border-white/20">
                <span className="text-white text-sm">▶</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      {history.length > 0 && (
        <section className="animate-in slide-up [animation-delay:400ms]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></div>
            <h3 className="text-xl font-bold">Recent Plays</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {history.slice(0, 8).map((item, idx) => (
              <div 
                key={item.id}
                className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-white/10 transition-all"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  item.result === 'win' ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                }`}>
                  {item.result === 'win' ? '✓' : '✗'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-200 truncate">{item.game.replace('_', ' ')}</div>
                  <div className={`text-lg font-mono font-black ${item.result === 'win' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {item.result === 'win' ? '+' : '-'}${item.amount.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Stats Bar */}
      <div className="flex flex-wrap justify-center gap-6 py-6 animate-in slide-up [animation-delay:500ms]">
        <div className="flex items-center gap-2 text-slate-500">
          <span className="text-pink-400">💰</span>
          <span className="font-mono font-bold text-white">${stats.balance.toLocaleString()}</span>
          <span className="text-xs">balance</span>
        </div>
        <div className="w-px h-6 bg-white/10"></div>
        <div className="flex items-center gap-2 text-slate-500">
          <span className="text-emerald-400">↑</span>
          <span className="font-mono font-bold text-emerald-400">+${stats.totalWon.toLocaleString()}</span>
          <span className="text-xs">won</span>
        </div>
        <div className="w-px h-6 bg-white/10"></div>
        <div className="flex items-center gap-2 text-slate-500">
          <span className="text-rose-400">↓</span>
          <span className="font-mono font-bold text-rose-400">-${stats.totalLost.toLocaleString()}</span>
          <span className="text-xs">lost</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
