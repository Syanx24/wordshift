import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, AlertCircle, CheckCircle2, CornerDownLeft, Sparkles } from 'lucide-react';

export default function WordInput({
  currentWord = '----',
  targetWord = '----',
  isMyTurn = false,
  opponentName = 'Opponent',
  onSubmitMove,
  isSubmitting = false,
  serverError = null
}) {
  const [inputVal, setInputVal] = useState('');
  const [localError, setLocalError] = useState(null);
  const inputRef = useRef(null);

  // Auto focus input when turn becomes active
  useEffect(() => {
    if (isMyTurn && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMyTurn]);

  // Reset input and clear errors on word change
  useEffect(() => {
    setInputVal('');
    setLocalError(null);
  }, [currentWord]);

  const curr = (currentWord || '----').toUpperCase();
  const typed = inputVal.toUpperCase().padEnd(4, ' ').slice(0, 4);

  // Analyze letter difference against currentWord
  let diffCount = 0;
  let changedIdx = -1;
  if (inputVal.length === 4) {
    for (let i = 0; i < 4; i++) {
      if (inputVal[i].toUpperCase() !== curr[i]) {
        diffCount++;
        changedIdx = i;
      }
    }
  }

  const handleInputChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    setInputVal(val);
    setLocalError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isMyTurn || isSubmitting) return;

    if (inputVal.length !== 4) {
      setLocalError('Word must be exactly 4 letters.');
      return;
    }

    if (diffCount === 0) {
      setLocalError('You must change exactly one letter. This is identical to the current word.');
      return;
    }

    if (diffCount > 1) {
      setLocalError(`You changed ${diffCount} letters. Only one letter may change per turn.`);
      return;
    }

    onSubmitMove(inputVal.toUpperCase());
  };

  const isWinningTarget = inputVal.toUpperCase() === (targetWord || '').toUpperCase();

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Hidden real input for accessibility & mobile keyboards */}
      <form onSubmit={handleSubmit} className="flex flex-col items-center">
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={handleInputChange}
          maxLength={4}
          disabled={!isMyTurn || isSubmitting}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck="false"
          className="sr-only"
          aria-label="Enter four-letter transformation word"
        />

        {/* Tactile Letter Boxes (Clicking focuses input) */}
        <div 
          onClick={() => isMyTurn && inputRef.current?.focus()}
          className={`flex items-center gap-2 sm:gap-3 cursor-text p-2 rounded-2xl transition-all duration-200 ${
            isMyTurn 
              ? 'ring-2 ring-brand-500/30 bg-brand-500/5' 
              : 'opacity-60 cursor-not-allowed bg-slate-100/50 dark:bg-dark-card/30'
          }`}
        >
          {[0, 1, 2, 3].map((index) => {
            const char = inputVal[index]?.toUpperCase() || '';
            const isDiff = char && char !== curr[index];
            const isTargetChar = char && isWinningTarget;

            return (
              <motion.div
                key={index}
                whileTap={{ scale: 0.95 }}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-mono font-extrabold text-2xl sm:text-3xl border-2 transition-all select-none ${
                  isTargetChar
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/50'
                    : isDiff
                    ? 'border-amber-400 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-2 ring-amber-400/40'
                    : char
                    ? 'border-brand-500 bg-white dark:bg-dark-card text-slate-900 dark:text-white'
                    : 'border-slate-300 dark:border-dark-border bg-white/60 dark:bg-dark-card/50 text-slate-400 border-dashed'
                }`}
              >
                {char || (isMyTurn && index === inputVal.length ? (
                  <span className="w-0.5 h-6 bg-brand-500 animate-pulse" />
                ) : '·')}
              </motion.div>
            );
          })}
        </div>

        {/* Live Transformation Feedback */}
        <div className="min-h-[26px] mt-2.5 flex items-center justify-center text-xs font-medium text-center">
          {localError || serverError ? (
            <motion.div 
              initial={{ opacity: 0, y: -4 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="text-rose-500 flex items-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{localError || serverError}</span>
            </motion.div>
          ) : isWinningTarget ? (
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }} 
              className="text-emerald-500 font-bold flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-emerald-500 animate-spin" />
              <span>Target word match! Submit for victory!</span>
            </motion.div>
          ) : inputVal.length === 4 && diffCount === 1 ? (
            <span className="text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Valid shift: Changing letter {changedIdx + 1} ({curr[changedIdx]} → {inputVal[changedIdx]})</span>
            </span>
          ) : inputVal.length === 4 && diffCount !== 1 ? (
            <span className="text-amber-500">
              {diffCount === 0 ? 'Same word: change 1 letter' : `Changed ${diffCount} letters: exactly 1 must change`}
            </span>
          ) : isMyTurn ? (
            <span className="text-slate-400">Type a 4-letter English word altering 1 letter</span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400 italic">
              Waiting for {opponentName}'s move...
            </span>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-3 w-full">
          {isMyTurn ? (
            <button
              type="submit"
              disabled={inputVal.length !== 4 || diffCount !== 1 || isSubmitting}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
                isWinningTarget
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:brightness-110'
                  : 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-500/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-brand-600'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Validating Word...</span>
                </div>
              ) : isWinningTarget ? (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>CLAIM VICTORY ({inputVal})</span>
                </>
              ) : (
                <>
                  <span>Submit Word Shift</span>
                  <CornerDownLeft className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <div className="py-3 px-4 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-card/40 text-center text-xs sm:text-sm font-medium text-slate-500">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping mr-2" />
              Opponent's turn ({opponentName})
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
