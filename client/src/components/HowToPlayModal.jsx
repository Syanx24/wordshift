import React from 'react';

export default function HowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const rules = [
    {
      num: '01',
      title: 'Word Setup',
      desc: 'Player 1 sets the 4-letter starting seed word. Player 2 joins with the room code and sets the 4-letter target word.',
      bg: 'bg-[#ab0e97]',
      text: 'text-white'
    },
    {
      num: '02',
      title: 'One Letter at a Time',
      desc: 'On your turn, you must change exactly ONE letter of the current board word. The other 3 letters must remain untouched.',
      bg: 'bg-[#296c00]',
      text: 'text-white'
    },
    {
      num: '03',
      title: 'Valid English Words',
      desc: 'Every shift must form a legitimate, recognized 4-letter English dictionary word. Slang or non-words are rejected.',
      bg: 'bg-[#715c00]',
      text: 'text-white'
    },
    {
      num: '04',
      title: 'No Word Repetition',
      desc: 'You cannot repeat any word that was already played in the current match chain. Backward shifts are disallowed.',
      bg: 'bg-[#f45bd7]',
      text: 'text-[#3a0032]'
    },
    {
      num: '05',
      title: 'Alternating Turns',
      desc: 'Players take turns strictly in order. Player 1 makes the first move. Plan your shifts carefully to bridge toward the target!',
      bg: 'bg-[#ffe17b]',
      text: 'text-[#231b00]'
    },
    {
      num: '06',
      title: 'Target Word Victory',
      desc: 'The game completes when the target word is successfully played on the board!',
      bg: 'bg-[#a0f973]',
      text: 'text-[#072100]'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#111111]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="w-full max-w-md sm:max-w-lg max-h-[88vh] bg-[#fbf9f1] border-[4px] border-[#111111] rounded-3xl p-4 sm:p-6 shadow-[8px_8px_0px_#111111] flex flex-col text-[#111111]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#111111] pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-[#ffe17b] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center justify-center text-lg">
              📖
            </span>
            <div>
              <h2 className="text-xl font-black uppercase text-[#111111] leading-none">
                RULES & GUIDE
              </h2>
              <span className="text-[10px] font-bold text-[#54414e] uppercase">Official Wordshift Codex</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close rules"
            className="w-9 h-9 rounded-xl bg-white border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center justify-center active:translate-x-0.5 active:translate-y-0.5"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Rules List (Scrollable middle container) */}
        <div className="flex-1 min-h-0 overflow-y-auto py-3 pr-1.5 flex flex-col gap-2.5">
          {rules.map((rule, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 bg-white p-3 rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_#111111]"
            >
              <div className={`w-8 h-8 rounded-lg ${rule.bg} ${rule.text} border-2 border-[#111111] shadow-[1px_1px_0px_#111111] flex items-center justify-center font-black text-xs shrink-0`}>
                {rule.num}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase text-[#111111]">{rule.title}</span>
                <span className="text-[11px] text-[#54414e] font-medium leading-snug mt-0.5">{rule.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Close Button (Always visible pinned at bottom) */}
        <div className="pt-3 border-t-2 border-[#111111]/10 shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-[#f45bd7] text-[#111111] py-3.5 rounded-xl border-2 border-[#111111] shadow-[3px_3px_0px_#111111] font-black text-xs uppercase tracking-wider active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            GOT IT, LET'S PLAY!
          </button>
        </div>

      </div>
    </div>
  );
}
