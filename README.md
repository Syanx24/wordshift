# WORDSHIFT — Real-time Multiplayer Word Transformation Game

> **"One letter at a time. One word closer to victory."**

WORDSHIFT is a real-time multiplayer word transformation game built on the MERN stack (`React + Vite + Tailwind CSS` on the client, `Node.js + Express.js + Mongoose + Socket.IO` on the server).

---

## 🎮 Core Game Concept & Rules

WORDSHIFT is a competitive two-player word ladder battle where vocabulary meets strategy:

1. **Strict Word Ownership**:
   - **Player 1 (Host)** enters their name and selects **ONLY the 4-letter starting word**. Player 1 is never asked for the target word.
   - **Player 2 (Challenger)** joins via an invitation link, enters their name, and selects **ONLY the 4-letter target word**. Player 2 cannot alter Player 1's starting word.
   - Neither player controls both words. The game starts only after Player 2 locks in a valid, different target word.
2. **Turn-Based Shifts**:
   - Players alternate turns. Player 1 always makes the first move.
3. **Single-Letter Mutation**:
   - On each turn, the active player must change **exactly ONE letter** of the current word. Three letters must remain unchanged.
4. **Dictionary Verification**:
   - Every shift must form a valid, recognized 4-letter English word, validated against an embedded local dictionary dataset (no external AI dependency).
5. **No Word Repetition**:
   - Words already played in the match chain cannot be reused.
6. **Victory Condition**:
   - The player who crafts the word matching the target word wins immediately!
7. **Mutual Rematch System**:
   - Either player can request a rematch with mutual confirmation. Includes an optional **"Role Swap"** mode where roles switch: former Player 2 becomes Player 1 and starts the new game with their previous target word as the new starting word!

---

## 🛠 Technology Stack

### Frontend (`/client`)
- **React.js (v18)** with **Vite**
- **Tailwind CSS** (Custom responsive theme with dark/light mode and electric accents)
- **Framer Motion** (Letter tile flips, glow highlights, turn transitions, overlays)
- **React Router DOM (v7)**
- **Axios** (REST API communication)
- **Socket.IO Client** (Real-time synchronization, reconnection, presence)
- **Lucide React** (Modern iconography)

### Backend (`/server`)
- **Node.js** & **Express.js** (REST API)
- **Socket.IO** (Real-time room pub/sub, presence tracking, reconnection)
- **Mongoose & MongoDB** (Schema architecture with automated in-memory MongoDB fallback)
- **Curated 4-Letter English Dictionary Dataset** (SOWPODS/TWL verified)

---

## 📁 Project Architecture

```text
wordgame/
├── client/                      # Frontend Vite + React SPA
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Navbar.jsx       # Header with branding, Rules modal, & theme toggle
│   │   │   ├── Footer.jsx       # Modern footer
│   │   │   ├── WordTiles.jsx    # Responsive letter tiles with changed-letter highlights
│   │   │   ├── WordInput.jsx    # 4-box tactile inputs with turn validation
│   │   │   ├── WordHistoryLadder.jsx # Scrollable transformation ladder
│   │   │   ├── HowToPlayModal.jsx # 6 rules + 15s animated BARK -> KITE demo
│   │   │   ├── VictoryModal.jsx # Winner announcement, stats, & mutual rematch
│   │   │   ├── GamePlayScreen.jsx # Full-featured multiplayer match arena
│   │   │   ├── CountdownOverlay.jsx # 3-second animated match countdown
│   │   │   ├── CopyButton.jsx   # One-click link copy
│   │   │   └── ShareButton.jsx  # Web Share API + clipboard fallback
│   │   ├── context/
│   │   │   ├── ThemeContext.jsx # Light / Dark mode management
│   │   │   └── GameContext.jsx  # Player session, role, & refresh state recovery
│   │   ├── pages/
│   │   │   ├── Home.jsx         # Landing page with interactive ladder & hero
│   │   │   ├── CreateRoom.jsx   # Player 1 match creator (Starting word ONLY)
│   │   │   ├── JoinRoom.jsx     # Player 2 direct join page (Target word ONLY)
│   │   │   ├── WaitingRoom.jsx  # Real-time lobby, state controller, & arena
│   │   │   └── NotFound.jsx     # 404 handler
│   │   ├── services/
│   │   │   ├── api.js           # REST API client
│   │   │   └── socket.js        # Socket.IO connection manager
│   │   ├── App.jsx              # Routes
│   │   ├── main.jsx             # React entrypoint
│   │   └── index.css            # Tailwind directives & glassmorphism utilities
│   ├── vercel.json              # SPA route rewrites for Vercel
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                      # Backend Express + Socket.IO server
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js            # MongoDB Atlas & in-memory dev database connection
│   │   ├── controllers/
│   │   │   └── roomController.js # Room lifecycle, moves, & rematch REST endpoints
│   │   ├── data/
│   │   │   └── words.js         # Curated 4-letter English dictionary dataset
│   │   ├── models/
│   │   │   └── Room.js          # Room Mongoose schema with RematchRequest subdocument
│   │   ├── routes/
│   │   │   └── roomRoutes.js    # Express REST API routes
│   │   ├── services/
│   │   │   ├── dictionaryService.js # Word verification & suggestions
│   │   │   └── wordValidationService.js # All 7 core gameplay validation rules
│   │   ├── sockets/
│   │   │   └── roomSocket.js    # Real-time events (moves, disconnects, rematches)
│   │   └── server.js            # Express app, CORS configuration, & server bootstrap
│   ├── test/
│   │   ├── phase2-runner.js     # Phase 2 test suite
│   │   └── phase3-runner.js     # Phase 3 automated test suite (8/8 tests pass)
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

## 🚀 Running Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Optional! If no local or cloud MongoDB URI is provided, the backend automatically spins up an in-memory MongoDB database.

### 1. Start Backend Server
```bash
cd server
npm install
npm run dev
```
*Backend runs at `http://localhost:5000`.*

