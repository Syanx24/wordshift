import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { roomApi } from '../services/api';
import { useGame } from '../context/GameContext';

const TARGET_PRESETS = ['WARM', 'TAIL', 'PLAY', 'DOCK', 'WIRE', 'STAR', 'MOON', 'COLD', 'FIRE', 'GOLD'];
const MASCOTS = ['🍕', '🍔', '🍟', '🌭', '🍩'];

export default function JoinRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { saveSession, getSavedSessionForRoom } = useGame();

  const [inputCode, setInputCode] = useState(roomId ? roomId.toUpperCase() : '');
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(!!roomId);
  const [error, setError] = useState(null);
  const [playerName, setPlayerName] = useState('Player 2');
  const [selectedMascot, setSelectedMascot] = useState('🍕');
  const [letters, setLetters] = useState(['W', 'A', 'R', 'M']);
  const [submitting, setSubmitting] = useState(false);

  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const letterPoints = {
    A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
    N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
  };

  useEffect(() => {
    if (roomId) {
      const saved = getSavedSessionForRoom(roomId.toUpperCase());
      if (saved && saved.playerId) {
        navigate(`/room/${roomId.toUpperCase()}`);
        return;
      }
      fetchRoom(roomId.toUpperCase());
    }
  }, [roomId]);

  const fetchRoom = async (code) => {
    setLoading(true);
    setError(null);
    try {
      const data = await roomApi.getRoom(code);
      if (data.success && data.room) {
        setRoom(data.room);
        if (data.room.startingWord) {
          // If default target matches start word, pick a different one
          if (data.room.startingWord === 'WARM') {
            setLetters(['C', 'O', 'L', 'D']);
          }
        }
      } else {
        setError(data.error || 'Failed to fetch room');
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 410) {
        setError('This room has expired. Rooms expire 24 hours after creation.');
      } else if (status === 404) {
        setError('Room not found. Please check your room code.');
      } else {
        setError(err.response?.data?.error || 'Unable to find room.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchCode = (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    navigate(`/join/${inputCode.trim().toUpperCase()}`);
  };

  const handleLetterChange = (index, val) => {
    const char = val.toUpperCase().replace(/[^A-Z]/g, '').slice(-1);
    const updated = [...letters];
    updated[index] = char;
    setLetters(updated);
    setError(null);

    if (char && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !letters[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleApplyPreset = (word) => {
    const chars = word.toUpperCase().split('');
    setLetters(chars);
    setError(null);
  };

  const handleRandomPreset = () => {
    const filtered = TARGET_PRESETS.filter(w => !room || w !== room.startingWord);
    const randomWord = filtered[Math.floor(Math.random() * filtered.length)];
    handleApplyPreset(randomWord);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError(null);

    if (!playerName.trim()) {
      setError('Please enter your player alias.');
      return;
    }

    const cleanTarget = letters.join('').toUpperCase();
    if (cleanTarget.length !== 4) {
      setError('Target word must be exactly 4 letters.');
      return;
    }

    if (room && cleanTarget === room.startingWord) {
      setError('Target word must be different from the starting word.');
      return;
    }

    setSubmitting(true);

    try {
      const activeCode = roomId ? roomId.toUpperCase() : inputCode.trim().toUpperCase();
      const response = await roomApi.joinRoom(activeCode, {
        name: playerName.trim(),
        targetWord: cleanTarget
      });

      if (response.success && response.room) {
        saveSession(activeCode, response.playerId, 'player2', playerName.trim());
        navigate(`/room/${activeCode}`);
      } else {
        setError(response.error || 'Failed to join room');
      }
    } catch (err) {
      console.error('Join room failed:', err);
      const apiError = err.response?.data?.error || err.message || 'Error joining room. Please check code.';
      setError(apiError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#fbf9f1] pb-16 min-h-[calc(100vh-5rem)]">
      <div className="max-w-md sm:max-w-lg mx-auto px-4 pt-4 flex flex-col gap-5 select-none">
        
        {/* Mode Toggle Bar */}
        <div className="w-full bg-[#e4e3db] rounded-2xl p-1.5 flex items-center justify-between border-2 border-[#111111] shadow-[3px_3px_0px_#111111] overflow-hidden">
          <Link
            to="/create"
            className="flex-1 py-2 px-3 text-[#54414e] font-black text-xs uppercase tracking-wider text-center hover:text-[#111111] transition-colors"
          >
            CREATE ROOM (P1)
          </Link>
          <button
            type="button"
            className="flex-1 py-2 px-3 bg-[#a0f973] text-[#072100] rounded-xl font-black text-xs uppercase tracking-wider text-center border-2 border-[#111111] shadow-[2px_2px_0px_#111111]"
          >
            JOIN ROOM (P2)
          </button>
        </div>

        {/* Hero Card */}
        <div className="relative bg-[#ffe17b] text-[#231b00] rounded-2xl p-5 border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] overflow-hidden">
          <div className="inline-block bg-white text-[#111111] px-2.5 py-0.5 rounded-md font-black text-[11px] uppercase border-2 border-[#111111] shadow-[2px_2px_0px_#111111] rotate-1 mb-2">
            DESTINATION BUILDER 🎯
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-[#231b00] leading-tight tracking-tight">
            SET THE GOAL<br />TARGET WORD!
          </h1>
          <p className="text-xs font-semibold mt-1 text-[#4d3e00] max-w-[280px]">
            Player 1 set the start word. You decide where the transformation ladder ends!
          </p>
        </div>

        {/* Enter Code Step if no roomId in URL */}
        {!roomId && (
          <form onSubmit={handleSearchCode} className="bg-white p-4 rounded-2xl border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] flex flex-col gap-3">
            <label className="text-xs font-black uppercase tracking-wide text-[#111111]">
              Enter 4-Letter Room Code
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="e.g. LUV4"
                maxLength={8}
                className="flex-1 bg-[#f5f4ec] text-[#111111] font-bold text-lg uppercase tracking-widest px-3.5 py-2.5 rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_#111111] focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                className="bg-[#a0f973] text-[#072100] px-5 py-2.5 rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_#111111] font-black text-sm uppercase active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              >
                FIND
              </button>
            </div>
          </form>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-[#ffdad6] border-2 border-[#ba1a1a] text-[#93000a] rounded-xl shadow-[2px_2px_0px_#ba1a1a] text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Start Word Preview Card (when room is fetched) */}
        {room && (
          <div className="bg-[#f0eee6] p-4 rounded-2xl border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#54414e] block">
                PLAYER 1 ({room.player1?.name || 'Player 1'}) CHOSE START WORD:
              </span>
              <div className="flex gap-1.5 mt-1">
                {(room.startingWord || '----').split('').map((c, i) => (
                  <span key={i} className="w-8 h-9 bg-white text-[#111111] rounded-lg border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center justify-center font-black text-base">
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-[#296c00] bg-[#a0f973] px-2 py-0.5 rounded border border-[#111111]">
                ROOM #{roomId || inputCode}
              </span>
            </div>
          </div>
        )}

        {/* Player 2 Target Word Form */}
        {(room || !roomId) && (
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            
            {/* Player 2 Alias */}
            <div className="bg-white text-[#111111] rounded-2xl p-4 border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wide text-[#111111]">
                  Player 2 Alias
                </label>
                <span className="bg-[#a0f973] text-[#072100] font-black text-[10px] px-2 py-0.5 rounded border border-[#111111] shadow-[1px_1px_0px_#111111] uppercase">
                  GUEST
                </span>
              </div>

              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={16}
                placeholder="ENTER YOUR NAME"
                className="w-full bg-[#f5f4ec] text-[#111111] font-bold text-base px-3.5 py-2.5 rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_#111111] focus:bg-white focus:outline-none transition-all placeholder:text-[#87717e]/50"
              />

              {/* Mascot Selector */}
              <div className="flex flex-col gap-1.5 mt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#54414e]">
                  Select Mascot
                </span>
                <div className="flex gap-2 sm:gap-3 items-center overflow-x-auto pb-1 pt-1 no-scrollbar">
                  {MASCOTS.map((mascot) => {
                    const isSelected = selectedMascot === mascot;
                    return (
                      <button
                        key={mascot}
                        type="button"
                        onClick={() => setSelectedMascot(mascot)}
                        className={`flex-shrink-0 flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                          isSelected
                            ? 'scale-125 -translate-y-1 opacity-100'
                            : 'opacity-40 hover:opacity-80 scale-100'
                        }`}
                      >
                        <span className="text-3xl select-none">{mascot}</span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#111111] mt-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Target Word Input */}
            <div className="bg-white text-[#111111] rounded-2xl p-4 border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wide text-[#111111]">
                  4-Letter Target Word
                </label>
                <span className="text-[10px] font-black text-[#715c00] uppercase tracking-wider bg-[#ffe17b] px-2 py-0.5 rounded border border-[#111111]">
                  TARGET WORD
                </span>
              </div>

              {/* 4 Tactile Letter Boxes */}
              <div className="grid grid-cols-4 gap-2.5 sm:gap-3 my-1">
                {letters.map((char, index) => (
                  <div key={index} className="relative aspect-square">
                    <input
                      ref={inputRefs[index]}
                      type="text"
                      value={char}
                      onChange={(e) => handleLetterChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      maxLength={1}
                      className="w-full h-full text-center bg-[#a0f973] text-[#072100] font-black text-2xl sm:text-3xl uppercase rounded-xl border-[3px] border-[#111111] shadow-[3px_3px_0px_#111111] focus:bg-[#ffd7f0] focus:-translate-y-1 focus:shadow-[4px_4px_0px_#111111] focus:outline-none transition-all select-none caret-transparent"
                    />
                    <span className="absolute bottom-1 right-2 text-[10px] font-bold text-[#1d5200] pointer-events-none">
                      {letterPoints[char] || 1}
                    </span>
                  </div>
                ))}
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] font-bold text-[#54414e] mr-1">Presets:</span>
                {TARGET_PRESETS.slice(0, 4).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="bg-[#f0eee6] hover:bg-[#a0f973] text-[#111111] text-[11px] font-black px-2 py-1 rounded-md border border-[#111111] shadow-[1px_1px_0px_#111111] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                  >
                    {preset}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleRandomPreset}
                  className="bg-[#ffe17b] text-[#231b00] text-[11px] font-black px-2.5 py-1 rounded-md border border-[#111111] shadow-[1px_1px_0px_#111111] flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5 transition-all ml-auto"
                >
                  <span className="material-symbols-outlined text-[14px]">shuffle</span>
                  <span>Random</span>
                </button>
              </div>
            </div>

            {/* Submit Join Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#a0f973] text-[#072100] py-4 px-4 rounded-2xl font-black text-base uppercase tracking-wider border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 mt-1 disabled:opacity-50"
            >
              <span>{submitting ? 'JOINING ROOM...' : 'LOCK TARGET WORD & START GAME'}</span>
              <span className="material-symbols-outlined text-xl">login</span>
            </button>

          </form>
        )}

      </div>
    </div>
  );
}
