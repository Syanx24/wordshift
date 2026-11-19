import { io as ClientIO } from 'socket.io-client';
import http from 'http';

console.log('--- 🧪 STARTING WORDSHIFT PHASE 1 IN-PROCESS INTEGRATION RUNNER ---');

// Import server
const { server } = await import('../src/server.js');

// Wait for server to listen
await new Promise((resolve) => {
  if (server.listening) resolve();
  else server.on('listening', resolve);
});

const port = server.address().port;
console.log(`Server is actively listening on port: ${port}`);

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
  // 1. Health check
  console.log('\n[TEST 1] Backend Health Check');
  const health = await makeRequest('GET', '/health');
  console.log('Health check status:', health.status, health.data);
  if (health.status !== 200) throw new Error('Health check failed');

  // 2. Word validation
  console.log('\n[TEST 2] Dictionary Validation');
  const validCheck = await makeRequest('GET', '/words/validate/COLD');
  console.log('Validate COLD (valid):', validCheck.data);
  if (!validCheck.data.valid) throw new Error('COLD should be valid');

  const invalidCheck = await makeRequest('GET', '/words/validate/XYZQ');
  console.log('Validate XYZQ (invalid):', invalidCheck.data);
  if (invalidCheck.data.valid) throw new Error('XYZQ should be invalid');

  // 3. Room Creation by Player 1 (only starting word provided)
  console.log('\n[TEST 3] Room Creation - Player 1 provides Starting Word "COLD"');
  const createRes = await makeRequest('POST', '/rooms', {
    name: 'Alice (Player 1)',
    startingWord: 'COLD'
  });
  console.log('Room created:', createRes.status, 'Room ID:', createRes.data.roomId);
  if (createRes.status !== 201) throw new Error('Create room failed');
  const { roomId, playerId: p1Id, room } = createRes.data;

  // 4. Verify initial room state (targetWord should be null until Player 2 joins)
  console.log('\n[TEST 4] Retrieve Room (Check startingWord is set, targetWord is null)');
  const getRes = await makeRequest('GET', `/rooms/${roomId}`);
  console.log('Retrieved room:', getRes.status, 'startingWord:', getRes.data.room?.startingWord, 'targetWord:', getRes.data.room?.targetWord);
  if (getRes.status !== 200 || getRes.data.room.startingWord !== 'COLD' || getRes.data.room.targetWord !== null) {
    throw new Error('Initial room state invalid');
  }

  // 5. Socket.IO: Player 1 joins socket room
  console.log('\n[TEST 5] Socket.IO - Player 1 connects & joins socket room');
  const p1Socket = ClientIO(SOCKET_URL, { transports: ['websocket'] });
  await new Promise((resolve) => {
    p1Socket.on('connect', () => {
      console.log('Player 1 socket connected:', p1Socket.id);
      p1Socket.emit('create-room', { roomId, playerId: p1Id }, (ack) => {
        console.log('Player 1 create-room ack:', ack?.success);
        resolve();
      });
    });
  });

  // 6. Player 2 joins with invalid target words (identical word rejection)
  console.log('\n[TEST 6] Player 2 Join - Reject Identical Word "COLD"');
  const identicalRes = await makeRequest('POST', `/rooms/${roomId}/join`, {
    name: 'Bob (Player 2)',
    targetWord: 'COLD'
  });
  console.log('Identical word rejection:', identicalRes.status, identicalRes.data.error);
  if (identicalRes.status !== 400) throw new Error('Expected 400 when Player 2 uses identical word');

  // 7. Player 2 joins with valid Target Word "WARM" and verifies Socket.IO notification
  console.log('\n[TEST 7] Player 2 joins with Target Word "WARM" & notifies Player 1 via Socket.IO');
  let player1Notified = false;
  p1Socket.on('player-joined', (eventData) => {
    console.log('⚡ Player 1 received real-time socket event "player-joined":', eventData.name, 'role:', eventData.role, 'targetWord in room:', eventData.room?.targetWord);
    player1Notified = true;
  });

  const joinRes = await makeRequest('POST', `/rooms/${roomId}/join`, {
    name: 'Bob (Player 2)',
    targetWord: 'WARM'
  });
  console.log('Player 2 join response:', joinRes.status, 'targetWord set to:', joinRes.data.room?.targetWord);
  if (joinRes.status !== 200 || joinRes.data.room?.targetWord !== 'WARM') {
    throw new Error('Player 2 join or targetWord assignment failed');
  }
  const p2Id = joinRes.data.playerId;

  const p2Socket = ClientIO(SOCKET_URL, { transports: ['websocket'] });
  await new Promise((resolve) => {
    p2Socket.on('connect', () => {
      p2Socket.emit('join-room', { roomId, playerId: p2Id }, (ack) => {
        console.log('Player 2 join-room socket ack:', ack?.success);
        resolve();
      });
    });
  });

  await new Promise(r => setTimeout(r, 800));
  if (!player1Notified) throw new Error('Player 1 did not receive player-joined socket event');
  console.log('✅ Real-time Socket.IO notification between Player 1 & Player 2 verified with both words established!');

  // 8. Prevent full room join
  console.log('\n[TEST 8] Prevent 3rd player joining (Room Full check)');
  const thirdPlayerRes = await makeRequest('POST', `/rooms/${roomId}/join`, {
    name: 'Charlie (Player 3)',
    targetWord: 'DARK'
  });
  console.log('3rd player join status (expected 409):', thirdPlayerRes.status, thirdPlayerRes.data.error);
  if (thirdPlayerRes.status !== 409) throw new Error('Expected 409 for full room');

  p1Socket.disconnect();
  p2Socket.disconnect();

  console.log('\n🎉 ALL 8 TESTS PASSED WITH 100% SUCCESS! (ONE WORD PER PLAYER FLOW VERIFIED) 🎉\n');
  process.exit(0);
}

run().catch((err) => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
