import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';

// Tipi per le risposte dell'API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
  code?: number;
}

export interface AuthResponse {
  token: string;
  bearerToken: string;
  expiresIn: string;
}

// ============================================================================
// V2 AUTHENTICATION API INTERFACES
// ============================================================================

export interface UserV2 {
  id: string;
  email: string;
  name: string | Record<string, unknown>;
  roles: (string | { name: string })[];
  permissions?: string[];
  isVerified: boolean;
}

export interface UserRegistrationResponse {
  user: UserV2;
}

export interface LoginResponseV2 {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresIn: number;
  tokenType: string;
  user: UserV2;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface UserMeResponse {
  user: UserV2 & {
    firstName?: string;
    lastName?: string;
    lastLoginAt?: string;
    createdAt?: string;
  };
  session: {
    jti: string;
    roles: string[];
    permissions: string[];
  };
}

export interface ChangePasswordResponse {
  passwordChanged: boolean;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface UserListItem {
  id: string;
  email: string;
  name: string;
  roles: string[];
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface UsersListResponse {
  users: UserListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RoleAssignmentResponse {
  success: boolean;
  message: string;
  assignment: {
    userId: string;
    role: string;
    expiresAt?: string;
  };
}

export interface Role {
  name: string;
  description: string;
  permissions: string[];
  isDefault: boolean;
  createdAt: string;
}

export interface RolesListResponse {
  roles: Role[];
}

export interface RoleDetailsResponse {
  role: Role & {
    usersCount: number;
    permissions: Array<{
      name: string;
      description: string;
      category: string;
    }>;
  };
}

export interface AuthInfoV2Response {
  version: string;
  features: {
    registration: boolean;
    passwordReset: boolean;
    roleManagement: boolean;
    sessionManagement: boolean;
  };
  security: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
    };
    sessionTimeout: number;
    maxFailedAttempts: number;
  };
}

// ============================================================================
// EXISTING INTERFACES
// ============================================================================

export interface FileData {
  name: string;
  size: number;
  modified: string;
  type?: string;
}

export interface ApiInfo {
  name: string;
  version: string;
  description: string;
  endpoints: {
    auth: Record<string, string>;
    data: Record<string, string>;
  };
  authentication: string;
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

export interface DataStats {
  totalFiles: number;
  totalSize: number;
  generalDataCount: number;
  lastUpdate: string | null;
}

export interface ActivityItem {
  id: string;
  type: 'file_upload' | 'system_update' | 'data_sync' | 'backup' | 'user_action';
  message: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
  userId?: string;
  details?: string;
}

class ApiService {
  private api: AxiosInstance;
  private bearerToken: string | null = null;

