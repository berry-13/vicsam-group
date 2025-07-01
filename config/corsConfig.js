// ============================================================================
// CORS CONFIGURATION
// ============================================================================

/**
 * Configura le opzioni CORS basate sull'ambiente
 */
function getCorsOptions() {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const isProduction = NODE_ENV === 'production';

  return {
    origin: isProduction ? 
      (process.env.CORS_ORIGIN || false) :
      true,
    credentials: true,
    optionsSuccessStatus: 200,
    maxAge: isProduction ? 86400 : 0,
  };
}

module.exports = {
  getCorsOptions
};
