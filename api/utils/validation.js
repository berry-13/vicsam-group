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
    const { error } = schema.validate(req[property]);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Dati non validi',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

module.exports = {
  saveDataSchema,
  fileParamsSchema,
  authSchema,
  validate
};
