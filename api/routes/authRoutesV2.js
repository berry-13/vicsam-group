const express = require('express');
const {
  register,
  login,
  refreshToken,
  logout,
  me,
  changePassword,
  listUsers,
  assignRole,
  listRoles,
  getAuthInfo
} = require('../controllers/authControllerV2');

const {
  authenticateJWT,
  requirePermissions,
  requireRoles,
  authenticate,
  auditLogger
} = require('../middleware/authMiddleware');

const {
  validateJoi,
  handleValidationErrors,
  sanitizeInput,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  assignRoleSchema,
  paginationSchema,
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateChangePassword,
  validateAssignRole
} = require('../utils/authValidation');

const { loginRateLimit, strictLoginRateLimit } = require('../middleware/rateLimiting');

const router = express.Router();

// ============================================================================
// ROUTES PUBBLICHE (SENZA AUTENTICAZIONE)
// ============================================================================

/**
 * @route GET /api/auth/info
 * @desc Informazioni sull'API di autenticazione
 * @access Public
 */
router.get('/info', getAuthInfo);

/**
 * @route POST /api/auth/register
 * @desc Registrazione nuovo utente
 * @access Public (con rate limiting)
 */
router.post('/register',
  loginRateLimit, // Rate limiting per prevenire spam
  sanitizeInput,
  validateJoi(registerSchema),
  auditLogger('user.register_attempt'),
  register
);

/**
 * @route POST /api/auth/login
 * @desc Login utente con email e password
 * @access Public (con rate limiting)
 */
router.post('/login',
  loginRateLimit,
  strictLoginRateLimit, // Rate limiting più severo per login
  sanitizeInput,
  validateJoi(loginSchema),
  auditLogger('user.login_attempt'),
  login
);

/**
 * @route POST /api/auth/refresh
 * @desc Rinnovo access token con refresh token
 * @access Public
 */
router.post('/refresh',
  sanitizeInput,
  validateJoi(refreshTokenSchema),
  auditLogger('token.refresh_attempt'),
  refreshToken
);

// ============================================================================
// ROUTES AUTENTICATE (RICHIEDONO JWT)
// ============================================================================

/**
 * @route GET /api/auth/me
 * @desc Informazioni utente corrente
 * @access Private (JWT required)
 */
router.get('/me',
  authenticateJWT,
  auditLogger('user.get_profile'),
  me
);

/**
 * @route POST /api/auth/logout
 * @desc Logout utente (revoca sessione)
 * @access Private (JWT required)
 */
router.post('/logout',
  authenticateJWT,
  auditLogger('user.logout'),
  logout
);

/**
 * @route POST /api/auth/change-password
 * @desc Cambio password utente
 * @access Private (JWT required)
 */
router.post('/change-password',
  authenticateJWT,
  sanitizeInput,
  validateJoi(changePasswordSchema),
  auditLogger('user.change_password'),
  changePassword
);

// ============================================================================
// ROUTES DI AMMINISTRAZIONE (RICHIEDONO RUOLI SPECIFICI)
// ============================================================================

/**
 * @route GET /api/auth/users
 * @desc Lista di tutti gli utenti (solo admin e manager)
 * @access Private (Admin/Manager only)
 */
router.get('/users',
  authenticate({
    roles: ['admin', 'manager'],
    permissions: ['users.read']
  }),
  validateJoi(paginationSchema, 'query'),
  auditLogger('admin.list_users'),
  listUsers
);

/**
 * @route POST /api/auth/assign-role
 * @desc Assegnazione ruolo a un utente (solo admin)
 * @access Private (Admin only)
 */
router.post('/assign-role',
  authenticate({
    roles: ['admin'],
    permissions: ['users.update', 'roles.assign']
  }),
  sanitizeInput,
  validateJoi(assignRoleSchema),
  auditLogger('admin.assign_role'),
  assignRole
);

