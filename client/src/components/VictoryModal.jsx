import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function VictoryModal({
  winner = 'both',
  winnerName = 'Both Players',
  player1Name = 'Player 1',
  player2Name = 'Player 2',
  player1Mascot = '😎',
  player2Mascot = '👩‍🦰',
  totalMoves = 0,
  duration = 0,
  wordHistory = [],
  startingWord = '----',
  targetWord = '----',
  rematchRequest = null,
  onRequestRematch,
  onRespondRematch,
  myRole = 'player1',
  opponentName = 'Opponent',
  isHost = false,
  terminatedBy = null
}) {
  const [swapRoles, setSwapRoles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStepList, setShowStepList] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const timeFormatted = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  const hasRequested = rematchRequest && rematchRequest.requestedBy === myRole;
  const opponentRequested = rematchRequest && rematchRequest.requestedBy !== myRole;

  // Check if the word chain successfully reached the target word
  const lastMoveWord = wordHistory && wordHistory.length > 0 
    ? wordHistory[wordHistory.length - 1]?.word 
    : null;
  const isTargetReached = (
    !terminatedBy && 
    ((lastMoveWord && targetWord && lastMoveWord.toUpperCase() === targetWord.toUpperCase()) || winner === 'both')
  );

  const handleRequestClick = async () => {
    if (!onRequestRematch) return;
    setIsSubmitting(true);
    try {
      await onRequestRematch(swapRoles);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRespondClick = async (accept) => {
    if (!onRespondRematch) return;
    setIsSubmitting(true);
    try {
      await onRespondRematch(accept);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg bg-[#ffe17b] border-[3px] border-[#111111] rounded-2xl p-3 shadow-[6px_6px_0px_#111111] flex items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center justify-center text-lg shrink-0">
            {isTargetReached ? '🏆' : '🏁'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-black text-xs uppercase tracking-tight text-[#111111] truncate">
              {isTargetReached ? 'Target Reached! 🎉' : 'Round Concluded 🏁'}
            </span>
            <span className="text-[10px] font-bold text-[#54414e] truncate">
              {totalMoves} shifts • {timeFormatted} • Target: <strong className="text-[#111111]">{targetWord}</strong>
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(false)}
          type="button"
          className="shrink-0 bg-[#a0f973] hover:bg-[#8cee5d] text-[#072100] px-3.5 py-2 rounded-xl border-2 border-[#111111] font-black text-xs uppercase shadow-[2px_2px_0px_#111111] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5"
        >
          <span>View Results</span>
          <span className="material-symbols-outlined text-sm font-bold">open_in_full</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#111111]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none">
      <div className="w-full max-w-md sm:max-w-lg bg-[#fbf9f1] border-[4px] border-[#111111] rounded-3xl p-4 sm:p-6 shadow-[8px_8px_0px_#111111] my-auto relative overflow-hidden text-[#111111] flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        
        {/* Playful Floating Stars & Decors */}
        <div className="relative w-full flex flex-col items-center">
          <div className="absolute -top-1 left-1 animate-bounce">
            <svg className="text-[#ffe17b] drop-shadow-[2px_2px_0px_#111111]" fill="none" height="26" viewBox="0 0 24 24" width="26">
              <path d="M12 0L14.8 8.8L24 12L14.8 15.2L12 24L9.2 15.2L0 12L9.2 8.8L12 0Z" fill="currentColor" />
            </svg>
          </div>
          <div className="absolute top-1 right-2 flex items-center gap-1.5">
            <button
              onClick={() => setIsMinimized(true)}
              type="button"
              title="Review full game board"
              className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white hover:bg-[#ffe17b] text-[#111111] border border-[#111111] shadow-[2px_2px_0px_#111111] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[13px]">visibility</span>
              <span>Review Board</span>
            </button>
            <div className={`text-[10px] font-black px-2 py-0.5 rounded-full border border-[#111111] shadow-[2px_2px_0px_#111111] ${
              isTargetReached ? 'bg-[#a0f973] text-[#072100]' : 'bg-[#ffe17b] text-[#231b00]'
            }`}>
              {isTargetReached ? '★ +500 XP' : '★ GAME OVER'}
            </div>
          </div>

          {/* Celebration / Concluded Hero Banner */}
          <div className={`w-full rounded-2xl p-4 border-[3px] border-[#111111] shadow-[5px_5px_0px_#111111] text-center relative overflow-hidden ${
            isTargetReached ? 'bg-[#f45bd7]' : 'bg-[#ffe17b]'
          }`}>
            <div className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border border-[#111111] shadow-[2px_2px_0px_#111111] -rotate-2 mb-1 ${
              isTargetReached ? 'bg-[#ffe17b] text-[#231b00]' : 'bg-white text-[#93000a]'
            }`}>
              <span className="material-symbols-outlined text-[15px]">
                {isTargetReached ? 'emoji_events' : 'flag'}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider">
                {isTargetReached ? 'YAY! TARGET REACHED' : 'OH NO!..'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[#111111] uppercase tracking-tight leading-none drop-shadow-[2px_2px_0px_#ffffff]">
              {isTargetReached ? 'YAY! SUCCESSFULLY DONE! 🎉' : 'Oh No!..'}
            </h2>
            <p className="font-black text-sm uppercase mt-0.5 text-[#5f0053]">
              {isTargetReached 
                ? 'WORD PUZZLE COMPLETED! ✨' 
                : `ENDED BEFORE REACHING "${targetWord}"`}
            </p>

            <div className="mt-2 inline-block bg-white text-[#111111] text-xs font-bold px-3 py-1 rounded-lg border border-[#111111] shadow-[2px_2px_0px_#111111]">
              {isTargetReached ? (
                <span>Both reached <strong className="text-[#111111]">{targetWord}</strong> in <span className="text-[#ab0e97] font-black">{totalMoves} total moves</span> ✨</span>
              ) : (
                <span>
                  {terminatedBy ? `Ended early by ${terminatedBy} • ` : ''}
                  Target was <strong className="text-[#ba1a1a] font-black">{targetWord}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Spotlight Card: Displays BOTH Players */}
        <div className="relative bg-white rounded-2xl p-4 border-[3px] border-[#111111] shadow-[5px_5px_0px_#111111] flex flex-col gap-3">
          {/* Top Pin Accent */}
          <div className="absolute -top-3.5 -left-2 rotate-[-12deg] bg-[#ffe17b] p-1.5 rounded-lg border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center justify-center">
            <span className="material-symbols-outlined text-[#231b00] text-[22px]">
              {isTargetReached ? 'workspace_premium' : 'flag'}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2 pt-1 text-center">
            {/* 2-Player Dual Avatars With Status Badge */}
            <div className="flex items-center justify-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-xl bg-[#ffe17b] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] flex items-center justify-center text-3xl">
                  {player1Mascot}
                </div>
                <span className="text-[11px] font-black uppercase text-[#111111] max-w-[80px] truncate">
                  {player1Name}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-3xl animate-pulse">
                  {isTargetReached ? '⚡' : '🔄'}
                </span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border border-[#111111] shadow-[1px_1px_0px_#111111] uppercase mt-0.5 ${
                  isTargetReached 
                    ? 'bg-[#a0f973] text-[#072100]' 
                    : 'bg-[#ffdad6] text-[#93000a]'
                }`}>
                  {isTargetReached ? 'COMPLETED' : 'NOT REACHED'}
                </span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-xl bg-[#a0f973] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] flex items-center justify-center text-3xl">
                  {player2Mascot}
                </div>
                <span className="text-[11px] font-black uppercase text-[#111111] max-w-[80px] truncate">
                  {player2Name}
                </span>
              </div>
            </div>

            {/* Status Message */}
            <div className="flex flex-col items-center mt-1">
              <span className="font-black text-sm uppercase text-[#111111]">
                {isTargetReached 
                  ? 'YAY! SUCCESSFULLY DONE! ✨' 
                  : 'Oh No!..'}
              </span>
              <p className="text-xs text-[#54414e] font-semibold mt-0.5">
                {isTargetReached ? (
                  <>Bridged <strong className="text-[#ab0e97]">{startingWord}</strong> ➔ <strong className="text-[#296c00]">{targetWord}</strong> together in <strong className="text-[#111111]">{totalMoves} moves</strong>!</>
                ) : (
                  <>Ended before reaching destination <strong className="text-[#ba1a1a]">"{targetWord}"</strong>. Don't worry, team up and try again!</>
                )}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] font-bold text-[#54414e]">
                <span>⏱ {timeFormatted}</span>
                <span>•</span>
                <span className={isTargetReached ? 'text-[#296c00] font-black' : 'text-[#ba1a1a] font-black'}>
                  {isTargetReached ? 'Target Word Reached ✨' : 'Ended Before Target 🏳️'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Match Stats Grid: Just Shifts Taken and Time Taken */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white p-3 rounded-xl border-2 border-[#111111] shadow-[3px_3px_0px_#111111] flex flex-col">
            <span className="text-[10px] font-black uppercase text-[#54414e] flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#ab0e97]">swap_horiz</span>
              SHIFTS TAKEN
            </span>
            <span className="font-black text-xl text-[#111111] mt-0.5">
              {totalMoves} <span className="text-xs text-[#87717e] font-bold">moves</span>
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border-2 border-[#111111] shadow-[3px_3px_0px_#111111] flex flex-col">
            <span className="text-[10px] font-black uppercase text-[#54414e] flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#715c00]">timer</span>
              TIME TAKEN
            </span>
            <span className="font-black text-xl text-[#111111] mt-0.5">
              {timeFormatted} <span className="text-xs text-[#87717e] font-bold">total</span>
            </span>
          </div>
        </div>

        {/* Word Ladder History for Tracking */}
        <div className="w-full bg-white rounded-2xl p-3.5 sm:p-4 border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#ab0e97] text-lg font-bold">alt_route</span>
              <span className="text-xs sm:text-sm font-black uppercase tracking-wide text-[#111111]">
                PATH HISTORY ({wordHistory.length} STEPS)
              </span>
            </div>
            {wordHistory.length > 0 && (
              <button
                onClick={() => setShowStepList(!showStepList)}
                type="button"
                className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#eae8e0] hover:bg-[#ffe17b] border border-[#111111] shadow-[1px_1px_0px_#111111] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1 text-[#111111]"
              >
                <span className="material-symbols-outlined text-[13px]">
                  {showStepList ? 'view_carousel' : 'format_list_bulleted'}
                </span>
                <span>{showStepList ? 'Chain View' : 'Step List'}</span>
              </button>
            )}
          </div>

          {!showStepList ? (
            /* Horizontal Transformation Chain */
            <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1.5 px-1 no-scrollbar select-none">
              {/* Step 0: Starting word */}
              <div className="flex items-center shrink-0">
                <div className="flex flex-col bg-[#eae8e0] px-2.5 py-1.5 rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_#111111] items-center">
                  <div className="font-black text-xs sm:text-sm tracking-widest text-[#111111]">
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
                const playerMascot = step.player === 'player1' ? player1Mascot : player2Mascot;

                let cardBg = 'bg-[#f5f4ec]';
                if (isTarget) cardBg = 'bg-[#ffe17b]';
                else if (isLatest) cardBg = 'bg-[#ffd7f0]';

                return (
                  <div key={idx} className="flex items-center shrink-0">
                    <div className={`flex flex-col ${cardBg} px-2.5 py-1.5 rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_#111111] items-center`}>
                      <div className="font-black text-xs sm:text-sm tracking-widest text-[#111111] flex">
                        {step.word.split('').map((c, i) => (
                          <span
                            key={i}
                            className={i === changedIdx ? 'text-[#ab0e97] underline decoration-2' : ''}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                      <span className="text-[9px] uppercase font-black mt-0.5 text-[#54414e] flex items-center gap-1">
                        <span>{playerMascot}</span>
                        <span>{isTarget ? 'TARGET 🎯' : (step.playerName || (step.player === 'player1' ? 'P1' : 'P2'))}</span>
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
              <div className="w-2.5 shrink-0 pointer-events-none" aria-hidden="true" />
            </div>
          ) : (
            /* Detailed Step-by-Step Breakdown */
            <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 pr-1 text-xs select-none">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#eae8e0] border border-[#111111]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#111111] text-white">
                    START
                  </span>
                  <span className="font-black tracking-wider text-sm">{startingWord}</span>
                </div>
                <span className="text-[10px] font-bold text-[#54414e]">Initial Word</span>
              </div>

              {wordHistory.map((step, idx) => {
                const isTarget = step.word.toUpperCase() === targetWord.toUpperCase();
                const playerMascot = step.player === 'player1' ? player1Mascot : player2Mascot;
                const prevWord = step.previousWord || (idx === 0 ? startingWord : wordHistory[idx - 1]?.word);
                const changedLetter = step.changedIndex >= 0 ? step.word[step.changedIndex] : '';
                const prevLetter = (prevWord && step.changedIndex >= 0) ? prevWord[step.changedIndex] : '';

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded-xl border border-[#111111] ${
                      isTarget ? 'bg-[#ffe17b]' : 'bg-[#f5f4ec]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white border border-[#111111]">
                        #{idx + 1}
                      </span>
                      <span className="font-black tracking-wider text-sm flex">
                        {step.word.split('').map((c, i) => (
                          <span
                            key={i}
                            className={i === step.changedIndex ? 'text-[#ab0e97] underline decoration-2 font-black' : ''}
                          >
                            {c}
                          </span>
                        ))}
                      </span>
                      {changedLetter && prevLetter && (
                        <span className="text-[10px] font-bold text-[#54414e]">
                          ({prevLetter} ➔ <strong className="text-[#ab0e97]">{changedLetter}</strong>)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#111111]">
                      <span>{playerMascot}</span>
                      <span className="truncate max-w-[80px]">
                        {isTarget ? 'TARGET 🎯' : (step.playerName || (step.player === 'player1' ? 'P1' : 'P2'))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Playful Match Tag */}
        <div className="w-full flex justify-center">
          <div className={`p-2.5 rounded-xl border-2 border-[#111111] shadow-[3px_3px_0px_#111111] -rotate-1 flex items-center gap-2 ${
            isTargetReached ? 'bg-[#ffd7f0] text-[#3a0032]' : 'bg-[#ffe17b] text-[#231b00]'
          }`}>
            <span className="material-symbols-outlined text-[20px] font-bold">
              {isTargetReached ? 'emoji_events' : 'sentiment_satisfied'}
            </span>
            <p className="text-xs font-black uppercase">
              {isTargetReached 
                ? '“Target Word Achieved! Brilliant Wordplay! ✨”' 
                : '“Almost had it! Try another match! 💪”'}
            </p>
          </div>
        </div>

        {/* Rematch Proposal Banner if opponent requested */}
        {opponentRequested && (
          <div className="p-3 bg-[#ffe17b] rounded-xl border-2 border-[#111111] shadow-[3px_3px_0px_#111111] text-center flex flex-col gap-2">
            <span className="text-xs font-black uppercase text-[#231b00]">
              {opponentName} proposed a Rematch!
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleRespondClick(true)}
                disabled={isSubmitting}
                className="flex-1 bg-[#a0f973] text-[#072100] py-2 rounded-lg border-2 border-[#111111] font-black text-xs uppercase shadow-[2px_2px_0px_#111111] active:translate-x-0.5 active:translate-y-0.5"
              >
                Accept Rematch
              </button>
              <button
                onClick={() => handleRespondClick(false)}
                disabled={isSubmitting}
                className="flex-1 bg-white text-[#ba1a1a] py-2 rounded-lg border-2 border-[#111111] font-black text-xs uppercase shadow-[2px_2px_0px_#111111] active:translate-x-0.5 active:translate-y-0.5"
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-1">
          {/* Play Again Button */}
          {!hasRequested && !opponentRequested && (
            <button
              onClick={handleRequestClick}
              disabled={isSubmitting}
              className="w-full bg-[#a0f973] text-[#072100] py-3.5 px-4 rounded-xl border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 font-black text-sm uppercase tracking-wide disabled:opacity-50"
            >
              <span>{isSubmitting ? 'SENDING REQUEST...' : (isTargetReached ? 'PLAY AGAIN ⚡' : 'TRY AGAIN 🔄')}</span>
              <span className="material-symbols-outlined text-[22px]">replay</span>
            </button>
          )}

          {hasRequested && (
            <div className="w-full bg-[#f0eee6] text-[#111111] py-3 px-4 rounded-xl border-2 border-[#111111] font-bold text-xs uppercase text-center">
              Waiting for {opponentName} to accept rematch...
            </div>
          )}

          {/* Back to Home Button */}
          <Link
            to="/"
            className="w-full bg-white text-[#111111] py-3.5 px-4 rounded-xl border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 font-black text-sm uppercase tracking-wide text-center"
          >
            <span>BACK TO HOME</span>
            <span className="material-symbols-outlined text-[22px]">cottage</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
