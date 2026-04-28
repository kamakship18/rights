/**
 * Block — single unit in the grievance blockchain.
 *
 * Each grievance filing creates exactly one block.
 * Once created, a block CANNOT be modified — any change
 * invalidates the SHA256 hash and breaks the chain.
 */
'use strict';

const crypto = require('crypto');

class Block {
  /**
   * @param {number} index       - Position in the chain (0 = genesis)
   * @param {string} timestamp   - ISO-8601 creation time
   * @param {object} data        - Grievance payload
   * @param {string} previousHash - Hash of the preceding block
   */
  constructor(index, timestamp, data, previousHash = '') {
    this.index        = index;
    this.timestamp    = timestamp;
    this.data         = data;
    this.previousHash = previousHash;
    this.hash         = this.calculateHash();
  }

  /**
   * Deterministic SHA256 hash of all block fields.
   * Changing ANY field produces a completely different hash.
   */
  calculateHash() {
    const content = JSON.stringify({
      index:        this.index,
      timestamp:    this.timestamp,
      data:         this.data,
      previousHash: this.previousHash,
    });
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /** Human-readable summary for logging. */
  toString() {
    return `Block#${this.index} [${this.hash.slice(0, 12)}…] prev=[${this.previousHash.slice(0, 12)}…]`;
  }
}

module.exports = { Block };
