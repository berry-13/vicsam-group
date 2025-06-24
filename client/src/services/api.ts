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
  type: string;
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

class ApiService {
  private api: AxiosInstance;
  private bearerToken: string | null = null;
  private currentBaseUrl: string;

  constructor() {
    // Get base URL from settings or environment
    // In Codespaces, use relative URLs to avoid SSL certificate issues
    this.currentBaseUrl = this.getStoredBaseUrl() || import.meta.env.VITE_API_BASE_URL || '/api';
    
    // Log della configurazione per debug
    console.log('🔧 [API CONFIG] Current window location:', window.location.href);
    console.log('🔧 [API CONFIG] Environment:', import.meta.env.MODE);
    console.log('🔧 [API CONFIG] Configured base URL:', this.currentBaseUrl);
    
    this.api = axios.create({
      baseURL: this.currentBaseUrl,
      timeout: 10000,
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
        if (error.response?.status === 401) {
          this.clearAuth();
          window.location.href = '/login';
        }
        return Promise.reject(error);
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
  async saveData(data: Record<string, unknown>): Promise<{ fileName: string }> {
    const response: AxiosResponse<ApiResponse<{ fileName: string }>> = await this.api.post('/data/save', data);
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

  // Recupera l'URL base dalle impostazioni salvate
  private getStoredBaseUrl(): string | null {
    try {
      const settings = localStorage.getItem('vicsam-app-settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed.apiBaseUrl;
      }
    } catch (error) {
      console.warn('Errore nel caricamento URL dalle impostazioni:', error);
    }
    return null;
  }

  // Metodo per aggiornare l'URL base
  public updateBaseUrl(newBaseUrl: string) {
    const cleanUrl = newBaseUrl.replace(/\/api$/, ''); // Remove /api suffix if present
    this.currentBaseUrl = cleanUrl;
    this.api.defaults.baseURL = cleanUrl;
  }

  // Metodo per ottenere l'URL base corrente
  public getBaseUrl(): string {
    return this.currentBaseUrl;
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
