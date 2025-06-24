const { generateToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Controller per l'autenticazione e generazione token
 */
const authenticate = async (req, res, next) => {
  try {
    console.log('🎯 [AUTH CONTROLLER] Iniziando processo di autenticazione...');
    console.log('🎯 [AUTH CONTROLLER] Request details:', {
      method: req.method,
      url: req.url,
      headers: Object.keys(req.headers),
      body: req.body ? Object.keys(req.body) : 'No body'
    });
    
    // A questo punto la password è già stata validata dal middleware authenticatePassword
    console.log('✅ [AUTH CONTROLLER] Middleware di password superato, generando token...');
    
    const tokenPayload = { 
      authenticated: true,
      timestamp: Date.now()
    };
    console.log('🎯 [AUTH CONTROLLER] Token payload:', tokenPayload);
    
    // Genera un JWT token per future implementazioni
    const token = generateToken(tokenPayload);
    console.log('✅ [AUTH CONTROLLER] JWT Token generato:', token ? `${token.substring(0, 20)}...` : 'ERRORE');
    
    const bearerToken = process.env.BEARER_TOKEN;
    console.log('🎯 [AUTH CONTROLLER] Bearer Token configurato:', bearerToken ? `${bearerToken.substring(0, 10)}...` : 'NON CONFIGURATO');
    
    const responseData = {
      token,
      bearerToken,
      expiresIn: process.env.JWT_EXPIRES_IN
    };
    
    console.log('✅ [AUTH CONTROLLER] Autenticazione completata con successo!');
    console.log('🎯 [AUTH CONTROLLER] Response data keys:', Object.keys(responseData));
    
    res.json(
      successResponse(
        responseData,
        '🎉 Autenticazione completata con successo! Usa il bearerToken per le chiamate successive.'
      )
    );
  } catch (error) {
    console.log('💥 [AUTH CONTROLLER ERROR] Errore durante l\'autenticazione:', error);
    console.log('💥 [AUTH CONTROLLER ERROR] Stack trace:', error.stack);
    next(error);
  }
};

/**
 * Controller per verificare lo stato dell'autenticazione
 */
const verifyAuth = async (req, res) => {
  console.log('✅ [VERIFY AUTH] Token Bearer verificato con successo!');
  console.log('🎯 [VERIFY AUTH] Request details:', {
    method: req.method,
    url: req.url,
    authHeader: req.headers.authorization ? 'PRESENTE' : 'ASSENTE'
  });
  
  res.json(
    successResponse(
      { 
        authenticated: true,
        timestamp: new Date().toISOString(),
        message: 'Il tuo token Bearer è valido!'
      },
      '✅ Token Bearer valido e funzionante!'
    )
  );
};

/**
 * Controller per ottenere informazioni sull'API
 */
const getApiInfo = async (req, res) => {
  const apiInfo = {
    name: 'VicSam Group API',
    version: '2.0.0',
    description: 'API ottimizzata per la gestione dei dati',
    endpoints: {
      auth: {
        'POST /api/auth/login': 'Autenticazione con password',
        'GET /api/auth/verify': 'Verifica token Bearer',
        'GET /api/auth/debug': 'Debug informazioni autenticazione'
      },
      data: {
        'POST /api/data/save': 'Salva nuovi dati',
        'GET /api/data/files': 'Lista tutti i file',
        'GET /api/data/file/:filename': 'Contenuto di un file specifico',
        'GET /api/data/download/:filename': 'Download di un file',
        'DELETE /api/data/file/:filename': 'Elimina un file',
        'GET /api/data/stats': 'Statistiche sui dati'
      }
    },
    authentication: 'Bearer Token',
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
    }
  };
  
  res.json(
    successResponse(apiInfo, 'Informazioni API')
  );
};

/**
 * Controller per debug dell'autenticazione
 */
const debugAuth = async (req, res) => {
  console.log('🐛 [DEBUG AUTH] Richiesta di debug ricevuta');
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      JWT_SECRET_CONFIGURED: !!process.env.JWT_SECRET,
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
      API_PASSWORD_CONFIGURED: !!process.env.API_PASSWORD,
      API_PASSWORD_LENGTH: process.env.API_PASSWORD ? process.env.API_PASSWORD.length : 0,
      BEARER_TOKEN_CONFIGURED: !!process.env.BEARER_TOKEN,
      BEARER_TOKEN_LENGTH: process.env.BEARER_TOKEN ? process.env.BEARER_TOKEN.length : 0
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    },
    testInstructions: {
      loginWithPassword: {
        url: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-password': process.env.API_PASSWORD || 'your-password-here'
        },
        body: {
          password: process.env.API_PASSWORD || 'your-password-here'
        }
      },
      verifyWithBearer: {
        url: '/api/auth/verify',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.BEARER_TOKEN || 'your-bearer-token-here'}`
        }
      }
    }
  };
  
  res.json(
    successResponse(debugInfo, '🐛 Informazioni di debug per l\'autenticazione')
  );
};

/**
 * Controller per testare tutti i tipi di errori di autenticazione
 */
const testAuthErrors = async (req, res) => {
  console.log('🧪 [TEST ERRORS] Endpoint di test errori chiamato');
  
  const testScenarios = {
    passwordErrors: {
      wrongPassword: {
        description: 'Test con password sbagliata',
        curl: `curl -X POST ${req.protocol}://${req.get('host')}/api/auth/login -H "Content-Type: application/json" -d '{"password": "password-sbagliata"}'`
      },
      missingPassword: {
        description: 'Test senza password',
        curl: `curl -X POST ${req.protocol}://${req.get('host')}/api/auth/login -H "Content-Type: application/json" -d '{}'`
      }
    },
    bearerTokenErrors: {
      wrongToken: {
        description: 'Test con Bearer Token sbagliato',
        curl: `curl -X GET ${req.protocol}://${req.get('host')}/api/auth/verify -H "Authorization: Bearer token-sbagliato"`
      },
      missingToken: {
        description: 'Test senza Bearer Token',
        curl: `curl -X GET ${req.protocol}://${req.get('host')}/api/auth/verify`
      },
      malformedHeader: {
        description: 'Test con header Authorization malformato',
        curl: `curl -X GET ${req.protocol}://${req.get('host')}/api/auth/verify -H "Authorization: NotBearer token"`
      }
    },
    successfulTests: {
      validLogin: {
        description: 'Login con password corretta',
        curl: `curl -X POST ${req.protocol}://${req.get('host')}/api/auth/login -H "Content-Type: application/json" -d '{"password": "${process.env.API_PASSWORD}"}'`
      },
      validBearer: {
        description: 'Verifica con Bearer Token corretto',
        curl: `curl -X GET ${req.protocol}://${req.get('host')}/api/auth/verify -H "Authorization: Bearer ${process.env.BEARER_TOKEN}"`
      }
    }
  };
  
  res.json(
    successResponse(testScenarios, '🧪 Scenari di test per debug autenticazione - Copia e incolla i comandi curl per testare')
  );
};

module.exports = {
  authenticate,
  verifyAuth,
  getApiInfo,
  debugAuth,
  testAuthErrors
};
