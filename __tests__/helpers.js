const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.test') });
const request = require('supertest');
const express = require('express');
const fs = require('fs');

// Import dell'app per i test
const createApp = () => {
  const app = express();
  
  // Configurazione minima per i test
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Import routes
  const apiRoutes = require('../api/routes');
  app.use('/api', apiRoutes);
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '2.0.0'
    });
  });
  
  // Error handling
  const { errorHandler, notFound } = require('../api/middleware/common');
  app.use(notFound);
  app.use(errorHandler);
  
  return app;
};

// Helper per l'autenticazione
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${process.env.BEARER_TOKEN}`
});

// Helper per pulire i file di test
const cleanupTestFiles = () => {
  const testDir = path.join(__dirname, '..', 'dati');
  
  // Verifica che la cartella dati esista
  if (!fs.existsSync(testDir)) {
    return;
  }
  
  const files = fs.readdirSync(testDir);
  
  files.forEach(file => {
    if (file.startsWith('dati_') && file.endsWith('.json')) {
      fs.unlinkSync(path.join(testDir, file));
    }
  });
  
  // Pulisci anche il file generale se esiste
  const generalFile = path.join(testDir, 'dati_generali.json');
  if (fs.existsSync(generalFile)) {
    fs.unlinkSync(generalFile);
  }
};

// Dati di test comuni
const testData = {
  validUser: {
    CustomerVAT: 'IT12345678901',
    nome: 'Mario Rossi',
    email: 'mario@example.com',
    telefono: '1234567890',
    messaggio: 'Test message'
  },
  invalidUser: {
    CustomerVAT: 'IT00000000000',
    nome: 'A', // Troppo corto
    email: 'invalid-email',
    telefono: '123'
  },
  loginCredentials: {
    bearerToken: process.env.BEARER_TOKEN
  },
  invalidCredentials: {
    bearerToken: 'invalid-bearer-token'
  }
};

// Aspetta che il server sia pronto
const waitForServer = (app, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      resolve(server);
    });
    
    setTimeout(() => {
      reject(new Error('Server startup timeout'));
    }, timeout);
  });
};

module.exports = {
  createApp,
  getAuthHeaders,
  cleanupTestFiles,
  testData,
  waitForServer,
  request
};
