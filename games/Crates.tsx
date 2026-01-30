import React, { useState, useEffect, useRef, useCallback } from 'react';

interface CratesProps {
  balance: number;
  onComplete: (win: boolean, amount: number) => void;
}

interface CrateItem {
  id: number;
  name: string;
  value: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  color: string;
  icon: string;
}

interface CrateType {
  id: string;
  name: string;
  cost: number;
  items: CrateItem[];
  rarityWeights: Record<string, number>;
  rtp: number;
}

// 2M Crate Items (40% RTP = 800k expected value)
const CRATE_2M_ITEMS: CrateItem[] = [
  { id: 1, name: 'Dirt Block', value: 50000, rarity: 'common', color: '#94a3b8', icon: '🟫' },
  { id: 2, name: 'Cobblestone', value: 100000, rarity: 'common', color: '#94a3b8', icon: '⬜' },
  { id: 3, name: 'Iron Ingot', value: 200000, rarity: 'common', color: '#94a3b8', icon: '🪨' },
  { id: 4, name: 'Gold Ingot', value: 400000, rarity: 'uncommon', color: '#22c55e', icon: '🥇' },
  { id: 5, name: 'Diamond', value: 600000, rarity: 'uncommon', color: '#22c55e', icon: '💎' },
  { id: 6, name: 'Enchanted Book', value: 800000, rarity: 'uncommon', color: '#22c55e', icon: '📖' },
  { id: 7, name: 'Netherite Ingot', value: 1500000, rarity: 'rare', color: '#3b82f6', icon: '⬛' },
  { id: 8, name: 'Beacon', value: 2000000, rarity: 'rare', color: '#3b82f6', icon: '🔦' },
  { id: 9, name: 'Totem of Undying', value: 3000000, rarity: 'epic', color: '#a855f7', icon: '🗿' },
  { id: 10, name: 'Netherite Block', value: 4000000, rarity: 'epic', color: '#a855f7', icon: '🖤' },
  { id: 11, name: 'Dragon Egg', value: 8000000, rarity: 'legendary', color: '#f59e0b', icon: '🥚' },
  { id: 12, name: 'Dragon Head', value: 15000000, rarity: 'legendary', color: '#f59e0b', icon: '🐲' },
  { id: 13, name: 'Elytra', value: 30000000, rarity: 'legendary', color: '#f59e0b', icon: '🪽' },
];

// 10M Crate Items (50% RTP = 5M expected value)
const CRATE_10M_ITEMS: CrateItem[] = [
  { id: 1, name: 'Gold Block', value: 500000, rarity: 'common', color: '#94a3b8', icon: '🟨' },
  { id: 2, name: 'Diamond Block', value: 1000000, rarity: 'common', color: '#94a3b8', icon: '💠' },
  { id: 3, name: 'Emerald Block', value: 2000000, rarity: 'common', color: '#94a3b8', icon: '💚' },
  { id: 4, name: 'Netherite Ingot', value: 3000000, rarity: 'uncommon', color: '#22c55e', icon: '⬛' },
  { id: 5, name: 'Enchanted Golden Apple', value: 4000000, rarity: 'uncommon', color: '#22c55e', icon: '🍎' },
  { id: 6, name: 'Beacon', value: 5000000, rarity: 'uncommon', color: '#22c55e', icon: '🔦' },
  { id: 7, name: 'Netherite Block', value: 8000000, rarity: 'rare', color: '#3b82f6', icon: '🖤' },
  { id: 8, name: 'Totem of Undying', value: 10000000, rarity: 'rare', color: '#3b82f6', icon: '🗿' },
  { id: 9, name: 'Wither Skull', value: 15000000, rarity: 'epic', color: '#a855f7', icon: '💀' },
  { id: 10, name: 'Dragon Egg', value: 20000000, rarity: 'epic', color: '#a855f7', icon: '🥚' },
  { id: 11, name: 'Dragon Head', value: 50000000, rarity: 'legendary', color: '#f59e0b', icon: '🐲' },
  { id: 12, name: 'Full Netherite Set', value: 75000000, rarity: 'legendary', color: '#f59e0b', icon: '⚔️' },
  { id: 13, name: 'Elytra', value: 100000000, rarity: 'legendary', color: '#f59e0b', icon: '🪽' },
];

