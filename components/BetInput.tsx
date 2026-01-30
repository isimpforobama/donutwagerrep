import React, { useState, useEffect, useRef } from 'react';

interface BetInputProps {
  value: number;
  onChange: (value: number) => void;
  maxValue: number;
  disabled?: boolean;
}

type Suffix = 'K' | 'M' | 'B';

const suffixMultipliers: Record<Suffix, number> = {
  'K': 1_000,
  'M': 1_000_000,
  'B': 1_000_000_000,
};

const parseInputToValue = (input: string, currentSuffix: Suffix): number => {
  const cleaned = input.trim().toUpperCase();
  const match = cleaned.match(/^([\d.]+)\s*(K|M|B)?$/);
  if (!match) return 0;
  
  const num = parseFloat(match[1]);
  if (isNaN(num)) return 0;
  
  const suffix = match[2] as Suffix | undefined;
  if (suffix) {
    return Math.floor(num * suffixMultipliers[suffix]);
  }
  return Math.floor(num * suffixMultipliers[currentSuffix]);
};

const formatForDisplay = (value: number, suffix: Suffix): string => {
  const divisor = suffixMultipliers[suffix];
  const result = value / divisor;
  if (result % 1 === 0) return result.toString();
  return result.toFixed(1);
};

const BetInput: React.FC<BetInputProps> = ({ value, onChange, maxValue, disabled = false }) => {
  const [suffix, setSuffix] = useState<Suffix>('K');
  const [inputValue, setInputValue] = useState(() => formatForDisplay(value, 'K'));
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isUserTyping = useRef(false);

  // Only update display when value changes externally (not from user typing)
  useEffect(() => {
    if (!isUserTyping.current) {
      setInputValue(formatForDisplay(value, suffix));
    }
  }, [value, suffix]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isUserTyping.current = true;
    setInputValue(e.target.value);
  };

  const handleBlur = () => {
    isUserTyping.current = false;
    const parsed = parseInputToValue(inputValue, suffix);
    const clamped = Math.min(Math.max(0, parsed), maxValue);
    onChange(clamped);
    setInputValue(formatForDisplay(clamped, suffix));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const handleSuffixChange = (newSuffix: Suffix) => {
    isUserTyping.current = false;
    setSuffix(newSuffix);
    setInputValue(formatForDisplay(value, newSuffix));
    setShowDropdown(false);
  };

  const handleHalf = () => {
    isUserTyping.current = false;
    const newValue = Math.max(1, Math.floor(value / 2));
    onChange(newValue);
    setInputValue(formatForDisplay(newValue, suffix));
  };

  const handleDouble = () => {
    isUserTyping.current = false;
    const newValue = Math.min(maxValue, value * 2);
    onChange(newValue);
    setInputValue(formatForDisplay(newValue, suffix));
  };

  const handleMax = () => {
    isUserTyping.current = false;
    onChange(maxValue);
    setInputValue(formatForDisplay(maxValue, suffix));
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bet Amount</label>
      <div className="relative flex items-center bg-slate-900/80 border border-white/10 rounded-lg">
        {/* Input field */}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1 bg-transparent px-3 py-2 font-mono font-bold text-sm outline-none disabled:opacity-50 min-w-0"
          placeholder="0"
        />

        {/* Suffix dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => !disabled && setShowDropdown(!showDropdown)}
            disabled={disabled}
            className="w-8 h-8 text-xs font-bold text-purple-300 hover:text-purple-200 hover:bg-white/5 rounded transition-colors disabled:opacity-50"
          >
            {suffix}
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-[100] overflow-hidden min-w-[120px]">
              {(['K', 'M', 'B'] as Suffix[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSuffixChange(s)}
                  className={`w-full px-4 py-2 text-xs font-bold text-left hover:bg-slate-700 transition-colors ${
                    suffix === s ? 'text-purple-300 bg-purple-500/20' : 'text-slate-300'
                  }`}
                >
                  {s} ({s === 'K' ? 'Thousand' : s === 'M' ? 'Million' : 'Billion'})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10" />

        {/* Action buttons inside the box */}
        <button
          type="button"
          onClick={handleHalf}
          disabled={disabled}
          className="px-2 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors disabled:opacity-50"
        >
          1/2
        </button>
        <button
          type="button"
          onClick={handleDouble}
          disabled={disabled}
          className="px-2 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors disabled:opacity-50"
        >
          2x
        </button>
        <button
          type="button"
          onClick={handleMax}
          disabled={disabled}
          className="px-2 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors disabled:opacity-50 pr-3"
        >
          Max
        </button>
      </div>
    </div>
  );
};

export default BetInput;
