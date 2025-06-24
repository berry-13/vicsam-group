require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Import middleware
const { errorHandler, notFound, requestLogger } = require('./api/middleware/common');

// Import routes
const apiRoutes = require('./api/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Verifica configurazione all'avvio
console.log('\n🔧 ===== CONFIGURAZIONE SERVER =====');
console.log('🔧 [CONFIG] NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 [CONFIG] PORT:', PORT);
console.log('🔧 [CONFIG] JWT_SECRET:', process.env.JWT_SECRET ? 'CONFIGURATO' : '❌ MANCANTE');
console.log('🔧 [CONFIG] JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN);
console.log('🔧 [CONFIG] API_PASSWORD:', process.env.API_PASSWORD ? 'CONFIGURATO' : '❌ MANCANTE');
console.log('🔧 [CONFIG] BEARER_TOKEN:', process.env.BEARER_TOKEN ? `CONFIGURATO (${process.env.BEARER_TOKEN.length} caratteri)` : '❌ MANCANTE');
console.log('🔧 [CONFIG] RATE_LIMIT_WINDOW_MS:', process.env.RATE_LIMIT_WINDOW_MS);
console.log('🔧 [CONFIG] RATE_LIMIT_MAX_REQUESTS:', process.env.RATE_LIMIT_MAX_REQUESTS);
console.log('🔧 [CONFIG] CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('🔧 ===================================\n');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabilita CSP per consentire il serving di file statici
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minuti
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limite di 100 richieste per finestra
  message: {
    success: false,
    error: 'Troppe richieste, riprova più tardi',
    timestamp: new Date().toISOString()
  }
});

app.use('/api', limiter);

// Request logging
if (process.env.NODE_ENV !== 'production') {
  app.use(requestLogger);
}

// Debug middleware per l'autenticazione
app.use('/api/auth', (req, res, next) => {
  console.log('\n🚀 ===== RICHIESTA AUTENTICAZIONE =====');
  console.log('🚀 [AUTH REQUEST] Timestamp:', new Date().toISOString());
  console.log('🚀 [AUTH REQUEST] Method:', req.method);
  console.log('🚀 [AUTH REQUEST] URL:', req.url);
  console.log('🚀 [AUTH REQUEST] Full URL:', req.originalUrl);
  console.log('🚀 [AUTH REQUEST] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('🚀 [AUTH REQUEST] Body:', JSON.stringify(req.body, null, 2));
  console.log('🚀 [AUTH REQUEST] Query:', JSON.stringify(req.query, null, 2));
  console.log('🚀 [AUTH REQUEST] IP:', req.ip);
  console.log('🚀 [AUTH REQUEST] User Agent:', req.get('User-Agent'));
  console.log('🚀 =====================================\n');
  next();
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api', apiRoutes);

// API 404 handler (solo per rotte che iniziano con /api)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Rotta API non trovata: ${req.method} ${req.path}`,
    timestamp: new Date().toISOString()
  });
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'client/dist')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0'
  });
});

// SPA fallback: tutte le altre rotte servono index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Server avviato su http://localhost:${PORT}`);
  console.log(`📁 API disponibili su http://localhost:${PORT}/api`);
  console.log(`🔍 Documentazione API: http://localhost:${PORT}/api/auth/info`);
  console.log(`⚡ Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
