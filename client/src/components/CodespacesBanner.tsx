import React, { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';
import { Settings, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export const CodespacesBanner: React.FC = () => {
  const { settings, detectCodespaceUrl, autoConfigureForCodespaces } = useSettings();
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we're in a codespace and the URL is not configured
    const codespaceUrl = detectCodespaceUrl();
    const isDismissed = localStorage.getItem('codespaces-banner-dismissed') === 'true';
    
    if (codespaceUrl && !isDismissed) {
      // Check if current API URL is different from detected URL
      const currentUrl = settings.apiBaseUrl.replace(/\/api$/, '');
      const detectedUrl = codespaceUrl.replace(/\/api$/, '');
      
      if (currentUrl !== detectedUrl) {
        setIsVisible(true);
      }
    }
  }, [settings.apiBaseUrl, detectCodespaceUrl]);

  const handleAutoConfig = () => {
    const configured = autoConfigureForCodespaces();
    if (configured) {
      setIsVisible(false);
      // Show success message briefly
      setTimeout(() => {
        window.location.reload(); // Reload to apply new settings
      }, 1000);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setIsVisible(false);
    localStorage.setItem('codespaces-banner-dismissed', 'true');
  };

  const handleManualConfig = () => {
    navigate('/settings');
  };

  if (!isVisible || dismissed) {
    return null;
  }

  return (
    <Alert className="mb-6 relative">
      <AlertCircle className="h-5 w-5" />
      <AlertTitle>GitHub Codespaces Rilevato!</AlertTitle>
      <AlertDescription>
        <p className="pr-8">
          Sembra che tu stia usando GitHub Codespaces. L'URL del backend potrebbe dover essere configurato per funzionare correttamente.
        </p>
        <div className="mt-4 flex gap-4">
          <Button onClick={handleAutoConfig} size="sm">
            Configura Automaticamente
          </Button>
          <Button onClick={handleManualConfig} variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configura Manualmente
          </Button>
        </div>
      </AlertDescription>
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1.5 rounded-md text-foreground/50 hover:text-foreground focus:outline-none"
      >
        <span className="sr-only">Dismiss</span>
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );
};
