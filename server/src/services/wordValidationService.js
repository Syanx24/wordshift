import { isFourLetterWord } from '../data/words.js';

export const wordValidationService = {
  /**
   * 1. Validate that the word has exactly four alphabetic letters
   * @param {string} word 
   * @returns {{ valid: boolean, error?: string, sanitized?: string }}
   */
  validateWordLength(word) {
    if (!word || typeof word !== 'string') {
      return { valid: false, error: 'Word cannot be empty.' };
    }

    const clean = word.trim().toUpperCase();

    if (clean.length !== 4) {
      return { valid: false, error: 'Word must contain exactly four letters.' };
    }

    if (!/^[A-Z]{4}$/.test(clean)) {
      return { valid: false, error: 'Word must contain only alphabetic letters (A-Z).' };
    }

    return { valid: true, sanitized: clean };
  },

  /**
   * 2. Validate that the word exists in the local English dictionary
   * @param {string} word 
   * @returns {{ valid: boolean, error?: string }}
   */
  isDictionaryWord(word) {
    const lenCheck = this.validateWordLength(word);
    if (!lenCheck.valid) {
      return lenCheck;
    }

    const clean = lenCheck.sanitized;
    if (!isFourLetterWord(clean)) {
      return {
        valid: false,
        error: `"${clean}" is not recognized as a valid 4-letter English word.`
      };
    }

    return { valid: true, sanitized: clean };
  },

  /**
   * 3. Count how many letters differ between two words and locate the index
   * @param {string} word1 
   * @param {string} word2 
   * @returns {{ count: number, changedIndex: number }}
   */
  countChangedLetters(word1, word2) {
    const w1 = (word1 || '').trim().toUpperCase();
    const w2 = (word2 || '').trim().toUpperCase();

    let count = 0;
    let changedIndex = -1;

    for (let i = 0; i < 4; i++) {
      if (w1[i] !== w2[i]) {
        count++;
        changedIndex = i;
      }
    }

    return { count, changedIndex: count === 1 ? changedIndex : -1 };
  },

  /**
   * 4. Verify that exactly ONE letter was changed from currentWord to newWord
   * @param {string} currentWord 
   * @param {string} newWord 
   * @returns {{ valid: boolean, error?: string, changedIndex?: number }}
   */
  isValidTransformation(currentWord, newWord) {
    const { count, changedIndex } = this.countChangedLetters(currentWord, newWord);

    if (count === 0) {
      return {
        valid: false,
        error: 'You must change exactly one letter. The word is unchanged.'
      };
    }

    if (count > 1) {
      return {
        valid: false,
        error: `Only one letter can change at a time. You changed ${count} letters.`
      };
    }

    return { valid: true, changedIndex };
  },

  /**
   * 5. Check if word was already used in the game's transformation history
   * @param {string} word 
   * @param {Array<{ word: string }>} wordHistory 
   * @returns {{ valid: boolean, error?: string }}
   */
  isWordAlreadyUsed(word, wordHistory = []) {
    const clean = (word || '').trim().toUpperCase();
    const used = wordHistory.some(item => (item.word || '').toUpperCase() === clean);

    if (used) {
      return {
        valid: false,
        error: `Word "${clean}" has already been played in this game. Previously used words cannot be repeated.`
      };
    }

    return { valid: true };
  },

  /**
   * 6. Validate player identity, turn order, and room playing status
   * @param {object} room 
   * @param {string} playerId 
   * @returns {{ valid: boolean, error?: string, role?: 'player1' | 'player2', player?: object }}
   */
  validatePlayerTurn(room, playerId) {
    if (!room) {
      return { valid: false, error: 'Room not found.' };
    }

    if (room.status === 'completed') {
      return { valid: false, error: 'The game has already ended.' };
    }

    if (room.status !== 'playing') {
      return { valid: false, error: `Game is not currently active (status: ${room.status}).` };
    }

    let role = null;
    let player = null;

    if (room.player1 && room.player1.playerId === playerId) {
      role = 'player1';
      player = room.player1;
    } else if (room.player2 && room.player2.playerId === playerId) {
      role = 'player2';
      player = room.player2;
    } else {
      return { valid: false, error: 'You are not a registered participant in this room.' };
    }

    if (room.currentTurn !== role) {
      const activePlayerName = role === 'player1' ? (room.player2?.name || 'Player 2') : room.player1.name;
      return {
        valid: false,
        error: `It is not your turn. Waiting for ${activePlayerName}'s move.`
      };
    }

    return { valid: true, role, player };
  },

  /**
   * 7. Check if the newly played word matches the target word
   * @param {string} newWord 
   * @param {string} targetWord 
   * @returns {boolean}
   */
  checkWinningCondition(newWord, targetWord) {
    if (!newWord || !targetWord) return false;
    return newWord.trim().toUpperCase() === targetWord.trim().toUpperCase();
  },

  /**
   * Full move validation pipeline combining all 7 rules
   * @param {{ room: object, playerId: string, word: string }} params
   * @returns {{ valid: boolean, error?: string, cleanWord?: string, changedIndex?: number, role?: string, isWinner?: boolean }}
   */
  validateMove({ room, playerId, word }) {
    // Check 1: Player turn and game status
    const turnCheck = this.validatePlayerTurn(room, playerId);
    if (!turnCheck.valid) {
      return turnCheck;
    }

    // Check 2: Word length and characters
    const lengthCheck = this.validateWordLength(word);
    if (!lengthCheck.valid) {
      return lengthCheck;
    }
    const cleanWord = lengthCheck.sanitized;

    // Check 3: Dictionary membership
    const dictCheck = this.isDictionaryWord(cleanWord);
    if (!dictCheck.valid) {
      return dictCheck;
    }

    // Check 4: Exactly one letter changed from currentWord
    const transformCheck = this.isValidTransformation(room.currentWord, cleanWord);
    if (!transformCheck.valid) {
      return transformCheck;
    }

    // Check 5: Word has not been used yet in wordHistory
    const usedCheck = this.isWordAlreadyUsed(cleanWord, room.wordHistory);
    if (!usedCheck.valid) {
      return usedCheck;
    }

    // Check 6: Winning condition
    const isWinner = this.checkWinningCondition(cleanWord, room.targetWord);

    return {
      valid: true,
      cleanWord,
      changedIndex: transformCheck.changedIndex,
      role: turnCheck.role,
      player: turnCheck.player,
      isWinner
    };
  }
};
