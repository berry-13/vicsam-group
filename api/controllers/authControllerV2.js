const { authService, AuthError } = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Controller per l'autenticazione avanzata con gestione utenti e ruoli
 */

/**
 * Registrazione di un nuovo utente
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const register = async (req, res) => {
  try {
    console.log('👤 [AUTH CONTROLLER] User registration request');
    
    const { email, password, firstName, lastName, role } = req.body;
    
    // Validazione input base
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json(
        errorResponse('Missing required fields', 400, {
          error: 'MISSING_FIELDS',
          required: ['email', 'password', 'firstName', 'lastName']
        })
      );
    }

    // Registra l'utente
    const user = await authService.registerUser({
      email,
      password,
      firstName,
      lastName,
      role: role || 'user'
    });

    console.log('✅ [AUTH CONTROLLER] User registered successfully:', email);
    
    res.status(201).json(
      successResponse(
        {
          user: {
            id: user.uuid,
            email: user.email,
            name: `${user.first_name} ${user.last_name}`,
            roles: user.roles,
            isVerified: user.is_verified
          }
        },
        'User registered successfully'
      )
    );
    
  } catch (error) {
    console.error('❌ [AUTH CONTROLLER] Registration failed:', error.message);
    
    let statusCode = 500;
    let errorCode = 'REGISTRATION_ERROR';
    
    if (error instanceof AuthError) {
      statusCode = error.code === 'EMAIL_EXISTS' ? 409 : 400;
      errorCode = error.code;
    }
    
    res.status(statusCode).json(
      errorResponse(error.message, statusCode, {
        error: errorCode
      })
    );
  }
};

/**
 * Login dell'utente
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const login = async (req, res) => {
  try {
    console.log('🔐 [AUTH CONTROLLER] User login request');
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json(
        errorResponse('Email and password are required', 400, {
          error: 'MISSING_CREDENTIALS'
        })
      );
    }

    // Metadati della richiesta per sicurezza
    const metadata = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };

    // Autentica l'utente
    const authData = await authService.loginUser(email, password, metadata);

    console.log('✅ [AUTH CONTROLLER] User login successful:', email);
    
    res.json(
      successResponse(
        authData,
        'Login successful'
      )
    );
    
  } catch (error) {
    console.error('❌ [AUTH CONTROLLER] Login failed:', error.message);
    
    let statusCode = 500;
    let errorCode = 'LOGIN_ERROR';
    
    if (error instanceof AuthError) {
      switch (error.code) {
        case 'INVALID_CREDENTIALS':
          statusCode = 401;
          break;
        case 'ACCOUNT_LOCKED':
          statusCode = 423;
          break;
        case 'ACCOUNT_DISABLED':
          statusCode = 403;
          break;
        default:
          statusCode = 400;
      }
      errorCode = error.code;
    }
    
    res.status(statusCode).json(
      errorResponse(error.message, statusCode, {
        error: errorCode
      })
    );
  }
};

/**
 * Refresh del token di accesso
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const refreshToken = async (req, res) => {
  try {
    console.log('🔄 [AUTH CONTROLLER] Token refresh request');
    
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json(
        errorResponse('Refresh token is required', 400, {
          error: 'MISSING_REFRESH_TOKEN'
        })
      );
    }

    const metadata = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    // Rinnova il token
    const tokenData = await authService.refreshAccessToken(refreshToken, metadata);

    console.log('✅ [AUTH CONTROLLER] Token refreshed successfully');
    
    res.json(
      successResponse(
        tokenData,
        'Token refreshed successfully'
      )
    );
    
  } catch (error) {
    console.error('❌ [AUTH CONTROLLER] Token refresh failed:', error.message);
    
    let statusCode = 500;
    let errorCode = 'TOKEN_REFRESH_ERROR';
    
    if (error instanceof AuthError) {
      statusCode = error.code === 'INVALID_REFRESH_TOKEN' ? 401 : 400;
      errorCode = error.code;
    }
    
    res.status(statusCode).json(
      errorResponse(error.message, statusCode, {
        error: errorCode
      })
    );
  }
};

/**
 * Logout dell'utente
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const logout = async (req, res) => {
  try {
    console.log('👋 [AUTH CONTROLLER] User logout request');
    
    if (!req.user || !req.user.jti) {
      return res.status(400).json(
        errorResponse('Invalid session', 400, {
          error: 'INVALID_SESSION'
        })
      );
    }

    // Effettua il logout (revoca sessione)
    await authService.logoutUser(req.user.jti);

    console.log('✅ [AUTH CONTROLLER] User logged out successfully');
    
    res.json(
      successResponse(
        { loggedOut: true },
        'Logout successful'
      )
    );
    
  } catch (error) {
    console.error('❌ [AUTH CONTROLLER] Logout failed:', error.message);
    
    res.status(500).json(
      errorResponse('Logout failed', 500, {
        error: 'LOGOUT_ERROR'
      })
    );
  }
};

/**
 * Verifica del token e informazioni utente
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const me = async (req, res) => {
  try {
    console.log('👤 [AUTH CONTROLLER] Get user info request');
    
    if (!req.user) {
      return res.status(401).json(
        errorResponse('Authentication required', 401, {
          error: 'AUTHENTICATION_REQUIRED'
        })
      );
    }

    // Ottiene i dati completi dell'utente in una singola query ottimizzata
    const userData = await authService.getUserByEmailComplete(req.user.email);

    res.json(
      successResponse(
        {
          user: userData,
          session: {
            jti: req.user.jti,
            roles: req.user.roles,
            permissions: req.user.permissions
          }
        },
        'User information retrieved successfully'
      )
    );
    
  } catch (error) {
    console.error('❌ [AUTH CONTROLLER] Get user info failed:', error.message);
    
    res.status(500).json(
      errorResponse('Failed to retrieve user information', 500, {
        error: 'USER_INFO_ERROR'
      })
    );
  }
};

/**
 * Cambio password dell'utente
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const changePassword = async (req, res) => {
  try {
    console.log('🔒 [AUTH CONTROLLER] Change password request');
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json(
        errorResponse('Current and new password are required', 400, {
          error: 'MISSING_PASSWORDS'
        })
      );
    }

    if (!req.user) {
      return res.status(401).json(
        errorResponse('Authentication required', 401, {
          error: 'AUTHENTICATION_REQUIRED'
        })
      );
    }

    // Implementazione cambio password
    await authService.changeUserPassword(req.user.sub, currentPassword, newPassword);

    console.log('✅ [AUTH CONTROLLER] Password changed successfully');
    
    res.json(
      successResponse(
        { passwordChanged: true },
        'Password changed successfully'
      )
    );
    
  } catch (error) {
    console.error('❌ [AUTH CONTROLLER] Change password failed:', error.message);
    
    res.status(500).json(
      errorResponse('Password change failed', 500, {
        error: 'PASSWORD_CHANGE_ERROR'
      })
    );
  }
};

/**
 * Lista di tutti gli utenti (solo admin)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const listUsers = async (req, res) => {
  try {
    console.log('👥 [AUTH CONTROLLER] List users request');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Implementazione lista utenti
    const { users, total } = await authService.listUsers({ limit, offset });

    const paginationData = {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    res.json(
      successResponse(
        paginationData,
        'Users retrieved successfully'
      )
    );
    
  } catch (error) {
    console.error('❌ [AUTH CONTROLLER] List users failed:', error.message);
    
    res.status(500).json(
      errorResponse('Failed to retrieve users', 500, {
        error: 'LIST_USERS_ERROR'
      })
    );
  }
};

/**
 * Assegnazione ruolo a un utente (solo admin)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const assignRole = async (req, res) => {
  try {
    console.log('👑 [AUTH CONTROLLER] Assign role request');
    
    const { userId, role, expiresAt } = req.body;
    
    if (!userId || !role) {
      return res.status(400).json(
        errorResponse('User ID and role are required', 400, {
          error: 'MISSING_FIELDS'
        })
      );
    }

    // Implementazione assegnazione ruolo
    await authService.assignRoleToUser(userId, role, req.user.id, expiresAt);

    console.log('✅ [AUTH CONTROLLER] Role assigned successfully');
    
    res.json(
      successResponse(
        { roleAssigned: true },
        'Role assigned successfully'
      )
    );
    
  } catch (error) {
    console.error('❌ [AUTH CONTROLLER] Assign role failed:', error.message);
    
    res.status(500).json(
      errorResponse('Role assignment failed', 500, {
        error: 'ROLE_ASSIGNMENT_ERROR'
      })
    );
  }
};

/**
 * Lista dei ruoli disponibili
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const listRoles = async (req, res) => {
  try {
    console.log('📋 [AUTH CONTROLLER] List roles request');
    
    // Implementazione lista ruoli
    const roles = await authService.listRoles();

    res.json(
      successResponse(
        { roles },
        'Roles retrieved successfully'
      )
    );
    
  } catch (error) {
    console.error('❌ [AUTH CONTROLLER] List roles failed:', error.message);
    
    res.status(500).json(
      errorResponse('Failed to retrieve roles', 500, {
        error: 'LIST_ROLES_ERROR'
      })
    );
  }
};

/**
 * Informazioni sull'API di autenticazione
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getAuthInfo = async (req, res) => {
  try {
    const authInfo = {
      api: 'Vicsam Group Authentication API',
      version: '2.0.0',
      features: [
        'Email/Password Authentication',
        'JWT Access Tokens',
        'Refresh Tokens',
        'Role-Based Access Control',
        'Permission Management',
        'Session Management',
        'Audit Logging'
      ],
      endpoints: {
        auth: {
          'POST /api/auth/register': 'User registration',
          'POST /api/auth/login': 'User login',
          'POST /api/auth/refresh': 'Refresh access token',
          'POST /api/auth/logout': 'User logout',
          'GET /api/auth/me': 'Get current user info'
        },
        admin: {
          'GET /api/auth/users': 'List all users (admin)',
          'POST /api/auth/assign-role': 'Assign role to user (admin)',
          'GET /api/auth/roles': 'List available roles'
        }
      },
      security: {
        passwordHashing: 'Argon2id',
        tokenSigning: 'RS256 JWT',
        sessionManagement: 'Database-backed',
        auditLogging: 'Full audit trail'
      }
    };

    res.json(
      successResponse(
        authInfo,
        'Authentication API information'
      )
    );
    
  } catch (error) {
    console.error('❌ [AUTH CONTROLLER] Get auth info failed:', error.message);
    
    res.status(500).json(
      errorResponse('Failed to retrieve auth info', 500, {
        error: 'AUTH_INFO_ERROR'
      })
    );
  }
};

module.exports = {
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
};
