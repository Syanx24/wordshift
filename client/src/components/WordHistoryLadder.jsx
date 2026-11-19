import React, { useRef, useEffect } from 'react';

export default function WordHistoryLadder({
  wordHistory = [],
  startingWord = '----',
  targetWord = '----',
  currentWord = '----'
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [wordHistory.length]);

  return (
    <div className="w-full bg-white p-4 rounded-2xl border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[#111111] text-base font-bold">alt_route</span>
          <span className="text-xs sm:text-sm font-black uppercase tracking-wide text-[#111111]">
            PATH HISTORY ({wordHistory.length} STEPS)
          </span>
        </div>

      </div>

      {/* Horizontal Transformation Chain */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar select-none"
      >
        {/* Step 0: Starting word */}
        <div className="flex items-center shrink-0">
          <div className="flex flex-col bg-[#eae8e0] px-3 py-2 rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_#111111] items-center">
            <div className="font-black text-sm tracking-widest text-[#111111]">
              {startingWord}
            </div>
            <span className="text-[9px] text-[#54414e] uppercase font-black mt-0.5">
              Start Word
            </span>
          </div>
          <span className="material-symbols-outlined text-[#87717e] mx-1 text-sm font-black">
            arrow_forward
          </span>
        </div>

        {/* Moves in history */}
        {wordHistory.map((step, idx) => {
          const isLatest = idx === wordHistory.length - 1;
          const isTarget = step.word.toUpperCase() === targetWord.toUpperCase();
          const changedIdx = step.changedIndex;

          let cardBg = 'bg-[#f5f4ec]';
          if (isTarget) cardBg = 'bg-[#ffe17b]';
          else if (isLatest) cardBg = 'bg-[#ffd7f0]';

          return (
            <div key={idx} className="flex items-center shrink-0">
              <div className={`flex flex-col ${cardBg} px-3 py-2 rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_#111111] items-center`}>
                <div className="font-black text-sm tracking-widest text-[#111111] flex">
                  {step.word.split('').map((c, i) => (
                    <span
                      key={i}
                      className={i === changedIdx ? 'text-[#ab0e97] underline decoration-2' : ''}
                    >
                      {c}
                    </span>
                  ))}
                </div>
                <span className="text-[9px] uppercase font-black mt-0.5 text-[#54414e]">
                  {isTarget ? 'TARGET 🎯' : (step.playerName || (step.player === 'player1' ? 'P1' : 'P2'))}
                </span>
              </div>
              {idx < wordHistory.length - 1 && (
                <span className="material-symbols-outlined text-[#87717e] mx-1 text-sm font-black">
                  arrow_forward
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
