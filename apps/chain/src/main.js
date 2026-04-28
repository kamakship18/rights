/**
 * Actionable Justice OS — Chain Service
 *
 * Standalone Express server providing blockchain-backed
 * grievance documentation with MongoDB fallback.
 *
 * Port: 4002 (web=3000, api=4000, worker=4001, ai=8000, chain=4002)
 */
'use strict';

const express        = require('express');
const cors           = require('cors');
const mongoose       = require('mongoose');
const path           = require('path');
const { ensureUploadsDir } = require('./modules/grievance-chain/utils/file.utils');
const grievanceRoutes      = require('./modules/grievance-chain/routes/grievance.routes');

/* ── Ensure required dirs exist before anything else ─────── */
ensureUploadsDir();

const app  = express();
const PORT = process.env.CHAIN_PORT || 4003;

/* ── Middleware ──────────────────────────────────────────── */

app.use(cors({
  origin:      (process.env.FRONTEND_ORIGIN || 'http://localhost:3000').split(','),
  credentials: true,
  methods:     ['GET', 'POST', 'OPTIONS'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ── Static file serving (uploaded evidence files) ───────── */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/* ── API routes ──────────────────────────────────────────── */
app.use('/api/grievance-chain', grievanceRoutes);

/* ── Health check ────────────────────────────────────────── */
app.get('/healthz', (_req, res) =>
  res.json({ ok: true, service: 'chain', port: PORT }),
);

/* ── Global error handler ────────────────────────────────── */
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Chain] Unhandled error:', err.message);
  res.status(500).json({ success: false, error: err.message });
});

/* ── MongoDB connection (optional) ───────────────────────── */
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/justice_chain';

mongoose
  .connect(MONGO_URI)
  .then(() =>
    console.log(`[Chain] MongoDB connected → ${MONGO_URI.replace(/\/\/.*@/, '//<creds>@')}`),
  )
  .catch(err =>
    console.warn(
      `[Chain] MongoDB unavailable (${err.message.split('\n')[0]}) — blockchain-only mode active`,
    ),
  );

/* ── Start ───────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n⛓️  [chain] running on http://localhost:${PORT}`);
  console.log(`   /healthz                              → http://localhost:${PORT}/healthz`);
  console.log(`   POST /api/grievance-chain             → file a new grievance`);
  console.log(`   GET  /api/grievance-chain             → list all grievances`);
  console.log(`   GET  /api/grievance-chain/chain-status→ blockchain health`);
  console.log(`   GET  /api/grievance-chain/:id         → fetch one grievance`);
  console.log(`   GET  /api/grievance-chain/:id/download→ court-ready JSON export\n`);
});

module.exports = app;
