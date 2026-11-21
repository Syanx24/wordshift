import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  mascot: {
    type: String,
    default: '😎'
  },
  connectionStatus: {
    type: String,
    enum: ['connected', 'disconnected'],
    default: 'connected'
  },
  socketId: {
    type: String,
    default: null
  },
  ready: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const WordMoveSchema = new mongoose.Schema({
  player: {
    type: String,
    enum: ['player1', 'player2'],
    required: true
  },
  playerName: {
    type: String,
    default: ''
  },
  word: {
    type: String,
    uppercase: true,
    trim: true,
    required: true,
    minlength: 4,
    maxlength: 4
  },
  changedIndex: {
    type: Number,
    default: -1 // -1 represents the starting word where no letter was changed
  },
  previousWord: {
    type: String,
    uppercase: true,
    trim: true,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const RematchRequestSchema = new mongoose.Schema({
  requestedBy: {
    type: String,
    enum: ['player1', 'player2'],
    required: true
  },
  requesterName: {
    type: String,
    default: ''
  },
  swapRoles: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const RoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  player1: {
    type: PlayerSchema,
    required: true
  },
  player2: {
    type: PlayerSchema,
    default: null
  },
  startingWord: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    minlength: 4,
    maxlength: 4
  },
  targetWord: {
    type: String,
    uppercase: true,
    trim: true,
    minlength: 4,
    maxlength: 4,
    default: null
  },
  currentWord: {
    type: String,
    uppercase: true,
    trim: true,
    default: null
  },
  wordHistory: {
    type: [WordMoveSchema],
    default: []
  },
  currentTurn: {
    type: String,
    enum: ['player1', 'player2'],
    default: 'player1'
  },
  status: {
    type: String,
    enum: [
      'waiting_for_player2',
      'waiting_for_target_word',
      'ready_to_start',
      'playing',
      'completed',
      'expired'
    ],
    default: 'waiting_for_player2'
  },
  winner: {
    type: String,
    enum: ['player1', 'player2', 'both', null],
    default: null
  },
  winnerName: {
    type: String,
    default: null
  },
  totalMoves: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 0 // Duration in seconds
  },
  rematchRequest: {
    type: RematchRequestSchema,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  version: {
    type: Number,
    default: 0
  }
}, {
  timestamps: false
});

export const Room = mongoose.model('Room', RoomSchema);
