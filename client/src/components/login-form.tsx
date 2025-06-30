import React, { useState, useEffect } from 'react';
import { AlertCircle, Eye, EyeOff, Lock, Shield, Mail, User } from 'lucide-react';
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
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { login, register } = useAuth();
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
    if (errorMessage.includes('401') || errorMessage.includes('non autorizzato') || errorMessage.includes('password errata') || errorMessage.includes('email') || errorMessage.includes('credentials')) {
      return 'auth';
    }
    if (errorMessage.includes('429') || errorMessage.includes('troppi tentativi') || errorMessage.includes('bloccato')) {
      return 'ratelimit';
    }
    if (errorMessage.includes('network') || errorMessage.includes('connessione')) {
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
        return mode === 'login' 
          ? 'Email o password errata. Verifica e riprova.'
          : 'Errore durante la registrazione. Controlla i dati inseriti.';
      case 'ratelimit':
        return 'Troppi tentativi falliti. Riprova più tardi.';
      case 'network':
        return 'Errore di connessione. Controlla la tua connessione internet.';
      case 'validation':
        return 'Controlla che tutti i campi siano compilati correttamente.';
      default:
        return errorMessage || 'Si è verificato un errore imprevisto.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validazione
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

    if (mode === 'register' && (!firstName.trim() || !lastName.trim())) {
      setError('Nome e cognome sono richiesti per la registrazione');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        await login(email, password);
        toast.success('Accesso effettuato', 'Benvenuto nel sistema!');
      } else {
        await register(email, password, firstName, lastName, role);
        toast.success('Registrazione completata', 'Account creato con successo!');
      }
      setHasError(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Errore durante ${mode === 'login' ? 'il login' : 'la registrazione'}`;
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

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setRole('user');
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
                  {mode === 'login' ? 'Accedi' : 'Registrati'}
                </CardTitle>
              </div>
              <CardDescription>
                {mode === 'login' 
                  ? 'Inserisci le tue credenziali per accedere al sistema'
                  : 'Crea un nuovo account per accedere al sistema'
                }
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
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">
                      Nome
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="firstName" 
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Il tuo nome"
                        className="pl-10"
                        disabled={loading}
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">
                      Cognome
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="lastName" 
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Il tuo cognome"
                        className="pl-10"
                        disabled={loading}
                        required 
                      />
                    </div>
                  </div>
                </div>
              )}

              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium">
                    Ruolo
                  </Label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 pl-10 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    disabled={loading}
                    required
                  >
                    <option value="user">Utente</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Amministratore</option>
                  </select>
                </div>
              )}

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
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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
                {mode === 'register' && (
                  <p className="text-xs text-muted-foreground">
                    La password deve contenere almeno 8 caratteri
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className={cn(
                  "w-full h-11 transition-all duration-200 login-button",
                  loading && "cursor-not-allowed"
                )}
                disabled={loading || !email.trim() || !password.trim() || (mode === 'register' && (!firstName.trim() || !lastName.trim()))}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    <span>{mode === 'login' ? 'Accesso in corso...' : 'Registrazione in corso...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>{mode === 'login' ? 'Accedi' : 'Registrati'}</span>
                  </div>
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                  disabled={loading}
                >
                  {mode === 'login' 
                    ? 'Non hai un account? Registrati'
                    : 'Hai già un account? Accedi'
                  }
                </button>
              </div>

              {mode === 'login' && (
                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    disabled={loading}
                  >
                    Hai dimenticato la password?
                  </button>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