/**
 * @route GET /api/auth/roles
 * @desc Lista dei ruoli disponibili
 * @access Private (Admin/Manager only)
 */
router.get('/roles',
  authenticate({
    roles: ['admin', 'manager'],
    permissions: ['roles.read']
  }),
  auditLogger('admin.list_roles'),
  listRoles
);

// ============================================================================
// ROUTES DI GESTIONE UTENTI AVANZATE
// ============================================================================

/**
 * @route GET /api/auth/users/:userId
 * @desc Dettagli di un utente specifico
 * @access Private (Admin/Manager only)
 */
router.get('/users/:userId',
  authenticate({
    roles: ['admin', 'manager'],
    permissions: ['users.read']
  }),
  // TODO: Validazione parametri UUID
  auditLogger('admin.get_user_details'),
  async (req, res) => {
    // TODO: Implementare controller per dettagli utente
    res.status(501).json({
      success: false,
      error: 'Not implemented yet',
      code: 'NOT_IMPLEMENTED'
    });
  }
);

/**
 * @route PUT /api/auth/users/:userId
 * @desc Aggiornamento dati utente
 * @access Private (Admin only or own profile)
 */
router.put('/users/:userId',
  authenticateJWT,
  // TODO: Middleware per verificare ownership o admin
  sanitizeInput,
  // TODO: Schema di validazione per aggiornamento utente
  auditLogger('user.update_profile'),
  async (req, res) => {
    // TODO: Implementare controller per aggiornamento utente
    res.status(501).json({
      success: false,
      error: 'Not implemented yet',
      code: 'NOT_IMPLEMENTED'
    });
  }
);

/**
 * @route DELETE /api/auth/users/:userId
 * @desc Disattivazione account utente
 * @access Private (Admin only)
 */
router.delete('/users/:userId',
  authenticate({
    roles: ['admin'],
    permissions: ['users.delete']
  }),
  auditLogger('admin.deactivate_user'),
  async (req, res) => {
    // TODO: Implementare controller per disattivazione utente
    res.status(501).json({
      success: false,
      error: 'Not implemented yet',
      code: 'NOT_IMPLEMENTED'
    });
  }
);

/**
 * @route POST /api/auth/users/:userId/activate
 * @desc Attivazione account utente
 * @access Private (Admin only)
 */
router.post('/users/:userId/activate',
  authenticate({
    roles: ['admin'],
    permissions: ['users.update']
  }),
  auditLogger('admin.activate_user'),
  async (req, res) => {
    // TODO: Implementare controller per attivazione utente
    res.status(501).json({
      success: false,
      error: 'Not implemented yet',
      code: 'NOT_IMPLEMENTED'
    });
  }
);

/**
 * @route GET /api/auth/users/:userId/sessions
 * @desc Lista sessioni attive di un utente
 * @access Private (Admin only or own sessions)
 */
router.get('/users/:userId/sessions',
  authenticateJWT,
  // TODO: Middleware per verificare ownership o admin
  auditLogger('user.list_sessions'),
  async (req, res) => {
    // TODO: Implementare controller per lista sessioni
    res.status(501).json({
      success: false,
      error: 'Not implemented yet',
      code: 'NOT_IMPLEMENTED'
    });
  }
);

/**
 * @route DELETE /api/auth/sessions/:sessionId
 * @desc Revoca una sessione specifica
 * @access Private (Admin only or own session)
 */
router.delete('/sessions/:sessionId',
  authenticateJWT,
  // TODO: Middleware per verificare ownership o admin
  auditLogger('user.revoke_session'),
  async (req, res) => {
    // TODO: Implementare controller per revoca sessione
    res.status(501).json({
      success: false,
      error: 'Not implemented yet',
      code: 'NOT_IMPLEMENTED'
    });
  }
);

// ============================================================================
// ROUTES DI GESTIONE RUOLI E PERMESSI
// ============================================================================

