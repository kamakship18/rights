/**
 * Singleton Blockchain instance.
 * Import this everywhere — do NOT create new Blockchain() elsewhere.
 */
'use strict';

const { Blockchain } = require('./blockchain');

const blockchain = new Blockchain();

module.exports = { blockchain };
