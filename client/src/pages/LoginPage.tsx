import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LoginForm } from "@/components/login-form";
import Spinner from "@/components/ui/spinner";

export const LoginPage: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  // Mostra un loading durante la verifica dell'autenticazione
  if (loading) {
    return (
      <div className="min-h-screen login-bg-loading flex items-center justify-center">
        <div className="text-center space-y-4">
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
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
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
