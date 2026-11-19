import React from 'react';

/**
 * Renders a word in distinct individual neo-brutalist letter tiles
 */
export default function WordTiles({ 
  word = '----', 
  label, 
  variant = 'neutral', 
  size = 'md',
  highlightIndex = -1,
  subtitle
}) {
  const letters = (word || '----').padEnd(4, ' ').slice(0, 4).split('');

  const sizeClasses = {
    sm: 'w-7 h-8 text-xs rounded-lg border-2',
    md: 'w-9 h-11 sm:w-10 sm:h-12 text-base sm:text-lg rounded-xl border-[3px]',
    lg: 'w-12 h-14 sm:w-14 sm:h-16 text-xl sm:text-2xl rounded-xl border-[3px]',
    xl: 'w-14 h-16 sm:w-16 sm:h-20 text-2xl sm:text-3xl rounded-2xl border-[4px] shadow-[4px_4px_0px_#111111]',
  }[size] || 'w-9 h-11 sm:w-10 sm:h-12 text-base sm:text-lg rounded-xl border-[3px]';

  const getVariantClasses = (index) => {
    const isHighlighted = highlightIndex === index;

    if (isHighlighted) {
      return 'bg-[#f45bd7] text-[#3a0032] border-[#111111] shadow-[3px_3px_0px_#111111] -translate-y-1';
    }

    switch (variant) {
      case 'start':
        return 'bg-[#ffe17b] text-[#231b00] border-[#111111] shadow-[2px_2px_0px_#111111]';
      case 'target':
        return 'bg-[#a0f973] text-[#072100] border-[#111111] shadow-[2px_2px_0px_#111111]';
      case 'current':
        return 'bg-white text-[#111111] border-[#111111] shadow-[3px_3px_0px_#111111]';
      case 'accent':
        return 'bg-[#ffd7f0] text-[#3a0032] border-[#111111] shadow-[2px_2px_0px_#111111]';
      default:
        return 'bg-[#f5f4ec] text-[#111111] border-[#111111] shadow-[2px_2px_0px_#111111]';
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className="text-[10px] font-black uppercase tracking-wider text-[#54414e]">
          {label}
        </span>
      )}
      <div className="flex items-center gap-1 sm:gap-1.5 select-none">
        {letters.map((char, index) => {
          return (
            <div
              key={`${index}-${char}`}
              className={`flex items-center justify-center font-black uppercase transition-all ${sizeClasses} ${getVariantClasses(index)}`}
            >
              {char.trim() || '·'}
            </div>
          );
        })}
      </div>
      {subtitle && (
        <span className="text-[10px] text-[#87717e] font-semibold">
          {subtitle}
        </span>
      )}
    </div>
  );
}
