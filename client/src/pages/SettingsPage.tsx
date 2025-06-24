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
  Zap,
  Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, resetSettings, autoConfigureForCodespaces } = useSettings();
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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Impostazioni</h2>
              <p className="text-muted-foreground">
                Configura l'URL del backend e altre opzioni
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Connection Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Configurazione Connessione
            </CardTitle>
            <CardDescription>
              Configura l'URL del backend API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiUrl">URL API Backend</Label>
              <Input
                id="apiUrl"
                type="url"
                placeholder="https://api.esempio.com/api"
                value={tempSettings.apiBaseUrl}
                onChange={(e) => setTempSettings(prev => ({ ...prev, apiBaseUrl: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                L'URL base per le chiamate API del backend
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={testConnection} disabled={testStatus === 'testing'} variant="outline">
                {testStatus === 'testing' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Testa Connessione
              </Button>
              
              <Button onClick={handleAutoDetect} variant="outline">
                <Zap className="h-4 w-4 mr-2" />
                Auto-rileva Codespaces
              </Button>
            </div>

            {/* Connection Status */}
            {testStatus === 'success' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{testMessage}</AlertDescription>
              </Alert>
            )}

            {testStatus === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{testMessage}</AlertDescription>
              </Alert>
            )}

            {testMessage && testStatus === 'idle' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{testMessage}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Debug Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Impostazioni Avanzate
            </CardTitle>
            <CardDescription>
              Configurazioni per sviluppatori e debug
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="debug">Modalità Debug</Label>
                <p className="text-xs text-muted-foreground">
                  Abilita logging dettagliato nella console
                </p>
              </div>
              <Switch
                id="debug"
                checked={tempSettings.debug}
                onCheckedChange={(checked) => setTempSettings(prev => ({ ...prev, debug: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button onClick={handleReset} variant="outline">
            Ripristina Default
          </Button>
          
          <div className="flex gap-2">
            <Button onClick={() => navigate('/')} variant="outline">
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || testStatus === 'testing'}>
              <Save className="h-4 w-4 mr-2" />
              Salva Impostazioni
            </Button>
          </div>
        </div>

        {/* Current Settings Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Configurazione Attuale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">URL API:</span>
              <span className="font-mono text-xs">{settings.apiBaseUrl}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Debug:</span>
              <span>{settings.debug ? 'Abilitato' : 'Disabilitato'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ambiente:</span>
              <span>{import.meta.env.MODE}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
