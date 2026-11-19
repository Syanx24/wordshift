import { io as ClientIO } from 'socket.io-client';
import http from 'http';

console.log('--- 🧪 STARTING WORDSHIFT PHASE 2 FULL MULTIPLAYER ENGINE TEST ---');

// Import server
const { server } = await import('../src/server.js');

await new Promise((resolve) => {
  if (server.listening) resolve();
  else server.on('listening', resolve);
});

const port = server.address().port;
console.log(`Server actively listening on port: ${port}`);

const BASE_URL = `http://127.0.0.1:${port}/api`;
const SOCKET_URL = `http://127.0.0.1:${port}`;

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      method,
      hostname: '127.0.0.1',
      port: port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  // [STEP 1] Player 1 creates room with BARK
  console.log('\n[STEP 1] Player 1 creates room with starting word "BARK"');
  const createRes = await makeRequest('POST', '/rooms', {
    name: 'Alice (Player 1)',
    startingWord: 'BARK'
  });
  console.log('Room created status:', createRes.status, 'Room ID:', createRes.data.roomId);
  if (createRes.status !== 201) throw new Error('Create room failed');
  const { roomId, playerId: p1Id, room: initialRoom } = createRes.data;

  if (initialRoom.startingWord !== 'BARK') throw new Error('startingWord must be BARK');
  if (initialRoom.targetWord !== null) throw new Error('targetWord must initially be null');
  if (initialRoom.status !== 'waiting_for_player2') throw new Error('status must be waiting_for_player2');
  console.log('✅ Player 1 created room with BARK, targetWord is null, status is waiting_for_player2');

  // [STEP 2] Player 1 connects Socket.IO
  console.log('\n[STEP 2] Player 1 connects to Socket.IO room');
  const p1Socket = ClientIO(SOCKET_URL, { transports: ['websocket'] });
  await new Promise((resolve) => {
    p1Socket.on('connect', () => {
      p1Socket.emit('create-room', { roomId, playerId: p1Id }, (ack) => {
        console.log('Player 1 create-room ack:', ack?.success);
        resolve();
      });
    });
  });

  // [STEP 3] Player 2 validation checks before joining
  console.log('\n[STEP 3] Player 2 validation tests:');
  
  // 3a. Identical word rejection
  const sameWordRes = await makeRequest('POST', `/rooms/${roomId}/join`, {
    name: 'Bob (Player 2)',
    targetWord: 'BARK'
  });
  console.log('Same word rejection status:', sameWordRes.status, sameWordRes.data.error);
  if (sameWordRes.status !== 400 || !sameWordRes.data.error.includes('different')) {
    throw new Error('Expected 400 with "Starting word and target word must be different."');
  }
  console.log('✅ Rejection of identical word confirmed');

  // 3b. Invalid dictionary word rejection
  const invalidWordRes = await makeRequest('POST', `/rooms/${roomId}/join`, {
    name: 'Bob (Player 2)',
    targetWord: 'XYZQ'
  });
  console.log('Invalid word rejection status:', invalidWordRes.status, invalidWordRes.data.error);
  if (invalidWordRes.status !== 400) throw new Error('Expected 400 for invalid dictionary word');
  console.log('✅ Rejection of non-dictionary target word confirmed');

  // [STEP 4] Player 2 joins with valid target word "KITE"
  console.log('\n[STEP 4] Player 2 joins with Target Word "KITE"');
  let p1TargetWordEvent = false;
  let p1GameReadyEvent = false;
  let p1GameStartEvent = false;

  p1Socket.on('target-word-submitted', (data) => {
    console.log('⚡ Player 1 received socket event "target-word-submitted":', data.targetWord);
    p1TargetWordEvent = true;
  });

  p1Socket.on('game-ready', (data) => {
    console.log('⚡ Player 1 received socket event "game-ready", countdown:', data.countdown);
    p1GameReadyEvent = true;
  });

  p1Socket.on('game-start', (data) => {
    console.log('⚡ Player 1 received socket event "game-start", currentTurn:', data.room?.currentTurn, 'currentWord:', data.room?.currentWord);
    p1GameStartEvent = true;
  });

  const joinRes = await makeRequest('POST', `/rooms/${roomId}/join`, {
    name: 'Bob (Player 2)',
    targetWord: 'KITE'
  });
  console.log('Player 2 join response status:', joinRes.status, 'status:', joinRes.data.room?.status);
  if (joinRes.status !== 200 || joinRes.data.room?.targetWord !== 'KITE') {
    throw new Error('Player 2 join failed');
  }
  const p2Id = joinRes.data.playerId;

  // Player 2 connects Socket.IO
  const p2Socket = ClientIO(SOCKET_URL, { transports: ['websocket'] });
  await new Promise((resolve) => {
    p2Socket.on('connect', () => {
      p2Socket.emit('join-room', { roomId, playerId: p2Id }, (ack) => {
        console.log('Player 2 join-room socket ack:', ack?.success);
        resolve();
      });
    });
  });

  // Trigger game start (manual start to avoid waiting full 3s in test)
  console.log('\n[STEP 5] Trigger Game Start (status -> playing)');
  const startRes = await makeRequest('POST', `/rooms/${roomId}/start`);
  console.log('Start match status:', startRes.status, 'Room status:', startRes.data.room?.status);
  if (startRes.data.room?.status !== 'playing' || startRes.data.room?.currentTurn !== 'player1') {
    throw new Error('Game must be playing with currentTurn as player1');
  }
  console.log('✅ Match is officially playing! Player 1 starts with BARK');

  // [STEP 6] Test Move Validation on Turn 1
  console.log('\n[STEP 6] Test gameplay validation rules on Turn 1:');

  // 6a. Player 2 attempts to move out of turn
  const wrongTurnRes = await makeRequest('POST', `/rooms/${roomId}/move`, {
    playerId: p2Id,
    word: 'PARK'
  });
  console.log('Player 2 out-of-turn rejection:', wrongTurnRes.status, wrongTurnRes.data.error);
  if (wrongTurnRes.status !== 400 || !wrongTurnRes.data.error.includes('turn')) {
    throw new Error('Expected 400 out-of-turn rejection');
  }
  console.log('✅ Out-of-turn move successfully rejected');

  // 6b. Player 1 submits identical word (0 letters changed)
  const zeroChangeRes = await makeRequest('POST', `/rooms/${roomId}/move`, {
    playerId: p1Id,
    word: 'BARK'
  });
  console.log('Zero letters changed rejection:', zeroChangeRes.status, zeroChangeRes.data.error);
  if (zeroChangeRes.status !== 400) throw new Error('Expected 400 for unchanged word');
  console.log('✅ Unchanged word successfully rejected');

  // 6c. Player 1 submits word changing 2 letters (BARK -> BEAT)
  const twoChangeRes = await makeRequest('POST', `/rooms/${roomId}/move`, {
    playerId: p1Id,
    word: 'BEAT'
  });
  console.log('Two letters changed rejection:', twoChangeRes.status, twoChangeRes.data.error);
  if (twoChangeRes.status !== 400 || !twoChangeRes.data.error.includes('one letter')) {
    throw new Error('Expected 400 for 2-letter shift');
  }
  console.log('✅ Multi-letter shift successfully rejected');

  // [STEP 7] Complete the exact game sequence from the prompt:
  // BARK -> PARK -> PART -> PORT -> SORT -> SORE -> SIRE -> SITE -> KITE
  console.log('\n[STEP 7] Executing full game transformation ladder:');
  console.log('BARK → PARK → PART → PORT → SORT → SORE → SIRE → SITE → KITE');

  const moves = [
    { player: 'player1', pId: p1Id, word: 'PARK', expectedTurn: 'player2' },
    { player: 'player2', pId: p2Id, word: 'PART', expectedTurn: 'player1' },
    { player: 'player1', pId: p1Id, word: 'PORT', expectedTurn: 'player2' },
    { player: 'player2', pId: p2Id, word: 'SORT', expectedTurn: 'player1' },
    { player: 'player1', pId: p1Id, word: 'SORE', expectedTurn: 'player2' },
    { player: 'player2', pId: p2Id, word: 'SIRE', expectedTurn: 'player1' },
    { player: 'player1', pId: p1Id, word: 'SITE', expectedTurn: 'player2' },
    { player: 'player2', pId: p2Id, word: 'KITE', isWinning: true }
  ];

  let p1TurnChanges = 0;
  p1Socket.on('turn-changed', () => { p1TurnChanges++; });

  let gameOverEventReceived = false;
  p1Socket.on('game-over', (data) => {
    console.log('⚡ Player 1 received "game-over" event:', data.winner, 'winnerName:', data.winnerName, 'totalMoves:', data.totalMoves);
    gameOverEventReceived = true;
  });

  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    const res = await makeRequest('POST', `/rooms/${roomId}/move`, {
      playerId: m.pId,
      word: m.word
    });

    if (res.status !== 200) {
      throw new Error(`Move ${i + 1} (${m.word}) failed: ${res.data.error}`);
    }

    if (m.isWinning) {
      console.log(`Move ${i + 1}: ${m.player} played WINNING target word "${m.word}"! Winner: ${res.data.room?.winner}`);
      if (res.data.room?.status !== 'completed' || res.data.room?.winner !== 'player2') {
        throw new Error('Winning move must complete game and set winner to player2');
      }
    } else {
      console.log(`Move ${i + 1}: ${m.player} played "${m.word}" -> Accepted. Next turn: ${res.data.room?.currentTurn}`);
      if (res.data.room?.currentTurn !== m.expectedTurn) {
        throw new Error(`Turn must switch to ${m.expectedTurn}`);
      }
    }
  }

  // [STEP 8] Verify Repeat Word Rejection
  console.log('\n[STEP 8] Verify Move Rejection after Game Over:');
  const afterOverRes = await makeRequest('POST', `/rooms/${roomId}/move`, {
    playerId: p1Id,
    word: 'BITE'
  });
  console.log('Post-game move rejection:', afterOverRes.status, afterOverRes.data.error);
  if (afterOverRes.status !== 400 || !afterOverRes.data.error.includes('ended')) {
    throw new Error('Moves after game over must be rejected');
  }
  console.log('✅ Post-game move correctly rejected');

  // Wait for socket events to settle
  await new Promise(r => setTimeout(r, 600));

  if (!gameOverEventReceived) {
    throw new Error('Player 1 did not receive game-over socket event');
  }
  console.log('✅ Real-time Socket.IO game-over notification verified!');

  p1Socket.disconnect();
  p2Socket.disconnect();

  console.log('\n🎉 ALL PHASE 2 ENGINE TESTS PASSED WITH 100% SUCCESS! 🎉\n');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Phase 2 test failed:', err);
  process.exit(1);
});
