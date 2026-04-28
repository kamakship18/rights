/**
 * GrievanceChainService — orchestrates blockchain + MongoDB storage.
 *
 * Failover logic:
 *   try  → addBlock(data)     [primary: blockchain]
 *          saveToMongo(...)   [secondary: MongoDB reference]
 *   catch → saveToMongo(...)  [fallback: MongoDB only]
 *
 * If MongoDB itself is unavailable, blockchain storage still succeeds.
 */
'use strict';

const { blockchain }          = require('../blockchain/ledger-instance');
const { GrievanceRepository } = require('../db/grievance.repository');
const { hashFile, generateGrievanceId } = require('../utils/hash.utils');
const { getFileUrl }          = require('../utils/file.utils');

const repo = new GrievanceRepository();

class GrievanceChainService {

  /* ── Create ─────────────────────────────────────────────── */

  /**
   * File a new grievance: generate ID + hashes, store on chain, save to Mongo.
   * @param {object}   body  - Parsed request body
   * @param {object[]} files - Multer file objects
   * @param {object}   req   - Express request (for URL generation)
   * @returns {Promise<object>} - Creation receipt
   */
  async createGrievance(body, files, req) {
    const grievanceId = generateGrievanceId();
    const timestamp   = new Date().toISOString();

    // 1. Hash every uploaded file
    const processedFiles = await Promise.all(
      (files || []).map(async (file) => {
        const hash = await hashFile(file.path);
        return {
          name:     file.originalname,
          url:      getFileUrl(file.filename, req),
          hash,
          mimetype: file.mimetype,
          size:     file.size,
        };
      }),
    );

    // 2. Normalise tags + rights from string or array
    const parseTags = (v) =>
      Array.isArray(v) ? v : (v ? String(v).split(',').map(t => t.trim()).filter(Boolean) : []);

    const metadata = {
      fullName:          body.fullName   || null,
      pin:               body.pin,
      location:          body.location   || null,
      title:             body.title,
      description:       body.description,
      tags:              parseTags(body.tags),
      rightsRegulations: parseTags(body.rightsRegulations),
    };

    // 3. Block payload (stored immutably on chain)
    const blockData = {
      grievanceId,
      timestamp,
      metadata,
      fileHashes: processedFiles.map(f => ({ name: f.name, hash: f.hash })),
    };

    let storageType    = 'blockchain';
    let blockchainHash = null;
    let blockIndex     = null;

    try {
      // ── Primary path: blockchain ───────────────────────────
      const block    = blockchain.addBlock(blockData);
      blockchainHash = block.hash;
      blockIndex     = block.index;

      // ── Also persist a reference in MongoDB (for fast queries)
      try {
        await repo.create({
          grievanceId,
          metadata,
          files:         processedFiles,
          blockchainHash,
          blockIndex,
          storageType:   'blockchain',
          isAnonymous:   !body.fullName,
          timestamp,
        });
      } catch (mongoErr) {
        // Non-critical: blockchain is the source of truth
        console.warn('[Service] MongoDB reference save skipped:', mongoErr.message);
      }

    } catch (chainErr) {
      // ── Fallback path: MongoDB only ────────────────────────
      console.error('[Service] Blockchain failed, falling back to MongoDB:', chainErr.message);
      storageType = 'mongodb';

      await repo.create({
        grievanceId,
        metadata,
        files:         processedFiles,
        blockchainHash: null,
        blockIndex:     null,
        storageType:   'mongodb',
        isAnonymous:   !body.fullName,
        timestamp,
      });
    }

    return {
      success:         true,
      grievanceId,
      storageType,
      blockchainHash,
      blockIndex,
      timestamp,
      filesProcessed:  processedFiles.length,
    };
  }

  /* ── Read ────────────────────────────────────────────────── */

  /**
   * Fetch a grievance from MongoDB (fast) + enrich with block data.
   * Falls back to scanning the chain directly if Mongo is unavailable.
   */
  async getGrievance(grievanceId) {
    // Try MongoDB first (O(1) index lookup)
    try {
      const doc = await repo.findById(grievanceId);
      if (doc) {
        const block       = blockchain.getBlockById(grievanceId);
        const chainStatus = blockchain.validateChain();
        return {
          ...doc,
          blockchainBlock: block   || null,
          chainValid:      block   ? chainStatus.valid : null,
        };
      }
    } catch (mongoErr) {
      console.warn('[Service] MongoDB lookup failed, scanning chain:', mongoErr.message);
    }

    // Fallback: scan blockchain directly
    const block = blockchain.getBlockById(grievanceId);
    if (block) {
      return {
        grievanceId,
        metadata:        block.data.metadata,
        files:           [],
        blockchainHash:  block.hash,
        blockIndex:      block.index,
        storageType:     'blockchain',
        isAnonymous:     !block.data.metadata?.fullName,
        timestamp:       block.timestamp,
        blockchainBlock: block,
        chainValid:      true,
      };
    }

    return null;
  }

  /**
   * Paginated list of all grievances.
   * Tries MongoDB; falls back to chain scan.
   */
  async listGrievances(limit = 20, page = 1) {
    const skip = (page - 1) * limit;

    try {
      const [items, total] = await Promise.all([
        repo.findAll(limit, skip),
        repo.count(),
      ]);
      return { items, total, page, limit, hasNext: skip + items.length < total };
    } catch (mongoErr) {
      console.warn('[Service] MongoDB list failed, reading from chain:', mongoErr.message);
      // Fallback: derive from blockchain (skip genesis block)
      const chain = blockchain.getChain().slice(1).reverse();
      const items = chain.slice(skip, skip + limit).map(b => ({
        grievanceId:    b.data.grievanceId,
        metadata:       b.data.metadata,
        blockchainHash: b.hash,
        blockIndex:     b.index,
        storageType:    'blockchain',
        timestamp:      b.timestamp,
        files:          [],
      }));
      const total = chain.length;
      return { items, total, page, limit, hasNext: skip + items.length < total };
    }
  }

  /* ── Chain status ────────────────────────────────────────── */

  getChainStatus() {
    const chain      = blockchain.getChain();
    const validation = blockchain.validateChain();
    const latest     = chain[chain.length - 1];
    return {
      blocks:         chain.length,
      grievances:     blockchain.grievanceCount,
      valid:          validation.valid,
      invalidReason:  validation.reason || null,
      latestHash:     latest?.hash      || null,
      latestIndex:    latest?.index     ?? null,
    };
  }

  /* ── Export ──────────────────────────────────────────────── */

  /**
   * Build a court-ready JSON export of a grievance document.
   * Includes all hashes, timestamps, and file evidence.
   */
  buildExport(doc) {
    return {
      exportedAt:     new Date().toISOString(),
      exportVersion:  '1.0',
      system:         'Actionable Justice OS — Grievance Chain',
      courtReadyRecord: {
        grievanceId:    doc.grievanceId,
        timestamp:      doc.timestamp,
        storageType:    doc.storageType,
        blockchainHash: doc.blockchainHash || 'N/A (MongoDB fallback)',
        blockIndex:     doc.blockIndex     ?? 'N/A',
        isAnonymous:    doc.isAnonymous,
        metadata:       doc.metadata,
        files: (doc.files || []).map(f => ({
          name:    f.name,
          url:     f.url,
          sha256:  f.hash,
          size:    f.size,
          type:    f.mimetype,
        })),
        integrity: {
          immutable:  true,
          algorithm:  'SHA-256',
          note: 'SHA256 hashes verify file and block authenticity. ' +
                'Cross-check blockchainHash against the on-chain ledger.',
        },
      },
    };
  }
}

module.exports = { GrievanceChainService };
