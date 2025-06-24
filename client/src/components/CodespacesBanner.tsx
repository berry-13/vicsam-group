import React, { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';
import { Settings, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-blue-400" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-blue-700">
            <strong>GitHub Codespaces rilevato!</strong> Sembra che tu stia usando GitHub Codespaces. 
            L'URL del backend potrebbe dover essere configurato per funzionare correttamente.
          </p>
          <div className="mt-3 flex space-x-3">
            <button
              onClick={handleAutoConfig}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Configura Automaticamente
            </button>
            <button
              onClick={handleManualConfig}
              className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Settings className="h-3 w-3 mr-1" />
              Configura Manualmente
            </button>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={handleDismiss}
              className="inline-flex rounded-md p-1.5 text-blue-500 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-50 focus:ring-blue-600"
            >
              <span className="sr-only">Dismiss</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
