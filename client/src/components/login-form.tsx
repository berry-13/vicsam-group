import React, { useState, useEffect } from 'react';
import { AlertCircle, Eye, EyeOff, Lock, Shield, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Spinner from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from './theme-toggle';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from '../hooks/useToast';
import { cn } from "@/lib/utils"

interface LoginFormProps extends React.ComponentProps<"div"> {
  className?: string;
}

/**
 * Renders an email+password login form with registration support, real-time validation, 
 * error handling, and user feedback.
 */
export function LoginForm({
  className,
  ...props
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { login } = useAuth();
  const toast = useToastContext();

  useEffect(() => {
    if (error && (email || password)) {
      setError('');
    }
  }, [email, password, error]);

  // Validazione email
  const validateEmail = (value: string) => {
    if (!value.trim()) {
      return 'L\'email è richiesta';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Inserisci un\'email valida';
    }
    return '';
  };

  // Validazione password
  const validatePassword = (value: string) => {
    if (!value.trim()) {
      return 'La password è richiesta';
    }
    if (value.length < 8) {
      return 'La password deve essere di almeno 8 caratteri';
    }
    return '';
  };

  const getErrorType = (errorMessage: string) => {
    if (errorMessage.includes('401') || errorMessage.includes('non autorizzato') || errorMessage.includes('password errata') || errorMessage.includes('email') || errorMessage.includes('credentials') || errorMessage.includes('invalid credentials')) {
      return 'auth';
    }
    if (errorMessage.includes('429') || errorMessage.includes('troppi tentativi') || errorMessage.includes('bloccato') || errorMessage.includes('rate limit')) {
      return 'ratelimit';
    }
    if (errorMessage.includes('423') || errorMessage.includes('account locked') || errorMessage.includes('account bloccato')) {
      return 'locked';
    }
    if (errorMessage.includes('network') || errorMessage.includes('connessione') || errorMessage.includes('timeout')) {
      return 'network';
    }
    if (errorMessage.includes('validation') || errorMessage.includes('required') || errorMessage.includes('invalid')) {
      return 'validation';
    }
    return 'generic';
  };

  const getErrorMessage = (errorMessage: string) => {
    const type = getErrorType(errorMessage.toLowerCase());
    
    switch (type) {
      case 'auth':
        return 'Email o password errata. Verifica le tue credenziali e riprova.';
      case 'ratelimit':
        return 'Troppi tentativi di accesso. Riprova tra qualche minuto.';
      case 'locked':
        return 'Account temporaneamente bloccato per sicurezza. Riprova più tardi.';
      case 'network':
        return 'Errore di connessione. Controlla la tua connessione internet.';
      case 'validation':
        return 'Controlla che tutti i campi siano compilati correttamente.';
      default:
        return errorMessage || 'Si è verificato un errore imprevisto. Riprova.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError) {
      setError(emailError);
      return;
    }
    
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
      toast.success('Accesso effettuato', 'Benvenuto nel sistema!');
      setHasError(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore durante il login';
      const processedError = getErrorMessage(errorMessage);
      setError(processedError);
      setHasError(true);
      
      const errorType = getErrorType(errorMessage.toLowerCase());
      if (errorType === 'ratelimit') {
        toast.warning('Accesso temporaneamente bloccato', 'Riprova tra qualche minuto.');
      } else if (errorType === 'locked') {
        toast.error('Account bloccato', 'Contatta l\'amministratore se il problema persiste.');
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
                <CardTitle className="text-xl">
                  Accedi
                </CardTitle>
              </div>
              <CardDescription>
                Inserisci le tue credenziali per accedere al sistema
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
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@esempio.com"
                    className={cn(
                      "pl-10 transition-all duration-200 login-input",
                      "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                      error && "border-red-300 focus:border-red-500 focus:ring-red-200",
                      hasError && "animate-shake input-error"
                    )}
                    disabled={loading}
                    required 
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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
                    aria-label={showPassword ? "Nascondi password" : "Mostra password"}
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
                disabled={loading || !email.trim() || !password.trim()}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    <span>Accesso in corso...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Accedi</span>
                  </div>
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  disabled={loading}
                >
                  Hai dimenticato la password?
                </button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
