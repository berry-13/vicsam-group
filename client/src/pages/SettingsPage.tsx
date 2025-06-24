import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
import { 
  ArrowLeft,
  Save,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Monitor,
  Palette
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

type Theme = 'light' | 'dark' | 'system';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, resetSettings } = useSettings();
  const [tempSettings, setTempSettings] = useState(settings);
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'system';
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasChanges(
      tempSettings.debug !== settings.debug ||
      theme !== (localStorage.getItem('theme') || 'system')
    );
  }, [tempSettings, settings, theme]);

  const applyTheme = (newTheme: Theme) => {
    if (newTheme === 'system') {
      localStorage.removeItem('theme');
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', systemTheme === 'dark');
    } else {
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleSave = () => {
    updateSettings(tempSettings);
    setHasChanges(false);
    setTimeout(() => navigate('/'), 500);
  };

  const handleReset = () => {
    resetSettings();
    setTempSettings(settings);
    setTheme('system');
    applyTheme('system');
    setHasChanges(false);
  };

  const getThemeIcon = (themeType: Theme) => {
    switch (themeType) {
      case 'light': return <Sun className="h-4 w-4" />;
      case 'dark': return <Moon className="h-4 w-4" />;
      case 'system': return <Monitor className="h-4 w-4" />;
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
                Personalizza l'applicazione secondo le tue preferenze
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Aspetto
            </CardTitle>
            <CardDescription>
              Personalizza l'aspetto dell'applicazione
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Tema</Label>
              <div className="grid grid-cols-3 gap-3">
                {(['light', 'dark', 'system'] as const).map((themeOption) => (
                  <Button
                    key={themeOption}
                    variant={theme === themeOption ? 'default' : 'outline'}
                    onClick={() => handleThemeChange(themeOption)}
                    className="flex items-center gap-2 justify-start"
                  >
                    {getThemeIcon(themeOption)}
                    {themeOption === 'light' && 'Chiaro'}
                    {themeOption === 'dark' && 'Scuro'}
                    {themeOption === 'system' && 'Sistema'}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Il tema sistema si adatta automaticamente alle preferenze del tuo dispositivo
              </p>
            </div>
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
                <Label htmlFor="debug">Modalità Debug Avanzata</Label>
                <p className="text-xs text-muted-foreground">
                  Abilita logging dettagliato nella console, informazioni di debug nell'interfaccia e strumenti per sviluppatori
                </p>
              </div>
              <Switch
                id="debug"
                checked={tempSettings.debug}
                onCheckedChange={(checked) => setTempSettings(prev => ({ ...prev, debug: checked }))}
              />
            </div>
            
            {tempSettings.debug && (
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="text-sm font-medium mb-2">Funzionalità Debug Abilitate:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Logging dettagliato delle chiamate API</li>
                  <li>• Informazioni di debug nell'interfaccia utente</li>
                  <li>• Stack trace degli errori</li>
                  <li>• Timing delle operazioni</li>
                  <li>• Stato interno dei componenti</li>
                </ul>
              </div>
            )}
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
            <Button onClick={handleSave} disabled={!hasChanges}>
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
              <span className="text-muted-foreground">Tema:</span>
              <span className="capitalize">{theme === 'system' ? 'Sistema' : theme === 'light' ? 'Chiaro' : 'Scuro'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Debug:</span>
              <span>{settings.debug ? 'Abilitato' : 'Disabilitato'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ambiente:</span>
              <span>{import.meta.env.MODE}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Versione:</span>
              <span>1.0.0</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
