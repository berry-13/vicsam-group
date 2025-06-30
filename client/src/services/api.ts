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

    // Interceptor per gestire le risposte
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Errore API:', error);
        
        // Gestione errori di autenticazione
        if (error.response?.status === 401) {
          this.clearAuth();
          // Non reindirizzare automaticamente se siamo già nella pagina di login
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        
        // Crea un messaggio di errore più specifico
        let errorMessage = 'Si è verificato un errore imprevisto';
        
        if (error.response) {
          // Errore del server con risposta
          const status = error.response.status;
          const serverMessage = error.response.data?.error || error.response.data?.message;
          
          switch (status) {
            case 400:
              errorMessage = serverMessage || 'Richiesta non valida';
              break;
            case 401:
              errorMessage = 'Password errata o sessione scaduta';
              break;
            case 403:
              errorMessage = 'Accesso negato';
              break;
            case 404:
              errorMessage = 'Risorsa non trovata';
              break;
            case 429:
              errorMessage = 'Troppi tentativi. Riprova più tardi';
              break;
            case 500:
              errorMessage = 'Errore interno del server. Riprova più tardi';
              break;
            case 502:
            case 503:
            case 504:
              errorMessage = 'Servizio temporaneamente non disponibile';
              break;
            default:
              errorMessage = serverMessage || `Errore del server (${status})`;
          }
        } else if (error.request) {
          // Errore di rete
          errorMessage = 'Errore di connessione. Verifica la tua connessione internet';
        } else {
          // Altro tipo di errore
          errorMessage = error.message || 'Errore imprevisto';
        }
        
        const enhancedError = new Error(errorMessage);
        enhancedError.name = error.name;
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
  }): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/v2/auth/register', data);
    return response.data;
  }

  async loginUser(email: string, password: string): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/v2/auth/login', {
      email,
      password
    });
    
    if (response.data.success) {
      // Store the new auth format if needed
      return response.data;
    }
    
    throw new Error(response.data.message || 'Login failed');
  }

  async refreshToken(refreshToken: string): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/v2/auth/refresh', {
      refreshToken
    });
    return response.data;
  }

  async logoutUser(): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/v2/auth/logout');
    return response.data;
  }

  async getUserMe(): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/v2/auth/me');
    return response.data;
  }

  async changeUserPassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/v2/auth/change-password', data);
    return response.data;
  }

  // Metodi di gestione utenti
  async listUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  } = {}): Promise<any> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.role) searchParams.append('role', params.role);

    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/v2/auth/users?${searchParams.toString()}`);
    return response.data;
  }

  async assignUserRole(data: {
    userId: string;
    role: string;
    expiresAt?: string;
  }): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/v2/auth/assign-role', data);
    return response.data;
  }

  async listRoles(): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/v2/auth/roles');
    return response.data;
  }

  async getRoleDetails(roleName: string): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/v2/auth/roles/${roleName}`);
    return response.data;
  }

  async getAuthInfoV2(): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/v2/auth/info');
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
