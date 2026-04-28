/**
 * Hash utilities — SHA256 for both strings and files.
 *
 * These hashes are embedded in each block and in MongoDB,
 * providing tamper-evidence for court-ready records.
 */
'use strict';

const crypto = require('crypto');
const fs     = require('fs');

/**
 * SHA256 of any string input.
 * @param {string} content
 * @returns {string} hex digest
 */
function hashString(content) {
  return crypto.createHash('sha256').update(String(content)).digest('hex');
}

/**
 * Streaming SHA256 of a file on disk.
 * Streams the file so large files don't blow up memory.
 * @param {string} filePath - Absolute path to file
 * @returns {Promise<string>} hex digest
 */
function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash   = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end',  ()    => resolve(hash.digest('hex')));
    stream.on('error', err  => reject(err));
  });
}

/**
 * Generate a unique, human-readable grievance ID.
 * Format: GC-<unix-ms>-<4-byte-hex>
 * Example: GC-1714310400000-A3F2
 */
function generateGrievanceId() {
  const hex = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `GC-${Date.now()}-${hex}`;
}

module.exports = { hashString, hashFile, generateGrievanceId };
