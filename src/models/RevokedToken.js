const mongoose = require('mongoose');

/**
 * Stores revoked JWT ids (jti). TTL index removes rows when expiresAt passes
 * (same moment the JWT would no longer be valid anyway).
 */
const revokedTokenSchema = new mongoose.Schema({
  jti: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});

revokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RevokedToken', revokedTokenSchema);
