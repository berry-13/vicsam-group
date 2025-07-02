import React, { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LoginForm } from "@/components/login-form";
import Spinner from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";

export const LoginPage: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [redirectMessage, setRedirectMessage] = useState<string>('');
  
  useEffect(() => {
    const reason = searchParams.get('reason');
    switch (reason) {
      case 'session_expired':
        setRedirectMessage('La tua sessione è scaduta. Effettua nuovamente l\'accesso.');
        break;
      case 'auth_required':
        setRedirectMessage('Accesso richiesto per visualizzare questa pagina.');
        break;
      case 'insufficient_permissions':
        setRedirectMessage('Non hai i permessi necessari per accedere a questa risorsa.');
        break;
      case 'account_locked':
        setRedirectMessage('Account temporaneamente bloccato. Riprova più tardi.');
        break;
      default:
        setRedirectMessage('');
    }
  }, [searchParams]);

  // Mostra un loading durante la verifica dell'autenticazione
  if (loading) {
    return (
      <div className="min-h-screen login-bg-loading flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-sm text-muted-foreground">
            Verifica autenticazione...
          </p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen login-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Elementi decorativi di sfondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl theme-transition"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl theme-transition"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl theme-transition"></div>
      </div>

      {/* Header con logo/titolo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-primary/20">
            <img src="/logo.png" alt="Vicsam Group Logo" className="w-16 h-16 rounded-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Vicsam Group</h1>
            <p className="text-muted-foreground mt-2">
              Sistema di Gestione Dati
            </p>
          </div>
        </div>
      </div>

      {/* Form di login */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {redirectMessage && (
          <div className="mb-6">
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                {redirectMessage}
              </AlertDescription>
            </Alert>
          </div>
        )}
        <LoginForm className="animate-in fade-in-50 slide-in-from-bottom-4 duration-700" />
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Vicsam Group
        </p>
      </div>
    </div>
  );
};
