/**
 * File utilities — upload directory management and URL generation.
 *
 * Files are stored locally at apps/chain/uploads/.
 * IPFS can be swapped in by replacing getFileUrl() with an IPFS upload call.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '../../../../uploads');

/** Ensure the uploads directory exists (called at startup). */
function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log('[Files] Created uploads directory:', UPLOADS_DIR);
  }
}

/**
 * Build the public URL for an uploaded file.
 * Swap this for an IPFS gateway URL when IPFS is configured.
 * @param {string} filename - Disk filename (not original name)
 * @param {object} req      - Express request (for host/protocol)
 * @returns {string}
 */
function getFileUrl(filename, req) {
  const protocol = req.protocol || 'http';
  const host     = req.get('host') || `localhost:${process.env.CHAIN_PORT || 4002}`;
  return `${protocol}://${host}/uploads/${filename}`;
}

/**
 * Attempt to delete a file from disk (best-effort, never throws).
 * @param {string} filePath
 */
function safeDelete(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // intentionally ignored
  }
}

module.exports = { ensureUploadsDir, getFileUrl, safeDelete, UPLOADS_DIR };
