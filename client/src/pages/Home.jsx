import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HowToPlayModal from '../components/HowToPlayModal';

export default function Home() {
  const navigate = useNavigate();
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [quickPin, setQuickPin] = useState('');
  
  // Interactive Sandbox State (Test Drive)
  const [practiceWord, setPracticeWord] = useState(['C', 'A', 'R', 'T']);
  const [practiceStatus, setPracticeStatus] = useState('Tap any pill button below to execute a valid single-letter move!');
  const [practiceChangedIdx, setPracticeChangedIdx] = useState(-1);
  const [demoReaction, setDemoReaction] = useState(null);

  const practiceChips = [
    { label: 'Shift C ➔ D (DART) 🎯', word: ['D', 'A', 'R', 'T'], bg: 'bg-[#ffd7f0]', text: 'text-[#3a0032]', note: 'DART: Bullseye! Valid dictionary word.' },
    { label: 'Shift C ➔ P (PART) 🧩', word: ['P', 'A', 'R', 'T'], bg: 'bg-[#a0f973]', text: 'text-[#072100]', note: 'PART: Perfect move! Only index 0 changed.' },
    { label: 'Shift T ➔ S (CARS) 🚗', word: ['C', 'A', 'R', 'S'], bg: 'bg-[#ffe17b]', text: 'text-[#231b00]', note: 'CARS: Clean shift! Only index 3 changed.' },
    { label: 'Shift T ➔ E (CARE) ✨', word: ['C', 'A', 'R', 'E'], bg: 'bg-[#eae8e0]', text: 'text-[#1b1c17]', note: 'CARE: Legitimate shift to another dictionary word.' },
  ];

  const handlePracticeShift = (targetArray, note) => {
    let diff = -1;
    for (let i = 0; i < 4; i++) {
      if (practiceWord[i] !== targetArray[i]) {
        diff = i;
      }
    }
    setPracticeChangedIdx(diff);
    setPracticeWord(targetArray);
    setPracticeStatus(`Valid Move: ${note}`);
  };

  const handleResetPractice = () => {
    setPracticeWord(['C', 'A', 'R', 'T']);
    setPracticeChangedIdx(-1);
    setPracticeStatus('Reset to starting word: C A R T');
  };

  const handleQuickJoin = (e) => {
    e.preventDefault();
    const cleanPin = quickPin.trim().toUpperCase();
    if (cleanPin) {
      navigate(`/join/${cleanPin}`);
    }
  };

  const handleDemoReaction = (emoji) => {
    setDemoReaction(emoji);
    setTimeout(() => setDemoReaction(null), 1800);
  };

  return (
    <div className="w-full bg-[#fbf9f1] pb-16 select-none">
      
      {/* 1. TOP ANNOUNCEMENT MARQUEE */}
      <div className="w-full overflow-hidden bg-[#ffe17b] py-2 border-b-2 border-[#111111] shadow-[0_2px_0_#111111] flex items-center">
        <div className="flex items-center gap-6 whitespace-nowrap animate-marquee">
          <span className="text-xs font-black text-[#231b00] flex items-center gap-1.5 uppercase tracking-wide">
            <span className="material-symbols-outlined text-[15px] text-[#ba1a1a]">bolt</span>
            REALTIME 2-PLAYER TURN-BASED WORD BATTLE
          </span>
          <span className="text-[#111111] font-black">•</span>
          <span className="text-xs font-black text-[#231b00] flex items-center gap-1.5 uppercase tracking-wide">
            <span className="material-symbols-outlined text-[15px] text-[#296c00]">swap_horiz</span>
            SHIFT EXACTLY 1 LETTER PER TURN
          </span>
          <span className="text-[#111111] font-black">•</span>
          <span className="text-xs font-black text-[#231b00] flex items-center gap-1.5 uppercase tracking-wide">
            <span className="material-symbols-outlined text-[15px] text-[#ab0e97]">menu_book</span>
            OFFICIAL 4-LETTER ENGLISH DICTIONARY
          </span>
          <span className="text-[#111111] font-black">•</span>
          <span className="text-xs font-black text-[#231b00] flex items-center gap-1.5 uppercase tracking-wide">
            <span className="material-symbols-outlined text-[15px] text-[#715c00]">tag</span>
            INSTANT ROOM CODE PAIRING
          </span>
          <span className="text-[#111111] font-black">•</span>
          <span className="text-xs font-black text-[#231b00] flex items-center gap-1.5 uppercase tracking-wide">
            <span className="material-symbols-outlined text-[15px] text-[#ba1a1a]">bolt</span>
            REALTIME 2-PLAYER TURN-BASED WORD BATTLE
          </span>
          <span className="text-[#111111] font-black">•</span>
          <span className="text-xs font-black text-[#231b00] flex items-center gap-1.5 uppercase tracking-wide">
            <span className="material-symbols-outlined text-[15px] text-[#296c00]">swap_horiz</span>
            SHIFT EXACTLY 1 LETTER PER TURN
          </span>
          <span className="text-[#111111] font-black">•</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 flex flex-col gap-10 sm:gap-14">
        
        {/* 2. HERO SECTION (2-COLUMN GRID ON DESKTOP, STACKED ON MOBILE) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Headlines, Pitch & Primary CTAs */}
          <section className="lg:col-span-7 flex flex-col gap-4 sm:gap-5">
            
            {/* Category Pill Badge */}
            <div className="inline-flex items-center gap-2 bg-[#ffd7f0] text-[#3a0032] px-3.5 py-1.5 rounded-full border-2 border-[#111111] shadow-[2px_2px_0px_#111111] -rotate-2 w-fit">
              <span className="text-xs">⚡</span>
              <span className="font-black text-xs uppercase tracking-wider">
                2-PLAYER TURN-BASED WORD BATTLE
              </span>
              <span className="text-xs">🔥</span>
            </div>

            {/* Giant Brutalist Headline */}
            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black text-[#111111] leading-[1.05] tracking-tight uppercase">
              TWO WORDS. <br />
              <span className="inline-block bg-[#a0f973] text-[#072100] px-3 py-0.5 sm:py-1 border-[3px] border-[#111111] shadow-[3px_3px_0px_#111111] rounded-2xl transform -rotate-1 mt-1">
                ONE MOVE.
              </span> <br />
              TWO <span className="relative text-[#ab0e97] underline decoration-[#111111] decoration-wavy decoration-3 underline-offset-8">WINNERS.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-lg font-semibold text-[#54414e] max-w-xl leading-relaxed">
              Transform casual screen time into fast-paced word battles. Swap <strong className="text-[#111111] font-black">strictly 1 letter</strong> each turn to outwit your opponent, climb the ladder, and hit the target word.
            </p>

            {/* Main Interactive CTA Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <Link
                to="/create"
                className="bg-[#f45bd7] hover:bg-[#ff7ae5] text-[#111111] font-black text-base sm:text-lg px-6 py-4 rounded-2xl border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <span>CREATE ROOM (P1)</span>
                <span className="text-xl">⚡</span>
              </Link>
              <Link
                to="/join"
                className="bg-[#ffe17b] hover:bg-[#ffeb7b] text-[#231b00] font-black text-base sm:text-lg px-6 py-4 rounded-2xl border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <span>JOIN ROOM (P2)</span>
                <span className="text-xl">🔑</span>
              </Link>
            </div>

            {/* Quick Room Code Input Box */}
            <form onSubmit={handleQuickJoin} className="bg-white p-3.5 rounded-2xl border-2 border-[#111111] shadow-[3px_3px_0px_#111111] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-lg mt-1">
              <label htmlFor="hero-quick-pin" className="text-xs font-black uppercase text-[#111111] shrink-0 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[#ab0e97]">tag</span>
                Room PIN:
              </label>
              <input
                id="hero-quick-pin"
                type="text"
                value={quickPin}
                onChange={(e) => setQuickPin(e.target.value.toUpperCase())}
                placeholder="e.g. WARM"
                maxLength={8}
                className="flex-1 bg-[#f0eee6] text-[#111111] font-black text-base uppercase tracking-widest px-3 py-2 rounded-xl border border-[#111111] outline-none focus:bg-[#ffd7f0]/30 transition-all placeholder:text-[#87717e]/60 placeholder:tracking-normal placeholder:font-medium placeholder:text-xs"
              />
              <button
                type="submit"
                className="bg-[#ab0e97] text-white px-5 py-2 rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_#111111] font-black text-xs uppercase active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              >
                ENTER MATCH
              </button>
            </form>

            {/* Feature Checklist Chips */}
            <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-bold text-[#54414e]">
              <span className="bg-[#f0eee6] px-2.5 py-1 rounded-lg border border-[#111111] shadow-[1px_1px_0px_#111111] flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#ab0e97]">menu_book</span>
                Valid 4-Letter English Words
              </span>
              <span className="bg-[#f0eee6] px-2.5 py-1 rounded-lg border border-[#111111] shadow-[1px_1px_0px_#111111] flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#715c00]">timer</span>
                Turn by Turn
              </span>
            </div>

          </section>

          {/* Right Column: Neo-Brutalist Visual Match Arena Showcase Card */}
          <section className="lg:col-span-5 relative mt-4 lg:mt-0">
            
            {/* Floating Sticker 1 */}
            <div className="absolute -top-4 -left-3 z-20 bg-[#ffd7f0] border-2 border-[#111111] px-3 py-1 rounded-xl shadow-[3px_3px_0px_#111111] font-black text-[11px] uppercase tracking-wider -rotate-6">
              ⚡ 100% REALTIME SYNC
            </div>

            {/* Floating Sticker 2 */}
            <div className="absolute -bottom-3 -right-2 z-20 bg-[#a0f973] text-[#072100] border-2 border-[#111111] px-3 py-1 rounded-xl shadow-[3px_3px_0px_#111111] font-black text-[11px] uppercase tracking-wider rotate-3">
              🔥 NO ADS • INSTANT PLAY
            </div>

            {/* Central Mock Match Arena Card */}
            <div className="bg-white border-[3px] sm:border-[4px] border-[#111111] rounded-3xl p-4 sm:p-5 shadow-[6px_6px_0px_#111111] relative overflow-hidden flex flex-col gap-3.5">
              
              {/* Mock Window Header */}
              <div className="flex items-center justify-between border-b-2 border-[#111111] pb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#ba1a1a] border border-[#111111]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffe17b] border border-[#111111]" />
                  <span className="w-3 h-3 rounded-full bg-[#a0f973] border border-[#111111]" />
                </div>
                <span className="font-black text-xs uppercase tracking-wider bg-[#f0eee6] px-2.5 py-0.5 rounded border border-[#111111]">
                  ROOM: <strong className="text-[#ab0e97]">#WORD-44</strong>
                </span>
                <span className="text-xs font-bold text-[#54414e]">Turn 03</span>
              </div>

              {/* Opponent & Player Cards */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* P1 Card */}
                <div className="bg-[#ffd7f0] border-2 border-[#111111] rounded-xl p-2 flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#111111] flex items-center justify-center text-lg shadow-[1px_1px_0px_#111111] shrink-0">
                    🤠
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-xs truncate uppercase text-[#3a0032]">Player 1</p>
                    <span className="inline-block bg-white text-[9px] font-black px-1.5 py-0.2 rounded border border-[#111111] text-[#ab0e97]">
                      1 SHIFT
                    </span>
                  </div>
                </div>

                {/* P2 Card */}
                <div className="bg-[#ffe17b] border-2 border-[#111111] rounded-xl p-2 flex items-center gap-2 relative">
                  <span className="absolute -top-2 right-1 bg-[#ba1a1a] text-white text-[8px] font-black px-1.5 rounded-full border border-[#111111] uppercase animate-pulse">
                    ACTIVE
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#111111] flex items-center justify-center text-lg shadow-[1px_1px_0px_#111111] shrink-0">
                    🦊
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-xs truncate uppercase text-[#231b00]">Player 2</p>
                    <span className="inline-block bg-white text-[9px] font-black px-1.5 py-0.2 rounded border border-[#111111] text-[#715c00]">
                      1 SHIFT
                    </span>
                  </div>
                </div>
              </div>

              {/* Target Objective Box */}
              <div className="bg-[#f0eee6] border-2 border-[#111111] rounded-xl p-3 text-center flex flex-col items-center">
                <span className="text-[10px] uppercase font-black tracking-widest text-[#54414e] block">
                  TARGET DESTINATION WORD
                </span>
                <div className="flex items-center justify-center gap-1.5 my-1.5">
                  {['W', 'A', 'R', 'M'].map((ch, idx) => (
                    <span
                      key={idx}
                      className="font-black text-xl w-8 h-9 flex items-center justify-center bg-white rounded-lg border-2 border-[#111111] shadow-[2px_2px_0px_#111111] text-[#111111]"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] font-bold text-[#54414e]">
                  Reach "WARM" with 1-letter shifts to complete the chain!
                </p>
              </div>

              {/* Word Shift Ladder Visualizer */}
              <div className="space-y-2 bg-white p-2.5 rounded-xl border-2 border-[#111111]">
                <div className="text-[10px] font-black text-[#54414e] uppercase tracking-wider flex justify-between">
                  <span>Match Ladder</span>
                  <span className="text-[#ab0e97] font-black">Rule: Change 1 letter</span>
                </div>

                {/* Step 1 */}
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#f0eee6] border border-[#111111] text-xs font-bold">
                  <span className="text-[#54414e] text-[11px]">01. Start</span>
                  <div className="flex gap-1">
                    {['C', 'O', 'L', 'D'].map((c, i) => (
                      <span key={i} className="w-6 h-6 flex items-center justify-center bg-white border border-[#111111] rounded font-black text-xs">
                        {c}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] font-black text-[#ab0e97]">P1</span>
                </div>

                {/* Step 2 */}
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#a0f973]/30 border-2 border-[#111111] text-xs font-bold">
                  <span className="text-[#111111] text-[11px]">02. C ➔ C</span>
                  <div className="flex gap-1">
                    <span className="w-6 h-6 flex items-center justify-center bg-white border border-[#111111] rounded font-black text-xs">C</span>
                    <span className="w-6 h-6 flex items-center justify-center bg-[#a0f973] text-[#072100] border border-[#111111] rounded font-black text-xs">A</span>
                    <span className="w-6 h-6 flex items-center justify-center bg-white border border-[#111111] rounded font-black text-xs">L</span>
                    <span className="w-6 h-6 flex items-center justify-center bg-white border border-[#111111] rounded font-black text-xs">M</span>
                  </div>
                  <span className="text-[10px] font-black text-[#296c00]">VALID</span>
                </div>

                {/* Step 3 */}
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#ffd7f0] border-2 border-[#111111] text-xs font-bold">
                  <span className="text-[#111111] text-[11px] font-black">03. C ➔ W</span>
                  <div className="flex gap-1">
                    <span className="w-6 h-6 flex items-center justify-center bg-[#f45bd7] text-white border border-[#111111] rounded font-black text-xs shadow-[1px_1px_0px_#111111]">W</span>
                    <span className="w-6 h-6 flex items-center justify-center bg-white border border-[#111111] rounded font-black text-xs">A</span>
                    <span className="w-6 h-6 flex items-center justify-center bg-white border border-[#111111] rounded font-black text-xs">L</span>
                    <span className="w-6 h-6 flex items-center justify-center bg-white border border-[#111111] rounded font-black text-xs">M</span>
                  </div>
                  <span className="bg-white px-1.5 py-0.2 rounded border border-[#111111] text-[9px] font-black text-[#ab0e97]">
                    1 SHIFT AWAY
                  </span>
                </div>
              </div>

              {/* Bottom In-Match Reaction Pill Bar */}
              <div className="pt-2 border-t-2 border-dashed border-[#111111]/30 flex items-center justify-between text-xs font-bold">
                <span className="text-[#54414e] text-[11px]">Send quick reaction:</span>
                <div className="flex gap-1.5">
                  {['🔥', '🧠', '⚡', '👑'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleDemoReaction(emoji)}
                      className="w-7 h-7 rounded-lg bg-[#f0eee6] hover:bg-[#ffe17b] border border-[#111111] flex items-center justify-center text-xs active:translate-x-0.5 active:translate-y-0.5 transition-all"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {demoReaction && (
                <div className="text-center text-xs font-black text-[#ab0e97] animate-bounce">
                  Sent {demoReaction} to opponent!
                </div>
              )}

            </div>
          </section>

        </div>

        {/* 3. HOW IT WORKS / GAME RULES (3-STEP NEO-BRUTALIST ROADMAP) */}
        <section className="w-full bg-white rounded-3xl border-[3px] sm:border-[4px] border-[#111111] shadow-[6px_6px_0px_#111111] p-5 sm:p-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#111111] pb-4">
            <div>
              <span className="bg-[#ffe17b] text-[#231b00] border-2 border-[#111111] px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-block mb-1 shadow-[2px_2px_0px_#111111]">
                SIMPLE RULES, PURE STRATEGY
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#111111]">
                HOW TO PLAY WORDSHIFT
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-[#54414e] mt-0.5">
                No complex board setup. Just 4 letters, alternating turns, and sharp vocabulary tactics.
              </p>
            </div>
            <button
              onClick={() => setShowRulesModal(true)}
              className="w-fit bg-[#a0f973] text-[#072100] px-4 py-2 rounded-xl border-2 border-[#111111] shadow-[3px_3px_0px_#111111] font-black text-xs uppercase flex items-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">menu_book</span>
              <span>Full explanation</span>
            </button>
          </div>

          {/* 3 Steps Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Step 1 */}
            <article className="bg-[#fbf9f1] rounded-2xl border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] p-4 sm:p-5 flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-10 h-10 rounded-xl bg-[#f45bd7] text-[#111111] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center justify-center font-black text-base">
                    01
                  </span>
                  <span className="text-2xl">🌱</span>
                </div>
                <h3 className="font-black text-lg uppercase text-[#111111] mb-1">
                  P1 Sets Start Word
                </h3>
                <p className="text-xs font-semibold text-[#54414e] leading-relaxed">
                  Player 1 creates the room and submits any valid 4-letter English word like <span className="bg-[#ffd7f0] text-[#3a0032] px-1 rounded font-black border border-[#111111]">COLD</span> or <span className="bg-[#ffe17b] text-[#231b00] px-1 rounded font-black border border-[#111111]">BARK</span>.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t-2 border-dashed border-[#111111]/20 flex items-center gap-1.5 text-[11px] font-bold text-[#54414e]">
                <span>⚡</span> Takes 5 seconds to generate room
              </div>
            </article>

            {/* Step 2 */}
            <article className="bg-[#ffd7f0] rounded-2xl border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] p-4 sm:p-5 flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-10 h-10 rounded-xl bg-[#ffe17b] text-[#231b00] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center justify-center font-black text-base">
                    02
                  </span>
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="font-black text-lg uppercase text-[#111111] mb-1">
                  P2 Sets Target Word
                </h3>
                <p className="text-xs font-semibold text-[#3a0032] leading-relaxed">
                  Player 2 enters the room code and sets the shared destination target word like <span className="bg-white text-[#111111] px-1 rounded font-black border border-[#111111]">WARM</span> or <span className="bg-white text-[#111111] px-1 rounded font-black border border-[#111111]">PLAY</span>.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t-2 border-dashed border-[#111111]/20 flex items-center gap-1.5 text-[11px] font-bold text-[#3a0032]">
                <span>🎯</span> Sets the target goal for both players
              </div>
            </article>

            {/* Step 3 */}
            <article className="bg-[#a0f973] rounded-2xl border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] p-4 sm:p-5 flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-10 h-10 rounded-xl bg-white text-[#072100] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center justify-center font-black text-base">
                    03
                  </span>
                  <span className="text-2xl">👑</span>
                </div>
                <h3 className="font-black text-lg uppercase text-[#072100] mb-1">
                  Shift 1 Letter Per Turn
                </h3>
                <p className="text-xs font-semibold text-[#1d5200] leading-relaxed">
                  Players take turns changing strictly 1 letter into another valid English dictionary word. Reach the target word to complete the ladder!
                </p>
              </div>
              <div className="mt-4 pt-3 border-t-2 border-dashed border-[#111111]/20 flex items-center gap-1.5 text-[11px] font-bold text-[#072100]">
                <span>🏆</span> Realtime validation with rematch support
              </div>
            </article>

          </div>
        </section>

        {/* 4. INTERACTIVE LIVE TEST DRIVE SANDBOX */}
        <section className="w-full bg-white rounded-3xl border-[3px] sm:border-[4px] border-[#111111] shadow-[6px_6px_0px_#111111] p-5 sm:p-8 text-center relative overflow-hidden flex flex-col items-center">
          
          <div className="inline-block bg-[#ffd7f0] border-2 border-[#111111] px-3.5 py-1 rounded-full text-[11px] font-black uppercase mb-2 tracking-wider shadow-[2px_2px_0px_#111111]">
            TRY IT NOW IN YOUR BROWSER
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-[#111111] uppercase tracking-tight mb-1">
            TEST DRIVE A LIVE SHIFT
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-[#54414e] max-w-md mx-auto mb-6">
            Current Word: <strong className="bg-[#ffe17b] text-[#231b00] px-2 py-0.5 rounded border border-[#111111]">C A R T</strong>. Choose which single letter to swap next:
          </p>

          {/* Active Interactive Letter Tiles */}
          <div className="flex justify-center items-center gap-2.5 sm:gap-4 mb-6">
            {practiceWord.map((letter, idx) => {
              const isChanged = practiceChangedIdx === idx;
              return (
                <div
                  key={idx}
                  className={`w-14 h-16 sm:w-18 sm:h-22 rounded-2xl border-[3px] border-[#111111] flex flex-col items-center justify-center font-black text-2xl sm:text-4xl transition-all relative ${
                    isChanged
                      ? 'bg-[#f45bd7] text-[#111111] -translate-y-1.5 shadow-[4px_6px_0px_#111111]'
                      : 'bg-[#fbf9f1] text-[#111111] shadow-[3px_3px_0px_#111111]'
                  }`}
                >
                  <span>{letter}</span>
                </div>
              );
            })}
          </div>

          {/* Quick Shift Pills */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4 max-w-2xl">
            {practiceChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePracticeShift(chip.word, chip.note)}
                className={`${chip.bg} ${chip.text} px-3.5 py-2 rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_#111111] font-black text-xs uppercase active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all`}
              >
                {chip.label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleResetPractice}
              className="bg-white hover:bg-[#f0eee6] text-[#111111] px-3.5 py-2 rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_#111111] font-black text-xs uppercase active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              Reset ↺
            </button>
          </div>

          {/* Live Feedback Banner */}
          <div className="w-full max-w-lg bg-[#f0eee6] rounded-xl border-2 border-[#111111] p-3 text-xs font-black text-[#111111] shadow-[2px_2px_0px_#111111]">
            {practiceStatus}
          </div>

        </section>

        {/* 5. CALL TO ACTION BANNER */}
        <section className="w-full bg-[#ffe17b] rounded-3xl border-[3px] sm:border-[4px] border-[#111111] shadow-[6px_6px_0px_#111111] p-6 sm:p-12 text-center relative overflow-hidden flex flex-col items-center">
          <span className="bg-white text-[#111111] border-2 border-[#111111] px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3 shadow-[2px_2px_0px_#111111]">
            INSTANT PAIRING • NO DOWNLOAD REQUIRED
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase text-[#231b00] tracking-tight max-w-2xl leading-tight">
            READY TO MAKE YOUR MOVE?
          </h2>
          <p className="text-xs sm:text-base font-semibold text-[#4d3e00] max-w-lg mt-2 mb-6 leading-relaxed">
            Create a private game room in 3 seconds, share the 4-digit code with your challenger, and let the word shift begin.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            <Link
              to="/create"
              className="w-full sm:w-auto bg-[#f45bd7] hover:bg-[#ff7ae5] text-[#111111] font-black text-base px-8 py-3.5 rounded-2xl border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <span>CREATE A ROOM NOW</span>
              <span>⚡</span>
            </Link>
            <Link
              to="/join"
              className="w-full sm:w-auto bg-white hover:bg-[#f0eee6] text-[#111111] font-black text-base px-8 py-3.5 rounded-2xl border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <span>ENTER ROOM CODE</span>
              <span>🔑</span>
            </Link>
          </div>
        </section>

      </div>

      <HowToPlayModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />

    </div>
  );
}
