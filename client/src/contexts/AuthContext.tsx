import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiService } from '../services/api';
import type { AuthResponse } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthResponse | null;
  login: (password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
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
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (apiService.isAuthenticated()) {
          const isValid = await apiService.verifyAuth();
          if (isValid) {
            setIsAuthenticated(true);
            // Recupera i dati utente dal localStorage se disponibili
            const stored = localStorage.getItem('vicsam_auth');
            if (stored) {
              setUser(JSON.parse(stored));
            }
          } else {
            apiService.clearAuth();
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Errore durante la verifica dell\'autenticazione:', error);
        apiService.clearAuth();
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (password: string) => {
    const authData = await apiService.login(password);
    setUser(authData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    apiService.clearAuth();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
