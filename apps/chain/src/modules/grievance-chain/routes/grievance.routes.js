/**
 * Grievance-chain routes — wires Express router to controllers.
 *
 * File upload constraints:
 *   - Max 10 files per request
 *   - Max 10 MB per file
 *   - Allowed types: jpg, png, gif, webp, pdf, doc, docx
 */
'use strict';

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const { UPLOADS_DIR } = require('../utils/file.utils');
const ctrl = require('../controller/grievance.controller');

const router = express.Router();

/* ── Multer storage ──────────────────────────────────────── */

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const base = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}${ext}`);
  },
});

const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },        // 10 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) cb(null, true);
    else cb(new Error(`File type not supported: ${file.mimetype}`));
  },
});

/* ── Routes ──────────────────────────────────────────────── */

router.post('/',              upload.array('files', 10), ctrl.createGrievance);
router.get('/',               ctrl.listGrievances);
router.get('/chain-status',   ctrl.getChainStatus);       // before :id !
router.get('/:id/download',   ctrl.downloadGrievance);
router.get('/:id',            ctrl.getGrievance);

/* ── Multer error handler ────────────────────────────────── */

// eslint-disable-next-line no-unused-vars
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message?.includes('not supported')) {
    return res.status(400).json({ success: false, error: err.message });
  }
  res.status(500).json({ success: false, error: err.message });
});

module.exports = router;