// Weighted probabilities for 2M crate (~40% RTP)
const RARITY_WEIGHTS_2M = {
  common: 60,      // 60% chance
  uncommon: 25,    // 25% chance
  rare: 10,        // 10% chance
  epic: 4,         // 4% chance
  legendary: 1,    // 1% chance
};

// Weighted probabilities for 10M crate (~50% RTP)
const RARITY_WEIGHTS_10M = {
  common: 55,      // 55% chance
  uncommon: 27,    // 27% chance
  rare: 12,        // 12% chance
  epic: 5,         // 5% chance
  legendary: 1,    // 1% chance
};

const CRATES: CrateType[] = [
  {
    id: '2m',
    name: 'Overworld Crate',
    cost: 2000000,
    items: CRATE_2M_ITEMS,
    rarityWeights: RARITY_WEIGHTS_2M,
    rtp: 40,
  },
  {
    id: '10m',
    name: 'End Crate',
    cost: 10000000,
    items: CRATE_10M_ITEMS,
    rarityWeights: RARITY_WEIGHTS_10M,
    rtp: 50,
  },
];

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
};

const Crates: React.FC<CratesProps> = ({ balance, onComplete }) => {
  const [selectedCrate, setSelectedCrate] = useState<CrateType>(CRATES[0]);
  const [spinning, setSpinning] = useState(false);
  const [wonItem, setWonItem] = useState<CrateItem | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [spinItems, setSpinItems] = useState<CrateItem[]>([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [manualItem, setManualItem] = useState<CrateItem | null>(null);
  const [showItemSelector, setShowItemSelector] = useState(false);
  
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const targetPositionRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const getRandomItem = (crate: CrateType): CrateItem => {
    const roll = Math.random() * 100;
    let cumulative = 0;
    let selectedRarity: keyof typeof RARITY_WEIGHTS_2M = 'common';
    
    for (const [rarity, weight] of Object.entries(crate.rarityWeights)) {
      cumulative += weight;
      if (roll <= cumulative) {
        selectedRarity = rarity as keyof typeof RARITY_WEIGHTS_2M;
        break;
      }
    }
    
    const itemsOfRarity = crate.items.filter(item => item.rarity === selectedRarity);
    return itemsOfRarity[Math.floor(Math.random() * itemsOfRarity.length)];
  };

  const generateSpinItems = (winningItem: CrateItem, crate: CrateType): CrateItem[] => {
    const items: CrateItem[] = [];
    const winPosition = 52 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < 60; i++) {
      if (i === winPosition) {
        items.push({ ...winningItem, id: winningItem.id + 1000 }); // Mark winning item
      } else {
        items.push(getRandomItem(crate));
      }
    }
    return items;
  };

  // Easing function for smooth deceleration
  const easeOutQuint = (t: number): number => {
    return 1 - Math.pow(1 - t, 5);
  };

  // Animation loop using requestAnimationFrame
  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }
    
    const elapsed = timestamp - startTimeRef.current;
    const duration = 5000; // 5 seconds
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutQuint(progress);
    
    const currentPosition = easedProgress * targetPositionRef.current;
    setScrollPosition(currentPosition);
    
    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, []);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const openCrate = () => {
    if (balance < selectedCrate.cost || spinning) return;
    
    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Use manual item if selected, otherwise random
    const winningItem = manualItem !== null 
      ? manualItem 
      : getRandomItem(selectedCrate);
    const items = generateSpinItems(winningItem, selectedCrate);
    
    // Find winning item position (the one with id + 1000)
    const winIndex = items.findIndex(item => item.id >= 1000);
    const itemWidth = 120; // w-28 (112px) + gap-2 (8px)
    const containerWidth = containerRef.current?.clientWidth || 800;
    const centerOffset = containerWidth / 2 - itemWidth / 2;
    // Remove randomness to ensure we land exactly on the winning item
    const targetOffset = (winIndex * itemWidth) - centerOffset;
    
    // Reset state
    setShowResult(false);
    setWonItem(null);
    setSpinItems(items);
    setScrollPosition(0);
    setSpinning(true);
    
    // Set up animation
    startTimeRef.current = 0;
    targetPositionRef.current = targetOffset;
    
    // Start animation on next frame
    requestAnimationFrame(() => {
      animationRef.current = requestAnimationFrame(animate);
    });

    // Reveal result after animation
    setTimeout(() => {
      setSpinning(false);
      setWonItem(winningItem);
      setShowResult(true);
      
      const profit = winningItem.value - selectedCrate.cost;
      onComplete(profit > 0, profit > 0 ? profit : selectedCrate.cost);
    }, 5200);
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'shadow-slate-500/30';
      case 'uncommon': return 'shadow-green-500/50';
      case 'rare': return 'shadow-blue-500/50';
      case 'epic': return 'shadow-purple-500/50';
      case 'legendary': return 'shadow-amber-500/70';
      default: return '';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-slate-500/50';
      case 'uncommon': return 'border-green-500/50';
      case 'rare': return 'border-blue-500/50';
      case 'epic': return 'border-purple-500/50';
      case 'legendary': return 'border-amber-500/70';
      default: return '';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-slate-900/80';
      case 'uncommon': return 'bg-green-950/80';
      case 'rare': return 'bg-blue-950/80';
      case 'epic': return 'bg-purple-950/80';
      case 'legendary': return 'bg-gradient-to-br from-amber-950/90 to-orange-950/90';
      default: return '';
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-white mb-2">
          Crates
        </h1>
        <p className="text-slate-400">Open crates for rare loot!</p>
      </div>

      {/* Crate Selection */}
      <div className="flex justify-center gap-4 mb-8">
        {CRATES.map((crate) => (
          <button
            key={crate.id}
            onClick={() => {
              if (!spinning) {
                setSelectedCrate(crate);
                setManualItem(null); // Reset manual item when switching crates
              }
            }}
            disabled={spinning}
            className={`px-6 py-4 rounded-2xl border-2 transition-all duration-300 ${
              selectedCrate.id === crate.id
                ? crate.id === '2m' 
                  ? 'border-green-500 bg-green-950/50 shadow-lg shadow-green-500/20'
                  : 'border-purple-500 bg-purple-950/50 shadow-lg shadow-purple-500/20'
                : 'border-white/10 bg-slate-900/50 hover:border-white/30'
            } ${spinning ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="text-3xl mb-2">{crate.id === '2m' ? '🌍' : '🌌'}</div>
            <div className="font-black text-white">{crate.name}</div>
            <div className={`text-lg font-bold ${crate.id === '2m' ? 'text-green-400' : 'text-purple-400'}`}>
              ${formatNumber(crate.cost)}
            </div>
            <div className="text-xs text-slate-500 mt-1">{crate.rtp}% RTP</div>
          </button>
        ))}
      </div>

      {/* Manual Item Selector */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setShowItemSelector(!showItemSelector)}
          disabled={spinning}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            spinning ? 'opacity-50 cursor-not-allowed' : ''
          } ${
            manualItem !== null 
              ? 'bg-pink-600 text-white' 
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          🎯 {manualItem !== null ? `Rigged: ${manualItem.icon} ${manualItem.name}` : 'Select Outcome (Dev)'}
        </button>
        {manualItem !== null && (
          <button
            onClick={() => setManualItem(null)}
            disabled={spinning}
            className="ml-2 px-3 py-2 rounded-xl bg-red-600/20 text-red-400 text-sm font-bold hover:bg-red-600/30 transition-all"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {showItemSelector && (
        <div className="mb-6 p-4 glass rounded-2xl border border-pink-500/30">
          <h4 className="text-sm font-bold text-pink-400 mb-3 text-center">🎯 Select Guaranteed Outcome</h4>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2">
            {selectedCrate.items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setManualItem(item);
                  setShowItemSelector(false);
                }}
                className={`p-2 rounded-lg border transition-all hover:scale-105 ${
                  manualItem?.id === item.id 
                    ? 'border-pink-500 bg-pink-500/20' 
                    : `${getRarityBorder(item.rarity)} ${getRarityBg(item.rarity)}`
                }`}
              >
                <div className="text-2xl">{item.icon}</div>
                <div className="text-[8px] text-white truncate">{item.name}</div>
                <div className="text-[9px] font-bold" style={{ color: item.color }}>${formatNumber(item.value)}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Spinner Container */}
      <div className="relative mb-8">
        <div className={`absolute inset-0 rounded-2xl blur-xl transition-all duration-500 ${
          spinning ? 'bg-pink-500/20' : 
          showResult && wonItem ? `bg-${wonItem.rarity === 'legendary' ? 'amber' : wonItem.rarity === 'epic' ? 'purple' : wonItem.rarity === 'rare' ? 'blue' : 'slate'}-500/30` : 
          'bg-slate-800/30'
        }`} />
        
        <div ref={containerRef} className="relative glass rounded-2xl border border-white/10 overflow-hidden">
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-pink-500 z-20 transform -translate-x-1/2">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-pink-500" />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-pink-500" />
          </div>
          
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />
          
          <div className="py-6 overflow-hidden">
            <div 
              className="flex gap-2"
              style={{ 
                width: 'max-content',
                transform: `translateX(-${scrollPosition}px)`,
              }}
            >
              {spinItems.length > 0 ? spinItems.map((item, index) => (
                <div
                  key={index}
                  className={`flex-shrink-0 w-28 h-32 rounded-xl border-2 ${getRarityBorder(item.rarity)} ${getRarityBg(item.rarity)} flex flex-col items-center justify-center ${
                    !spinning && showResult && wonItem && item.id >= 1000 ? `shadow-2xl ${getRarityGlow(item.rarity)} scale-105` : ''
                  }`}
                >
                  <span className="text-4xl mb-1">{item.icon}</span>
                  <span className="text-xs font-bold text-white text-center px-1 truncate w-full">{item.name}</span>
                  <span className="text-xs font-bold" style={{ color: item.color }}>${formatNumber(item.value)}</span>
                </div>
              )) : (
                [...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-28 h-32 rounded-xl border-2 border-white/10 bg-slate-900/50 flex flex-col items-center justify-center"
                  >
                    <span className="text-4xl mb-1 opacity-30">❓</span>
                    <span className="text-xs text-slate-500">???</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Result Display */}
      {showResult && wonItem && (
        <div className={`text-center mb-8 p-6 rounded-2xl border ${getRarityBorder(wonItem.rarity)} ${getRarityBg(wonItem.rarity)} animate-pulse-once`}>
          <div className="text-6xl mb-4">{wonItem.icon}</div>
          <h2 className="text-2xl font-black text-white mb-2">{wonItem.name}</h2>
          <p className="text-lg font-bold capitalize mb-2" style={{ color: wonItem.color }}>
            {wonItem.rarity}
          </p>
          <p className={`text-3xl font-black ${wonItem.value >= selectedCrate.cost ? 'text-green-400' : 'text-red-400'}`}>
            {wonItem.value >= selectedCrate.cost ? '+' : ''}{formatNumber(wonItem.value - selectedCrate.cost)} chips
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Won ${formatNumber(wonItem.value)} from ${formatNumber(selectedCrate.cost)} crate
          </p>
        </div>
      )}

      {/* Open Button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={openCrate}
          disabled={balance < selectedCrate.cost || spinning}
          className={`px-12 py-5 rounded-2xl font-black text-xl uppercase tracking-wider transition-all duration-300 ${
            balance < selectedCrate.cost || spinning
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : selectedCrate.id === '2m'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105 active:scale-95'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 active:scale-95'
          }`}
        >
          {spinning ? (
            <span className="flex items-center gap-3">
              <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Opening...
            </span>
          ) : (
            <span className="flex items-center gap-3">
              {selectedCrate.id === '2m' ? '🌍' : '🌌'} Open {selectedCrate.name}
              <span className={selectedCrate.id === '2m' ? 'text-green-200' : 'text-purple-200'}>${formatNumber(selectedCrate.cost)}</span>
            </span>
          )}
        </button>
      </div>

      {/* Possible Rewards Grid */}
      <div className="glass rounded-2xl border border-white/10 p-6">
        <h3 className="text-xl font-black text-white mb-4 text-center">
          {selectedCrate.name} Rewards
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {selectedCrate.items.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border ${getRarityBorder(item.rarity)} ${getRarityBg(item.rarity)} flex flex-col items-center hover:scale-105 transition-transform cursor-default`}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-[10px] font-bold text-white text-center truncate w-full">{item.name}</span>
              <span className="text-xs font-bold" style={{ color: item.color }}>${formatNumber(item.value)}</span>
            </div>
          ))}
        </div>
        
        {/* Rarity Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-6 pt-4 border-t border-white/10">
          {Object.entries(selectedCrate.rarityWeights).map(([rarity, weight]) => (
            <div key={rarity} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                rarity === 'common' ? 'bg-slate-400' :
                rarity === 'uncommon' ? 'bg-green-500' :
                rarity === 'rare' ? 'bg-blue-500' :
                rarity === 'epic' ? 'bg-purple-500' :
                'bg-amber-500'
              }`} />
              <span className="text-xs text-slate-400 capitalize">{rarity}</span>
              <span className="text-xs text-slate-500">({weight}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Crates;
