const { errorResponse } = require('../utils/helpers');

/**
 * Middleware per gestione degli errori globali
 */
const errorHandler = (err, req, res, next) => {
  // Non loggare errori di parsing JSON nei test
  if (process.env.NODE_ENV !== 'test') {
    console.error('Error:', err);
  }

  // Errore di parsing JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json(
      errorResponse('Formato JSON non valido', 400)
    );
  }

  // Errore di validazione Joi
  if (err.isJoi) {
    return res.status(400).json(
      errorResponse('Dati non validi', 400, err.details.map(detail => detail.message))
    );
  }

  // Errore JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      errorResponse('Token non valido', 401)
    );
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(
      errorResponse('Token scaduto', 401)
    );
  }

  // Errore di file system
  if (err.code === 'ENOENT') {
    return res.status(404).json(
      errorResponse('File non trovato', 404)
    );
  }

  if (err.code === 'EACCES') {
    return res.status(403).json(
      errorResponse('Accesso negato al file', 403)
    );
  }

  // Errore generico del server
  return res.status(500).json(
    errorResponse('Errore interno del server', 500, process.env.NODE_ENV === 'development' ? err.message : undefined)
  );
};

/**
 * Middleware per gestire rotte non trovate
 */
const notFound = (req, res) => {
  res.status(404).json(
    errorResponse(`Rotta non trovata: ${req.method} ${req.path}`, 404)
  );
};

/**
 * Middleware per logging delle richieste
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

module.exports = {
  errorHandler,
  notFound,
  requestLogger
};
