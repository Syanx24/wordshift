import { isFourLetterWord, FOUR_LETTER_WORDS } from '../data/words.js';

/**
 * Service for dictionary validation of 4-letter words
 */
export const dictionaryService = {
  /**
   * Validate a single word
   * @param {string} word 
   * @returns {{ valid: boolean, error?: string, sanitized?: string }}
   */
  validateWord(word) {
    if (!word || typeof word !== 'string') {
      return { valid: false, error: 'Word cannot be empty' };
    }

    const clean = word.trim().toUpperCase();

    if (clean.length !== 4) {
      return { valid: false, error: 'Word must be exactly 4 letters' };
    }

    if (!/^[A-Z]{4}$/.test(clean)) {
      return { valid: false, error: 'Word must contain only alphabetic letters' };
    }

    if (!isFourLetterWord(clean)) {
      return { valid: false, error: `"${clean}" is not recognized as a valid 4-letter English word` };
    }

    return { valid: true, sanitized: clean };
  },

  /**
   * Validate a pair of words (starting and target)
   * @param {string} startingWord 
   * @param {string} targetWord 
   * @returns {{ valid: boolean, error?: string, start?: string, target?: string }}
   */
  validateWordPair(startingWord, targetWord) {
    const startResult = this.validateWord(startingWord);
    if (!startResult.valid) {
      return { valid: false, error: `Starting word: ${startResult.error}` };
    }

    const targetResult = this.validateWord(targetWord);
    if (!targetResult.valid) {
      return { valid: false, error: `Target word: ${targetResult.error}` };
    }

    if (startResult.sanitized === targetResult.sanitized) {
      return { valid: false, error: 'Starting word and target word cannot be identical' };
    }

    return {
      valid: true,
      start: startResult.sanitized,
      target: targetResult.sanitized
    };
  },

  /**
   * Check if a word is in dictionary
   * @param {string} word 
   * @returns {boolean}
   */
  hasWord(word) {
    return isFourLetterWord(word);
  },

  /**
   * Get total word count in dictionary
   */
  getWordCount() {
    return FOUR_LETTER_WORDS.size;
  }
};
