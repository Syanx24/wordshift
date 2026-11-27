import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import HowToPlayModal from './HowToPlayModal';
import { isSoundEnabled, setSoundEnabled } from '../utils/sound';

export default function Navbar() {
  const location = useLocation();
  const { session } = useGame();
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [soundEnabled, setSoundEnabledState] = useState(isSoundEnabled);

  useEffect(() => {
    const handleToggle = (e) => {
      setSoundEnabledState(e.detail?.enabled ?? isSoundEnabled());
    };
    window.addEventListener('wordshift-sound-toggle', handleToggle);
    return () => window.removeEventListener('wordshift-sound-toggle', handleToggle);
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabledState(next);
    setSoundEnabled(next);
  };

  // Check if inside a room
  const roomPathMatch = location.pathname.match(/\/room\/([A-Za-z0-9]+)/);
  const currentRoomId = roomPathMatch ? roomPathMatch[1].toUpperCase() : (session?.roomId || 'WORD');

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#fbf9f1]/95 backdrop-blur-xl border-b-2 border-[#111111]">
        <div className="max-w-5xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo Badge (Rotated -2deg) */}
          <Link to="/" className="flex items-center group">
            <div className="bg-[#f45bd7] text-[#111111] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border-2 border-[#111111] shadow-[2px_2px_0px_#111111] -rotate-2 group-hover:rotate-0 transition-transform flex items-center gap-1.5 shrink-0">
              <span className="material-symbols-outlined text-[18px] sm:text-[20px] font-bold text-[#111111]">
                swap_horiz
              </span>
              <span className="font-extrabold text-base sm:text-lg tracking-tight uppercase leading-none">
                WORDSHIFT
              </span>
            </div>
          </Link>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Sound Toggle Button */}
            <button
              onClick={toggleSound}
              aria-label="Toggle sound"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center justify-center text-[#111111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              title={soundEnabled ? 'Mute audio' : 'Unmute audio'}
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                {soundEnabled ? 'volume_up' : 'volume_off'}
              </span>
            </button>

            {/* Rules Button */}
            <button
              onClick={() => setShowHowToPlay(true)}
              aria-label="Game rules and guide"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center justify-center text-[#111111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              title="Game Rules"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                menu_book
              </span>
            </button>



            {/* Profile Avatar Pill */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#ab0e97] border-2 border-[#111111] flex items-center justify-center text-white shadow-[2px_2px_0px_#111111] shrink-0 font-bold text-xs uppercase">
              {session?.name ? session.name.charAt(0).toUpperCase() : (
                <span className="material-symbols-outlined text-white text-[18px]">
                  person
                </span>
              )}
            </div>
          </div>

        </div>
      </header>

      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />
    </>
  );
}
