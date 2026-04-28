/**
 * Blockchain — append-only chain of grievance blocks.
 *
 * Core rules enforced here:
 *  - No block can be modified after insertion
 *  - Each block's previousHash must equal the prior block's hash
 *  - Tampering with any block invalidates ALL subsequent hashes
 *
 * Persistence is handled by Ledger (data/ledger.json).
 */
'use strict';

const { Block }  = require('./block');
const { Ledger } = require('./ledger');

class Blockchain {
  constructor() {
    this.ledger = new Ledger();
    // Load persisted chain; hydrate as Block instances to restore methods
    const raw = this.ledger.load();
    this.chain = raw.map(b => Object.assign(new Block(0, '', {}, ''), b));

    if (this.chain.length === 0) {
      this.chain.push(this._createGenesisBlock());
      this.ledger.save(this.chain);
      console.log('[Blockchain] Genesis block created.');
    } else {
      console.log(`[Blockchain] Loaded ${this.chain.length} blocks from ledger.`);
    }
  }

  _createGenesisBlock() {
    return new Block(
      0,
      new Date().toISOString(),
      { genesis: true, note: 'Actionable Justice OS — Grievance Chain' },
      '0',
    );
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Add a new grievance block to the chain.
   * @param {object} data - Structured grievance data
   * @returns {Block}     - The newly created block
   * @throws  {Error}     - If chain is invalid before insertion
   */
  addBlock(data) {
    const validation = this.validateChain();
    if (!validation.valid) {
      throw new Error(`Chain integrity broken before insert: ${validation.reason}`);
    }

    const previousBlock = this.getLatestBlock();
    const block = new Block(
      this.chain.length,
      new Date().toISOString(),
      data,
      previousBlock.hash,
    );

    this.chain.push(block);
    this.ledger.save(this.chain);

    console.log(`[Blockchain] ${block.toString()} added.`);
    return block;
  }

  /**
   * Validate entire chain integrity.
   * Returns { valid: true } or { valid: false, reason: string }.
   */
  validateChain() {
    for (let i = 1; i < this.chain.length; i++) {
      const cur  = this.chain[i];
      const prev = this.chain[i - 1];

      // Re-compute expected hash from stored fields
      const recomputed = new Block(
        cur.index,
        cur.timestamp,
        cur.data,
        cur.previousHash,
      ).calculateHash();

      if (cur.hash !== recomputed) {
        return { valid: false, reason: `Block #${i} hash mismatch (data tampered)` };
      }

      if (cur.previousHash !== prev.hash) {
        return { valid: false, reason: `Block #${i} previousHash mismatch (chain broken)` };
      }
    }
    return { valid: true };
  }

  /**
   * Find a block by grievanceId stored in its data payload.
   * @param {string} grievanceId
   * @returns {Block|null}
   */
  getBlockById(grievanceId) {
    return (
      this.chain.find(b => b.data && b.data.grievanceId === grievanceId) || null
    );
  }

  /** Return the full chain (read-only view). */
  getChain() {
    return [...this.chain];
  }

  /** Chain length excluding genesis. */
  get grievanceCount() {
    return Math.max(0, this.chain.length - 1);
  }
}

module.exports = { Blockchain };
