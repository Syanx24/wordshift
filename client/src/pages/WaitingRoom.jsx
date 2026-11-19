import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { roomApi } from '../services/api';
import { connectSocket, getSocket } from '../services/socket';
import { useGame } from '../context/GameContext';
import GamePlayScreen from '../components/GamePlayScreen';
import CountdownOverlay from '../components/CountdownOverlay';

const TARGET_PRESETS = ['WARM', 'TAIL', 'PLAY', 'DOCK', 'WIRE', 'STAR', 'MOON', 'DARK', 'FIRE', 'GOLD'];

export default function WaitingRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { session, saveSession, getSavedSessionForRoom } = useGame();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullError, setIsFullError] = useState(false);
  const [isExpiredError, setIsExpiredError] = useState(false);
  
  // Join form state for invited Player 2
  const [guestName, setGuestName] = useState('Player 2');
  const [guestLetters, setGuestLetters] = useState(['W', 'A', 'R', 'M']);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState(null);

  // Gameplay state
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [moveSubmitting, setMoveSubmitting] = useState(false);
  const [serverMoveError, setServerMoveError] = useState(null);

  // Real-time connection state
  const [socketConnected, setSocketConnected] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [incomingReaction, setIncomingReaction] = useState(null);

  const activeSession = session?.roomId === roomId?.toUpperCase() ? session : getSavedSessionForRoom(roomId?.toUpperCase());
  const socketRef = useRef(null);
  const guestInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const fetchRoomData = async () => {
    try {
      const data = await roomApi.getRoom(roomId);
      if (data.success && data.room) {
        setRoom(data.room);
        setError(null);

        if (data.room.status === 'ready_to_start') {
          setIsCountingDown(true);
        } else if (data.room.status === 'playing' || data.room.status === 'completed') {
          setIsCountingDown(false);
        }
        return data.room;
      } else {
        setError(data.error || 'Failed to fetch room');
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 410) {
        setIsExpiredError(true);
      } else if (status === 404) {
        setError('Room not found. Check the code or create a new room.');
      } else {
        setError(err.response?.data?.error || 'Unable to load room data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!roomId) return;
    fetchRoomData();

    const interval = setInterval(() => {
      fetchRoomData();
    }, 4000);

    return () => clearInterval(interval);
  }, [roomId]);

  // Handle Socket.IO connection & event subscription
  useEffect(() => {
    if (!roomId || !activeSession?.playerId) return;

    const socket = connectSocket();
    socketRef.current = socket;

    function handleConnect() {
      setSocketConnected(true);
      socket.emit('join-room', {
        roomId: roomId.toUpperCase(),
        playerId: activeSession.playerId
      }, (res) => {
        if (res?.success && res.room) {
          setRoom(res.room);
          if (res.room.status === 'ready_to_start') {
            setIsCountingDown(true);
          }
        }
      });
    }

    function handleDisconnect() {
      setSocketConnected(false);
    }

    function handlePlayerJoined(data) {
      if (data?.room) setRoom(data.room);
      if (data?.name) showToast(`${data.name} joined the room! ⚡`);
    }

    function handleTargetWordSubmitted(data) {
      if (data?.room) setRoom(data.room);
      showToast('Target word locked! Ready to shift...');
    }

    function handleGameReady(data) {
      if (data?.room) setRoom(data.room);
      setIsCountingDown(true);
    }

    function handleGameStart(data) {
      setIsCountingDown(false);
      if (data?.room) setRoom(data.room);
      showToast('Game Started! Player 1 goes first.');
    }

    function handleWordAccepted(data) {
      setServerMoveError(null);
      if (data?.currentWord) {
        setRoom(prev => prev ? {
          ...prev,
          currentWord: data.currentWord,
          wordHistory: data.wordHistory || prev.wordHistory,
          currentTurn: data.nextTurn || prev.currentTurn,
          totalMoves: data.totalMoves !== undefined ? data.totalMoves : prev.totalMoves + 1
        } : prev);
      }
    }

    function handleWordRejected(data) {
      if (data?.error) {
        setServerMoveError(data.error);
      }
    }

    function handleTurnChanged(data) {
      if (data?.currentTurn) {
        setRoom(prev => prev ? { ...prev, currentTurn: data.currentTurn } : prev);
      }
    }

    function handleGameOver(data) {
      if (data?.room) {
        setRoom(data.room);
      } else if (data?.winner) {
        setRoom(prev => prev ? {
          ...prev,
          status: 'completed',
          winner: data.winner,
          winnerName: data.winnerName,
          duration: data.duration,
          totalMoves: data.totalMoves
        } : prev);
      }
    }

    function handleGameStateUpdated(data) {
      if (data?.room) {
        setRoom(data.room);
        if (data.room.status === 'playing' || data.room.status === 'completed') {
          setIsCountingDown(false);
        } else if (data.room.status === 'ready_to_start') {
          setIsCountingDown(true);
        }
      }
    }

    function handleRematchRequested(data) {
      if (data?.room) setRoom(data.room);
      if (data?.requesterName) showToast(`${data.requesterName} requested a rematch!`);
    }

    function handleRematchDeclined(data) {
      if (data?.room) setRoom(data.room);
      if (data?.declinerName) showToast(`${data.declinerName} declined the rematch.`);
    }

    function handleRematchStarted(data) {
      if (data?.room) {
        setRoom(data.room);
        setIsCountingDown(false);
        setServerMoveError(null);
        if (data.swapped && activeSession?.playerId) {
          const newRole = data.room.player1.playerId === activeSession.playerId ? 'player1' : 'player2';
          const myName = newRole === 'player1' ? data.room.player1.name : data.room.player2?.name;
          saveSession(data.room.roomId, activeSession.playerId, newRole, myName);
        }
        showToast('Rematch accepted! Choose your target word.');
      }
    }

    function handlePlayerDisconnected(data) {
      if (data?.room) setRoom(data.room);
      if (data?.name) showToast(`${data.name} disconnected`);
    }

    function handlePlayerReconnected(data) {
      if (data?.room) setRoom(data.room);
      if (data?.name) showToast(`${data.name} reconnected!`);
    }

    function handlePlayerReaction(data) {
      if (data?.emoji) {
        setIncomingReaction(data);
      }
    }

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }

    socket.on('disconnect', handleDisconnect);
    socket.on('player-joined', handlePlayerJoined);
    socket.on('target-word-submitted', handleTargetWordSubmitted);
    socket.on('game-ready', handleGameReady);
    socket.on('game-start', handleGameStart);
    socket.on('word-accepted', handleWordAccepted);
    socket.on('word-rejected', handleWordRejected);
    socket.on('turn-changed', handleTurnChanged);
    socket.on('game-over', handleGameOver);
    socket.on('game-state-updated', handleGameStateUpdated);
    socket.on('rematch-requested', handleRematchRequested);
    socket.on('rematch-declined', handleRematchDeclined);
    socket.on('rematch-started', handleRematchStarted);
    socket.on('player-disconnected', handlePlayerDisconnected);
    socket.on('player-reconnected', handlePlayerReconnected);
    socket.on('player-reaction', handlePlayerReaction);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('player-joined', handlePlayerJoined);
      socket.off('target-word-submitted', handleTargetWordSubmitted);
      socket.off('game-ready', handleGameReady);
      socket.off('game-start', handleGameStart);
      socket.off('word-accepted', handleWordAccepted);
      socket.off('word-rejected', handleWordRejected);
      socket.off('turn-changed', handleTurnChanged);
      socket.off('game-over', handleGameOver);
      socket.off('game-state-updated', handleGameStateUpdated);
      socket.off('rematch-requested', handleRematchRequested);
      socket.off('rematch-declined', handleRematchDeclined);
      socket.off('rematch-started', handleRematchStarted);
      socket.off('player-disconnected', handlePlayerDisconnected);
      socket.off('player-reconnected', handlePlayerReconnected);
      socket.off('player-reaction', handlePlayerReaction);
    };
  }, [roomId, activeSession?.playerId]);

  const handleGuestLetterChange = (index, val) => {
    const char = val.toUpperCase().replace(/[^A-Z]/g, '').slice(-1);
    const updated = [...guestLetters];
    updated[index] = char;
    setGuestLetters(updated);
    setJoinError(null);

    if (char && index < 3) {
      guestInputRefs[index + 1].current?.focus();
    }
  };

  const handleGuestKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !guestLetters[index] && index > 0) {
      guestInputRefs[index - 1].current?.focus();
    }
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    setJoinError(null);

    if (!guestName.trim()) {
      setJoinError('Please enter your alias.');
      return;
    }

    const cleanTarget = guestLetters.join('').toUpperCase();
    if (cleanTarget.length !== 4) {
      setJoinError('Target word must be exactly 4 letters.');
      return;
    }

    if (room && cleanTarget === room.startingWord.toUpperCase()) {
      setJoinError('Starting word and target word must be different.');
      return;
    }

    setJoinLoading(true);

    try {
      const response = await roomApi.joinRoom(roomId, {
        name: guestName.trim(),
        targetWord: cleanTarget
      });

      if (response.success && response.room) {
        saveSession(roomId.toUpperCase(), response.playerId, 'player2', guestName.trim());
        setRoom(response.room);
        if (response.room.status === 'ready_to_start') {
          setIsCountingDown(true);
        }
      } else {
        setJoinError(response.error || 'Failed to join room.');
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        setIsFullError(true);
      } else {
        setJoinError(err.response?.data?.error || 'Failed to join game room.');
      }
    } finally {
      setJoinLoading(false);
    }
  };

  const handleSubmitMove = async (word) => {
    if (!room || !activeSession?.playerId) return;

    setMoveSubmitting(true);
    setServerMoveError(null);

    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('submit-word', {
        roomId: room.roomId,
        playerId: activeSession.playerId,
        word
      }, (ack) => {
        setMoveSubmitting(false);
        if (ack && !ack.success) {
          setServerMoveError(ack.error || 'Move was rejected.');
        } else if (ack?.room) {
          setRoom(ack.room);
        }
      });
    } else {
      try {
        const res = await roomApi.submitMove(room.roomId, {
          playerId: activeSession.playerId,
          word
        });
        if (res.success && res.room) {
          setRoom(res.room);
        } else {
          setServerMoveError(res.error || 'Failed to submit move.');
        }
      } catch (err) {
        setServerMoveError(err.response?.data?.error || 'Network error submitting move.');
      } finally {
        setMoveSubmitting(false);
      }
    }
  };

  const handleCountdownFinished = async () => {
    setIsCountingDown(false);
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('start-game', { roomId: room.roomId });
    } else {
      try {
        await roomApi.startGame(room.roomId);
      } catch (e) {
        console.warn('Fallback start game error:', e);
      }
    }
  };

  const handleRequestRematch = async (swapRoles = false) => {
    if (!room || !activeSession?.playerId) return;
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('request-rematch', {
        roomId: room.roomId,
        playerId: activeSession.playerId,
        swapRoles: !!swapRoles
      });
    } else {
      try {
        const res = await roomApi.requestRematch(room.roomId, {
          playerId: activeSession.playerId,
          swapRoles: !!swapRoles
        });
        if (res.success && res.room) setRoom(res.room);
      } catch (err) {
        console.error('Request rematch error:', err);
      }
    }
  };

  const handleRespondRematch = async (accept) => {
    if (!room || !activeSession?.playerId) return;
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('respond-rematch', {
        roomId: room.roomId,
        playerId: activeSession.playerId,
        accept: !!accept
      });
    } else {
      try {
        const res = await roomApi.respondRematch(room.roomId, {
          playerId: activeSession.playerId,
          accept: !!accept
        });
        if (res.success && res.room) setRoom(res.room);
      } catch (err) {
        console.error('Respond rematch error:', err);
      }
    }
  };

  const handleTerminateGame = async () => {
    if (!room || !activeSession?.playerId) return;
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('terminate-game', {
        roomId: room.roomId,
        playerId: activeSession.playerId
      }, (res) => {
        if (res?.room) setRoom(res.room);
      });
    } else {
      try {
        const res = await roomApi.terminateGame(room.roomId, {
          playerId: activeSession.playerId
        });
        if (res?.room) setRoom(res.room);
      } catch (e) {
        console.error('Terminate game error:', e);
      }
    }
  };

  const handleSendReaction = (emoji) => {
    const targetRoomId = (room?.roomId || roomId)?.toUpperCase();
    if (!targetRoomId) return;

    const senderName = activeSession?.playerName || activeSession?.name || (activeSession?.role === 'player1' ? room?.player1?.name : room?.player2?.name) || 'Player';
    const socket = connectSocket();
    if (socket) {
      socket.emit('send-reaction', {
        roomId: targetRoomId,
        emoji,
        senderName,
        senderPlayerId: activeSession?.playerId,
        senderRole: activeSession?.role || 'player'
      });
    }
  };

  const copyRoomCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId.toUpperCase());
      showToast(`Room code #${roomId.toUpperCase()} copied!`);
    }
  };

  const shareLink = (type) => {
    const url = `${window.location.origin}/join/${roomId?.toUpperCase()}`;
    if (type === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Play Wordshift with me! Join room #${roomId?.toUpperCase()}: ${url}`)}`, '_blank');
    } else {
      navigator.clipboard.writeText(url);
      showToast('Invite link copied to clipboard!');
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-[#ab0e97] animate-spin">progress_activity</span>
          <span className="text-sm font-black uppercase text-[#111111]">Connecting to room #{roomId}...</span>
        </div>
      </div>
    );
  }

  // 2. Expired Room Error
  if (isExpiredError) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#ffdad6] p-6 rounded-2xl border-[3px] border-[#ba1a1a] shadow-[4px_4px_0px_#ba1a1a] text-center flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-[#ba1a1a]">schedule</span>
          <h2 className="text-xl font-black uppercase text-[#93000a]">Room Expired</h2>
          <p className="text-xs font-semibold text-[#93000a]">This match expired after 24 hours.</p>
          <Link to="/create" className="mt-2 bg-white text-[#ba1a1a] px-4 py-2 rounded-xl border-2 border-[#ba1a1a] shadow-[2px_2px_0px_#ba1a1a] text-xs font-black uppercase">
            Create New Room
          </Link>
        </div>
      </div>
    );
  }

  // 3. Room Full Error
  if (isFullError) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] text-center flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-[#715c00]">group_off</span>
          <h2 className="text-xl font-black uppercase text-[#111111]">Room is Full</h2>
          <p className="text-xs font-medium text-[#54414e]">2 players have already taken their seats in this room.</p>
          <Link to="/create" className="mt-2 bg-[#ffe17b] text-[#231b00] px-5 py-2.5 rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_#111111] text-xs font-black uppercase">
            Create Your Own Room
          </Link>
        </div>
      </div>
    );
  }

  // 4. Render Active Game Play Screen if status is playing or completed
  if (room && (room.status === 'playing' || room.status === 'completed')) {
    return (
      <>
        <GamePlayScreen
          room={room}
          session={activeSession}
          socketConnected={socketConnected}
          onSubmitMove={handleSubmitMove}
          isSubmitting={moveSubmitting}
          serverError={serverMoveError}
          onRequestRematch={handleRequestRematch}
          onRespondRematch={handleRespondRematch}
          onTerminateGame={handleTerminateGame}
          onSendReaction={handleSendReaction}
          incomingReaction={incomingReaction}
        />
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 left-4 right-4 max-w-sm mx-auto bg-[#111111] text-white p-3.5 rounded-xl border-2 border-white shadow-[4px_4px_0px_#111111] flex items-center justify-between gap-3 z-50">
            <span className="text-xs font-bold uppercase">{toastMessage}</span>
            <span className="bg-[#f45bd7] text-[#3a0032] text-[10px] font-black px-2 py-0.5 rounded">YAY</span>
          </div>
        )}
      </>
    );
  }

  // 5. Render Stitch Neo-Brutalist Waiting Room (Lobby)
  const isHost = activeSession?.role === 'player1' || (room && room.player1?.playerId === activeSession?.playerId);
  const isJoinedPlayer2 = activeSession?.role === 'player2' || (room && room.player2?.playerId === activeSession?.playerId);
  const showJoinForm = !isHost && !isJoinedPlayer2;

  return (
    <div className="w-full bg-[#fbf9f1] pb-16 min-h-[calc(100vh-5rem)]">
      
      {/* Countdown Overlay when transition happens */}
      {isCountingDown && (
        <CountdownOverlay onFinished={handleCountdownFinished} />
      )}

      <div className="max-w-md sm:max-w-lg mx-auto px-4 pt-4 flex flex-col gap-4 select-none">
        
        {/* Big Hot Pink Header Banner */}
        <div className="bg-[#f45bd7] text-[#111111] rounded-2xl p-5 border-[3px] border-[#111111] shadow-[5px_5px_0px_#111111] relative overflow-hidden">
          <div className="absolute -top-1 -right-7 bg-[#ffe17b] text-[#231b00] text-[10px] font-black px-7 py-1 rotate-45 border border-[#111111] shadow-[1px_1px_0px_#111111] uppercase">
            LOBBY LIVE
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-2xl animate-bounce text-[#111111]">bolt</span>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#111111]">
              YOUR ROOM IS READY!
            </h2>
          </div>
          <p className="text-xs font-bold text-[#5f0053] max-w-[270px]">
            Keep this page open! Player 2 must enter the room code to set the target word.
          </p>
        </div>

        {/* Room Code Action Center */}
        <div className="bg-white text-[#111111] rounded-2xl p-4 border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] flex flex-col items-center gap-3">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#54414e]">
            ROOM INVITE CODE
          </span>
          <div className="w-full bg-[#f0eee6] py-3 px-4 rounded-xl border-2 border-[#111111] shadow-[3px_3px_0px_#111111] flex items-center justify-between">
            <span className="font-black text-2xl tracking-widest text-[#ab0e97]">
              #{roomId?.toUpperCase()}
            </span>
            <button
              onClick={copyRoomCode}
              className="bg-[#a0f973] text-[#072100] text-xs font-black px-3 py-1.5 rounded-lg border-2 border-[#111111] shadow-[2px_2px_0px_#111111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all uppercase flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm font-bold">content_copy</span>
              <span>COPY</span>
            </button>
          </div>

          {/* Social Sharing Row */}
          <div className="grid grid-cols-2 gap-2.5 w-full mt-1">
            <button
              onClick={() => shareLink('whatsapp')}
              className="bg-[#a0f973] text-[#072100] py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider border-2 border-[#111111] shadow-[3px_3px_0px_#111111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">chat</span>
              <span>WHATSAPP</span>
            </button>
            <button
              onClick={() => shareLink('link')}
              className="bg-[#eae8e0] text-[#111111] py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider border-2 border-[#111111] shadow-[3px_3px_0px_#111111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">share</span>
              <span>SHARE LINK</span>
            </button>
          </div>
        </div>

        {/* Head-to-Head Status Board */}
        <div className="bg-[#f5f4ec] text-[#111111] rounded-2xl p-4 border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#54414e]">
              HEAD-TO-HEAD SETUP
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#ab0e97] uppercase animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#ab0e97]" />
              LISTENING FOR SYNC...
            </span>
          </div>

          {/* Versus Cards */}
          <div className="grid grid-cols-2 gap-3 items-stretch">
            {/* Player 1 Card */}
            <div className="bg-white rounded-xl p-3 border-2 border-[#111111] shadow-[3px_3px_0px_#111111] flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#ffd7f0] border border-[#111111] flex items-center justify-center text-lg">
                  🍔
                </div>
                <div className="min-w-0">
                  <p className="font-black text-xs uppercase truncate text-[#111111]">
                    {room?.player1?.name || 'Player 1'}
                  </p>
                  <p className="text-[10px] font-black text-[#296c00]">READY</p>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-[10px] font-bold text-[#54414e] block uppercase">Start Word</span>
                <div className="flex gap-1 mt-1">
                  {(room?.startingWord || 'BARK').split('').map((c, i) => (
                    <span key={i} className="w-6 h-7 bg-[#ffe17b] text-[#231b00] rounded border border-[#111111] font-black text-xs flex items-center justify-center shadow-[1px_1px_0px_#111111]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Player 2 Card */}
            <div className={`rounded-xl p-3 border-2 shadow-[3px_3px_0px_#111111] flex flex-col justify-between ${
              room?.player2?.name
                ? 'bg-white border-[#111111]'
                : 'bg-[#eae8e0] border-dashed border-[#87717e]'
            }`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#e4e3db] border border-[#111111] flex items-center justify-center text-lg">
                  {room?.player2?.name ? '🍕' : '💬'}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-xs uppercase truncate text-[#111111]">
                    {room?.player2?.name || 'PLAYER 2'}
                  </p>
                  <p className={`text-[10px] font-black ${room?.player2?.name ? 'text-[#296c00]' : 'text-[#ba1a1a]'}`}>
                    {room?.player2?.name ? 'READY' : 'WAITING...'}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-[10px] font-bold text-[#54414e] block uppercase">Target Word</span>
                <div className="flex gap-1 mt-1">
                  {(room?.targetWord || '????').split('').map((c, i) => (
                    <span key={i} className="w-6 h-7 bg-white text-[#111111] rounded border border-[#111111] font-black text-xs flex items-center justify-center shadow-[1px_1px_0px_#111111]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inline Join Form for Visiting Guest */}
        {showJoinForm && (
          <form onSubmit={handleJoinSubmit} className="bg-white p-4 rounded-2xl border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] flex flex-col gap-3">
            <span className="text-xs font-black uppercase text-[#ab0e97]">
              JOIN AS PLAYER 2 & SET TARGET WORD
            </span>

            {joinError && (
              <div className="p-2 bg-[#ffdad6] border border-[#ba1a1a] text-[#93000a] text-xs font-bold rounded-lg">
                {joinError}
              </div>
            )}

            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="YOUR NAME"
              maxLength={16}
              className="bg-[#f5f4ec] font-bold text-sm px-3 py-2 rounded-xl border-2 border-[#111111] outline-none"
            />

            <div>
              <label className="text-[11px] font-bold text-[#54414e] block mb-1">
                4-Letter Target Goal Word
              </label>
              <div className="grid grid-cols-4 gap-2">
                {guestLetters.map((char, idx) => (
                  <input
                    key={idx}
                    ref={guestInputRefs[idx]}
                    type="text"
                    value={char}
                    onChange={(e) => handleGuestLetterChange(idx, e.target.value)}
                    onKeyDown={(e) => handleGuestKeyDown(idx, e)}
                    maxLength={1}
                    className="w-full aspect-square text-center bg-[#a0f973] text-[#072100] font-black text-2xl uppercase rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_#111111] focus:outline-none"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={joinLoading}
              className="w-full bg-[#a0f973] text-[#072100] py-3 rounded-xl font-black text-sm uppercase border-2 border-[#111111] shadow-[3px_3px_0px_#111111] active:translate-x-0.5 active:translate-y-0.5 transition-all mt-1"
            >
              {joinLoading ? 'JOINING...' : 'ENTER MATCH WITH TARGET WORD'}
            </button>
          </form>
        )}

        {/* Mascot Waiting Moment Card */}
        <div className="bg-white rounded-2xl p-4 border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-[#ffd7f0] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center justify-center text-3xl shrink-0">
            🍔
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm uppercase text-[#111111]">
              WAITING FOR PLAYER 2...
            </p>
            <p className="text-xs text-[#54414e] font-semibold mt-0.5 leading-snug">
              “Player 2 will set the goal word. Work together to reach it one letter at a time!”
            </p>
          </div>
        </div>

        {/* Share Invite Sticky Button */}
        <button
          onClick={() => shareLink('link')}
          className="w-full bg-[#a0f973] text-[#072100] py-4 px-4 rounded-2xl font-black text-base uppercase tracking-wider border-[3px] border-[#111111] shadow-[4px_4px_0px_#111111] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-2xl">send</span>
          <span>INVITE PLAYER 2 ⚡</span>
        </button>

      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-4 right-4 max-w-sm mx-auto bg-[#111111] text-white p-3.5 rounded-xl border-2 border-white shadow-[4px_4px_0px_#111111] flex items-center justify-between gap-3 z-50">
          <span className="text-xs font-bold uppercase">{toastMessage}</span>
          <span className="bg-[#f45bd7] text-[#3a0032] text-[10px] font-black px-2 py-0.5 rounded">YAY</span>
        </div>
      )}

    </div>
  );
}
