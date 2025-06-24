import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import type { DataStats, ApiInfo } from '../services/api';
import { CodespacesBanner } from '../components/CodespacesBanner';
import { 
  BarChart3, 
  FileText, 
  Database, 
  Activity, 
  LogOut, 
  RefreshCw,
  Settings,
  Info
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DataStats | null>(null);
  const [apiInfo, setApiInfo] = useState<ApiInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [statsData, infoData] = await Promise.all([
        apiService.getStats(),
        apiService.getApiInfo()
      ]);
      setStats(statsData);
      setApiInfo(infoData);
    } catch (error) {
      console.error('Errore nel caricamento dati dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('it-IT');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {apiInfo?.name || 'VicSam Group API'}
                </h1>
                <p className="text-sm text-gray-500">
                  {apiInfo?.description || 'Dashboard di gestione'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Aggiorna
              </button>
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Codespaces Configuration Banner */}
        <CodespacesBanner />
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      File Totali
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.totalFiles || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Dimensione Totale
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatBytes(stats?.totalSize || 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Database className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Dati Generali
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.generalDataCount || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Ultimo Aggiornamento
                    </dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {formatDate(stats?.lastUpdate || null)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Azioni Rapide
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => navigate('/files')}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Gestisci File
                </button>
                <button 
                  onClick={() => navigate('/save-data')}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Salva Dati
                </button>
                <button 
                  onClick={() => navigate('/stats')}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Statistiche
                </button>
                <button 
                  onClick={() => navigate('/settings')}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Impostazioni
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Informazioni API
              </h3>
              {apiInfo && (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Versione:</span>
                    <span className="text-sm font-medium text-gray-900">{apiInfo.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Autenticazione:</span>
                    <span className="text-sm font-medium text-gray-900">{apiInfo.authentication}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Rate Limit:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {apiInfo.rateLimit?.maxRequests}/min
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Token:</span>
                    <span className="text-sm font-mono text-gray-600 truncate max-w-32">
                      {user?.bearerToken.substring(0, 20)}...
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
              <Info className="h-5 w-5 mr-2" />
              Endpoint API Disponibili
            </h3>
            {apiInfo && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-2">Autenticazione</h4>
                  <div className="space-y-2">
                    {Object.entries(apiInfo.endpoints.auth).map(([endpoint, description]) => (
                      <div key={endpoint} className="flex items-center text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-3">
                          {endpoint.split(' ')[0]}
                        </span>
                        <span className="text-gray-600">{description}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-2">Gestione Dati</h4>
                  <div className="space-y-2">
                    {Object.entries(apiInfo.endpoints.data).map(([endpoint, description]) => (
                      <div key={endpoint} className="flex items-center text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-3">
                          {endpoint.split(' ')[0]}
                        </span>
                        <span className="text-gray-600 truncate">{description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
