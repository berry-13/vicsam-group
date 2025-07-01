const { verifyToken, extractBearerToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/helpers');

/**
 * Middleware per autenticazione Bearer Token con JWT
 * Aggiornato per utilizzare JWT invece del token statico
 */
const authenticateBearer = async (req, res, next) => {
  try {
    console.log('🔐 [AUTH JWT] Iniziando verifica JWT Bearer Token...');
    console.log('🔐 [AUTH JWT] Headers ricevuti:', JSON.stringify(req.headers, null, 2));
    
    const authHeader = req.headers.authorization;
    console.log('🔐 [AUTH JWT] Authorization header:', authHeader);
    
    const token = extractBearerToken(authHeader);
    console.log('🔐 [AUTH JWT] Token estratto:', token ? `${token.substring(0, 20)}...` : 'NESSUN TOKEN');

    if (!token) {
      console.log('❌ [AUTH ERROR] Token Bearer mancante!');
      return res.status(401).json(
        errorResponse('🚨 TOKEN BEARER MANCANTE! Assicurati di includere "Authorization: Bearer <jwt-token>" negli headers', 401, {
          receivedHeaders: Object.keys(req.headers),
          authorizationHeader: authHeader,
          expectedFormat: 'Authorization: Bearer <your-jwt-token-here>'
        })
      );
    }

    // Prova prima con JWT
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      req.tokenPayload = decoded;
      req.authMethod = 'JWT';
      
      console.log('✅ [AUTH JWT] JWT Bearer token valido per utente:', decoded.email || decoded.userId || 'unknown');
      return next();
      
    } catch (jwtError) {
      console.log('🔄 [AUTH JWT] JWT fallito, provo con token legacy...', jwtError.message);
      
      // Fallback al token statico per compatibilità
      const expectedToken = process.env.BEARER_TOKEN;
      
      if (expectedToken && token === expectedToken) {
        req.authMethod = 'LEGACY';
        console.log('✅ [AUTH JWT] Token legacy valido (compatibilità)');
        return next();
      }
      
      console.log('❌ [AUTH ERROR] Sia JWT che token legacy falliti!');
      
      let errorCode = 'INVALID_BEARER_TOKEN';
      let errorMessage = '🚨 TOKEN BEARER NON VALIDO!';
      
      // Fornisci messaggi di errore più specifici per JWT
      if (token.includes('.') && token.split('.').length === 3) {
        if (jwtError.name === 'TokenExpiredError') {
          errorCode = 'TOKEN_EXPIRED';
          errorMessage = '🚨 TOKEN JWT SCADUTO!';
        } else if (jwtError.name === 'JsonWebTokenError') {
          errorCode = 'MALFORMED_JWT_TOKEN';
          errorMessage = '🚨 TOKEN JWT MALFORMATO!';
        } else if (jwtError.name === 'NotBeforeError') {
          errorCode = 'TOKEN_NOT_ACTIVE';
          errorMessage = '🚨 TOKEN JWT NON ANCORA ATTIVO!';
        }
      }
      
      return res.status(401).json(
        errorResponse(errorMessage, 401, {
          error: errorCode,
          tokenLength: token ? token.length : 0,
          tokenPrefix: token ? token.substring(0, 20) : 'N/A',
          hint: 'Verifica che il token JWT sia valido e non scaduto',
          details: process.env.NODE_ENV === 'development' ? jwtError.message : undefined
        })
      );
    }
    
  } catch (error) {
    console.log('💥 [AUTH ERROR] Errore durante l\'autenticazione Bearer:', error);
    return res.status(401).json(
      errorResponse('🚨 ERRORE INTERNO DURANTE L\'AUTENTICAZIONE BEARER', 401, {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    );
  }
};

/**
 * Middleware per autenticazione JWT (opzionale per future implementazioni)
 */
const authenticateJWT = (req, res, next) => {
  try {
    console.log('🔐 [JWT DEBUG] Iniziando verifica JWT Token...');
    
    const authHeader = req.headers.authorization;
    console.log('🔐 [JWT DEBUG] Authorization header:', authHeader);
    
    const token = extractBearerToken(authHeader);
    console.log('🔐 [JWT DEBUG] JWT Token estratto:', token ? `${token.substring(0, 20)}...` : 'NESSUN TOKEN');

    if (!token) {
      console.log('❌ [JWT ERROR] Token JWT mancante!');
      return res.status(401).json(
        errorResponse('🚨 TOKEN JWT MANCANTE! Includi "Authorization: Bearer <jwt-token>" negli headers', 401, {
          receivedHeaders: Object.keys(req.headers),
          expectedFormat: 'Authorization: Bearer <your-jwt-token>'
        })
      );
    }

    console.log('🔐 [JWT DEBUG] Tentativo di verifica JWT...');
    const decoded = verifyToken(token);
    console.log('✅ [JWT SUCCESS] Token JWT decodificato:', decoded);
    
    req.user = decoded;
    next();
  } catch (error) {
    console.log('❌ [JWT ERROR] Errore nella verifica JWT:', error.message);
    console.log('❌ [JWT ERROR] Stack trace:', error.stack);
    return res.status(401).json(
      errorResponse('🚨 TOKEN JWT NON VALIDO!', 401, {
        error: error.message,
        type: error.name,
        hint: 'Il token JWT potrebbe essere scaduto, malformato o firmato con una chiave diversa',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    );
  }
};

/**
 * Middleware per autenticazione password (legacy support)
 */
const authenticatePassword = (req, res, next) => {
  console.log('🔐 [PASSWORD DEBUG] Iniziando verifica password...');
  console.log('🔐 [PASSWORD DEBUG] Method:', req.method);
  console.log('🔐 [PASSWORD DEBUG] URL:', req.url);
  console.log('🔐 [PASSWORD DEBUG] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔐 [PASSWORD DEBUG] Body:', JSON.stringify(req.body, null, 2));
  
  const passwordFromHeader = req.headers['x-access-password'];
  const passwordFromBody = req.body.password;
  const password = passwordFromHeader || passwordFromBody;
  
  console.log('🔐 [PASSWORD DEBUG] Password da header:', passwordFromHeader ? '[PRESENTE]' : '[ASSENTE]');
  console.log('🔐 [PASSWORD DEBUG] Password da body:', passwordFromBody ? '[PRESENTE]' : '[ASSENTE]');
  console.log('🔐 [PASSWORD DEBUG] Password finale:', password ? '[PRESENTE]' : '[ASSENTE]');
  
  const expectedPassword = process.env.API_PASSWORD;
  console.log('🔐 [PASSWORD DEBUG] Password attesa configurata:', expectedPassword ? '[PRESENTE]' : '[ASSENTE]');
  
  if (!password) {
    console.log('❌ [PASSWORD ERROR] Nessuna password fornita!');
    return res.status(401).json(
      errorResponse('🚨 PASSWORD MANCANTE! Fornisci la password tramite header "x-access-password" o nel body come "password"', 401, {
        receivedHeaders: Object.keys(req.headers),
        bodyKeys: Object.keys(req.body || {}),
        expectedHeaderName: 'x-access-password',
        expectedBodyField: 'password',
        hint: 'Puoi inviare la password in due modi: 1) Header "x-access-password" 2) Campo "password" nel body JSON'
      })
    );
  }
  
  if (password !== expectedPassword) {
    console.log('❌ [PASSWORD ERROR] Password errata!');
    console.log('❌ [PASSWORD ERROR] Password ricevuta:', password);
    console.log('❌ [PASSWORD ERROR] Password attesa:', expectedPassword);
    console.log('❌ [PASSWORD ERROR] Lunghezza password ricevuta:', password ? password.length : 0);
    console.log('❌ [PASSWORD ERROR] Lunghezza password attesa:', expectedPassword ? expectedPassword.length : 0);
    
    return res.status(401).json(
      errorResponse('🚨 PASSWORD ERRATA! La password fornita non corrisponde a quella configurata', 401, {
        receivedPasswordLength: password ? password.length : 0,
        expectedPasswordLength: expectedPassword ? expectedPassword.length : 0,
        source: passwordFromHeader ? 'header' : 'body',
        hint: 'Verifica che la password sia stata copiata correttamente e che non ci siano spazi extra'
      })
    );
  }
  
  console.log('✅ [PASSWORD SUCCESS] Password corretta!');
  next();
};

module.exports = {
  authenticateBearer,
  authenticateJWT,
  authenticatePassword
};
