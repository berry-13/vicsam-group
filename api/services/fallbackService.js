// ============================================================================
// FALLBACK HTML SERVICE
// ============================================================================

const { getSimpleVersion } = require('../utils/version');

/**
 * Genera HTML di fallback quando il client React non è disponibile
 */
async function generateFallbackHTML() {
  const versionInfo = await getSimpleVersion();
  
  return `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="description" content="API Server Vicsam Group - Modalità API-only">
      <title>Vicsam Group API</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          background: #f8fafc;
          color: #334155;
          line-height: 1.6;
        }
        .container {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        h1 { color: #1e40af; margin-bottom: 1rem; }
        h2 { color: #1e40af; margin-top: 2rem; }
        .api-list { 
          background: #f1f5f9; 
          padding: 1rem; 
          border-radius: 4px; 
          margin: 1rem 0; 
        }
        .endpoint { 
          font-family: monospace; 
          background: #e2e8f0; 
          padding: 0.25rem 0.5rem; 
          border-radius: 4px; 
          margin: 0.25rem 0;
          font-size: 0.9rem;
        }
        .status { color: #059669; font-weight: bold; }
        .warning { 
          color: #d97706; 
          background: #fef3c7; 
          padding: 1rem; 
          border-radius: 4px; 
          margin: 1rem 0; 
        }
        .version { 
          color: #6b7280; 
          font-size: 0.875rem; 
          margin-top: 1rem; 
        }
        pre {
          background: #1e293b;
          color: #e2e8f0;
          padding: 1rem;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 0.9rem;
        }
        a {
          color: #1e40af;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 Vicsam Group API Server</h1>
        <p class="status">✅ Server attivo e funzionante</p>
        <p class="version">📦 Versione: ${versionInfo}</p>
        
        <div class="warning">
          ⚠️ <strong>Client React non disponibile</strong><br>
          L'interfaccia web non è stata costruita. Server in modalità API-only.
        </div>
        
        <h2>📡 Endpoints API Disponibili</h2>
        <div class="api-list">
          <div class="endpoint">GET /health - Controllo stato del server</div>
          <div class="endpoint">GET /api/version - Informazioni sulla versione</div>
          <div class="endpoint">POST /api/auth/login - Autenticazione utente</div>
          <div class="endpoint">GET /api/auth/info - Informazioni sull'API</div>
          <div class="endpoint">POST /api/data - Salvataggio dati (richiede autenticazione)</div>
          <div class="endpoint">GET /api/data - Recupero dati (richiede autenticazione)</div>
        </div>

        <h2>📥 Endpoints di Download</h2>
        <div class="api-list">
          <div class="endpoint">GET /get - Scarica file dati principale</div>
          <div class="endpoint">GET /app - Scarica informazioni applicazione</div>
          <div class="endpoint">GET /downloads/info - Informazioni sui download disponibili</div>
          <div class="endpoint">GET /downloads/health - Controllo stato servizio download</div>
        </div>
        
        <h2>🔧 Per Sviluppatori</h2>
        <p>Per costruire il client React:</p>
        <pre>cd client && npm run build</pre>
        
        <p><strong>Collegamenti utili:</strong></p>
        <ul>
          <li><a href="/api/auth/info" target="_blank">Documentazione API completa</a></li>
          <li><a href="/api/version" target="_blank">Informazioni sulla versione</a></li>
          <li><a href="/health" target="_blank">Stato del server</a></li>
        </ul>
      </div>
    </body>
    </html>
  `;
}

module.exports = {
  generateFallbackHTML
};
