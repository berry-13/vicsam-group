require('dotenv').config();
const express = require('express');

const { getServerConfig } = require('./config/serverConfig');
const { setupMiddleware } = require('./config/middleware');
const { logServerConfiguration, setupGracefulShutdown, logServerStartup } = require('./api/utils/serverUtils');
const { setupStaticRoutes } = require('./api/routes/staticRoutes');

const { errorHandler, notFound } = require('./api/middleware/common');

const apiRoutes = require('./api/routes');
const downloadRoutes = require('./api/routes/downloadRoutes');
const healthRoutes = require('./api/routes/healthRoutes');

const app = express();
const { PORT, NODE_ENV } = getServerConfig();

logServerConfiguration();

const { corsOptions, rateLimitConfig } = setupMiddleware(app);

app.use('/', downloadRoutes);
app.use('/', healthRoutes);
app.use('/api', apiRoutes);
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Rotta API non trovata: ${req.method} ${req.path}`,
    timestamp: new Date().toISOString()
  });
});

setupStaticRoutes(app);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  logServerStartup(PORT, corsOptions, rateLimitConfig);
});

setupGracefulShutdown(server);
