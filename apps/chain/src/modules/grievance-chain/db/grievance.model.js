/**
 * GrievanceChain — MongoDB document schema.
 *
 * Enforces immutability via pre-hooks: once saved, no document
 * can be updated.  This mirrors the blockchain's append-only guarantee.
 *
 * storageType: "blockchain" = block exists on chain
 *              "mongodb"    = blockchain failed; this is the primary record
 */
'use strict';

const mongoose = require('mongoose');

/* ── Sub-schemas ──────────────────────────────────────────── */

const fileSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },
    url:      { type: String, required: true },
    hash:     { type: String, required: true },   // SHA256 of file contents
    mimetype: { type: String },
    size:     { type: Number },
  },
  { _id: false },
);

const metadataSchema = new mongoose.Schema(
  {
    fullName:          { type: String, default: null },
    pin:               { type: String, required: true },
    location:          { type: String, default: null },
    title:             { type: String, required: true },
    description:       { type: String, required: true },
    tags:              { type: [String], default: [] },
    rightsRegulations: { type: [String], default: [] },
  },
  { _id: false },
);

/* ── Main schema ──────────────────────────────────────────── */

const grievanceChainSchema = new mongoose.Schema(
  {
    grievanceId: {
      type:     String,
      required: true,
      unique:   true,
      index:    true,
    },
    metadata:       { type: metadataSchema, required: true },
    files:          { type: [fileSchema], default: [] },
    blockchainHash: { type: String, default: null },
    blockIndex:     { type: Number, default: null },
    storageType: {
      type:    String,
      enum:    ['blockchain', 'mongodb'],
      default: 'blockchain',
    },
    isAnonymous: { type: Boolean, default: false },
    timestamp:   { type: Date,    default: Date.now },
  },
  {
    timestamps:  true,   // adds createdAt + updatedAt automatically
    versionKey:  false,
    collection:  'grievance_chain',
  },
);

/* ── Immutability guards ──────────────────────────────────── */

function rejectUpdate() {
  throw new Error(
    '[GrievanceChain] Immutability violation — records cannot be updated after creation.',
  );
}

grievanceChainSchema.pre('findOneAndUpdate', rejectUpdate);
grievanceChainSchema.pre('updateOne',        rejectUpdate);
grievanceChainSchema.pre('updateMany',       rejectUpdate);

/* ── Model ────────────────────────────────────────────────── */

const GrievanceChain = mongoose.model('GrievanceChain', grievanceChainSchema);

module.exports = { GrievanceChain };