/**
 * @route POST /api/auth/roles
 * @desc Creazione nuovo ruolo
 * @access Private (Admin only)
 */
router.post('/roles',
  authenticate({
    roles: ['admin'],
    permissions: ['roles.create']
  }),
  sanitizeInput,
  // TODO: Schema di validazione per creazione ruolo
  auditLogger('admin.create_role'),
  async (req, res) => {
    // TODO: Implementare controller per creazione ruolo
    res.status(501).json({
      success: false,
      error: 'Not implemented yet',
      code: 'NOT_IMPLEMENTED'
    });
  }
);

/**
 * @route PUT /api/auth/roles/:roleId
 * @desc Aggiornamento ruolo esistente
 * @access Private (Admin only)
 */
router.put('/roles/:roleId',
  authenticate({
    roles: ['admin'],
    permissions: ['roles.update']
  }),
  sanitizeInput,
  // TODO: Schema di validazione per aggiornamento ruolo
  auditLogger('admin.update_role'),
  async (req, res) => {
    // TODO: Implementare controller per aggiornamento ruolo
    res.status(501).json({
      success: false,
      error: 'Not implemented yet',
      code: 'NOT_IMPLEMENTED'
    });
  }
);

/**
 * @route DELETE /api/auth/roles/:roleId
 * @desc Eliminazione ruolo
 * @access Private (Admin only)
 */
router.delete('/roles/:roleId',
  authenticate({
    roles: ['admin'],
    permissions: ['roles.delete']
  }),
  auditLogger('admin.delete_role'),
  async (req, res) => {
    // TODO: Implementare controller per eliminazione ruolo
    res.status(501).json({
      success: false,
      error: 'Not implemented yet',
      code: 'NOT_IMPLEMENTED'
    });
  }
);

/**
 * @route GET /api/auth/permissions
 * @desc Lista di tutti i permessi disponibili
 * @access Private (Admin only)
 */
router.get('/permissions',
  authenticate({
    roles: ['admin'],
    permissions: ['system.admin']
  }),
  auditLogger('admin.list_permissions'),
  async (req, res) => {
    // TODO: Implementare controller per lista permessi
    res.status(501).json({
      success: false,
      error: 'Not implemented yet',
      code: 'NOT_IMPLEMENTED'
    });
  }
);

// ============================================================================
// ROUTES DI AUDIT E MONITORING
// ============================================================================

/**
 * @route GET /api/auth/audit
 * @desc Log di audit delle attività
 * @access Private (Admin only)
 */
router.get('/audit',
  authenticate({
    roles: ['admin'],
    permissions: ['system.admin']
  }),
  validateJoi(paginationSchema, 'query'),
  auditLogger('admin.view_audit_logs'),
  async (req, res) => {
    // TODO: Implementare controller per audit logs
    res.status(501).json({
      success: false,
      error: 'Not implemented yet',
      code: 'NOT_IMPLEMENTED'
    });
  }
);

/**
 * @route GET /api/auth/stats
 * @desc Statistiche del sistema di autenticazione
 * @access Private (Admin only)
 */
router.get('/stats',
  authenticate({
    roles: ['admin'],
    permissions: ['system.admin']
  }),
  auditLogger('admin.view_auth_stats'),
  async (req, res) => {
    // TODO: Implementare controller per statistiche
    res.status(501).json({
      success: false,
      error: 'Not implemented yet',
      code: 'NOT_IMPLEMENTED'
    });
  }
);

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Middleware per gestire errori specifici delle routes di autenticazione
 */
router.use((error, req, res, next) => {
  console.error('❌ [AUTH ROUTES] Error:', error.message);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details,
      code: 'VALIDATION_ERROR'
    });
  }
  
  if (error.name === 'AuthError') {
    return res.status(401).json({
      success: false,
      error: error.message,
      code: error.code || 'AUTH_ERROR'
    });
  }
  
  // Passa al gestore di errori globale
  next(error);
});

module.exports = router;
