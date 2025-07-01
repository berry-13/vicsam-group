import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService, type User } from '../services/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve essere usato all\'interno di un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if we have a stored token
        const storedAuth = localStorage.getItem('vicsam_auth_v2');
        const storedToken = localStorage.getItem('vicsam_token');
        
        if (storedToken && storedAuth) {
          // Set token for API service
          authService.setToken(storedToken);
          
          // Try to validate current session
          try {
            const userInfo = await authService.getMe();
            setUser(userInfo);
            setIsAuthenticated(true);
            console.log('✅ User authenticated from stored token');
          } catch {
            console.warn('❌ Token validation failed, clearing auth');
            // Clear everything on validation failure
            localStorage.removeItem('vicsam_auth_v2');
            localStorage.removeItem('vicsam_token');
            localStorage.removeItem('vicsam_refresh_token');
            authService.clearToken();
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          console.log('ℹ️ No stored auth found');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError('Errore durante l\'inizializzazione dell\'autenticazione');
        // Clear everything on error
        localStorage.removeItem('vicsam_auth_v2');
        localStorage.removeItem('vicsam_token');
        localStorage.removeItem('vicsam_refresh_token');
        authService.clearToken();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []); // Run only once on mount

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const authResponse = await authService.login(email, password);
      const authData = authResponse.data;
      
      // Store auth data
      localStorage.setItem('vicsam_auth_v2', JSON.stringify(authData));
      localStorage.setItem('vicsam_token', authData.accessToken);
      localStorage.setItem('vicsam_refresh_token', authData.refreshToken);
      
      // Set token for API service
      authService.setToken(authData.accessToken);
      
      // Get full user info
      const userInfo = await authService.getMe();
      
      setUser(userInfo);
      setIsAuthenticated(true);
      
      console.log('✅ User logged in successfully');
      
    } catch (error) {
      setError((error as Error).message || 'Errore durante il login');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string, role?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await authService.register({
        email,
        password,
        firstName,
        lastName,
        role
      });
      
      // Auto-login after registration
      await login(email, password);
      
    } catch (error) {
      setError((error as Error).message || 'Errore durante la registrazione');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshAuth = async () => {
    try {
      const refreshToken = localStorage.getItem('vicsam_refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const authResponse = await authService.refresh(refreshToken);
      const authData = authResponse.data;
      
      // Update stored auth data
      localStorage.setItem('vicsam_auth_v2', JSON.stringify(authData));
      localStorage.setItem('vicsam_token', authData.accessToken);
      if (authData.refreshToken) {
        localStorage.setItem('vicsam_refresh_token', authData.refreshToken);
      }
      
      // Set token for API service
      authService.setToken(authData.accessToken);
      
      // Get updated user info
      const userInfo = await authService.getMe();
      setUser(userInfo);
      
      console.log('✅ Token refreshed successfully');
      
    } catch (error: unknown) {
      // Enhanced error handling with specific categorization
      interface AxiosError {
        response?: {
          status?: number;
          data?: {
            message?: string;
            error?: string;
          };
        };
        request?: unknown;
        message?: string;
      }
      
      const isAxiosError = (err: unknown): err is AxiosError => {
        return err !== null && typeof err === 'object' && ('response' in err || 'request' in err);
      };
      
      const axiosError = isAxiosError(error) ? error : null;
      const errorMessage = axiosError?.message || (error as Error)?.message || 'Token refresh failed';
      
      // Check if it's a network error (no response received)
      if (!axiosError?.response && axiosError?.request) {
        console.error('🌐 [AUTH] Network error during token refresh:', errorMessage);
        setError('Errore di connessione. Verifica la tua connessione internet e riprova.');
        
        // For network errors, we might want to retry or show a different UI
        // Don't automatically logout on network issues
        throw new Error('NETWORK_ERROR');
        
      } else if (axiosError?.response?.status === 401 || axiosError?.response?.status === 403) {
        // Invalid/expired refresh token - authentication failure
        console.error('🔐 [AUTH] Authentication failed during token refresh:', errorMessage);
        console.log('🚪 [AUTH] Refresh token invalid or expired, logging out user');
        
        // Clear all auth data and force re-login
        localStorage.removeItem('vicsam_auth_v2');
        localStorage.removeItem('vicsam_token');
        localStorage.removeItem('vicsam_refresh_token');
        authService.clearToken();
        setUser(null);
        setIsAuthenticated(false);
        setError('Sessione scaduta. Effettua nuovamente l\'accesso.');
        
        throw new Error('AUTH_EXPIRED');
        
      } else if (axiosError?.response?.status && axiosError.response.status >= 500) {
        // Server error - temporary issue
        console.error('🔧 [AUTH] Server error during token refresh:', errorMessage);
        setError('Errore temporaneo del server. Riprova tra qualche momento.');
        
        throw new Error('SERVER_ERROR');
        
      } else if (axiosError?.response?.status === 429) {
        // Rate limiting
        console.error('⏱️ [AUTH] Rate limit exceeded during token refresh:', errorMessage);
        setError('Troppi tentativi di aggiornamento. Riprova tra qualche minuto.');
        
        throw new Error('RATE_LIMIT');
        
      } else {
        // Other errors - generic handling
        console.error('❌ [AUTH] Unknown error during token refresh:', errorMessage, error);
        setError('Errore durante l\'aggiornamento della sessione.');
        
        throw new Error('UNKNOWN_ERROR');
      }
    }
  };

  const logout = async () => {
    try {
      // Try to logout on server
      try {
        await authService.logout();
      } catch (error) {
        console.error('Server logout failed:', error);
      }
      
      // Clear local state
      localStorage.removeItem('vicsam_auth_v2');
      localStorage.removeItem('vicsam_token');
      localStorage.removeItem('vicsam_refresh_token');
      
      authService.clearToken();
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      
      console.log('✅ User logged out successfully');
      
    } catch (error) {
      console.error('Logout error:', error);
      setError('Errore durante il logout');
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await authService.changePassword({
        currentPassword,
        newPassword
      });
      
    } catch (error) {
      setError((error as Error).message || 'Errore durante il cambio password');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) || false;
  };

  const hasPermission = (permission: string): boolean => {
    // Check if user and permissions array are available
    if (!user?.permissions) {
      return false;
    }
    
    // Check if the permission exists in the user's permissions array
    return user.permissions.includes(permission);
  };

  const value = {
    isAuthenticated,
    user,
    login,
    register,
    logout,
    refreshAuth,
    changePassword,
    hasRole,
    hasPermission,
    loading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