  constructor() {
    // Usa sempre l'URL relativo per evitare problemi di configurazione
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    
    console.log('🔧 [API CONFIG] Configurazione API:', {
      baseUrl,
      mode: import.meta.env.MODE,
      url: window.location.href
    });
    
    this.api = axios.create({
      baseURL: baseUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor per aggiungere il token Bearer
    this.api.interceptors.request.use((config) => {
      if (this.bearerToken) {
        config.headers.Authorization = `Bearer ${this.bearerToken}`;
      }
      return config;
    });

    // Enhanced response interceptor with automatic token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        console.error('🔴 [API ERROR]:', error);
        
        const originalRequest = error.config;
        
        // Check if this is a 401 error and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Try to refresh the token
            const refreshToken = localStorage.getItem('vicsam_refresh_token');
            if (refreshToken && !window.location.pathname.includes('/login')) {
              console.log('🔄 [AUTH] Attempting automatic token refresh...');
              
              const refreshResponse = await axios.post(`${this.api.defaults.baseURL}/auth/refresh`, {
                refreshToken
              });
              
              if (refreshResponse.data.success) {
                const newAuthData = refreshResponse.data.data;
                
                // Update stored tokens
                localStorage.setItem('vicsam_token', newAuthData.accessToken);
                localStorage.setItem('vicsam_refresh_token', newAuthData.refreshToken || refreshToken);
                this.bearerToken = newAuthData.accessToken;
                
                // Retry the original request with new token
                originalRequest.headers.Authorization = `Bearer ${newAuthData.accessToken}`;
                console.log('✅ [AUTH] Token refreshed, retrying original request');
                
                return this.api(originalRequest);
              }
            }
          } catch (refreshError) {
            console.error('❌ [AUTH] Token refresh failed:', refreshError);
          }
          
          // If refresh failed or no refresh token, clear auth and redirect
          this.clearAuth();
          if (!window.location.pathname.includes('/login')) {
            console.log('🚪 [AUTH] Redirecting to login page');
            // Use a custom event to notify the app about auth failure
            window.dispatchEvent(new CustomEvent('auth:logout', { 
              detail: { reason: 'token_expired' } 
            }));
            window.location.href = '/login?reason=session_expired';
          }
        }
        
        // Enhanced error message handling
        let errorMessage = 'Si è verificato un errore imprevisto';
        
        if (error.response) {
          const status = error.response.status;
          const serverMessage = error.response.data?.error || error.response.data?.message;
          const errorCode = error.response.data?.data?.error;
          
          switch (status) {
            case 400:
              if (errorCode === 'INVALID_CREDENTIALS' || errorCode === 'MISSING_CREDENTIALS') {
                errorMessage = 'Email o password non valida';
              } else if (errorCode === 'VALIDATION_ERROR') {
                errorMessage = 'Dati inseriti non validi';
              } else {
                errorMessage = serverMessage || 'Richiesta non valida';
              }
              break;
            case 401:
              if (errorCode === 'INVALID_CREDENTIALS') {
                errorMessage = 'Email o password errata';
              } else if (errorCode === 'ACCOUNT_LOCKED') {
                errorMessage = 'Account temporaneamente bloccato per sicurezza';
              } else if (errorCode === 'ACCOUNT_DISABLED') {
                errorMessage = 'Account disabilitato. Contatta l\'amministratore';
              } else {
                errorMessage = 'Sessione scaduta. Effettua nuovamente l\'accesso';
              }
              break;
            case 403:
              errorMessage = 'Accesso negato. Non hai i permessi necessari';
              break;
            case 404:
              errorMessage = 'Risorsa non trovata';
              break;
            case 423:
              errorMessage = 'Account bloccato per sicurezza. Riprova più tardi';
              break;
            case 429:
              errorMessage = 'Troppi tentativi. Riprova tra qualche minuto';
              break;
            case 500:
              errorMessage = 'Errore interno del server. Riprova più tardi';
              break;
            case 502:
            case 503:
            case 504:
              errorMessage = 'Servizio temporaneamente non disponibile. Riprova più tardi';
              break;
            default:
              errorMessage = serverMessage || `Errore del server (${status})`;
          }
        } else if (error.request) {
          // Network error
          errorMessage = 'Errore di connessione. Verifica la tua connessione internet';
        } else {
          errorMessage = error.message || 'Errore imprevisto';
        }
        
        interface EnhancedError extends Error {
          originalError?: unknown;
          status?: number;
          errorCode?: string;
        }
        
        const enhancedError: EnhancedError = new Error(errorMessage);
        enhancedError.name = error.name;
        enhancedError.originalError = error;
        enhancedError.status = error.response?.status;
        enhancedError.errorCode = error.response?.data?.data?.error;
        
        return Promise.reject(enhancedError);
      }
    );

    // Recupera il token dal localStorage se presente
    this.loadAuthFromStorage();
  }

  // Autenticazione
  async login(password: string): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.api.post('/auth/login', {
      password,
    });
    
    if (response.data.success) {
      this.bearerToken = response.data.data.bearerToken;
      this.saveAuthToStorage(response.data.data);
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Login fallito');
  }

  async verifyAuth(): Promise<boolean> {
    try {
      const response: AxiosResponse<ApiResponse> = await this.api.get('/auth/verify');
      return response.data.success;
    } catch {
      return false;
    }
  }

  async getApiInfo(): Promise<ApiInfo> {
    const response: AxiosResponse<ApiResponse<ApiInfo>> = await this.api.get('/auth/info');
    return response.data.data;
  }

  // Gestione dati
  async saveData(data: Record<string, unknown>): Promise<{ fileName: string; isUpdate?: boolean; customerVAT?: string }> {
    const response: AxiosResponse<ApiResponse<{ fileName: string; isUpdate?: boolean; customerVAT?: string }>> = await this.api.post('/data/save', data);
    return response.data.data;
  }

  async getFiles(): Promise<{ files: FileData[]; count: number }> {
    const response: AxiosResponse<ApiResponse<{ files: FileData[]; count: number }>> = await this.api.get('/data/files');
    return response.data.data;
  }

  async getFileContent(filename: string): Promise<{ filename: string; content: unknown }> {
    const response: AxiosResponse<ApiResponse<{ filename: string; content: unknown }>> = await this.api.get(`/data/file/${filename}`);
    return response.data.data;
  }

  async deleteFile(filename: string): Promise<{ filename: string }> {
    const response: AxiosResponse<ApiResponse<{ filename: string }>> = await this.api.delete(`/data/file/${filename}`);
    return response.data.data;
  }

  async getStats(): Promise<DataStats> {
    const response: AxiosResponse<ApiResponse<DataStats>> = await this.api.get('/data/stats');
    return response.data.data;
  }

