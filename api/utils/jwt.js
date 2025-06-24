const jwt = require('jsonwebtoken');

/**
 * Genera un token JWT
 * @param {Object} payload - Dati da includere nel token
 * @param {string} secret - Chiave segreta
 * @param {string} expiresIn - Tempo di scadenza
 * @returns {string} Token JWT
 */
const generateToken = (payload, secret = process.env.JWT_SECRET, expiresIn = process.env.JWT_EXPIRES_IN) => {
  console.log('🔑 [JWT DEBUG] Generando token JWT...');
  console.log('🔑 [JWT DEBUG] Payload:', payload);
  console.log('🔑 [JWT DEBUG] Secret configurato:', secret ? 'SÌ' : 'NO');
  console.log('🔑 [JWT DEBUG] ExpiresIn:', expiresIn);
  
  if (!secret) {
    console.log('❌ [JWT ERROR] JWT_SECRET non configurato!');
    throw new Error('JWT_SECRET non configurato nelle variabili d\'ambiente');
  }
  
  try {
    const token = jwt.sign(payload, secret, { expiresIn });
    console.log('✅ [JWT SUCCESS] Token generato:', token ? `${token.substring(0, 20)}...` : 'ERRORE');
    return token;
  } catch (error) {
    console.log('❌ [JWT ERROR] Errore nella generazione del token:', error.message);
    throw error;
  }
};

/**
 * Verifica un token JWT
 * @param {string} token - Token da verificare
 * @param {string} secret - Chiave segreta
 * @returns {Object} Payload decodificato
 */
const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  console.log('🔍 [JWT DEBUG] Verificando token JWT...');
  console.log('🔍 [JWT DEBUG] Token:', token ? `${token.substring(0, 20)}...` : 'VUOTO');
  console.log('🔍 [JWT DEBUG] Secret configurato:', secret ? 'SÌ' : 'NO');
  
  if (!secret) {
    console.log('❌ [JWT ERROR] JWT_SECRET non configurato per la verifica!');
    throw new Error('JWT_SECRET non configurato nelle variabili d\'ambiente');
  }
  
  if (!token) {
    console.log('❌ [JWT ERROR] Token vuoto fornito per la verifica!');
    throw new Error('Token JWT vuoto');
  }
  
  try {
    const decoded = jwt.verify(token, secret);
    console.log('✅ [JWT SUCCESS] Token verificato con successo:', decoded);
    return decoded;
  } catch (error) {
    console.log('❌ [JWT ERROR] Errore nella verifica del token:', error.message);
    console.log('❌ [JWT ERROR] Tipo errore:', error.name);
    throw error;
  }
};

/**
 * Estrae il token Bearer dall'header Authorization
 * @param {string} authHeader - Header Authorization
 * @returns {string|null} Token estratto o null
 */
const extractBearerToken = (authHeader) => {
  console.log('🔍 [JWT DEBUG] Estraendo Bearer token...');
  console.log('🔍 [JWT DEBUG] Auth header ricevuto:', authHeader);
  
  if (!authHeader) {
    console.log('❌ [JWT DEBUG] Header Authorization mancante');
    return null;
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    console.log('❌ [JWT DEBUG] Header Authorization non inizia con "Bearer "');
    console.log('❌ [JWT DEBUG] Header ricevuto inizia con:', authHeader.substring(0, 10));
    return null;
  }
  
  const token = authHeader.substring(7);
  console.log('✅ [JWT DEBUG] Token estratto:', token ? `${token.substring(0, 10)}...` : 'VUOTO');
  console.log('🔍 [JWT DEBUG] Lunghezza token:', token ? token.length : 0);
  
  return token;
};

module.exports = {
  generateToken,
  verifyToken,
  extractBearerToken
};
