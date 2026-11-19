import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { roomApi } from '../services/api';
import { useGame } from '../context/GameContext';

const START_PRESETS = ['BARK', 'COLD', 'HEAD', 'WORK', 'SHIP', 'FIRE', 'MOON', 'GAME', 'PLAY', 'DARK'];
const MASCOTS = ['🍔', '🍟', '🌭', '🍕', '🍩'];

export default function CreateRoom() {
  const navigate = useNavigate();
  const { saveSession } = useGame();

  const [name, setName] = useState('Player 1');
  const [selectedMascot, setSelectedMascot] = useState('🍔');
  const [letters, setLetters] = useState(['B', 'A', 'R', 'K']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const letterPoints = {
    A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
    N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
  };

  const handleLetterChange = (index, val) => {
    const char = val.toUpperCase().replace(/[^A-Z]/g, '').slice(-1);
    const updated = [...letters];
    updated[index] = char;
    setLetters(updated);
    setError(null);

    // Auto advance to next tile
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
    const randomWord = START_PRESETS[Math.floor(Math.random() * START_PRESETS.length)];
    handleApplyPreset(randomWord);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your player alias.');
      return;
    }

    const startingWord = letters.join('').toUpperCase();
    if (startingWord.length !== 4) {
      setError('Starting word must be exactly 4 letters.');
      return;
    }

    setLoading(true);

    try {
      const response = await roomApi.createRoom({
        name: name.trim(),
        startingWord: startingWord,
      });

      if (response.success && response.roomId) {
        saveSession(response.roomId, response.playerId, 'player1', name.trim());
        navigate(`/room/${response.roomId}`);
      } else {
        setError(response.error || 'Failed to create room.');
      }
    } catch (err) {
      console.error('Room creation failed:', err);
      const apiError = err.response?.data?.error || err.message || 'Failed to create room. Please try again.';
      setError(apiError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#fbf9f1] pb-16 min-h-[calc(100vh-5rem)]">
      <div className="max-w-md sm:max-w-lg mx-auto px-4 pt-4 flex flex-col gap-5 select-none">
        
        {/* Ambient Decorative Retro Mode Toggle Bar */}
        <div className="w-full bg-[#e4e3db] rounded-2xl p-1.5 flex items-center justify-between border-2 border-[#111111] shadow-[3px_3px_0px_#111111] overflow-hidden">
          <button
            type="button"
            className="flex-1 py-2 px-3 bg-[#f45bd7] text-[#111111] rounded-xl font-black text-xs uppercase tracking-wider text-center border-2 border-[#111111] shadow-[2px_2px_0px_#111111]"
          >
            CREATE ROOM (P1)
          </button>
          <Link
            to="/join"
            className="flex-1 py-2 px-3 text-[#54414e] font-black text-xs uppercase tracking-wider text-center hover:text-[#111111] transition-colors"
          >
            JOIN ROOM (P2)
          </Link>
        </div>

        {/* Hero Banner Card with rubberhose decorative icon */}
        <div className="relative bg-[#a0f973] text-[#072100] rounded-2xl p-5 border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] overflow-hidden">
          <div className="absolute -right-4 -bottom-6 w-28 h-28 opacity-20 pointer-events-none text-[#072100]">
            <svg fill="currentColor" viewBox="0 0 100 100">
              <circle cx="35" cy="50" fill="#111111" r="18" />
              <circle cx="42" cy="46" fill="#ffffff" r="6" />
              <circle cx="68" cy="50" fill="#111111" r="18" />
              <circle cx="75" cy="46" fill="#ffffff" r="6" />
              <path d="M 30 75 Q 50 92 70 75" fill="none" stroke="#111111" strokeLinecap="round" strokeWidth="6" />
            </svg>
          </div>
          
          <div className="inline-block bg-white text-[#111111] px-2.5 py-0.5 rounded-md font-black text-[11px] uppercase border-2 border-[#111111] shadow-[2px_2px_0px_#111111] -rotate-2 mb-2">
            ROOM BUILDER ⚡
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-[#072100] leading-tight tracking-tight">
            LET'S START<br />THE SHIFT!
          </h1>
          <p className="text-xs font-semibold mt-1 text-[#1d5200] max-w-[280px]">
            Pick your 4-letter starting word. Player 2 will set the destination target word!
          </p>
        </div>

        {/* Error Alert if any */}
        {error && (
          <div className="p-3 bg-[#ffdad6] border-2 border-[#ba1a1a] text-[#93000a] rounded-xl shadow-[2px_2px_0px_#ba1a1a] text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* P1 Identity & Avatar Picker */}
          <div className="bg-white text-[#111111] rounded-2xl p-4 border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label htmlFor="p1-name" className="text-xs font-black uppercase tracking-wide text-[#111111]">
                Player 1 Alias
              </label>
              <span className="bg-[#ffe17b] text-[#231b00] font-black text-[10px] px-2 py-0.5 rounded border border-[#111111] shadow-[1px_1px_0px_#111111] uppercase">
                PLAYER 1
              </span>
            </div>

            <input
              id="p1-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={16}
              placeholder="ENTER YOUR NAME"
              className="w-full bg-[#f5f4ec] text-[#111111] font-bold text-base px-3.5 py-2.5 rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_#111111] focus:bg-white focus:outline-none transition-all placeholder:text-[#87717e]/50"
            />

            {/* Avatar Selector Carousel */}
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

          {/* 4-Letter Start Word Input */}
          <div className="bg-white text-[#111111] rounded-2xl p-4 border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wide text-[#111111]">
                4-Letter Starting Word
              </label>
              <span className="text-[10px] font-black text-[#296c00] uppercase tracking-wider bg-[#a0f973] px-2 py-0.5 rounded border border-[#111111]">
                DICTIONARY VERIFIED
              </span>
            </div>

            {/* 4 Tactile Letter Boxes with Scrabble Points */}
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
                    className="w-full h-full text-center bg-[#ffe17b] text-[#231b00] font-black text-2xl sm:text-3xl uppercase rounded-xl border-[3px] border-[#111111] shadow-[3px_3px_0px_#111111] focus:bg-[#ffd7f0] focus:-translate-y-1 focus:shadow-[4px_4px_0px_#111111] focus:outline-none transition-all select-none caret-transparent"
                  />
                  <span className="absolute bottom-1 right-2 text-[10px] font-bold text-[#715c00] pointer-events-none">
                    {letterPoints[char] || 1}
                  </span>
                </div>
              ))}
            </div>

            {/* Preset Suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] font-bold text-[#54414e] mr-1">Presets:</span>
              {['COLD', 'FIRE', 'DARK', 'PLAY'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="bg-[#f0eee6] hover:bg-[#ffe17b] text-[#111111] text-[11px] font-black px-2 py-1 rounded-md border border-[#111111] shadow-[1px_1px_0px_#111111] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  {preset}
                </button>
              ))}
              <button
                type="button"
                onClick={handleRandomPreset}
                className="bg-[#a0f973] text-[#072100] text-[11px] font-black px-2.5 py-1 rounded-md border border-[#111111] shadow-[1px_1px_0px_#111111] flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5 transition-all ml-auto"
              >
                <span className="material-symbols-outlined text-[14px]">shuffle</span>
                <span>Random</span>
              </button>
            </div>

            {/* Rule Sticker Badge */}
            <div className="bg-[#ffe17b] text-[#231b00] p-2.5 rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center gap-2 mt-1 rotate-[0.5deg]">
              <span className="material-symbols-outlined text-base">verified</span>
              <span className="text-[10px] font-black uppercase tracking-wider">
                PLAYER 1 CHOOSES STARTING WORD ONLY
              </span>
            </div>
          </div>

          {/* Launch Room Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f45bd7] text-[#111111] py-4 px-4 rounded-2xl font-black text-base uppercase tracking-wider border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 mt-1 disabled:opacity-50"
          >
            <span>{loading ? 'CREATING ROOM...' : 'LOCK START WORD & LAUNCH ROOM'}</span>
            <span className="material-symbols-outlined text-xl">arrow_forward</span>
          </button>

        </form>

      </div>
    </div>
  );
}
