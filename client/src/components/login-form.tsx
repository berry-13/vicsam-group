import React, { useState, useEffect } from 'react';
import { AlertCircle, Eye, EyeOff, Lock, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Spinner from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from './theme-toggle';
import { useAuth } from '../hooks/useAuth';
import { useToastContext } from '../hooks/useToast';
import { cn } from "@/lib/utils"

interface LoginFormProps extends React.ComponentProps<"div"> {
  className?: string;
}

export function LoginForm({
  className,
  ...props
}: LoginFormProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { login } = useAuth();
  const toast = useToastContext();

  useEffect(() => {
    if (error && password) {
      setError('');
    }
  }, [password, error]);

  // Validazione password in tempo reale
  const validatePassword = (value: string) => {
    if (!value.trim()) {
      return 'La password è richiesta';
    }
    if (value.length < 3) {
      return 'La password deve essere di almeno 3 caratteri';
    }
    return '';
  };

  const getErrorType = (errorMessage: string) => {
    if (errorMessage.includes('401') || errorMessage.includes('non autorizzato') || errorMessage.includes('password errata')) {
      return 'auth';
    }
    if (errorMessage.includes('429') || errorMessage.includes('troppi tentativi') || errorMessage.includes('bloccato')) {
      return 'ratelimit';
    }
    if (errorMessage.includes('network') || errorMessage.includes('connessione')) {
      return 'network';
    }
    return 'generic';
  };

  const getErrorMessage = (errorMessage: string) => {
    const type = getErrorType(errorMessage.toLowerCase());
    
    switch (type) {
      case 'auth':
        return 'Password errata. Verifica e riprova.';
      case 'ratelimit':
        return 'Troppi tentativi falliti. Riprova più tardi.';
      case 'network':
        return 'Errore di connessione. Controlla la tua connessione internet.';
      default:
        return errorMessage || 'Si è verificato un errore imprevisto.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(password);
      setHasError(false);
      
      toast.success('Accesso effettuato', 'Benvenuto nel sistema!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore durante il login';
      const processedError = getErrorMessage(errorMessage);
      setError(processedError);
      setHasError(true);
      
      // Mostra toast di errore per rate limiting
      if (getErrorType(errorMessage.toLowerCase()) === 'ratelimit') {
        toast.warning('Accesso temporaneamente bloccato', 'Riprova tra qualche minuto.');
      }
      
      setTimeout(() => setHasError(false), 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="backdrop-blur-sm bg-background/95 border-border/50 shadow-2xl">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Login</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">
                Inserisci la password master per accedere al pannello di controllo
              </CardDescription>
            </div>
            <div className="-mt-1">
              <ThemeToggle />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert 
                variant={getErrorType(error.toLowerCase()) === 'auth' ? "destructive" : "default"}
                className={cn(
                  "animate-in slide-in-from-top-2 duration-300",
                  getErrorType(error.toLowerCase()) === 'auth' && "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
                )}
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password Master
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Inserisci la password"
                    className={cn(
                      "pl-10 pr-10 transition-all duration-200 login-input",
                      "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                      error && "border-red-300 focus:border-red-500 focus:ring-red-200",
                      hasError && "animate-shake input-error"
                    )}
                    disabled={loading}
                    required 
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={loading}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className={cn(
                  "w-full h-11 transition-all duration-200 login-button",
                  loading && "cursor-not-allowed"
                )}
                disabled={loading || !password.trim()}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    <span>Verifica in corso...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Accedi</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
