import React, { useState, useEffect } from 'react';

export default function CountdownOverlay({ count = 3, onFinished, onFinish }) {
  const [secondsLeft, setSecondsLeft] = useState(count);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onFinished) onFinished();
      else if (onFinish) onFinish();
      return;
    }

    const timer = setTimeout(() => {
      setSecondsLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondsLeft, onFinished, onFinish]);

  return (
    <div className="fixed inset-0 z-50 bg-[#111111]/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 select-none">
      <div className="text-center flex flex-col items-center">
        {secondsLeft > 0 ? (
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#ffe17b] bg-[#111111] px-4 py-1.5 rounded-full border-2 border-[#ffe17b] shadow-[2px_2px_0px_#ffe17b]">
              ⚡ BOTH WORDS LOCKED • MATCH STARTING IN
            </span>
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-[#f45bd7] text-[#111111] border-[4px] border-[#111111] shadow-[8px_8px_0px_#111111] flex items-center justify-center font-black text-7xl sm:text-8xl mt-3 animate-bounce">
              {secondsLeft}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="px-8 py-4 rounded-3xl bg-[#a0f973] text-[#072100] border-[4px] border-[#111111] shadow-[8px_8px_0px_#111111] font-black text-6xl sm:text-7xl -rotate-2">
              SHIFT! ⚡
            </div>
            <span className="text-sm font-bold text-white mt-3 uppercase tracking-wider">
              Player 1 makes the first move!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
