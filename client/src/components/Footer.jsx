import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full border-t-[3px] border-[#111111] bg-[#f0eee6] py-6 px-4 text-center select-none">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-[#111111]">
        <div className="flex items-center gap-2">
          <span className="bg-[#f45bd7] text-[#111111] px-2 py-0.5 rounded border border-[#111111] shadow-[1px_1px_0px_#111111] font-black uppercase text-[10px]">
            WORDSHIFT
          </span>
          <span>•</span>
          <span className="text-[#54414e]">Realtime multiplayer</span>
        </div>
        <p className="text-[11px] text-[#87717e]">
          made by pepugamings with ❤️
        </p>
      </div>
    </footer>
  );
}
