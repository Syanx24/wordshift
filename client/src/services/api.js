import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const roomApi = {
  /**
   * Create a new room (Player 1 provides name and startingWord)
   * @param {{ name: string, startingWord: string }} data 
   */
  async createRoom(data) {
    const response = await api.post('/rooms', data);
    return response.data;
  },

  /**
   * Get room details by roomId
   * @param {string} roomId 
   */
  async getRoom(roomId) {
    const response = await api.get(`/rooms/${roomId}`);
    return response.data;
  },

  /**
   * Join an existing room (Player 2 provides name and optionally targetWord)
   * @param {string} roomId 
   * @param {{ name: string, targetWord?: string, playerId?: string }} data 
   */
  async joinRoom(roomId, data) {
    const response = await api.post(`/rooms/${roomId}/join`, data);
    return response.data;
  },

  /**
   * Submit target word (Player 2)
   * @param {string} roomId 
   * @param {{ playerId: string, targetWord: string }} data 
   */
  async submitTargetWord(roomId, data) {
    const response = await api.post(`/rooms/${roomId}/target-word`, data);
    return response.data;
  },

  /**
   * Start game after countdown
   * @param {string} roomId 
   */
  async startGame(roomId) {
    const response = await api.post(`/rooms/${roomId}/start`);
    return response.data;
  },

  /**
   * Submit word transformation move
   * @param {string} roomId 
   * @param {{ playerId: string, word: string }} data 
   */
  async submitMove(roomId, data) {
    const response = await api.post(`/rooms/${roomId}/move`, data);
    return response.data;
  },

  /**
   * Terminate match early from either player's side
   * @param {string} roomId 
   * @param {{ playerId: string }} data 
   */
  async terminateGame(roomId, data) {
    const response = await api.post(`/rooms/${roomId}/terminate`, data);
    return response.data;
  },

  /**
   * Request / confirm rematch
   * @param {string} roomId 
   * @param {{ playerId: string, newStartingWord?: string }} data 
   */
  async rematch(roomId, data) {
    const response = await api.post(`/rooms/${roomId}/rematch`, data);
    return response.data;
  },

  /**
   * Request rematch with mutual confirmation
   * @param {string} roomId 
   * @param {{ playerId: string, swapRoles?: boolean }} data 
   */
  async requestRematch(roomId, data) {
    const response = await api.post(`/rooms/${roomId}/rematch/request`, data);
    return response.data;
  },

  /**
   * Respond to rematch request (accept or decline)
   * @param {string} roomId 
   * @param {{ playerId: string, accept: boolean }} data 
   */
  async respondRematch(roomId, data) {
    const response = await api.post(`/rooms/${roomId}/rematch/respond`, data);
    return response.data;
  },

  /**
   * Fast check if a word is in dictionary
   * @param {string} word 
   */
  async checkWord(word) {
    const response = await api.get(`/words/validate/${word}`);
    return response.data;
  }
};

export default api;