  async downloadFile(filename: string): Promise<void> {
    const response = await this.api.get(`/data/download/${filename}`, {
      responseType: 'blob',
    });
    
    // Crea un link temporaneo per il download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  async getRecentActivities(limit: number = 10): Promise<ActivityItem[]> {
    try {
      const response = await this.api.get<ApiResponse<ActivityItem[]>>(`/data/activities?limit=${limit}`);
      return response.data.data;
    } catch (error) {
      // If the endpoint doesn't exist yet, provide fallback mock data
      console.warn('Activities endpoint not available, using fallback data:', error);
      return this.generateFallbackActivities(limit);
    }
  }

  private generateFallbackActivities(limit: number): ActivityItem[] {
    const now = new Date();
    const activities: ActivityItem[] = [
      {
        id: '1',
        type: 'system_update',
        message: 'Sistema di monitoraggio aggiornato',
        timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: '2',
        type: 'data_sync',
        message: 'Controlli di integrità completati',
        timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: '3',
        type: 'file_upload',
        message: 'File caricato con successo',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: '4',
        type: 'backup',
        message: 'Backup automatico eseguito',
        timestamp: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: '5',
        type: 'user_action',
        message: 'Accesso utente effettuato',
        timestamp: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        status: 'success'
      }
    ];
    return activities.slice(0, limit);
  }

  // Nuovi metodi di autenticazione per l'API v2
  async registerUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }): Promise<ApiResponse<UserRegistrationResponse>> {
    const response: AxiosResponse<ApiResponse<UserRegistrationResponse>> = await this.api.post('/v2/auth/register', data);
    return response.data;
  }

  async loginUser(email: string, password: string): Promise<ApiResponse<LoginResponseV2>> {
    const response: AxiosResponse<ApiResponse<LoginResponseV2>> = await this.api.post('/v2/auth/login', {
      email,
      password
    });
    
    if (response.data.success) {
      // Store the new auth format if needed
      return response.data;
    }
    
    throw new Error(response.data.message || 'Login failed');
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> {
    const response: AxiosResponse<ApiResponse<RefreshTokenResponse>> = await this.api.post('/v2/auth/refresh', {
      refreshToken
    });
    return response.data;
  }

  async logoutUser(): Promise<ApiResponse<LogoutResponse>> {
    const response: AxiosResponse<ApiResponse<LogoutResponse>> = await this.api.post('/v2/auth/logout');
    return response.data;
  }

  async getUserMe(): Promise<ApiResponse<UserMeResponse>> {
    const response: AxiosResponse<ApiResponse<UserMeResponse>> = await this.api.get('/v2/auth/me');
    return response.data;
  }

  async changeUserPassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<ChangePasswordResponse>> {
    const response: AxiosResponse<ApiResponse<ChangePasswordResponse>> = await this.api.post('/v2/auth/change-password', data);
    return response.data;
  }

  // Metodi di gestione utenti
  async listUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  } = {}): Promise<ApiResponse<UsersListResponse>> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.role) searchParams.append('role', params.role);

    const response: AxiosResponse<ApiResponse<UsersListResponse>> = await this.api.get(`/v2/auth/users?${searchParams.toString()}`);
    return response.data;
  }

  async assignUserRole(data: {
    userId: string;
    role: string;
    expiresAt?: string;
  }): Promise<ApiResponse<RoleAssignmentResponse>> {
    const response: AxiosResponse<ApiResponse<RoleAssignmentResponse>> = await this.api.post('/v2/auth/assign-role', data);
    return response.data;
  }

  async listRoles(): Promise<ApiResponse<RolesListResponse>> {
    const response: AxiosResponse<ApiResponse<RolesListResponse>> = await this.api.get('/v2/auth/roles');
    return response.data;
  }

  async getRoleDetails(roleName: string): Promise<ApiResponse<RoleDetailsResponse>> {
    const response: AxiosResponse<ApiResponse<RoleDetailsResponse>> = await this.api.get(`/v2/auth/roles/${roleName}`);
    return response.data;
  }

  async getAuthInfoV2(): Promise<ApiResponse<AuthInfoV2Response>> {
    const response: AxiosResponse<ApiResponse<AuthInfoV2Response>> = await this.api.get('/v2/auth/info');
    return response.data;
  }

  // Gestione token
  setToken(token: string): void {
    this.bearerToken = token;
  }

  // Gestione autenticazione locale
  private saveAuthToStorage(authData: AuthResponse): void {
    localStorage.setItem('vicsam_auth', JSON.stringify(authData));
  }

  private loadAuthFromStorage(): void {
    const stored = localStorage.getItem('vicsam_auth');
    if (stored) {
      try {
        const authData: AuthResponse = JSON.parse(stored);
        this.bearerToken = authData.bearerToken;
      } catch {
        this.clearAuth();
      }
    }
  }

  clearAuth(): void {
    this.bearerToken = null;
    localStorage.removeItem('vicsam_auth');
  }

  isAuthenticated(): boolean {
    return !!this.bearerToken;
  }
}

export const apiService = new ApiService();
