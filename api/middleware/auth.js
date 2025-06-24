const { verifyToken, extractBearerToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/helpers');

/**
 * Middleware per autenticazione Bearer Token
 */
const authenticateBearer = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      return res.status(401).json(
        errorResponse('Token di accesso mancante', 401)
      );
    }

    // Verifica se il token corrisponde al bearer token configurato
    if (token !== process.env.BEARER_TOKEN) {
      return res.status(401).json(
        errorResponse('Token di accesso non valido', 401)
      );
    }

    next();
  } catch (error) {
    return res.status(401).json(
      errorResponse('Errore di autenticazione', 401, error.message)
    );
  }
};

/**
 * Middleware per autenticazione JWT (opzionale per future implementazioni)
 */
const authenticateJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      return res.status(401).json(
        errorResponse('Token JWT mancante', 401)
      );
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json(
      errorResponse('Token JWT non valido', 401, error.message)
    );
  }
};

/**
 * Middleware per autenticazione password (legacy support)
 */
const authenticatePassword = (req, res, next) => {
  const password = req.headers['x-access-password'] || req.body.password;
  
  if (password !== process.env.API_PASSWORD) {
    return res.status(401).json(
      errorResponse('Password errata', 401)
    );
  }
  
  next();
};

module.exports = {
  authenticateBearer,
  authenticateJWT,
  authenticatePassword
};
