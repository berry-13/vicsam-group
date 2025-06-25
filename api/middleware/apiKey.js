// Middleware opzionale per la protezione tramite API KEY delle rotte /api
require('dotenv').config();

function optionalApiKeyMiddleware(req, res, next) {
  // Se non è configurata l'API_KEY, salta il controllo
  if (!process.env.API_KEY) {
    return next();
  }
  
  // Escludi le rotte di autenticazione dal controllo API KEY
  if (req.path.startsWith('/auth')) {
    return next();
  }
  
  // Controlla se è presente una API KEY valida
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  // Se è presente l'API KEY, verificala
  if (apiKey) {
    if (apiKey === process.env.API_KEY) {
      return next();
    } else {
      return res.status(401).json({ 
        success: false,
        error: 'API key non valida',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Se non è presente l'API KEY, verifica se è presente un JWT token valido
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Lascia che il middleware di autenticazione JWT gestisca la validazione
    return next();
  }
  
  // Se non c'è né API KEY né JWT token, richiedi l'autenticazione
  return res.status(401).json({ 
    success: false,
    error: 'Accesso negato. Fornire API key o token JWT valido.',
    timestamp: new Date().toISOString()
  });
}

module.exports = optionalApiKeyMiddleware;
