const Joi = require('joi');

/**
 * Schema per validazione dati di salvataggio
 */
const saveDataSchema = Joi.object({
  nome: Joi.string().min(2).max(100).required()
    .messages({
      'string.base': 'Nome deve essere una stringa',
      'string.min': 'Nome deve avere almeno 2 caratteri',
      'string.max': 'Nome non può superare 100 caratteri',
      'any.required': 'Nome è obbligatorio'
    }),
  email: Joi.string().email().required()
    .messages({
      'string.email': 'Email deve essere valida',
      'any.required': 'Email è obbligatoria'
    }),
  // Aggiungi altri campi secondo necessità
}).unknown(true); // Permette campi aggiuntivi

/**
 * Schema per validazione parametri file
 */
const fileParamsSchema = Joi.object({
  filename: Joi.string().pattern(/^[a-zA-Z0-9_.-]+\.json$/).required()
    .messages({
      'string.pattern.base': 'Nome file deve essere un file JSON valido',
      'any.required': 'Nome file è obbligatorio'
    })
});

/**
 * Schema per validazione credenziali
 */
const authSchema = Joi.object({
  password: Joi.string().min(6).required()
    .messages({
      'string.min': 'Password deve avere almeno 6 caratteri',
      'any.required': 'Password è obbligatoria'
    })
});

/**
 * Middleware per validazione request
 * @param {Object} schema - Schema Joi per validazione
 * @param {string} property - Proprietà della request da validare ('body', 'params', 'query')
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    console.log('📝 [VALIDATION DEBUG] Iniziando validazione...');
    console.log('📝 [VALIDATION DEBUG] Property da validare:', property);
    console.log('📝 [VALIDATION DEBUG] Dati da validare:', JSON.stringify(req[property], null, 2));
    console.log('📝 [VALIDATION DEBUG] Schema name:', schema._type || 'unknown');
    
    const { error, value } = schema.validate(req[property]);
    
    if (error) {
      console.log('❌ [VALIDATION ERROR] Validazione fallita!');
      console.log('❌ [VALIDATION ERROR] Errore:', error.message);
      console.log('❌ [VALIDATION ERROR] Dettagli:', error.details);
      
      return res.status(400).json({
        success: false,
        error: '🚨 DATI NON VALIDI! Controlla i campi richiesti',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          receivedValue: detail.context?.value
        })),
        receivedData: req[property],
        hint: 'Verifica che tutti i campi obbligatori siano presenti e abbiano il formato corretto'
      });
    }
    
    console.log('✅ [VALIDATION SUCCESS] Validazione completata con successo!');
    console.log('📝 [VALIDATION DEBUG] Valore validato:', value);
    next();
  };
};

module.exports = {
  saveDataSchema,
  fileParamsSchema,
  authSchema,
  validate
};
