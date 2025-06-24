import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
import { apiService } from '../services/api';
import { 
  ArrowLeft,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Globe,
  Settings as SettingsIcon,
  Zap
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, resetSettings, detectCodespaceUrl, autoConfigureForCodespaces } = useSettings();
  const [tempSettings, setTempSettings] = useState(settings);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasChanges(
      tempSettings.apiBaseUrl !== settings.apiBaseUrl ||
      tempSettings.debug !== settings.debug
    );
  }, [tempSettings, settings]);

  const testConnection = async () => {
    setTestStatus('testing');
    setTestMessage('');

    try {
      // Update API service with new URL for testing
      apiService.updateBaseUrl(tempSettings.apiBaseUrl);

      await apiService.getApiInfo();
      setTestStatus('success');
      setTestMessage('Connessione riuscita! Il backend è raggiungibile.');
    } catch (error) {
      setTestStatus('error');
      setTestMessage(
        error instanceof Error 
          ? `Errore di connessione: ${error.message}`
          : 'Impossibile connettersi al backend. Verifica l\'URL.'
      );
      // Restore original URL on error
      apiService.updateBaseUrl(settings.apiBaseUrl);
    }
  };

  const handleSave = async () => {
    updateSettings(tempSettings);
    apiService.updateBaseUrl(tempSettings.apiBaseUrl);
    
    // Test the connection after saving
    await testConnection();
    
    if (testStatus === 'success') {
      setTimeout(() => navigate('/'), 1500);
    }
  };

  const handleReset = () => {
    resetSettings();
    setTempSettings(settings);
    setTestStatus('idle');
    setTestMessage('');
  };

  const handleAutoDetect = () => {
    const detectedUrl = autoConfigureForCodespaces();
    if (detectedUrl) {
      setTempSettings(prev => ({ ...prev, apiBaseUrl: detectedUrl }));
      setTestMessage(`URL GitHub Codespaces rilevato: ${detectedUrl}`);
    } else {
      setTestMessage('GitHub Codespaces non rilevato. Assicurati di essere in un ambiente Codespaces.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <SettingsIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Impostazioni</h1>
                <p className="text-sm text-gray-500">Configura l'URL del backend e altre opzioni</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              {/* API Configuration Section */}
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Configurazione API
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="apiUrl" className="block text-sm font-medium text-gray-700">
                      URL Base API
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <input
                        type="url"
                        id="apiUrl"
                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="https://your-codespace-3000.preview.app.github.dev"
                        value={tempSettings.apiBaseUrl}
                        onChange={(e) => setTempSettings(prev => ({ ...prev, apiBaseUrl: e.target.value }))}
                      />
                      <button
                        type="button"
                        onClick={handleAutoDetect}
                        className="inline-flex items-center px-3 py-2 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <Zap className="h-4 w-4" />
                        <span className="ml-1 hidden sm:inline">Auto</span>
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Per GitHub Codespaces, l'URL dovrebbe essere simile a: 
                      <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                        https://username-codespace-name-3000.preview.app.github.dev
                      </code>
                    </p>
                  </div>

                  {/* Connection Test */}
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={testConnection}
                      disabled={testStatus === 'testing'}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                      {testStatus === 'testing' ? 'Testing...' : 'Testa Connessione'}
                    </button>

                    {testStatus === 'success' && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span className="text-sm">Connesso</span>
                      </div>
                    )}

                    {testStatus === 'error' && (
                      <div className="flex items-center text-red-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        <span className="text-sm">Errore</span>
                      </div>
                    )}
                  </div>

                  {testMessage && (
                    <div className={`p-3 rounded-md text-sm ${
                      testStatus === 'success' 
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : testStatus === 'error'
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}>
                      {testMessage}
                    </div>
                  )}
                </div>
              </div>

              {/* Debug Section */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Opzioni Debug
                </h3>
                
                <div className="flex items-center">
                  <input
                    id="debug"
                    name="debug"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={tempSettings.debug}
                    onChange={(e) => setTempSettings(prev => ({ ...prev, debug: e.target.checked }))}
                  />
                  <label htmlFor="debug" className="ml-2 block text-sm text-gray-900">
                    Abilita modalità debug
                  </label>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Mostra informazioni aggiuntive nella console del browser
                </p>
              </div>

              {/* Actions */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Reset Impostazioni
                  </button>
                  
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Annulla
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={!hasChanges}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salva Impostazioni
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Configuration Display */}
        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Configurazione Attuale
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">URL API Salvato</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono break-all">
                  {settings.apiBaseUrl}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">URL Rilevato (Codespaces)</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono break-all">
                  {detectCodespaceUrl() || 'Non rilevato'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Modalità Debug</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {settings.debug ? 'Abilitata' : 'Disabilitata'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Ambiente</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {import.meta.env.DEV ? 'Sviluppo' : 'Produzione'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};
