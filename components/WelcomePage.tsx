import React, { useState, useEffect, useRef } from 'react';
import reviewsData from '../data/reviews.json';

interface WelcomePageProps {
  onEnter: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onEnter }) => {
  const [loaded, setLoaded] = useState(false);
  const [entering, setEntering] = useState(false);
  const [activePlayers, setActivePlayers] = useState(3000);

  // Fluctuate active players count to look realistic
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePlayers(prev => {
        const change = Math.floor(Math.random() * 11) - 5; // Random change between -5 and +5
        const newValue = prev + change;
        // Keep it roughly around 3000 (between 2900 and 3100)
        if (newValue < 2900) return prev + Math.abs(change);
        if (newValue > 3100) return prev - Math.abs(change);
        return newValue;
      });
    }, 4000 + Math.random() * 2000); // Update every 4-6 seconds
    return () => clearInterval(interval);
  }, []);

  // Generate snowflakes with staggered start positions and varied properties
  const snowflakes = useRef(
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: (i * 7) % 100, // spread across width
      startY: -5 - (i * 3) % 30, // stagger start above viewport
      size: 8 + (i % 5) * 3,
      delay: (i * 0.5) % 15, // stagger animation start
      duration: 12 + (i % 6) * 3, // varied fall speeds (12-30s)
      rotationSpeed: 4 + (i % 4) * 2, // rotation duration
      drift: (i % 2 === 0 ? 1 : -1) * (10 + (i % 3) * 5), // horizontal drift direction
    }))
  ).current;

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleEnter = () => {
    setEntering(true);
    setTimeout(onEnter, 800);
  };

  return (
    <div className={`fixed inset-0 z-50 bg-slate-950 overflow-y-auto overflow-x-hidden transition-opacity duration-700 ${entering ? 'opacity-0' : 'opacity-100'}`}>
      {/* Base Grid with white pulse */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] grid-pulse-white pointer-events-none" />

      {/* Live Wins Carousel - Top */}
      <div className="absolute top-4 left-0 right-0 overflow-hidden z-20">
        <div className="flex gap-6 ticker-scroll">
          {[...Array(3)].map((_, setIndex) => (
            <div key={setIndex} className="flex gap-6 shrink-0">
              <WinTicker user="D***r" amount="$2.4M" game="Blackjack" multiplier="2.5x" />
              <WinTicker user="J***n" amount="$8.9M" game="Towers" multiplier="8.2x" />
              <WinTicker user="A***a" amount="$5.2M" game="Plinko" multiplier="12x" />
              <WinTicker user="M***k" amount="$1.1M" game="Mines" multiplier="3.4x" />
              <WinTicker user="S***h" amount="$3.7M" game="Baccarat" multiplier="2x" />
              <WinTicker user="R***o" amount="$6.7M" game="Coin Flip" multiplier="2x" />
              <WinTicker user="K***e" amount="$15M" game="Blackjack" multiplier="21x" />
              <WinTicker user="T***y" amount="$4.2M" game="Towers" multiplier="15x" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full blur-3xl animate-float"
            style={{
              width: `${150 + i * 50}px`,
              height: `${150 + i * 50}px`,
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              background: i % 2 === 0 
                ? 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${8 + i * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Animated Half Rings */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Left Ring */}
        <div
          className="absolute rounded-full"
          style={{
            width: '800px',
            height: '800px',
            left: '-600px',
            top: '50%',
            transform: 'translateY(-50%)',
            border: '2px solid rgba(236,72,153,0.3)',
            boxShadow: '0 0 30px rgba(236,72,153,0.4), inset 0 0 20px rgba(236,72,153,0.2)',
          }}
        />
        {/* Right Ring */}
        <div
          className="absolute rounded-full"
          style={{
            width: '800px',
            height: '800px',
            right: '-600px',
            top: '50%',
            transform: 'translateY(-50%)',
            border: '2px solid rgba(139,92,246,0.3)',
            boxShadow: '0 0 30px rgba(139,92,246,0.4), inset 0 0 20px rgba(139,92,246,0.2)',
          }}
        />
      </div>

      {/* Animated Lines */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="rgba(236,72,153,0.5)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        {[...Array(5)].map((_, i) => (
          <line
            key={i}
            x1="-100%"
            y1={`${20 + i * 15}%`}
            x2="200%"
            y2={`${20 + i * 15}%`}
            stroke="url(#lineGradient)"
            strokeWidth="1"
            className="animate-slide-line"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </svg>

      {/* Particle Effect */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-pink-500/30 rounded-full animate-rise"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: '-10px',
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Snowfall Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="absolute animate-fall"
            style={{
              left: `${flake.x}%`,
              top: `${flake.startY}%`,
              fontSize: `${flake.size}px`,
              color: 'rgba(255, 255, 255, 0.15)',
              animationDelay: `${flake.delay}s`,
              animationDuration: `${flake.duration}s`,
              ['--drift' as string]: `${flake.drift}px`,
            }}
          >
            ✦
          </div>
        ))}
        <style>{`
          @keyframes fall {
            0% {
              transform: translateY(0) translateX(0);
            }
            100% {
              transform: translateY(100vh) translateX(var(--drift));
            }
          }
          .animate-fall {
            animation: fall linear infinite;
          }
        `}</style>
      </div>

      {/* Content Container */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          {/* Logo Section */}
          <div className={`transition-all duration-1000 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Title with breathing animation */}
            <h1 className="text-center mb-4 breathing-text">
            <span 
              className={`block text-5xl md:text-7xl font-black tracking-tight transition-all duration-1000 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{
                fontFamily: "'Playfair Display', serif",
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 80px rgba(255,255,255,0.3)',
              }}
            >
              DONUT
            </span>
            <span 
              className={`block text-5xl md:text-7xl font-black tracking-tight transition-all duration-1000 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{
                fontFamily: "'Playfair Display', serif",
                background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 50%, #db2777 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 80px rgba(236,72,153,0.5)',
              }}
            >
              WAGER
            </span>
          </h1>

          {/* Tagline */}
          <p className={`text-center text-slate-400 text-lg md:text-xl font-light tracking-widest uppercase mb-2 transition-all duration-1000 delay-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            99% of Gamblers Quit Before Their Big Win
          </p>
          <p className={`text-center text-slate-400 text-sm md:text-base font-light tracking-widest uppercase mb-12 transition-all duration-1000 delay-600 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            (BUT NOT YOU)
          </p>
        </div>

        {/* Stats Row */}
        <div className={`flex flex-wrap justify-center gap-8 md:gap-16 mb-12 transition-all duration-1000 delay-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <StatItem value="$2.6T" label="Total Paid Out" />
          <AnimatedCounter value={activePlayers} label="Active Players" />
          <StatItem value="99.9%" label="Uptime" />
        </div>

        {/* CTA Button */}
        <div className={`transition-all duration-1000 delay-900 ${loaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'}`}>
          <button
            onClick={handleEnter}
            className="group relative px-12 py-5 rounded-2xl font-black text-xl tracking-wider uppercase overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
          >
            {/* Button Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 bg-[length:200%_100%] animate-gradient-x" />
            
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            
            {/* Glow */}
            <div className="absolute inset-0 rounded-2xl shadow-[0_0_40px_rgba(236,72,153,0.5)] group-hover:shadow-[0_0_60px_rgba(236,72,153,0.7)] transition-shadow duration-300" />
            
            {/* Text */}
            <span className="relative z-10 flex items-center gap-3">
              Enter Lounge
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>

          {/* Are We Legit Text with Arrow */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={() => document.getElementById('legit-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:scale-105 transition-transform duration-300"
            >
              <span 
                className="text-2xl md:text-3xl font-black tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 50%, #db2777 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Are We Legit?
              </span>
            </button>
            <button
              onClick={() => document.getElementById('legit-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-pink-500 animate-bounce hover:scale-110 transition-transform duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Are We Legit Reasons Section */}
      <div id="legit-section" className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <ReasonCard 
              id="card-reviews"
              title="Is it fair?"
              description="We use a cryptographic system that allows you to independently verify each result. Before a round starts, a secure server seed is generated and locked in. After the round ends, the seed is revealed so you can confirm the outcome wasn't changed or manipulated in any way. Each result is determined by a combination of: A server seed (generated by us), A client seed (generated by you or your device), A nonce (round number). These values are processed using secure hashing algorithms to produce a completely random and verifiable result. Because the outcome is mathematically predetermined and verifiable, neither players nor the platform can alter it after the round begins."
            />
            <ReasonCard 
              id="card-deposits"
              title="Instant deposits and withdrawals"
              description="Depositing your money is now super easy with our automated deposit framework. Withdrawals are a bit different in their respective framework so although they are not as quick as deposits they still happen in under 3 minutes"
            />
            <ReasonCard 
              id="card-online"
              title="Online 23/7"
              description="We prioritize that your money is tracked and safe thats why everyday for 1 hour we take extra precations to ensure the database is synced and you have no issues"
            />
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div id="reviews-section" className="relative z-10 py-20 px-4 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-center text-3xl md:text-4xl font-black mb-16 text-white">What Players Say</h3>
          <ReviewCarousel />
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-20 py-6">
        <div className="flex items-center justify-center gap-8">
          {/* Discord */}
          <a 
            href="https://discord.gg/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 group"
          >
            <svg className="w-5 h-5 text-[#5865F2] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span className="text-slate-300 text-sm font-medium group-hover:text-white transition-colors">Discord</span>
          </a>

          {/* Support Email */}
          <a 
            href="mailto:" 
            className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-pink-500/30 transition-all duration-300 group"
          >
            <img 
              src="/images/logoimage.png" 
              alt="Support" 
              className="w-5 h-5 object-contain group-hover:scale-110 transition-transform"
            />
            <span className="text-slate-300 text-sm font-medium group-hover:text-white transition-colors">Support</span>
          </a>
        </div>
      </div>
      </div>

      {/* Floating Support Button */}
      <a 
        href="mailto:" 
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full flex items-center justify-center hover:scale-110 transition-transform z-50"
      >
        <img 
          src="/images/logoimage.png" 
          alt="Support" 
          className="w-full h-full object-contain"
        />
      </a>
    </div>
  );
};

const WinTicker: React.FC<{ user: string; amount: string; game: string; multiplier: string }> = ({ user, amount, game, multiplier }) => (
  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
    <span className="text-slate-400 text-sm">{user}</span>
    <span className="text-green-400 font-bold text-sm">{amount}</span>
    <span className="text-slate-500 text-xs">on</span>
    <span className="text-white text-sm font-medium">{game}</span>
    <span className="text-yellow-400 text-xs font-semibold">{multiplier}</span>
  </div>
);

const StatItem: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="text-center">
    <div className="text-3xl md:text-4xl font-black text-white mb-1">{value}</div>
    <div className="text-xs text-slate-500 uppercase tracking-widest">{label}</div>
  </div>
);

// Single digit with slide animation
const AnimatedDigit: React.FC<{ digit: string }> = ({ digit }) => {
  const [displayedDigit, setDisplayedDigit] = useState(digit);
  const [outgoingDigit, setOutgoingDigit] = useState<string | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (digit !== displayedDigit) {
      setOutgoingDigit(displayedDigit);
      setDisplayedDigit(digit);
      setAnimationKey(prev => prev + 1);
      
      const timer = setTimeout(() => {
        setOutgoingDigit(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [digit, displayedDigit]);

  // Non-numeric characters (like commas) don't animate
  if (isNaN(Number(digit))) {
    return <span>{digit}</span>;
  }

  return (
    <span className="inline-block h-[1.2em] overflow-hidden relative" style={{ width: '0.6em' }}>
      {/* Outgoing digit - slides up and out with blur */}
      {outgoingDigit !== null && (
        <span 
          key={`out-${animationKey}`}
          className="absolute inset-0 block animate-slideOut"
        >
          {outgoingDigit}
        </span>
      )}
      {/* Incoming digit - slides up into view with blur */}
      <span 
        key={`in-${animationKey}`}
        className={outgoingDigit !== null ? "block animate-slideIn" : "block"}
      >
        {displayedDigit}
      </span>
      <style>{`
        @keyframes slideOut {
          from {
            transform: translateY(0);
            opacity: 1;
            filter: blur(0);
          }
          to {
            transform: translateY(-100%);
            opacity: 0;
            filter: blur(4px);
          }
        }
        @keyframes slideIn {
          from {
            transform: translateY(100%);
            opacity: 0;
            filter: blur(4px);
          }
          to {
            transform: translateY(0);
            opacity: 1;
            filter: blur(0);
          }
        }
        @keyframes ringBreathing {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.25) rotate(180deg);
            opacity: 0.8;
          }
        }
        @keyframes ringFloat {
          0%, 100% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(30px, -20px);
          }
          50% {
            transform: translate(-20px, 30px);
          }
          75% {
            transform: translate(40px, 10px);
          }
        }
        .animate-slideOut {
          animation: slideOut 500ms ease-out forwards;
        }
        .animate-slideIn {
          animation: slideIn 500ms ease-out forwards;
        }
      `}</style>
    </span>
  );
};

// Animated counter with per-digit slide-up blur effect
const AnimatedCounter: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  const formattedValue = value.toLocaleString();

  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-black text-white mb-1 flex justify-center">
        {formattedValue.split('').map((char, index) => (
          <AnimatedDigit 
            key={index} 
            digit={char}
          />
        ))}
      </div>
      <div className="text-xs text-slate-500 uppercase tracking-widest">{label}</div>
    </div>
  );
};

const ReasonCard: React.FC<{ id: string; title: string; description: string; onClick?: () => void }> = ({ id, title, description, onClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnimating(true);
    setIsOpen(!isOpen);
    if (!isOpen && onClick) {
      onClick();
    }
    // Remove animating state after animation completes (1.5 seconds)
    setTimeout(() => setIsAnimating(false), 1500);
  };

  return (
    <div
      key={id}
      className="bg-gradient-to-br from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 border border-white/20 rounded-2xl p-8 flex flex-col"
      style={{
        filter: isAnimating ? 'blur(1px)' : 'blur(0px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1), filter 1.5s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isAnimating ? '0 0 30px rgba(236,72,153,0.3)' : '0 0 0 rgba(236,72,153,0)'
      }}
      onMouseEnter={(e) => {
        if (!isAnimating) {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 0 30px rgba(236,72,153,0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isAnimating) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 0 0 rgba(236,72,153,0)';
        }
      }}
    >
      <h4 className="text-xl font-black text-white mb-4">{title}</h4>
      
      {/* Description Dropdown with Motion Blur */}
      <div 
        className="overflow-hidden"
        style={{ 
          maxHeight: isOpen ? '500px' : '0px',
          opacity: isOpen ? 1 : 0,
          filter: isOpen ? 'blur(0px)' : 'blur(2px)',
          transform: isOpen ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'max-height 1.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1), filter 1.5s cubic-bezier(0.4, 0, 0.2, 1), transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <p className="text-slate-400 leading-relaxed mb-4">{description}</p>
      </div>

      {/* Learn More Button */}
      <button
        onClick={handleToggle}
        className="mt-auto flex items-center gap-2 text-pink-500 font-semibold text-sm hover:text-pink-400 transition-colors cursor-pointer"
      >
        <span>Learn more</span>
        <svg 
          className="w-4 h-4"
          style={{
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
    </div>
  );
};

const ReviewCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const reviews = reviewsData;

  const handlePrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(currentIndex === 0 ? reviews.length - 1 : currentIndex - 1);
    setTimeout(() => setIsTransitioning(false), 2000);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(currentIndex === reviews.length - 1 ? 0 : currentIndex + 1);
    setTimeout(() => setIsTransitioning(false), 2000);
  };

  const getCardPosition = (index: number) => {
    const diff = index - currentIndex;
    if (diff === 0) return 'center';
    if (diff === 1 || diff === -(reviews.length - 1)) return 'right';
    if (diff === -1 || diff === reviews.length - 1) return 'left';
    return 'hidden';
  };

  return (
    <div className="relative">
      {/* Carousel Container */}
      <div className="relative h-[400px] flex items-center justify-center">
        {/* Navigation Buttons */}
        <button
          onClick={handlePrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={handleNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Review Cards */}
        {reviews.map((review, index) => {
          const position = getCardPosition(index);
          const isCenter = position === 'center';
          const isVisible = position !== 'hidden';
          
          return (
            <div
              key={index}
              className="absolute"
              style={{
                transform: position === 'center' 
                  ? 'translateX(0) scale(1.2)' 
                  : position === 'left'
                  ? 'translateX(-450px) scale(0.85)'
                  : position === 'right'
                  ? 'translateX(450px) scale(0.85)'
                  : 'translateX(0) scale(0.5)',
                opacity: isVisible ? (isCenter ? 1 : 0.5) : 0,
                filter: isCenter ? 'blur(0px)' : 'blur(3px)',
                pointerEvents: isVisible ? 'auto' : 'none',
                width: '400px',
                transition: 'all 2s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: isCenter ? 10 : 1,
              }}
            >
              <div
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-8"
                style={{
                  boxShadow: isCenter
                    ? '0 0 60px rgba(255, 255, 255, 0.15), 0 0 100px rgba(255, 255, 255, 0.1), inset 0 0 60px rgba(255, 255, 255, 0.05)'
                    : '0 0 20px rgba(255, 255, 255, 0.05)',
                  transition: 'box-shadow 2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }, (_, j) => {
                    const starValue = j + 1;
                    const isFull = starValue <= review.rating;
                    const isHalf = starValue - 0.5 === review.rating;
                    
                    return (
                      <span 
                        key={j} 
                        className="text-yellow-400 text-2xl inline-block relative"
                        style={{
                          animation: isCenter 
                            ? `starFadeIn 0.4s ease-out ${j * 0.15}s both` 
                            : `starFadeOut 0.3s ease-in ${j * 0.05}s both`,
                        }}
                      >
                        {isFull ? '★' : isHalf ? (
                          <>
                            <span className="absolute inset-0" style={{ clipPath: 'inset(0 50% 0 0)' }}>★</span>
                            <span className="text-slate-600">★</span>
                          </>
                        ) : (
                          <span className="text-slate-600">★</span>
                        )}
                      </span>
                    );
                  })}
                </div>
                <style>{`
                  @keyframes starFadeIn {
                    0% {
                      opacity: 0;
                      transform: scale(0.3) rotateZ(-20deg);
                    }
                    50% {
                      transform: scale(1.2) rotateZ(5deg);
                    }
                    100% {
                      opacity: 1;
                      transform: scale(1) rotateZ(0deg);
                    }
                  }
                  @keyframes starFadeOut {
                    0% {
                      opacity: 1;
                      transform: scale(1) rotateZ(0deg);
                    }
                    100% {
                      opacity: 0;
                      transform: scale(0.3) rotateZ(20deg);
                    }
                  }
                `}</style>
                <p className="text-slate-200 text-base mb-6 leading-relaxed min-h-[80px]">{review.text}</p>
                <p className="text-slate-400 font-bold text-sm">— {review.name}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Indicator Dots */}
      <div className="flex items-center justify-center gap-2 mt-8">
        {reviews.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (!isTransitioning) {
                setIsTransitioning(true);
                setCurrentIndex(index);
                setTimeout(() => setIsTransitioning(false), 2000);
              }
            }}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex
                ? 'w-8 h-2 bg-white'
                : 'w-2 h-2 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Leave a Review Button */}
      <div className="flex justify-center mt-12">
        <button className="px-8 py-4 rounded-2xl font-bold text-lg text-white border-2 border-white/30 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:scale-105 breathing-glow">
          Leave a Review
        </button>
      </div>

      <style>{`
        @keyframes breathingGlow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.1);
          }
          50% {
            box-shadow: 0 0 40px rgba(255, 255, 255, 0.5), 0 0 80px rgba(255, 255, 255, 0.3), inset 0 0 30px rgba(255, 255, 255, 0.15);
          }
        }
        .breathing-glow {
          animation: breathingGlow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default WelcomePage;
