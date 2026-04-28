/**
 * Ledger — file-system persistence for the blockchain.
 *
 * The chain is persisted to data/ledger.json so it survives
 * server restarts.  On first boot an empty array is returned
 * and the blockchain layer adds the genesis block.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const LEDGER_PATH = path.join(__dirname, '../../../../data/ledger.json');

class Ledger {
  /** Load the persisted chain from disk.  Returns [] on first run or error. */
  load() {
    try {
      if (fs.existsSync(LEDGER_PATH)) {
        const raw = fs.readFileSync(LEDGER_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.error('[Ledger] Failed to load — starting fresh:', err.message);
    }
    return [];
  }

  /** Atomically write the current chain to disk. */
  save(chain) {
    try {
      const dir = path.dirname(LEDGER_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      // Write to a temp file first then rename for atomicity
      const tmp = LEDGER_PATH + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(chain, null, 2), 'utf8');
      fs.renameSync(tmp, LEDGER_PATH);
    } catch (err) {
      console.error('[Ledger] Failed to save:', err.message);
      throw err;
    }
  }
}

module.exports = { Ledger };
