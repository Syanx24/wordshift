import { Room } from '../models/Room.js';
import { wordValidationService } from '../services/wordValidationService.js';

let ioInstance = null;

export function getIO() {
  return ioInstance;
}

export function broadcastRoomEvent(roomId, eventName, data) {
  if (ioInstance && roomId) {
    ioInstance.to(roomId.toUpperCase()).emit(eventName, data);
  }
}

export function initializeSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] New client connected: ${socket.id}`);

    /**
     * Handler: create-room
     * Player 1 creates room and joins socket channel
     */
    socket.on('create-room', async (data, callback) => {
      try {
        const { roomId, playerId } = data || {};
        if (!roomId || !playerId) {
          if (callback) callback({ success: false, error: 'roomId and playerId required' });
          return;
        }

        const room = await Room.findOne({ roomId: roomId.toUpperCase() });
        if (!room) {
          if (callback) callback({ success: false, error: 'Room not found' });
          return;
        }

        socket.join(room.roomId);
        socket.roomId = room.roomId;
        socket.playerId = playerId;
        socket.role = 'player1';

        room.player1.socketId = socket.id;
        room.player1.connectionStatus = 'connected';
        room.lastActivityAt = new Date();
        await room.save();

        console.log(`[Socket.IO] Player 1 joined socket room: ${room.roomId}`);
        socket.emit('room-created', { room });
        if (callback) callback({ success: true, room });
      } catch (err) {
        console.error('[Socket.IO:create-room] Error:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    /**
     * Handler: join-room
     * Both Player 1 and Player 2 connect/reconnect to the room channel
     */
    socket.on('join-room', async (data, callback) => {
      try {
        const { roomId, playerId } = data || {};
        if (!roomId || !playerId) {
          if (callback) callback({ success: false, error: 'roomId and playerId required' });
          return;
        }

        const room = await Room.findOne({ roomId: roomId.toUpperCase() });
        if (!room) {
          if (callback) callback({ success: false, error: 'Room not found' });
          return;
        }

        socket.join(room.roomId);
        socket.roomId = room.roomId;
        socket.playerId = playerId;

        let role = null;
        let isReconnection = false;

        if (room.player1 && room.player1.playerId === playerId) {
          role = 'player1';
          isReconnection = !!(room.player1.socketId && room.player1.socketId !== socket.id);
          room.player1.socketId = socket.id;
          room.player1.connectionStatus = 'connected';
        } else if (room.player2 && room.player2.playerId === playerId) {
          role = 'player2';
          isReconnection = !!(room.player2.socketId && room.player2.socketId !== socket.id);
          room.player2.socketId = socket.id;
          room.player2.connectionStatus = 'connected';
        } else {
          if (callback) callback({ success: false, error: 'Player identity not recognized in room' });
          return;
        }

        socket.role = role;
        room.lastActivityAt = new Date();
        await room.save();

        console.log(`[Socket.IO] ${role} (${playerId}) connected to room ${room.roomId} (reconnect: ${isReconnection})`);

        if (isReconnection) {
          io.to(room.roomId).emit('player-reconnected', {
            role,
            playerId,
            name: role === 'player1' ? room.player1.name : room.player2.name,
            room
          });
        } else {
          io.to(room.roomId).emit('player-joined', {
            role,
            playerId,
            name: role === 'player1' ? room.player1.name : room.player2.name,
            room
          });
        }

        io.to(room.roomId).emit('game-state-updated', { room });
        if (callback) callback({ success: true, room, role });
      } catch (err) {
        console.error('[Socket.IO:join-room] Error:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    /**
     * Handler: submit-target-word
     * Player 2 submits their chosen target word
     */
    socket.on('submit-target-word', async (data, callback) => {
      try {
        const { roomId, playerId, targetWord } = data || {};
        const cleanRoomId = (roomId || socket.roomId || '').toUpperCase();
        const activePlayerId = playerId || socket.playerId;

        if (!cleanRoomId || !activePlayerId || !targetWord) {
          const err = 'Room ID, player ID, and target word are required.';
          socket.emit('word-rejected', { error: err });
          if (callback) callback({ success: false, error: err });
          return;
        }

        const room = await Room.findOne({ roomId: cleanRoomId });
        if (!room) {
          const err = 'Room not found.';
          socket.emit('word-rejected', { error: err });
          if (callback) callback({ success: false, error: err });
          return;
        }

        // Only Player 2 can set target word
        if (!room.player2 || room.player2.playerId !== activePlayerId) {
          const err = 'Only Player 2 is authorized to select the target word.';
          socket.emit('word-rejected', { error: err });
          if (callback) callback({ success: false, error: err });
          return;
        }

        // Target word must be different from starting word
        const cleanTarget = targetWord.trim().toUpperCase();
        if (cleanTarget === room.startingWord.toUpperCase()) {
          const err = 'Starting word and target word must be different.';
          socket.emit('word-rejected', { error: err });
          if (callback) callback({ success: false, error: err });
          return;
        }

        // Validate dictionary
        const dictCheck = wordValidationService.isDictionaryWord(cleanTarget);
        if (!dictCheck.valid) {
          socket.emit('word-rejected', { error: dictCheck.error });
          if (callback) callback({ success: false, error: dictCheck.error });
          return;
        }

        // Set target word & transition to ready_to_start
        room.targetWord = cleanTarget;
        room.status = 'ready_to_start';
        room.lastActivityAt = new Date();
        await room.save();

        console.log(`[Socket.IO] Room ${room.roomId}: Player 2 set target word: ${cleanTarget}. Room ready to start.`);

        io.to(room.roomId).emit('target-word-submitted', {
          targetWord: cleanTarget,
          room
        });

        io.to(room.roomId).emit('game-ready', {
          room,
          countdown: 3
        });

        io.to(room.roomId).emit('game-state-updated', { room });
        if (callback) callback({ success: true, room });

        // Trigger automated 3-second countdown transition to 'playing'
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

              console.log(`[Socket.IO] Room ${currentRoom.roomId}: Countdown finished! Game started.`);
              io.to(currentRoom.roomId).emit('game-start', { room: currentRoom });
              io.to(currentRoom.roomId).emit('game-state-updated', { room: currentRoom });
            }
          } catch (autoErr) {
            console.error('[Socket.IO:auto-start] Error:', autoErr);
          }
        }, 3200);

      } catch (err) {
        console.error('[Socket.IO:submit-target-word] Error:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    /**
     * Handler: game-start
     * Manual or client triggered start of game after countdown
     */
    socket.on('start-game', async (data, callback) => {
      try {
        const { roomId } = data || {};
        const cleanRoomId = (roomId || socket.roomId || '').toUpperCase();
        const room = await Room.findOne({ roomId: cleanRoomId });

        if (room && room.status === 'ready_to_start') {
          room.status = 'playing';
          room.currentWord = room.startingWord;
          if (!room.wordHistory || room.wordHistory.length === 0) {
            room.wordHistory = [{
              player: 'player1',
              playerName: room.player1.name,
              word: room.startingWord,
              changedIndex: -1,
              previousWord: null,
              timestamp: new Date()
            }];
          }
          room.currentTurn = 'player1';
          room.startedAt = new Date();
          room.lastActivityAt = new Date();
          await room.save();

          io.to(room.roomId).emit('game-start', { room });
          io.to(room.roomId).emit('game-state-updated', { room });
          if (callback) callback({ success: true, room });
        }
      } catch (err) {
        console.error('[Socket.IO:start-game] Error:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    /**
     * Handler: submit-word
     * Player submits a word transformation move
     */
    socket.on('submit-word', async (data, callback) => {
      try {
        const { roomId, playerId, word } = data || {};
        const cleanRoomId = (roomId || socket.roomId || '').toUpperCase();
        const activePlayerId = playerId || socket.playerId;

        if (!cleanRoomId || !activePlayerId || !word) {
          const err = 'Room ID, player ID, and word are required.';
          socket.emit('word-rejected', { error: err });
          if (callback) callback({ success: false, error: err });
          return;
        }

        // Fetch room
        const room = await Room.findOne({ roomId: cleanRoomId });
        if (!room) {
          const err = 'Room not found.';
          socket.emit('word-rejected', { error: err });
          if (callback) callback({ success: false, error: err });
          return;
        }

        // Validate using Word Validation Engine
        const validation = wordValidationService.validateMove({
          room,
          playerId: activePlayerId,
          word
        });

        if (!validation.valid) {
          console.warn(`[Socket.IO] Move rejected in room ${room.roomId}: ${validation.error}`);
          socket.emit('word-rejected', {
            error: validation.error,
            word
          });
          if (callback) callback({ success: false, error: validation.error });
          return;
        }

        const { cleanWord, changedIndex, role, player, isWinner } = validation;
        const previousWord = room.currentWord;

        // Apply state updates
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

          console.log(`🏆 [Socket.IO] Room ${room.roomId}: Couple Won! ${room.player1.name} & ${room.player2.name} completed target word ${cleanWord}!`);

          // Emit word-accepted
          io.to(room.roomId).emit('word-accepted', {
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

          // Emit game-over (both players win together as a couple)
          io.to(room.roomId).emit('game-over', {
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

          // Emit full game-state-updated
          io.to(room.roomId).emit('game-state-updated', { room });

          if (callback) callback({ success: true, room, isWinner: true });
        } else {
          // Switch turn
          room.currentTurn = role === 'player1' ? 'player2' : 'player1';
          await room.save();

          console.log(`[Socket.IO] Room ${room.roomId}: Move accepted (${cleanWord}). Next turn: ${room.currentTurn}`);

          // Emit word-accepted
          io.to(room.roomId).emit('word-accepted', {
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

          // Emit turn-changed
          const nextPlayerName = room.currentTurn === 'player1' ? room.player1.name : room.player2.name;
          io.to(room.roomId).emit('turn-changed', {
            currentTurn: room.currentTurn,
            activePlayerName: nextPlayerName
          });

          // Emit game-state-updated
          io.to(room.roomId).emit('game-state-updated', { room });

          if (callback) callback({ success: true, room, isWinner: false });
        }

      } catch (err) {
        console.error('[Socket.IO:submit-word] Error:', err);
        socket.emit('word-rejected', { error: 'Server error processing move.' });
        if (callback) callback({ success: false, error: err.message });
      }
    });

    /**
     * Handler: request-rematch
     * Either player requests a rematch (with standard or swapRoles mode)
     */
    socket.on('request-rematch', async (data, callback) => {
      try {
        const { roomId, playerId, swapRoles } = data || {};
        const cleanRoomId = (roomId || socket.roomId || '').toUpperCase();
        const activePlayerId = playerId || socket.playerId;

        const room = await Room.findOne({ roomId: cleanRoomId });
        if (!room) {
          if (callback) callback({ success: false, error: 'Room not found' });
          return;
        }

        // Identify role
        let role = null;
        let playerName = '';
        if (room.player1 && room.player1.playerId === activePlayerId) {
          role = 'player1';
          playerName = room.player1.name;
        } else if (room.player2 && room.player2.playerId === activePlayerId) {
          role = 'player2';
          playerName = room.player2.name;
        } else {
          if (callback) callback({ success: false, error: 'Unauthorized' });
          return;
        }

        // Save rematch request
        room.rematchRequest = {
          requestedBy: role,
          requesterName: playerName,
          swapRoles: !!swapRoles,
          timestamp: new Date()
        };
        room.lastActivityAt = new Date();
        await room.save();

        console.log(`[Socket.IO] Room ${room.roomId}: ${playerName} (${role}) requested rematch (swapRoles: ${!!swapRoles})`);

        io.to(room.roomId).emit('rematch-requested', {
          requestedBy: role,
          requesterName: playerName,
          swapRoles: !!swapRoles,
          room
        });
        io.to(room.roomId).emit('game-state-updated', { room });

        if (callback) callback({ success: true, room });
      } catch (err) {
        console.error('[Socket.IO:request-rematch] Error:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    /**
     * Handler: respond-rematch
     * Other player accepts or declines the rematch request
     */
    socket.on('respond-rematch', async (data, callback) => {
      try {
        const { roomId, playerId, accept } = data || {};
        const cleanRoomId = (roomId || socket.roomId || '').toUpperCase();
        const activePlayerId = playerId || socket.playerId;

        const room = await Room.findOne({ roomId: cleanRoomId });
        if (!room || !room.rematchRequest) {
          if (callback) callback({ success: false, error: 'No active rematch request.' });
          return;
        }

        // Identify role
        let role = null;
        let playerName = '';
        if (room.player1 && room.player1.playerId === activePlayerId) {
          role = 'player1';
          playerName = room.player1.name;
        } else if (room.player2 && room.player2.playerId === activePlayerId) {
          role = 'player2';
          playerName = room.player2.name;
        } else {
          if (callback) callback({ success: false, error: 'Unauthorized' });
          return;
        }

        if (role === room.rematchRequest.requestedBy) {
          if (callback) callback({ success: false, error: 'Cannot respond to your own rematch request.' });
          return;
        }

        if (!accept) {
          room.rematchRequest = null;
          room.lastActivityAt = new Date();
          await room.save();

          console.log(`[Socket.IO] Room ${room.roomId}: ${playerName} declined rematch.`);
          io.to(room.roomId).emit('rematch-declined', {
            declinerName: playerName,
            room
          });
          io.to(room.roomId).emit('game-state-updated', { room });
          if (callback) callback({ success: true, declined: true, room });
          return;
        }

        // Both accepted rematch!
        const wasSwapped = room.rematchRequest.swapRoles;

        if (wasSwapped) {
          // Explicitly swap Player 1 and Player 2
          const oldP1 = room.player1.toObject ? room.player1.toObject() : room.player1;
          const oldP2 = room.player2.toObject ? room.player2.toObject() : room.player2;

          room.player1 = oldP2;
          room.player2 = oldP1;

          // The target word chosen by previous Player 2 becomes the starting word
          if (room.targetWord) {
            room.startingWord = room.targetWord;
          }
        }

        // Reset game board
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

        console.log(`[Socket.IO] Room ${room.roomId}: Rematch confirmed! Swapped: ${wasSwapped}. Room reset to waiting_for_target_word.`);

        io.to(room.roomId).emit('rematch-started', {
          room,
          swapped: wasSwapped
        });
        io.to(room.roomId).emit('game-state-updated', { room });

        if (callback) callback({ success: true, accepted: true, room });
      } catch (err) {
        console.error('[Socket.IO:respond-rematch] Error:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    /**
     * Handler: send-reaction
     * Broadcasts real-time emoji reactions to all players in the room
     */
    socket.on('send-reaction', (data) => {
      try {
        const { roomId, emoji, senderName } = data || {};
        const targetRoom = roomId || socket.roomId;
        if (!targetRoom || !emoji) return;

        console.log(`[Socket.IO] Reaction in room ${targetRoom}: ${emoji} from ${senderName || socket.role}`);

        io.to(targetRoom.toUpperCase()).emit('player-reaction', {
          emoji,
          senderName: senderName || (socket.role === 'player1' ? 'Player 1' : 'Player 2'),
          senderRole: socket.role,
          senderPlayerId: socket.playerId,
          timestamp: Date.now()
        });
      } catch (err) {
        console.error('[Socket.IO:send-reaction] Error:', err);
      }
    });

    /**
     * Handler: terminate-game
     * Allows either player to terminate/forfeit the match
     */
    socket.on('terminate-game', async (data, callback) => {
      try {
        const { roomId, playerId } = data || {};
        const targetRoomId = (roomId || socket.roomId)?.toUpperCase();
        const activePlayerId = playerId || socket.playerId;

        if (!targetRoomId || !activePlayerId) {
          if (callback) callback({ success: false, error: 'roomId and playerId required' });
          return;
        }

        const room = await Room.findOne({ roomId: targetRoomId });
        if (!room) {
          if (callback) callback({ success: false, error: 'Room not found' });
          return;
        }

        if (room.status === 'completed') {
          if (callback) callback({ success: true, room });
          return;
        }

        const isPlayer1 = room.player1 && room.player1.playerId === activePlayerId;
        const isPlayer2 = room.player2 && room.player2.playerId === activePlayerId;

        if (!isPlayer1 && !isPlayer2) {
          if (callback) callback({ success: false, error: 'Player not recognized in room' });
          return;
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
        await room.save();

        console.log(`[Socket.IO] Room ${room.roomId} terminated by ${forfeitingName}. Winner: ${winningName}`);

        // Emit game-over and game-state-updated
        io.to(room.roomId).emit('game-over', {
          winner: winningRole,
          winnerName: winningName,
          terminatedBy: forfeitingName,
          terminatedRole: forfeitingRole,
          totalMoves: room.totalMoves,
          duration: room.duration,
          wordHistory: room.wordHistory,
          room
        });

        io.to(room.roomId).emit('game-state-updated', { room });

        if (callback) callback({ success: true, room });
      } catch (err) {
        console.error('[Socket.IO:terminate-game] Error:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    /**
     * Handler: disconnect
     */
    socket.on('disconnect', async () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      if (socket.roomId && socket.playerId && socket.role) {
        try {
          const room = await Room.findOne({ roomId: socket.roomId });
          if (room) {
            let playerName = '';
            if (socket.role === 'player1' && room.player1) {
              room.player1.connectionStatus = 'disconnected';
              playerName = room.player1.name;
            } else if (socket.role === 'player2' && room.player2) {
              room.player2.connectionStatus = 'disconnected';
              playerName = room.player2.name;
            }

            room.lastActivityAt = new Date();
            await room.save();

            io.to(room.roomId).emit('player-disconnected', {
              role: socket.role,
              playerId: socket.playerId,
              name: playerName,
              room
            });
            console.log(`[Socket.IO] Broadcasted disconnection for ${socket.role} in room ${room.roomId}`);
          }
        } catch (err) {
          console.error('[Socket.IO:disconnect] Error updating room state:', err);
        }
      }
    });
  });
}
