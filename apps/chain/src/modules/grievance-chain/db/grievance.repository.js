/**
 * GrievanceRepository — data-access layer for MongoDB.
 *
 * All methods check Mongoose connection state before operating.
 * If MongoDB is not connected, methods throw so callers can decide
 * whether to propagate or swallow the error.
 */
'use strict';

const mongoose         = require('mongoose');
const { GrievanceChain } = require('./grievance.model');

class GrievanceRepository {
  /** True when Mongoose has an open connection. */
  isConnected() {
    return mongoose.connection.readyState === 1;
  }

  _requireConnection() {
    if (!this.isConnected()) {
      throw new Error('MongoDB not connected');
    }
  }

  /**
   * Persist a new grievance document.
   * @param {object} data
   * @returns {Promise<object>} - The saved document (lean)
   */
  async create(data) {
    this._requireConnection();
    const doc = new GrievanceChain(data);
    const saved = await doc.save();
    return saved.toObject();
  }

  /**
   * Fetch a grievance by its grievanceId string.
   * @param {string} grievanceId
   * @returns {Promise<object|null>}
   */
  async findById(grievanceId) {
    this._requireConnection();
    return GrievanceChain.findOne({ grievanceId }).lean();
  }

  /**
   * Paginated list of grievances, newest first.
   * @param {number} limit
   * @param {number} skip
   * @returns {Promise<object[]>}
   */
  async findAll(limit = 20, skip = 0) {
    this._requireConnection();
    return GrievanceChain.find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
  }

  /** Total document count (for pagination). */
  async count() {
    this._requireConnection();
    return GrievanceChain.countDocuments();
  }
}

module.exports = { GrievanceRepository };
