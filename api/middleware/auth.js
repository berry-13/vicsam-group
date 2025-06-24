const { verifyToken, extractBearerToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/helpers');

/**
 * Middleware per autenticazione Bearer Token
 */
const authenticateBearer = (req, res, next) => {
  try {
    console.log('🔐 [AUTH DEBUG] Iniziando verifica Bearer Token...');
    console.log('🔐 [AUTH DEBUG] Headers ricevuti:', JSON.stringify(req.headers, null, 2));
    
    const authHeader = req.headers.authorization;
    console.log('🔐 [AUTH DEBUG] Authorization header:', authHeader);
    
    const token = extractBearerToken(authHeader);
    console.log('🔐 [AUTH DEBUG] Token estratto:', token ? `${token.substring(0, 10)}...` : 'NESSUN TOKEN');

    if (!token) {
      console.log('❌ [AUTH ERROR] Token Bearer mancante!');
      console.log('❌ [AUTH ERROR] Authorization header:', authHeader);
      console.log('❌ [AUTH ERROR] Headers disponibili:', Object.keys(req.headers));
      return res.status(401).json(
        errorResponse('🚨 TOKEN BEARER MANCANTE! Assicurati di includere "Authorization: Bearer <token>" negli headers', 401, {
          receivedHeaders: Object.keys(req.headers),
          authorizationHeader: authHeader,
          expectedFormat: 'Authorization: Bearer <your-token-here>'
        })
      );
    }

    const expectedToken = process.env.BEARER_TOKEN;
    console.log('🔐 [AUTH DEBUG] Token atteso:', expectedToken ? `${expectedToken.substring(0, 10)}...` : 'NON CONFIGURATO');
    
    // Verifica se il token corrisponde al bearer token configurato
    if (token !== expectedToken) {
      console.log('❌ [AUTH ERROR] Token Bearer non valido!');
      console.log('❌ [AUTH ERROR] Token ricevuto:', token ? `${token.substring(0, 10)}...` : 'VUOTO');
      console.log('❌ [AUTH ERROR] Token atteso:', expectedToken ? `${expectedToken.substring(0, 10)}...` : 'NON CONFIGURATO');
      console.log('❌ [AUTH ERROR] Lunghezza token ricevuto:', token ? token.length : 0);
      console.log('❌ [AUTH ERROR] Lunghezza token atteso:', expectedToken ? expectedToken.length : 0);
      
      return res.status(401).json(
        errorResponse('🚨 TOKEN BEARER NON VALIDO! Il token fornito non corrisponde a quello configurato', 401, {
          tokenLength: token ? token.length : 0,
          expectedTokenLength: expectedToken ? expectedToken.length : 0,
          tokenPrefix: token ? token.substring(0, 10) : 'N/A',
          hint: 'Verifica che il token sia stato copiato correttamente e che non ci siano spazi extra'
        })
      );
    }

    console.log('✅ [AUTH SUCCESS] Token Bearer valido!');
    next();
  } catch (error) {
    console.log('💥 [AUTH ERROR] Errore durante l\'autenticazione Bearer:', error);
    console.log('💥 [AUTH ERROR] Stack trace:', error.stack);
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
