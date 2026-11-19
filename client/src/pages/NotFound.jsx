import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center p-4 text-center select-none">
      <div className="bg-[#f45bd7] text-[#111111] px-6 py-2 rounded-2xl border-[4px] border-[#111111] shadow-[6px_6px_0px_#111111] -rotate-3 text-6xl font-black">
        404
      </div>
      <h1 className="text-2xl font-black uppercase text-[#111111] mt-6">Lost in the Dictionary</h1>
      <p className="text-xs font-semibold text-[#54414e] mt-1 max-w-sm">
        The word shift path you took does not lead to any known room or valid dictionary destination.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#a0f973] text-[#072100] font-black text-sm uppercase border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
      >
        <span className="material-symbols-outlined text-[18px]">cottage</span>
        <span>Return to Home</span>
      </Link>
    </div>
  );
}
