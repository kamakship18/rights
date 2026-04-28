/**
 * GrievanceChain Controller — HTTP handlers for all chain endpoints.
 *
 * POST /api/grievance-chain          — file a new grievance
 * GET  /api/grievance-chain          — list all
 * GET  /api/grievance-chain/chain-status — blockchain health
 * GET  /api/grievance-chain/:id      — fetch one
 * GET  /api/grievance-chain/:id/download — JSON export
 */
'use strict';

const { GrievanceChainService } = require('../service/grievance.service');

const service = new GrievanceChainService();

/* ── POST /api/grievance-chain ───────────────────────────── */

async function createGrievance(req, res) {
  try {
    const { body, files } = req;

    // Validate required fields
    const missing = ['pin', 'title', 'description'].filter(f => !body[f]?.trim());
    if (missing.length) {
      return res.status(400).json({
        success: false,
        error:   `Missing required fields: ${missing.join(', ')}`,
      });
    }

    const result = await service.createGrievance(body, files, req);
    return res.status(201).json(result);

  } catch (err) {
    console.error('[Controller] createGrievance:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/* ── GET /api/grievance-chain ────────────────────────────── */

async function listGrievances(req, res) {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const result = await service.listGrievances(limit, page);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[Controller] listGrievances:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/* ── GET /api/grievance-chain/chain-status ───────────────── */

function getChainStatus(req, res) {
  try {
    const status = service.getChainStatus();
    return res.json({ success: true, chain: status });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/* ── GET /api/grievance-chain/:id ────────────────────────── */

async function getGrievance(req, res) {
  try {
    const doc = await service.getGrievance(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Grievance not found' });
    }
    return res.json({ success: true, data: doc });
  } catch (err) {
    console.error('[Controller] getGrievance:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/* ── GET /api/grievance-chain/:id/download ───────────────── */

async function downloadGrievance(req, res) {
  try {
    const doc = await service.getGrievance(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Grievance not found' });
    }

    const exported = service.buildExport(doc);
    const filename = `grievance-${req.params.id}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.json(exported);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  createGrievance,
  listGrievances,
  getChainStatus,
  getGrievance,
  downloadGrievance,
};
