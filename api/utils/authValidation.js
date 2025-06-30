const Joi = require('joi');
const { body, validationResult } = require('express-validator');

/**
 * Schemi di validazione per l'autenticazione avanzata
 */

// ============================================================================
// SCHEMI JOI
// ============================================================================

/**
 * Schema per registrazione utente
 */
const registerSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
      'any.required': 'Password is required'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Password confirmation does not match',
      'any.required': 'Password confirmation is required'
    }),
  
  firstName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .required()
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name must not exceed 50 characters',
      'string.pattern.base': 'First name can only contain letters, spaces, hyphens and apostrophes',
      'any.required': 'First name is required'
    }),
  
  lastName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .required()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name must not exceed 50 characters',
      'string.pattern.base': 'Last name can only contain letters, spaces, hyphens and apostrophes',
      'any.required': 'Last name is required'
    }),
  
  role: Joi.string()
    .valid('admin', 'manager', 'user')
    .default('user')
    .messages({
      'any.only': 'Role must be one of: admin, manager, user'
    })
});

/**
 * Schema per login utente
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.min': 'Password cannot be empty',
      'any.required': 'Password is required'
    }),
  
  rememberMe: Joi.boolean()
    .default(false)
});

/**
 * Schema per refresh token
 */
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required'
    })
});

/**
 * Schema per cambio password
 */
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.max': 'New password must not exceed 128 characters',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
      'any.required': 'New password is required'
    }),
  
  confirmNewPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'New password confirmation does not match',
      'any.required': 'New password confirmation is required'
    })
});

/**
 * Schema per assegnazione ruolo
 */
const assignRoleSchema = Joi.object({
  userId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'User ID must be a valid UUID',
      'any.required': 'User ID is required'
    }),
  
  role: Joi.string()
    .valid('admin', 'manager', 'user')
    .required()
    .messages({
      'any.only': 'Role must be one of: admin, manager, user',
      'any.required': 'Role is required'
    }),
  
  expiresAt: Joi.date()
    .iso()
    .min('now')
    .optional()
    .messages({
      'date.format': 'Expiration date must be in ISO format',
      'date.min': 'Expiration date must be in the future'
    })
});

/**
 * Schema per parametri di paginazione
 */
const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100'
    }),
  
  search: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Search term must not exceed 100 characters'
    }),
  
  role: Joi.string()
    .valid('admin', 'manager', 'user')
    .optional()
    .messages({
      'any.only': 'Role filter must be one of: admin, manager, user'
    }),
  
  active: Joi.boolean()
    .optional()
});

// ============================================================================
// EXPRESS-VALIDATOR CHAINS
// ============================================================================

/**
 * Validatori per registrazione
 */
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email must be a valid email address'),
  
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    }),
  
  body('firstName')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('First name can only contain letters, spaces, hyphens and apostrophes')
    .trim(),
  
  body('lastName')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens and apostrophes')
    .trim(),
  
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'user'])
    .withMessage('Role must be one of: admin, manager, user')
];

/**
 * Validatori per login
 */
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email must be a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Validatori per refresh token
 */
const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
];

/**
 * Validatori per cambio password
 */
const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
  
  body('confirmNewPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('New password confirmation does not match');
      }
      return true;
    })
];

/**
 * Validatori per assegnazione ruolo
 */
const validateAssignRole = [
  body('userId')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  
  body('role')
    .isIn(['admin', 'manager', 'user'])
    .withMessage('Role must be one of: admin, manager, user'),
  
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Expiration date must be in ISO format')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiration date must be in the future');
      }
      return true;
    })
];

// ============================================================================
// MIDDLEWARE DI VALIDAZIONE
// ============================================================================

/**
 * Middleware per validazione con Joi
 * @param {Object} schema - Schema Joi
 * @param {string} property - Proprietà della request da validare
 * @returns {Function} Middleware function
 */
const validateJoi = (schema, property = 'body') => {
  return (req, res, next) => {
    console.log(`📝 [VALIDATION] Validating ${property} with Joi schema`);
    
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });
    
    if (error) {
      console.log('❌ [VALIDATION] Joi validation failed:', error.details);
      
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Sostituisce i dati validati e puliti
    req[property] = value;
    
    console.log('✅ [VALIDATION] Joi validation passed');
    next();
  };
};

/**
 * Middleware per gestire errori di express-validator
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    console.log('❌ [VALIDATION] Express-validator validation failed:', errors.array());
    
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: formattedErrors,
      code: 'VALIDATION_ERROR'
    });
  }
  
  console.log('✅ [VALIDATION] Express-validator validation passed');
  next();
};

/**
 * Sanitizza l'input dell'utente
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
const sanitizeInput = (req, res, next) => {
  console.log('🧹 [SANITIZATION] Sanitizing user input');
  
  // Sanitizza stringhe ricorsivamente
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Rimuove caratteri potenzialmente pericolosi
        obj[key] = obj[key]
          .trim()
          .replace(/[<>]/g, '') // Rimuove < e >
          .replace(/javascript:/gi, '') // Rimuove javascript:
          .replace(/on\w+=/gi, ''); // Rimuove event handlers
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };
  
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  
  console.log('✅ [SANITIZATION] Input sanitized');
  next();
};

/**
 * Validatore personalizzato per controlli complessi
 */
const customValidators = {
  /**
   * Verifica se l'email è unica
   * @param {string} email - Email da verificare
   * @returns {Promise<boolean>} True se l'email è unica
   */
  async isEmailUnique(email) {
    // TODO: Implementare controllo con database
    console.log('🔍 [VALIDATION] Checking email uniqueness:', email);
    return true; // Placeholder
  },
  
  /**
   * Verifica la forza della password
   * @param {string} password - Password da verificare
   * @returns {Object} Risultato della verifica
   */
  checkPasswordStrength(password) {
    const result = {
      score: 0,
      feedback: []
    };
    
    // Lunghezza
    if (password.length >= 12) result.score += 2;
    else if (password.length >= 8) result.score += 1;
    else result.feedback.push('Use at least 8 characters');
    
    // Caratteri vari
    if (/[a-z]/.test(password)) result.score += 1;
    else result.feedback.push('Add lowercase letters');
    
    if (/[A-Z]/.test(password)) result.score += 1;
    else result.feedback.push('Add uppercase letters');
    
    if (/\d/.test(password)) result.score += 1;
    else result.feedback.push('Add numbers');
    
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) result.score += 2;
    else result.feedback.push('Add special characters');
    
    return result;
  }
};

module.exports = {
  // Schemi Joi
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  assignRoleSchema,
  paginationSchema,
  
  // Express-validator chains
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateChangePassword,
  validateAssignRole,
  
  // Middleware
  validateJoi,
  handleValidationErrors,
  sanitizeInput,
  
  // Validatori personalizzati
  customValidators
};
