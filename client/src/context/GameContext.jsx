import React, { createContext, useContext, useState, useEffect } from 'react';

const GameContext = createContext();

export function GameProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const stored = sessionStorage.getItem('wordshift-session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const saveSession = (roomId, playerId, role, playerName) => {
    const data = { roomId, playerId, role, playerName, timestamp: Date.now() };
    setSession(data);
    try {
      sessionStorage.setItem('wordshift-session', JSON.stringify(data));
      // Also persist to localStorage keyed by roomId for easy recovery if tab duplicated
      localStorage.setItem(`wordshift-player-${roomId}`, JSON.stringify(data));
    } catch (e) {
      console.warn('Session storage write error', e);
    }
  };

  const getSavedSessionForRoom = (roomId) => {
    if (!roomId) return null;
    if (session && session.roomId === roomId) return session;
    try {
      const stored = localStorage.getItem(`wordshift-player-${roomId}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const clearSession = (roomId) => {
    setSession(null);
    try {
      sessionStorage.removeItem('wordshift-session');
      if (roomId) {
        localStorage.removeItem(`wordshift-player-${roomId}`);
      }
    } catch (e) {
      console.warn('Session storage clear error', e);
    }
  };

  return (
    <GameContext.Provider value={{ session, saveSession, getSavedSessionForRoom, clearSession }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
