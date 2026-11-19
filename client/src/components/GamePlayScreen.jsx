import React, { useState, useRef, useEffect } from 'react';
import { getSocket, connectSocket } from '../services/socket';
import WordHistoryLadder from './WordHistoryLadder';
import VictoryModal from './VictoryModal';
import HowToPlayModal from './HowToPlayModal';

export default function GamePlayScreen({
  room,
  session,
  socketConnected = true,
  onSubmitMove,
  isSubmitting = false,
  serverError = null,
  onRequestRematch,
  onRespondRematch,
  onTerminateGame,
  onSendReaction,
  incomingReaction
}) {
  const [showRules, setShowRules] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [typedLetters, setTypedLetters] = useState(['', '', '', '']);
  const [localError, setLocalError] = useState(null);
  const [activeReaction, setActiveReaction] = useState(null);

  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const reactionTimerRef = useRef(null);

  // Helper to show reaction popup with auto-dismiss
  const showReactionPopup = (emoji, sender) => {
    if (reactionTimerRef.current) {
      clearTimeout(reactionTimerRef.current);
    }
    setActiveReaction({ emoji, senderName: sender });
    reactionTimerRef.current = setTimeout(() => {
      setActiveReaction(null);
    }, 2500);
  };

  // Player identity checks
  const isPlayer1 = session?.playerId === room.player1?.playerId;
  const isPlayer2 = session?.playerId === room.player2?.playerId;
  const myRole = isPlayer1 ? 'player1' : (isPlayer2 ? 'player2' : (session?.role || 'spectator'));
  const myName = isPlayer1 ? room.player1.name : (room.player2?.name || 'Player 2');
  const opponentRole = isPlayer1 ? 'player2' : 'player1';
  const opponentName = isPlayer1 ? (room.player2?.name || 'Player 2') : room.player1.name;
  const isMyTurn = room.currentTurn === myRole;
  const myMascot = isPlayer1 ? '🍔' : '🍕';
  const opponentMascot = isPlayer1 ? '🍕' : '🍔';

  // Connection presence
  const p1Connected = room.player1?.connectionStatus !== 'disconnected';
  const p2Connected = room.player2?.connectionStatus !== 'disconnected';
  const opponentConnected = isPlayer1 ? p2Connected : p1Connected;

  const currentWord = (room.currentWord || '----').toUpperCase();
  const targetWord = (room.targetWord || '----').toUpperCase();
  const startingWord = (room.startingWord || '----').toUpperCase();

  // Initialize input letters to current word when turn changes
  useEffect(() => {
    if (currentWord && currentWord.length === 4) {
      setTypedLetters(currentWord.split(''));
      setLocalError(null);
    }
  }, [currentWord]);

  // Auto focus first input on my turn
  useEffect(() => {
    if (isMyTurn && inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, [isMyTurn]);

  // Listen for real-time reactions via props
  useEffect(() => {
    if (incomingReaction?.emoji) {
      const isFromMe = (incomingReaction.senderPlayerId && session?.playerId && incomingReaction.senderPlayerId === session.playerId) ||
                       (incomingReaction.senderRole && myRole && incomingReaction.senderRole === myRole);
      const senderDisplayName = isFromMe ? 'You' : (incomingReaction.senderName || opponentName || 'Player');
      showReactionPopup(incomingReaction.emoji, senderDisplayName);
    }
  }, [incomingReaction, session?.playerId, myRole, opponentName]);

  // Direct socket listener for reactions to guarantee real-time sync for both players
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;

    function handleDirectReaction(data) {
      if (data?.emoji) {
        const isFromMe = (data.senderPlayerId && session?.playerId && data.senderPlayerId === session.playerId) ||
                         (data.senderRole && myRole && data.senderRole === myRole);
        const senderDisplayName = isFromMe ? 'You' : (data.senderName || opponentName || 'Player');
        showReactionPopup(data.emoji, senderDisplayName);
      }
    }

    socket.on('player-reaction', handleDirectReaction);
    return () => {
      socket.off('player-reaction', handleDirectReaction);
      if (reactionTimerRef.current) {
        clearTimeout(reactionTimerRef.current);
      }
    };
  }, [session?.playerId, myRole, opponentName]);

  // Diff calculation
  let diffCount = 0;
  let changedIndex = -1;
  const currentChars = currentWord.split('');

  for (let i = 0; i < 4; i++) {
    if (typedLetters[i] && typedLetters[i].toUpperCase() !== currentChars[i]) {
      diffCount++;
      changedIndex = i;
    }
  }

  const handleLetterInput = (index, val) => {
    const char = val.toUpperCase().replace(/[^A-Z]/g, '').slice(-1);
    const updated = [...typedLetters];
    updated[index] = char;
    setTypedLetters(updated);
    setLocalError(null);

    if (char && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !typedLetters[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    if (e.key === 'Enter') {
      handleConfirmShift();
    }
  };

  const handleConfirmShift = () => {
    if (!isMyTurn || isSubmitting) return;

    const fullWord = typedLetters.join('').toUpperCase();
    if (fullWord.length !== 4) {
      setLocalError('Word must be exactly 4 letters.');
      return;
    }

    if (diffCount === 0) {
      setLocalError('You must change exactly one letter.');
      return;
    }

    if (diffCount > 1) {
      setLocalError(`You changed ${diffCount} letters. Only 1 change allowed!`);
      return;
    }

    onSubmitMove(fullWord);
  };

  // Broadcast reaction to both players
  const triggerReaction = (emoji) => {
    showReactionPopup(emoji, 'You');

    const activeRoomId = (room?.roomId || session?.roomId || '').toUpperCase();
    const activeName = myName || session?.playerName || session?.name || (isPlayer1 ? 'Player 1' : 'Player 2');

    const socket = connectSocket();
    if (socket) {
      socket.emit('send-reaction', {
        roomId: activeRoomId,
        emoji,
        senderName: activeName,
        senderPlayerId: session?.playerId,
        senderRole: myRole
      });
    }

    if (onSendReaction) {
      onSendReaction(emoji);
    }
  };

  // Find which index was changed in the most recent move
  const latestMove = room.wordHistory && room.wordHistory.length > 0 
    ? room.wordHistory[room.wordHistory.length - 1] 
    : null;
  const lastShiftedIndex = latestMove?.changedIndex !== undefined ? latestMove.changedIndex : -1;

  // Moves count
  const myMovesCount = room.wordHistory 
    ? room.wordHistory.filter(h => h.player === myRole).length 
    : 0;
  const opponentMovesCount = room.wordHistory 
    ? room.wordHistory.filter(h => h.player === opponentRole).length 
    : 0;

  return (
    <div className="w-full max-w-md sm:max-w-xl mx-auto px-3 sm:px-4 py-4 flex flex-col gap-3 sm:gap-4 select-none pb-20">
      
      {/* MATCH CONTROL SUB-HEADER: Status & Small Game Termination Button */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-black text-[#54414e]">
          <span className={`w-2.5 h-2.5 rounded-full ${socketConnected ? 'bg-[#296c00]' : 'bg-[#ba1a1a] animate-ping'}`} />
          <span className="uppercase">{socketConnected ? 'game in play' : 'Reconnecting...'}</span>
        </div>

        {/* Small Game Termination Button for both sides */}
        <button
          onClick={() => setShowTerminateModal(true)}
          type="button"
          title="Conclude match early"
          className="px-2.5 py-1 rounded-lg bg-[#ffdad6] hover:bg-[#ba1a1a] hover:text-white text-[#93000a] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] text-[11px] font-black uppercase flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
        >
          <span className="material-symbols-outlined text-[15px] font-bold">flag</span>
          <span>End Round</span>
        </button>
      </div>

      {/* OPPONENT DISCONNECTION BANNER */}
      {!opponentConnected && (
        <div className="p-3 rounded-xl bg-[#ffdad6] border-2 border-[#ba1a1a] text-[#93000a] flex items-center justify-between text-xs font-bold shadow-[2px_2px_0px_#ba1a1a]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] animate-pulse">wifi_off</span>
            <span>{opponentName} disconnected. Waiting for player to reconnect...</span>
          </div>
          <span className="bg-[#ba1a1a] text-white px-2 py-0.5 rounded text-[10px]">PAUSED</span>
        </div>
      )}

      {/* 1. OBJECTIVE STICKER TRAY (START -> TARGET) */}
      <div className="flex items-center justify-between bg-white p-2.5 sm:p-3 rounded-xl border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111]">
        {/* Start Word */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[10px] sm:text-xs font-black bg-[#ffe17b] text-[#231b00] px-2 py-1 rounded border-2 border-[#111111] uppercase tracking-wider">
            START
          </span>
          <div className="flex gap-0.5 sm:gap-1">
            {startingWord.split('').map((c, i) => (
              <span key={i} className="w-6 h-7 bg-[#f0eee6] text-[#111111] font-black text-xs sm:text-sm flex items-center justify-center rounded border border-[#111111]">
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center">
          <span className="material-symbols-outlined text-[#ab0e97] text-xl font-bold animate-pulse">
            arrow_right_alt
          </span>
        </div>

        {/* Target Word */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[10px] sm:text-xs font-black bg-[#a0f973] text-[#072100] px-2 py-1 rounded border-2 border-[#111111] uppercase tracking-wider">
            TARGET
          </span>
          <div className="flex gap-0.5 sm:gap-1">
            {targetWord.split('').map((c, i) => (
              <span key={i} className="w-6 h-7 bg-[#a0f973] text-[#072100] font-black text-xs sm:text-sm flex items-center justify-center rounded border border-[#111111]">
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 2. 2-PLAYER TEAM STRIP (Left Card: YOU, Right Card: Opponent) */}
      <div className="relative flex items-center justify-between gap-2 sm:gap-3 pt-3.5">
        {/* Left Card: YOU (Current Player) */}
        <div className="relative flex-1">
          {isMyTurn && (
            <div className="absolute -top-3 left-2 sm:left-3 z-20 pointer-events-none">
              <span className="inline-flex items-center gap-1 bg-[#f45bd7] text-[#111111] text-[10px] font-black px-2.5 py-0.5 rounded-full border-2 border-[#111111] shadow-[2px_2px_0px_#111111] uppercase tracking-wider animate-bounce">
                <span className="w-1.5 h-1.5 rounded-full bg-[#111111] animate-ping" />
                YOUR TURN!
              </span>
            </div>
          )}
          <div className={`p-2.5 sm:p-3 rounded-xl border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] flex items-center gap-2 transition-colors ${
            isMyTurn ? 'bg-[#ffd7f0]' : 'bg-[#f0eee6]'
          }`}>
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${isPlayer1 ? 'bg-[#ffe17b]' : 'bg-[#a0f973]'} border-2 border-[#111111] flex items-center justify-center text-xl shrink-0`}>
              {myMascot}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-black text-[#111111] truncate uppercase">
                {myName} (YOU)
              </span>
              <span className={`text-[10px] sm:text-xs font-bold ${isMyTurn ? 'text-[#ab0e97]' : 'text-[#54414e]'}`}>
                {myMovesCount} SHIFTS
              </span>
            </div>
          </div>
        </div>

        {/* Center Tactile Turn Pin */}
        <div className="z-10 -mx-2 shrink-0 flex items-center justify-center">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#ffe17b] border-[3px] border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center justify-center rotate-[-6deg]">
            <span className="text-base font-black text-[#111111]">⚡</span>
          </div>
        </div>

        {/* Right Card: Opponent */}
        <div className="relative flex-1">
          {!isMyTurn && (
            <div className="absolute -top-3 right-2 sm:right-3 z-20 pointer-events-none">
              <span className="inline-flex items-center gap-1 bg-[#ffe17b] text-[#231b00] text-[10px] font-black px-2.5 py-0.5 rounded-full border-2 border-[#111111] shadow-[2px_2px_0px_#111111] uppercase tracking-wider animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]" />
                WAITING
              </span>
            </div>
          )}
          <div className={`p-2.5 sm:p-3 rounded-xl border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] flex items-center justify-end gap-2 transition-colors ${
            !isMyTurn ? 'bg-[#ffd7f0]/50' : 'bg-[#eae8e0]'
          }`}>
            <div className="flex flex-col items-end min-w-0">
              <span className="text-xs sm:text-sm font-black text-[#111111] truncate uppercase">
                {opponentName}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-[#715c00]">
                {opponentMovesCount} SHIFTS
              </span>
            </div>
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${isPlayer1 ? 'bg-[#a0f973]' : 'bg-[#ffe17b]'} border-2 border-[#111111] flex items-center justify-center text-xl shrink-0`}>
              {opponentMascot}
            </div>
          </div>
        </div>
      </div>

      {/* 3. CURRENT LIVE BOARD WORD CARD */}
      <div className="flex flex-col items-center bg-white p-4 sm:p-5 rounded-2xl border-[4px] border-[#111111] shadow-[6px_6px_0px_#111111] relative mt-1">
        {/* Floating Eye Sticker Accent */}
        <div className="absolute -top-4 left-4 bg-[#ffe17b] px-2 py-0.5 rounded-full border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center gap-1.5 -rotate-3">
          <span className="w-3 h-3 bg-white rounded-full border border-[#111111] flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-[#111111] rounded-full" />
          </span>
          <span className="w-3 h-3 bg-white rounded-full border border-[#111111] flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-[#111111] rounded-full" />
          </span>
          <span className="text-[10px] font-black text-[#111111] uppercase tracking-wider">
            CURRENT BOARD
          </span>
        </div>

        {/* Rule Reminder */}
        <div className="w-full text-center mb-3 mt-1">
          <span className="text-xs font-bold text-[#54414e]">
            Change <span className="text-[#ab0e97] underline decoration-2">only 1 letter</span> to build a valid word!
          </span>
        </div>

        {/* 4 Large Active Letter Blocks */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3 w-full max-w-[320px] justify-center">
          {currentWord.split('').map((char, index) => {
            const isShifted = lastShiftedIndex === index;
            return (
              <div
                key={index}
                className={`flex flex-col items-center justify-center h-18 sm:h-20 rounded-xl border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] relative ${
                  isShifted
                    ? 'bg-[#f45bd7] text-[#3a0032] -translate-y-1'
                    : 'bg-white text-[#111111]'
                }`}
              >
                {isShifted && (
                  <div className="absolute -top-2.5 bg-[#ab0e97] text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 rounded border border-[#111111] uppercase tracking-tight">
                    SHIFTED
                  </div>
                )}
                <span className="font-black text-2xl sm:text-3xl text-[#111111]">{char}</span>

              </div>
            );
          })}
        </div>

        {/* Chain Progress Footer */}
        <div className="mt-4 flex items-center justify-between w-full px-2 pt-2 border-t-2 border-[#111111]/10">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#296c00] text-base font-bold">bolt</span>
            <span className="text-xs font-bold text-[#111111] uppercase">
              Step {room.wordHistory?.length || 1} in chain
            </span>
          </div>
          <div className="flex items-center gap-1 text-[#715c00] font-black text-xs uppercase">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <span>MATCH ACTIVE</span>
          </div>
        </div>
      </div>

      {/* 4. PLAYER TURN INPUT DECK */}
      <div className={`flex flex-col p-4 sm:p-5 rounded-2xl border-[4px] border-[#111111] shadow-[6px_6px_0px_#111111] gap-3 relative transition-all ${
        isMyTurn ? 'bg-[#ffd7f0]/40' : 'bg-[#eae8e0]/40 opacity-75'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-sm uppercase text-[#111111]">
              {isMyTurn ? 'YOUR MOVE' : `${opponentName}'S TURN`}
            </span>
            {isMyTurn && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#a0f973] border border-[#111111] animate-ping" />
            )}
          </div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded border border-[#111111] uppercase tracking-wider ${
            diffCount === 1 ? 'bg-[#a0f973] text-[#072100]' : 'bg-[#ffe17b] text-[#231b00]'
          }`}>
            {diffCount === 1 ? '1 CHANGE DETECTED ✓' : `${diffCount} CHANGES (MUST BE 1)`}
          </span>
        </div>

        {/* 4 Interactive Letter Inputs */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3 w-full">
          {typedLetters.map((char, index) => {
            const isDiff = char.toUpperCase() !== currentChars[index];
            return (
              <div key={index} className="relative flex flex-col items-center">
                <input
                  ref={inputRefs[index]}
                  type="text"
                  disabled={!isMyTurn || isSubmitting}
                  value={char}
                  onChange={(e) => handleLetterInput(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  maxLength={1}
                  className={`w-full h-16 sm:h-18 text-center font-black text-2xl sm:text-3xl uppercase rounded-xl border-[3px] border-[#111111] shadow-[3px_3px_0px_#111111] outline-none transition-all select-none caret-transparent ${
                    isDiff
                      ? 'bg-[#a0f973] text-[#072100] -translate-y-1'
                      : 'bg-white text-[#111111] focus:bg-[#ffe17b]'
                  }`}
                />
                <span className={`text-[10px] font-black mt-1 uppercase ${
                  isDiff ? 'text-[#296c00]' : 'text-[#87717e]'
                }`}>
                  {isDiff ? 'NEW!' : 'SAME'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Errors & Validation Feedback */}
        {(localError || serverError) && (
          <div className="p-2.5 bg-[#ffdad6] border-2 border-[#ba1a1a] text-[#93000a] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_#ba1a1a]">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{localError || serverError}</span>
          </div>
        )}

        {/* Large Tactile Submit CTA */}
        <button
          onClick={handleConfirmShift}
          disabled={!isMyTurn || isSubmitting || diffCount !== 1}
          className="w-full py-3.5 sm:py-4 bg-[#a0f973] text-[#072100] font-black text-base uppercase tracking-wider rounded-xl border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <span>{isSubmitting ? 'VERIFYING SHIFT...' : 'CONFIRM SHIFT!'}</span>
          <span className="material-symbols-outlined text-2xl font-bold">bolt</span>
        </button>
      </div>

      {/* 5. WORD TRANSFORMATION PATH LOG */}
      <WordHistoryLadder
        wordHistory={room.wordHistory || []}
        startingWord={startingWord}
        targetWord={targetWord}
        currentWord={currentWord}
      />

      {/* 6. SOCIAL REACTION STRIP */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111]">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[#ab0e97] text-xl font-bold">mood</span>
          <span className="text-xs font-black uppercase text-[#111111]">REACTIONS:</span>
        </div>
        <div className="flex items-center gap-2">
          {['🔥', '🤯', '👏', '⚡'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => triggerReaction(emoji)}
              type="button"
              aria-label={`Reaction ${emoji}`}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#f5f4ec] hover:bg-[#ffe17b] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center justify-center text-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Reaction Pop Display for BOTH players */}
      {activeReaction && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-50 animate-bounce">
          <div className="text-7xl sm:text-8xl drop-shadow-[4px_4px_0px_#111111]">
            {activeReaction.emoji}
          </div>
          <div className="bg-[#111111] text-white text-xs font-black px-3.5 py-1 rounded-full border-2 border-white shadow-[3px_3px_0px_#111111] uppercase mt-2 tracking-wide flex items-center gap-1.5 whitespace-nowrap">
            <span>{activeReaction.senderName}</span>
            <span>reacted {activeReaction.emoji}!</span>
          </div>
        </div>
      )}

      {/* Small Termination Confirmation Modal */}
      {showTerminateModal && (
        <div className="fixed inset-0 z-50 bg-[#111111]/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white border-[4px] border-[#111111] rounded-2xl p-4 shadow-[6px_6px_0px_#111111] flex flex-col gap-3 text-center">
            <div className="w-11 h-11 rounded-xl bg-[#ffdad6] border-2 border-[#ba1a1a] text-[#ba1a1a] flex items-center justify-center mx-auto shadow-[2px_2px_0px_#ba1a1a]">
              <span className="material-symbols-outlined text-2xl font-black">flag</span>
            </div>
            <h3 className="text-base font-black uppercase text-[#111111]">
              End Game Session?
            </h3>
            <p className="text-xs font-semibold text-[#54414e] leading-snug">
              Ending this round early will conclude the current word ladder for both players. You can start a fresh round together anytime!
            </p>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => {
                  setShowTerminateModal(false);
                  if (onTerminateGame) onTerminateGame();
                }}
                type="button"
                className="flex-1 bg-[#ba1a1a] text-white py-2.5 rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_#111111] font-black text-xs uppercase active:translate-x-0.5 active:translate-y-0.5"
              >
                End Round
              </button>
              <button
                onClick={() => setShowTerminateModal(false)}
                type="button"
                className="flex-1 bg-[#eae8e0] text-[#111111] py-2.5 rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_#111111] font-black text-xs uppercase active:translate-x-0.5 active:translate-y-0.5"
              >
                Keep Playing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VICTORY MODAL when match is completed */}
      {room.status === 'completed' && (
        <VictoryModal
          winner={room.winner}
          winnerName={room.winnerName}
          player1Name={room.player1?.name || 'Partner 1'}
          player2Name={room.player2?.name || 'Partner 2'}
          totalMoves={room.totalMoves || room.wordHistory?.length}
          duration={room.duration || 60}
          wordHistory={room.wordHistory || []}
          startingWord={startingWord}
          targetWord={targetWord}
          rematchRequest={room.rematchRequest}
          onRequestRematch={onRequestRematch}
          onRespondRematch={onRespondRematch}
          myRole={myRole}
          opponentName={opponentName}
          isHost={isPlayer1}
          terminatedBy={room.terminatedBy}
        />
      )}

      <HowToPlayModal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
      />

    </div>
  );
}
