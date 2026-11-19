import crypto from 'crypto';
import { Room } from '../models/Room.js';
import { dictionaryService } from '../services/dictionaryService.js';
import { wordValidationService } from '../services/wordValidationService.js';
import { broadcastRoomEvent, getIO } from '../sockets/roomSocket.js';

// Helper to generate a friendly 6-character uppercase room ID (e.g., ABCD12)
function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 24 hour expiration limit
const ROOM_EXPIRY_MS = 24 * 60 * 60 * 1000;

export const roomController = {
  /**
   * POST /api/rooms
   * Create a new room with Player 1 (startingWord only)
   */
  async createRoom(req, res) {
    try {
      const { name, startingWord } = req.body;

      // 1. Validate Player 1 name
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Player name is required and cannot be empty.'
        });
      }

      const trimmedName = name.trim();
      if (trimmedName.length > 30) {
        return res.status(400).json({
          success: false,
          error: 'Player name cannot exceed 30 characters.'
        });
      }

      // 2. Validate starting word with dictionaryService
      const wordValidation = dictionaryService.validateWord(startingWord);
      if (!wordValidation.valid) {
        return res.status(400).json({
          success: false,
          error: `Starting word: ${wordValidation.error}`
        });
      }

      // 3. Generate unique Room ID
      let roomId = generateRoomId();
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        const existing = await Room.findOne({ roomId });
        if (!existing) {
          isUnique = true;
        } else {
          roomId = generateRoomId();
          attempts++;
        }
      }

      if (!isUnique) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate a unique room ID. Please try again.'
        });
      }

      // 4. Create Player 1 identity
      const player1Id = crypto.randomUUID();

      // 5. Construct room model (Player 1 owns starting word; status is waiting_for_player2)
      const room = new Room({
        roomId,
        player1: {
          playerId: player1Id,
          name: trimmedName,
          connectionStatus: 'connected',
          socketId: null,
          ready: false
        },
        player2: null,
        startingWord: wordValidation.sanitized,
        targetWord: null, // To be entered by Player 2
        currentWord: wordValidation.sanitized,
        wordHistory: [],
        currentTurn: 'player1',
        status: 'waiting_for_player2',
        winner: null,
        winnerName: null,
        totalMoves: 0,
        duration: 0,
        createdAt: new Date(),
        lastActivityAt: new Date()
      });

      await room.save();

      return res.status(201).json({
        success: true,
        message: 'Room created successfully',
        roomId: room.roomId,
        playerId: player1Id,
        room
      });
    } catch (err) {
      console.error('[createRoom] Error:', err);
      return res.status(500).json({
        success: false,
        error: 'An internal server error occurred while creating the room.'
      });
    }
  },

  /**
   * GET /api/rooms/:roomId
   * Fetch room details by ID
   */
  async getRoom(req, res) {
    try {
      const { roomId } = req.params;

      if (!roomId || typeof roomId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'A valid room ID is required.'
        });
      }

      const formattedRoomId = roomId.trim().toUpperCase();
      const room = await Room.findOne({ roomId: formattedRoomId });

      if (!room) {
        return res.status(404).json({
          success: false,
          error: 'Room not found. Please check the room code or invite link.'
        });
      }

      // Check if room is expired (e.g., > 24 hours without completion)
      const now = Date.now();
      const roomTime = new Date(room.createdAt).getTime();
      if (now - roomTime > ROOM_EXPIRY_MS && room.status !== 'completed') {
        room.status = 'expired';
        await room.save();
        return res.status(410).json({
          success: false,
          error: 'This room has expired because it was created more than 24 hours ago.'
        });
      }

      return res.status(200).json({
        success: true,
        room
      });
    } catch (err) {
      console.error('[getRoom] Error:', err);
      return res.status(500).json({
        success: false,
        error: 'An internal server error occurred while retrieving the room.'
      });
    }
  },

  /**
   * POST /api/rooms/:roomId/join
   * Player 2 joins an existing room (and optionally provides targetWord)
   */
  async joinRoom(req, res) {
    try {
      const { roomId } = req.params;
      const { name, targetWord, playerId: existingPlayerId } = req.body;

      if (!roomId || typeof roomId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'A valid room ID is required.'
        });
      }

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Player name is required.'
        });
      }

      const trimmedName = name.trim();
      if (trimmedName.length > 30) {
        return res.status(400).json({
          success: false,
          error: 'Player name cannot exceed 30 characters.'
        });
      }

      const formattedRoomId = roomId.trim().toUpperCase();
      const room = await Room.findOne({ roomId: formattedRoomId });

      if (!room) {
        return res.status(404).json({
          success: false,
          error: 'Room does not exist.'
        });
      }

      // Check expired room
      const now = Date.now();
      const roomTime = new Date(room.createdAt).getTime();
      if (now - roomTime > ROOM_EXPIRY_MS && room.status !== 'completed') {
        return res.status(410).json({
          success: false,
          error: 'This room has expired.'
        });
      }

      // Prevent duplicate player identity: if requester is already Player 1
      if (existingPlayerId && room.player1.playerId === existingPlayerId) {
        return res.status(400).json({
          success: false,
          error: 'You are already registered as Player 1 in this room.'
        });
      }

      // Reconnection for existing Player 2
      if (room.player2 && room.player2.playerId) {
        if (existingPlayerId && room.player2.playerId === existingPlayerId) {
          room.player2.connectionStatus = 'connected';
          room.lastActivityAt = new Date();
          await room.save();

          return res.status(200).json({
            success: true,
            message: 'Reconnected to room',
            roomId: room.roomId,
            playerId: room.player2.playerId,
            room
          });
        }

        return res.status(409).json({
          success: false,
          error: 'This room is already full. Two players have already joined.'
        });
      }

      // Prevent duplicate name confusion
      if (trimmedName.toLowerCase() === room.player1.name.toLowerCase()) {
        return res.status(400).json({
          success: false,
          error: 'Please choose a different name. Player 1 is already using this name.'
        });
      }

      // Register Player 2
      const player2Id = existingPlayerId || crypto.randomUUID();
      room.player2 = {
        playerId: player2Id,
        name: trimmedName,
        connectionStatus: 'connected',
        socketId: null,
        ready: false
      };

      // Check if targetWord is supplied during join
      if (targetWord && typeof targetWord === 'string' && targetWord.trim().length > 0) {
        const cleanTarget = targetWord.trim().toUpperCase();

        if (cleanTarget === room.startingWord.toUpperCase()) {
          return res.status(400).json({
            success: false,
            error: 'Starting word and target word must be different.'
          });
        }

        const targetValidation = dictionaryService.validateWord(cleanTarget);
        if (!targetValidation.valid) {
          return res.status(400).json({
            success: false,
            error: `Target word: ${targetValidation.error}`
          });
        }

        room.targetWord = targetValidation.sanitized;
        room.status = 'ready_to_start';
      } else {
        room.status = 'waiting_for_target_word';
      }

      room.lastActivityAt = new Date();
      await room.save();

      // Broadcast events
      broadcastRoomEvent(room.roomId, 'player-joined', {
        role: 'player2',
        playerId: player2Id,
        name: trimmedName,
        room
      });

      if (room.status === 'ready_to_start') {
        broadcastRoomEvent(room.roomId, 'target-word-submitted', {
          targetWord: room.targetWord,
          room
        });
        broadcastRoomEvent(room.roomId, 'game-ready', {
          room,
          countdown: 3
        });

        // Trigger automatic 3-second countdown transition
        setTimeout(async () => {
          try {
            const currentRoom = await Room.findOne({ roomId: room.roomId });
            if (currentRoom && currentRoom.status === 'ready_to_start') {
              currentRoom.status = 'playing';
              currentRoom.currentWord = currentRoom.startingWord;
              currentRoom.wordHistory = [{
                player: 'player1',
                playerName: currentRoom.player1.name,
                word: currentRoom.startingWord,
                changedIndex: -1,
                previousWord: null,
                timestamp: new Date()
              }];
              currentRoom.currentTurn = 'player1';
              currentRoom.startedAt = new Date();
              currentRoom.lastActivityAt = new Date();
              await currentRoom.save();

              broadcastRoomEvent(currentRoom.roomId, 'game-start', { room: currentRoom });
              broadcastRoomEvent(currentRoom.roomId, 'game-state-updated', { room: currentRoom });
            }
          } catch (autoErr) {
            console.error('[joinRoom:auto-start] Error:', autoErr);
          }
        }, 3200);
      }

      broadcastRoomEvent(room.roomId, 'game-state-updated', { room });

      return res.status(200).json({
        success: true,
        message: 'Successfully joined room',
        roomId: room.roomId,
        playerId: player2Id,
        room
      });
    } catch (err) {
      console.error('[joinRoom] Error:', err);
      return res.status(500).json({
        success: false,
        error: 'An internal server error occurred while joining the room.'
      });
    }
  },

  /**
   * POST /api/rooms/:roomId/target-word
   * Player 2 submits their target word
   */
  async submitTargetWord(req, res) {
    try {
      const { roomId } = req.params;
      const { playerId, targetWord } = req.body;

      if (!roomId || !playerId || !targetWord) {
        return res.status(400).json({
          success: false,
          error: 'Room ID, player ID, and target word are required.'
        });
      }

      const formattedRoomId = roomId.trim().toUpperCase();
      const room = await Room.findOne({ roomId: formattedRoomId });

      if (!room) {
        return res.status(404).json({
          success: false,
          error: 'Room not found.'
        });
      }

      // Verify that requester is Player 2
      if (!room.player2 || room.player2.playerId !== playerId) {
        return res.status(403).json({
          success: false,
          error: 'Only Player 2 can set the target word.'
        });
      }

      // Check room status
      if (room.status === 'playing' || room.status === 'completed') {
        return res.status(400).json({
          success: false,
          error: 'The game has already started; target word is locked.'
        });
      }

      const cleanTarget = targetWord.trim().toUpperCase();

      if (cleanTarget === room.startingWord.toUpperCase()) {
        return res.status(400).json({
          success: false,
          error: 'Starting word and target word must be different.'
        });
      }

      const dictCheck = wordValidationService.isDictionaryWord(cleanTarget);
      if (!dictCheck.valid) {
        return res.status(400).json({
          success: false,
          error: dictCheck.error
        });
      }

      room.targetWord = cleanTarget;
      room.status = 'ready_to_start';
      room.lastActivityAt = new Date();
      await room.save();

      broadcastRoomEvent(room.roomId, 'target-word-submitted', {
        targetWord: cleanTarget,
        room
      });

      broadcastRoomEvent(room.roomId, 'game-ready', {
        room,
        countdown: 3
      });

      broadcastRoomEvent(room.roomId, 'game-state-updated', { room });

      // Trigger automatic 3-second countdown
      setTimeout(async () => {
        try {
          const currentRoom = await Room.findOne({ roomId: room.roomId });
          if (currentRoom && currentRoom.status === 'ready_to_start') {
            currentRoom.status = 'playing';
            currentRoom.currentWord = currentRoom.startingWord;
            currentRoom.wordHistory = [{
              player: 'player1',
              playerName: currentRoom.player1.name,
              word: currentRoom.startingWord,
              changedIndex: -1,
              previousWord: null,
              timestamp: new Date()
            }];
            currentRoom.currentTurn = 'player1';
            currentRoom.startedAt = new Date();
            currentRoom.lastActivityAt = new Date();
            await currentRoom.save();

            broadcastRoomEvent(currentRoom.roomId, 'game-start', { room: currentRoom });
            broadcastRoomEvent(currentRoom.roomId, 'game-state-updated', { room: currentRoom });
          }
        } catch (autoErr) {
          console.error('[submitTargetWord:auto-start] Error:', autoErr);
        }
      }, 3200);

      return res.status(200).json({
        success: true,
        message: 'Target word accepted. Match is ready to start.',
        room
      });
    } catch (err) {
      console.error('[submitTargetWord] Error:', err);
      return res.status(500).json({
        success: false,
        error: 'An internal server error occurred while setting the target word.'
      });
    }
  },

  /**
   * POST /api/rooms/:roomId/start
   * Start the match after countdown
   */
  async startGame(req, res) {
    try {
      const { roomId } = req.params;
      const formattedRoomId = roomId.trim().toUpperCase();
      const room = await Room.findOne({ roomId: formattedRoomId });

      if (!room) {
        return res.status(404).json({ success: false, error: 'Room not found.' });
      }

      if (room.status !== 'ready_to_start') {
        if (room.status === 'playing') {
          return res.status(200).json({ success: true, message: 'Game already playing', room });
        }
        return res.status(400).json({ success: false, error: `Cannot start game from status: ${room.status}` });
      }

      room.status = 'playing';
      room.currentWord = room.startingWord;
      room.wordHistory = [{
        player: 'player1',
        playerName: room.player1.name,
        word: room.startingWord,
        changedIndex: -1,
        previousWord: null,
        timestamp: new Date()
      }];
      room.currentTurn = 'player1';
      room.startedAt = new Date();
      room.lastActivityAt = new Date();
      await room.save();

      broadcastRoomEvent(room.roomId, 'game-start', { room });
      broadcastRoomEvent(room.roomId, 'game-state-updated', { room });

      return res.status(200).json({ success: true, room });
    } catch (err) {
      console.error('[startGame] Error:', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  /**
   * POST /api/rooms/:roomId/move
   * Submit word transformation move
   */
  async submitMove(req, res) {
    try {
      const { roomId } = req.params;
      const { playerId, word } = req.body;

      if (!roomId || !playerId || !word) {
        return res.status(400).json({
          success: false,
          error: 'Room ID, player ID, and word are required.'
        });
      }

      const formattedRoomId = roomId.trim().toUpperCase();
      const room = await Room.findOne({ roomId: formattedRoomId });

      if (!room) {
        return res.status(404).json({
          success: false,
          error: 'Room not found.'
        });
      }

      // Validate move using Word Validation Service
      const validation = wordValidationService.validateMove({
        room,
        playerId,
        word
      });

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      const { cleanWord, changedIndex, role, player, isWinner } = validation;
      const previousWord = room.currentWord;

      // Update room state
      room.currentWord = cleanWord;
      room.wordHistory.push({
        player: role,
        playerName: player.name,
        word: cleanWord,
        changedIndex,
        previousWord,
        timestamp: new Date()
      });
      room.totalMoves += 1;
      room.version += 1;
      room.lastActivityAt = new Date();

      if (isWinner) {
        room.status = 'completed';
        room.winner = 'both';
        room.winnerName = `${room.player1.name} & ${room.player2.name}`;
        room.completedAt = new Date();
        const startMs = room.startedAt ? new Date(room.startedAt).getTime() : new Date(room.createdAt).getTime();
        room.duration = Math.max(1, Math.round((new Date(room.completedAt).getTime() - startMs) / 1000));
        await room.save();

        broadcastRoomEvent(room.roomId, 'word-accepted', {
          word: cleanWord,
          player: role,
          playerName: player.name,
          changedIndex,
          previousWord,
          currentWord: cleanWord,
          wordHistory: room.wordHistory,
          totalMoves: room.totalMoves,
          isWinningMove: true
        });

        broadcastRoomEvent(room.roomId, 'game-over', {
          winner: 'both',
          winnerName: `${room.player1.name} & ${room.player2.name}`,
          isCoupleWin: true,
          completerRole: role,
          completerName: player.name,
          totalMoves: room.totalMoves,
          duration: room.duration,
          wordHistory: room.wordHistory,
          finalWord: cleanWord,
          startingWord: room.startingWord,
          targetWord: room.targetWord,
          room
        });

        broadcastRoomEvent(room.roomId, 'game-state-updated', { room });

        return res.status(200).json({
          success: true,
          message: 'Winning word played! Couple victory!',
          isWinner: true,
          room
        });
      } else {
        // Switch turn
        room.currentTurn = role === 'player1' ? 'player2' : 'player1';
        await room.save();

        broadcastRoomEvent(room.roomId, 'word-accepted', {
          word: cleanWord,
          player: role,
          playerName: player.name,
          changedIndex,
          previousWord,
          currentWord: cleanWord,
          nextTurn: room.currentTurn,
          wordHistory: room.wordHistory,
          totalMoves: room.totalMoves,
          isWinningMove: false
        });

        const nextPlayerName = room.currentTurn === 'player1' ? room.player1.name : room.player2.name;
        broadcastRoomEvent(room.roomId, 'turn-changed', {
          currentTurn: room.currentTurn,
          activePlayerName: nextPlayerName
        });

        broadcastRoomEvent(room.roomId, 'game-state-updated', { room });

        return res.status(200).json({
          success: true,
          message: 'Move accepted',
          isWinner: false,
          room
        });
      }
    } catch (err) {
      console.error('[submitMove] Error:', err);
      return res.status(500).json({
        success: false,
        error: 'An internal server error occurred while processing your move.'
      });
    }
  },

  /**
   * POST /api/rooms/:roomId/rematch/request
   * Player requests a rematch (with optional swapRoles)
   */
  async requestRematch(req, res) {
    try {
      const { roomId } = req.params;
      const { playerId, swapRoles } = req.body;

      const formattedRoomId = roomId.trim().toUpperCase();
      const room = await Room.findOne({ roomId: formattedRoomId });

      if (!room) {
        return res.status(404).json({ success: false, error: 'Room not found.' });
      }

      let role = null;
      let playerName = '';
      if (room.player1.playerId === playerId) {
        role = 'player1';
        playerName = room.player1.name;
      } else if (room.player2 && room.player2.playerId === playerId) {
        role = 'player2';
        playerName = room.player2.name;
      } else {
        return res.status(403).json({ success: false, error: 'Unauthorized.' });
      }

      room.rematchRequest = {
        requestedBy: role,
        requesterName: playerName,
        swapRoles: !!swapRoles,
        timestamp: new Date()
      };
      room.lastActivityAt = new Date();
      await room.save();

      broadcastRoomEvent(room.roomId, 'rematch-requested', {
        requestedBy: role,
        requesterName: playerName,
        swapRoles: !!swapRoles,
        room
      });
      broadcastRoomEvent(room.roomId, 'game-state-updated', { room });

      return res.status(200).json({ success: true, room });
    } catch (err) {
      console.error('[requestRematch] Error:', err);
      return res.status(500).json({ success: false, error: 'Internal server error.' });
    }
  },

  /**
   * POST /api/rooms/:roomId/rematch/respond
   * Other player accepts or declines the rematch request
   */
  async respondRematch(req, res) {
    try {
      const { roomId } = req.params;
      const { playerId, accept } = req.body;

      const formattedRoomId = roomId.trim().toUpperCase();
      const room = await Room.findOne({ roomId: formattedRoomId });

      if (!room || !room.rematchRequest) {
        return res.status(400).json({ success: false, error: 'No active rematch request.' });
      }

      let role = null;
      let playerName = '';
      if (room.player1.playerId === playerId) {
        role = 'player1';
        playerName = room.player1.name;
      } else if (room.player2 && room.player2.playerId === playerId) {
        role = 'player2';
        playerName = room.player2.name;
      } else {
        return res.status(403).json({ success: false, error: 'Unauthorized.' });
      }

      if (role === room.rematchRequest.requestedBy) {
        return res.status(400).json({ success: false, error: 'Cannot respond to your own rematch request.' });
      }

      if (!accept) {
        room.rematchRequest = null;
        room.lastActivityAt = new Date();
        await room.save();

        broadcastRoomEvent(room.roomId, 'rematch-declined', {
          declinerName: playerName,
          room
        });
        broadcastRoomEvent(room.roomId, 'game-state-updated', { room });
        return res.status(200).json({ success: true, declined: true, room });
      }

      const wasSwapped = room.rematchRequest.swapRoles;

      if (wasSwapped) {
        const oldP1 = room.player1.toObject ? room.player1.toObject() : room.player1;
        const oldP2 = room.player2.toObject ? room.player2.toObject() : room.player2;

        room.player1 = oldP2;
        room.player2 = oldP1;

        if (room.targetWord) {
          room.startingWord = room.targetWord;
        }
      }

      room.targetWord = null;
      room.currentWord = null;
      room.wordHistory = [];
      room.totalMoves = 0;
      room.winner = null;
      room.winnerName = null;
      room.duration = 0;
      room.startedAt = null;
      room.completedAt = null;
      room.currentTurn = 'player1';
      room.status = 'waiting_for_target_word';
      room.rematchRequest = null;
      room.lastActivityAt = new Date();
      await room.save();

      broadcastRoomEvent(room.roomId, 'rematch-started', {
        room,
        swapped: wasSwapped
      });
      broadcastRoomEvent(room.roomId, 'game-state-updated', { room });

      return res.status(200).json({ success: true, accepted: true, room });
    } catch (err) {
      console.error('[respondRematch] Error:', err);
      return res.status(500).json({ success: false, error: 'Internal server error.' });
    }
  },

  /**
   * POST /api/rooms/:roomId/rematch
   * Direct instant rematch
   */
  async rematch(req, res) {
    try {
      const { roomId } = req.params;
      const { playerId, newStartingWord } = req.body;

      const formattedRoomId = roomId.trim().toUpperCase();
      const room = await Room.findOne({ roomId: formattedRoomId });

      if (!room) {
        return res.status(404).json({ success: false, error: 'Room not found.' });
      }

      if (room.player1.playerId !== playerId && room.player2?.playerId !== playerId) {
        return res.status(403).json({ success: false, error: 'Unauthorized.' });
      }

      if (newStartingWord) {
        const dictCheck = wordValidationService.isDictionaryWord(newStartingWord);
        if (dictCheck.valid) {
          room.startingWord = dictCheck.sanitized;
        }
      }

      room.targetWord = null;
      room.currentWord = null;
      room.wordHistory = [];
      room.totalMoves = 0;
      room.winner = null;
      room.winnerName = null;
      room.duration = 0;
      room.startedAt = null;
      room.completedAt = null;
      room.currentTurn = 'player1';
      room.status = 'waiting_for_target_word';
      room.lastActivityAt = new Date();
      await room.save();

      broadcastRoomEvent(room.roomId, 'rematch-started', { room });
      broadcastRoomEvent(room.roomId, 'game-state-updated', { room });

      return res.status(200).json({ success: true, message: 'Rematch started', room });
    } catch (err) {
      console.error('[rematch] Error:', err);
      return res.status(500).json({ success: false, error: 'Internal server error.' });
    }
  },

  /**
   * POST /api/rooms/:roomId/terminate
   * Terminate match early from either player's side
   */
  async terminateRoom(req, res) {
    try {
      const { roomId } = req.params;
      const { playerId } = req.body;

      const formattedRoomId = roomId.trim().toUpperCase();
      const room = await Room.findOne({ roomId: formattedRoomId });

      if (!room) {
        return res.status(404).json({ success: false, error: 'Room not found.' });
      }

      if (room.status === 'completed') {
        return res.status(200).json({ success: true, room });
      }

      const isPlayer1 = room.player1 && room.player1.playerId === playerId;
      const isPlayer2 = room.player2 && room.player2.playerId === playerId;

      if (!isPlayer1 && !isPlayer2) {
        return res.status(403).json({ success: false, error: 'Unauthorized player.' });
      }

      const forfeitingRole = isPlayer1 ? 'player1' : 'player2';
      const forfeitingName = isPlayer1 ? room.player1.name : (room.player2?.name || 'Player 2');
      const winningRole = isPlayer1 ? 'player2' : 'player1';
      const winningName = isPlayer1 ? (room.player2?.name || 'Player 2') : room.player1.name;

      room.status = 'completed';
      room.winner = winningRole;
      room.winnerName = winningName;
      room.completedAt = new Date();
      if (room.startedAt) {
        room.duration = Math.round((room.completedAt.getTime() - room.startedAt.getTime()) / 1000);
      }
      room.lastActivityAt = new Date();
      await room.save();

      broadcastRoomEvent(room.roomId, 'game-over', {
        winner: winningRole,
        winnerName: winningName,
        terminatedBy: forfeitingName,
        terminatedRole: forfeitingRole,
        totalMoves: room.totalMoves,
        duration: room.duration,
        wordHistory: room.wordHistory,
        room
      });

      broadcastRoomEvent(room.roomId, 'game-state-updated', { room });

      return res.status(200).json({ success: true, message: 'Game terminated.', room });
    } catch (err) {
      console.error('[terminateRoom] Error:', err);
      return res.status(500).json({ success: false, error: 'Internal server error.' });
    }
  }
};
