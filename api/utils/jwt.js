const jwt = require('jsonwebtoken');

/**
 * Genera un token JWT
 * @param {Object} payload - Dati da includere nel token
 * @param {string} secret - Chiave segreta
 * @param {string} expiresIn - Tempo di scadenza
 * @returns {string} Token JWT
 */
const generateToken = (payload, secret = process.env.JWT_SECRET, expiresIn = process.env.JWT_EXPIRES_IN) => {
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verifica un token JWT
 * @param {string} token - Token da verificare
 * @param {string} secret - Chiave segreta
 * @returns {Object} Payload decodificato
 */
const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  return jwt.verify(token, secret);
};

/**
 * Estrae il token Bearer dall'header Authorization
 * @param {string} authHeader - Header Authorization
 * @returns {string|null} Token estratto o null
 */
const extractBearerToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

module.exports = {
  generateToken,
  verifyToken,
  extractBearerToken
};
