/**
 * Formatta una risposta di successo
 * @param {any} data - Dati da includere nella risposta
 * @param {string} message - Messaggio di successo
 * @param {number} statusCode - Codice di stato HTTP
 * @returns {Object} Risposta formattata
 */
const successResponse = (data = null, message = 'Operazione completata con successo', statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * Formatta una risposta di errore
 * @param {string} message - Messaggio di errore
 * @param {number} statusCode - Codice di stato HTTP
 * @param {any} details - Dettagli aggiuntivi dell'errore
 * @returns {Object} Risposta formattata
 */
const errorResponse = (message = 'Si è verificato un errore', statusCode = 500, details = null) => {
  return {
    success: false,
    error: message,
    details,
    timestamp: new Date().toISOString()
  };
};

/**
 * Estrae i dati importanti dal body della request
 * @param {Object} body - Body della request
 * @returns {Object} Dati estratti
 */
const extractImportantData = (body) => {
  return {
    nome: body.nome,
    email: body.email,
    data: new Date().toISOString()
  };
};

/**
 * Genera un nome file unico con timestamp
 * @param {string} prefix - Prefisso del file
 * @param {string} extension - Estensione del file
 * @returns {string} Nome file generato
 */
const generateFileName = (prefix = 'dati', extension = 'json') => {
  const timestamp = Date.now();
  return `${prefix}_${timestamp}.${extension}`;
};

module.exports = {
  successResponse,
  errorResponse,
  extractImportantData,
  generateFileName
};
