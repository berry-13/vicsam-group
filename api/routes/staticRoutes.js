// ============================================================================
// STATIC FILES AND SPA ROUTES
// ============================================================================

const express = require('express');
const path = require('path');
const { getServerConfig, getStaticOptions } = require('../../config/serverConfig');
const { checkClientBuild } = require('../utils/serverUtils');
const { generateFallbackHTML } = require('../services/fallbackService');

const router = express.Router();

/**
 * Configura il serving dei file statici e il fallback per SPA
 */
function setupStaticRoutes(app) {
  const { isProduction } = getServerConfig();
  const staticOptions = getStaticOptions();
  const clientDistPath = path.join(__dirname, '../../client/dist');
  const clientIndexPath = path.join(clientDistPath, 'index.html');

  // Servire file statici se il build del client esiste
  if (checkClientBuild()) {
    app.use(express.static(clientDistPath, staticOptions));
  }

  // Fallback per SPA e pagina di informazioni se client non disponibile
  app.get('*', (req, res) => {
    if (checkClientBuild()) {
      res.set({
        'Cache-Control': isProduction ? 'public, max-age=3600' : 'no-cache',
        'Content-Type': 'text/html; charset=utf-8'
      });
      res.sendFile(clientIndexPath);
    } else {
      res.set({
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      });
      res.status(200).send(generateFallbackHTML());
    }
  });
}

module.exports = {
  setupStaticRoutes
};
