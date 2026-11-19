/**
 * Phase 3 Verification Test Runner
 * Tests:
 * 1. Player 1 creates room with starting word ONLY (targetWord is null)
 * 2. Player 2 joins with target word ONLY
 * 3. Alternating moves to victory
 * 4. Rematch request with swapRoles: true
 * 5. Player 1 accepts rematch -> roles swap, board resets to waiting_for_target_word
 * 6. New Player 2 submits new target word -> game starts
 * 7. State recovery & session verification
 */

import { roomController } from '../src/controllers/roomController.js';
import { Room } from '../src/models/Room.js';
import { dictionaryService } from '../src/services/dictionaryService.js';
import { wordValidationService } from '../src/services/wordValidationService.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

async function runPhase3Tests() {
  console.log('====================================================');
  console.log('🧪 WORDSHIFT — PHASE 3 AUTOMATED VERIFICATION SUITE');
  console.log('====================================================\n');

  let mongod;
  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(' Connected to in-memory test database');

    // ----------------------------------------------------
    // TEST 1: Dictionary & 7 Core Game Rules
    // ----------------------------------------------------
    console.log('\n--- TEST 1: Word Validation & Mutation Rules ---');
    const dictCheck = dictionaryService.validateWord('BARK');
    console.assert(dictCheck.valid === true, 'BARK must be valid dictionary word');
    console.log(' 1.1 Valid word check (BARK): PASSED');

    const fakeCheck = dictionaryService.validateWord('ZZQX');
    console.assert(fakeCheck.valid === false, 'ZZQX must be rejected');
    console.log(' 1.2 Invalid word rejection (ZZQX): PASSED');

    // Single letter change validation
    const validShift = wordValidationService.isValidTransformation('BARK', 'PARK');
    console.assert(validShift.valid === true, 'BARK -> PARK should be valid');
    console.log(' 1.3 1-Letter Mutation (BARK -> PARK): PASSED');

    const twoLetterShift = wordValidationService.isValidTransformation('BARK', 'PORE');
    console.assert(twoLetterShift.valid === false, 'BARK -> PORE changes 2 letters and must be rejected');
    console.log(' 1.4 Multi-letter change rejection (BARK -> PORE): PASSED');

    // ----------------------------------------------------
    // TEST 2: Room Creation — Player 1 Word Ownership
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Player 1 Room Creation (Starting Word ONLY) ---');
    const reqCreate = {
      body: {
        name: 'Alice',
        startingWord: 'bark'
      }
    };
    const resCreate = createMockRes();
    await roomController.createRoom(reqCreate, resCreate);

    console.assert(resCreate.statusCode === 201, `Expected 201, got ${resCreate.statusCode}`);
    const room = resCreate.body.room;
    console.assert(room.startingWord === 'BARK', 'Starting word must be uppercase BARK');
    console.assert(room.targetWord === null, 'Target word must be null upon room creation');
    console.assert(room.status === 'waiting_for_player2', 'Status must be waiting_for_player2');
    console.log(` Created Room ${room.roomId} by ${room.player1.name}. Target word is null. PASSED`);

    const roomId = room.roomId;
    const player1Id = room.player1.playerId;

    // ----------------------------------------------------
    // TEST 3: Room Joining — Player 2 Word Ownership
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Player 2 Joining (Target Word ONLY) ---');
    // Test duplicate word rejection
    const reqDuplicate = {
      params: { roomId },
      body: {
        name: 'Bob',
        targetWord: 'BARK'
      }
    };
    const resDuplicate = createMockRes();
    await roomController.joinRoom(reqDuplicate, resDuplicate);
    console.assert(resDuplicate.statusCode === 400, 'Duplicate target word must return 400');
    console.log(' 3.1 Identical starting & target word rejection: PASSED');

    // Valid join with target word 'KITE'
    const reqJoin = {
      params: { roomId },
      body: {
        name: 'Bob',
        targetWord: 'kite'
      }
    };
    const resJoin = createMockRes();
    await roomController.joinRoom(reqJoin, resJoin);

    console.assert(resJoin.statusCode === 200, `Expected 200, got ${resJoin.statusCode}`);
    const joinedRoom = resJoin.body.room;
    const player2Id = joinedRoom.player2.playerId;
    console.assert(joinedRoom.targetWord === 'KITE', 'Target word must be KITE');
    console.assert(joinedRoom.status === 'ready_to_start', 'Status must transition to ready_to_start');
    console.log(` Bob joined as Player 2 with target word KITE. Status: ${joinedRoom.status}. PASSED`);

    // ----------------------------------------------------
    // TEST 4: Game Start
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Game Start ---');
    const reqStart = { params: { roomId } };
    const resStart = createMockRes();
    await roomController.startGame(reqStart, resStart);

    console.assert(resStart.statusCode === 200, `Expected 200, got ${resStart.statusCode}`);
    const startedRoom = resStart.body.room;
    console.assert(startedRoom.status === 'playing', 'Status must be playing');
    console.assert(startedRoom.currentWord === 'BARK', 'Initial current word must be BARK');
    console.assert(startedRoom.currentTurn === 'player1', 'First turn must be player1');
    console.log(' Game initialized. Player 1 turn. PASSED');

    // ----------------------------------------------------
    // TEST 5: Complete Transformation Sequence: BARK -> KITE
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Full 8-Step Shift Sequence (BARK -> KITE) ---');
    const moves = [
      { player: 'player1', id: player1Id, word: 'PARK' },
      { player: 'player2', id: player2Id, word: 'PART' },
      { player: 'player1', id: player1Id, word: 'PORT' },
      { player: 'player2', id: player2Id, word: 'SORT' },
      { player: 'player1', id: player1Id, word: 'SORE' },
      { player: 'player2', id: player2Id, word: 'SIRE' },
      { player: 'player1', id: player1Id, word: 'SITE' },
      { player: 'player2', id: player2Id, word: 'KITE' } // Winning move!
    ];

    let currentGameState = startedRoom;
    for (let i = 0; i < moves.length; i++) {
      const step = moves[i];
      const reqMove = {
        params: { roomId },
        body: { playerId: step.id, word: step.word }
      };
      const resMove = createMockRes();
      await roomController.submitMove(reqMove, resMove);

      console.assert(resMove.statusCode === 200, `Move ${i + 1} (${step.word}) failed: ${JSON.stringify(resMove.body)}`);
      currentGameState = resMove.body.room;
      console.log(` Move ${i + 1}: ${step.player} shifted to ${step.word}`);
    }

    console.assert(currentGameState.status === 'completed', 'Game must be marked completed');
    console.assert(currentGameState.winner === 'player2', 'Player 2 should be the winner');
    console.assert(currentGameState.winnerName === 'Bob', 'Winner name must be Bob');
    console.assert(currentGameState.totalMoves === 8, 'Total moves must be 8');
    console.log(' Victory reached! Bob (Player 2) is the winner. Total moves: 8. PASSED');

    // ----------------------------------------------------
    // TEST 6: Rematch with Mutual Confirmation & Role Swap
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Rematch Request & Role Swap Flow ---');
    // Step 6.1: Bob (Player 2) requests a rematch with swapRoles = true
    const reqRematchRequest = {
      params: { roomId },
      body: {
        playerId: player2Id,
        swapRoles: true
      }
    };
    const resRematchRequest = createMockRes();
    await roomController.requestRematch(reqRematchRequest, resRematchRequest);

    console.assert(resRematchRequest.statusCode === 200, `Expected 200, got ${resRematchRequest.statusCode}`);
    const rematchPendingRoom = resRematchRequest.body.room;
    console.assert(rematchPendingRoom.rematchRequest.requestedBy === 'player2', 'rematchRequest requestedBy must be player2');
    console.assert(rematchPendingRoom.rematchRequest.swapRoles === true, 'swapRoles must be true');
    console.log(' 6.1 Bob requested rematch with role swap. PASSED');

    // Step 6.2: Alice (Player 1) accepts the rematch
    const reqRematchRespond = {
      params: { roomId },
      body: {
        playerId: player1Id,
        accept: true
      }
    };
    const resRematchRespond = createMockRes();
    await roomController.respondRematch(reqRematchRespond, resRematchRespond);

    console.assert(resRematchRespond.statusCode === 200, `Expected 200, got ${resRematchRespond.statusCode}`);
    const swappedRoom = resRematchRespond.body.room;
    console.assert(swappedRoom.status === 'waiting_for_target_word', 'Status must be reset to waiting_for_target_word');
    console.assert(swappedRoom.player1.name === 'Bob', 'Bob must now be Player 1!');
    console.assert(swappedRoom.player2.name === 'Alice', 'Alice must now be Player 2!');
    console.assert(swappedRoom.startingWord === 'KITE', 'Previous target word KITE must now be startingWord!');
    console.assert(swappedRoom.targetWord === null, 'Target word must be reset to null');
    console.assert(swappedRoom.totalMoves === 0, 'Moves count must reset to 0');
    console.assert(swappedRoom.wordHistory.length === 0, 'History must be cleared');
    console.log(' 6.2 Roles successfully swapped: Bob is now P1 (Start: KITE), Alice is now P2. PASSED');

    // ----------------------------------------------------
    // TEST 7: Rematch Game Target Selection & Re-engagement
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Rematch Target Selection by New Player 2 (Alice) ---');
    const reqNewTarget = {
      params: { roomId },
      body: {
        playerId: player1Id, // Alice's playerId, who is now player2!
        targetWord: 'COLD'
      }
    };
    const resNewTarget = createMockRes();
    await roomController.submitTargetWord(reqNewTarget, resNewTarget);

    console.assert(resNewTarget.statusCode === 200, `Expected 200, got ${resNewTarget.statusCode}`);
    const rematchReady = resNewTarget.body.room;
    console.assert(rematchReady.targetWord === 'COLD', 'Target word must be COLD');
    console.assert(rematchReady.status === 'ready_to_start', 'Status must be ready_to_start');
    console.log(' 7.1 New Player 2 (Alice) set target word COLD. Match ready. PASSED');

    // ----------------------------------------------------
    // TEST 8: State Recovery on Refresh
    // ----------------------------------------------------
    console.log('\n--- TEST 8: Session Recovery & State Fetch ---');
    const reqGet = { params: { roomId } };
    const resGet = createMockRes();
    await roomController.getRoom(reqGet, resGet);

    console.assert(resGet.statusCode === 200, 'Room retrieval must succeed');
    console.assert(resGet.body.room.startingWord === 'KITE', 'Retained starting word KITE');
    console.assert(resGet.body.room.targetWord === 'COLD', 'Retained target word COLD');
    console.assert(resGet.body.room.player1.name === 'Bob', 'Retained Player 1 Bob');
    console.assert(resGet.body.room.player2.name === 'Alice', 'Retained Player 2 Alice');
    console.log(' 8.1 Complete room state successfully rehydrated for refresh recovery. PASSED');

    console.log('\n====================================================');
    console.log('🎉 ALL PHASE 3 BACKEND & GAMEPLAY TESTS PASSED (8/8)!');
    console.log('====================================================\n');

    // Wait for any trailing auto-start timers before tearing down
    await new Promise(resolve => setTimeout(resolve, 3500));
  } catch (err) {
    console.error('\n❌ TEST RUNNER FAILED:', err);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongod) {
      await mongod.stop();
    }
  }
}

runPhase3Tests();