### 2. Start Frontend Client
```bash
cd client
npm install
npm run dev
```
*Frontend runs at `http://localhost:5173`.*

---

## 🧪 Automated Testing

Run the full end-to-end verification test suite:
```bash
cd server
node test/phase3-runner.js
```

### Verified Scenarios (8/8 Pass):
1. **Dictionary & Rules Engine**: 4-letter length, dictionary verification, 1-letter mutation (`BARK -> PARK`), multi-letter rejection (`BARK -> PORE`).
2. **Player 1 Ownership**: Room created with starting word `BARK`, `targetWord` remains `null`.
3. **Player 2 Ownership**: Target word identical to starting word rejected; valid target word `KITE` accepted, status transitions to `ready_to_start`.
4. **Game Start**: Initialized with starting word, Player 1 turn.
5. **Full 8-Move Shift Sequence**: Complete `BARK -> PARK -> PART -> PORT -> SORT -> SORE -> SIRE -> SITE -> KITE` transformation. Winner declared, duration and moves tracked.
6. **Mutual Rematch with Role Swap**: Player 2 requests swap; Player 1 accepts; roles invert (Player 2 becomes Player 1 with `KITE` as start); board resets cleanly.
7. **Rematch Engagement**: New Player 2 chooses target word `COLD`; match transitions to `ready_to_start`.
8. **State Recovery**: Room rehydration after simulated browser refresh.

---

## 🌐 Production Deployment Guide

### 1. MongoDB Database (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas) and create a free M0 cluster.
2. In **Network Access**, add `0.0.0.0/0` (allow access from anywhere).
3. In **Database Access**, create a database user and password.
4. Click **Connect** > **Drivers** > Copy the connection string:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/wordshift?retryWrites=true&w=majority
   ```

---

### 2. Backend Deployment (Render or Railway)

#### Deploying on Render:
1. Push your repository to GitHub.
2. Log into [Render](https://render.com) and create a **New Web Service**.
3. Select your repository.
4. Set the configuration:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
5. Under **Environment Variables**, add:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<your-mongodb-atlas-uri>`
   - `CLIENT_URL`: `https://your-frontend.vercel.app`
6. Click **Deploy**. Note your backend URL (e.g. `https://wordshift-api.onrender.com`).

#### Deploying on Railway:
1. Log into [Railway](https://railway.app) and create a **New Project from GitHub Repo**.
2. Set root directory to `/server`.
3. Add the same environment variables (`MONGODB_URI`, `CLIENT_URL`, `PORT=5000`).

---

### 3. Frontend Deployment (Vercel)
1. Log into [Vercel](https://vercel.com) and click **Add New Project**.
2. Select your repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://your-backend-service.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://your-backend-service.onrender.com`
5. Click **Deploy**.
   *Note: `client/vercel.json` is preconfigured to route all SPA deep links (`/room/:id`, `/join/:id`) to `index.html`.*

---

## 📱 Mobile Responsiveness

WORDSHIFT is built mobile-first and tested for:
- **320px screens** (iPhone SE, narrow Android devices)
- **375px & 390px screens** (iPhone 12/13/14/15)
- **430px screens** (iPhone Pro Max, Samsung Ultra)
- **Tablets & Desktop displays**
- **Touch Targets**: All tile inputs and primary action buttons maintain $\ge 44$px touch targets.
- **Virtual Keyboards**: Tactile 4-letter boxes with hidden accessible inputs keep inputs sticky and avoid keyboard obstruction.

---

## 📄 License
MIT License. Built for real-time multiplayer word game enthusiasts.
