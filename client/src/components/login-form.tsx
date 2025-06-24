import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '../hooks/useAuth';
import { cn } from "@/lib/utils"
import { ThemeToggle } from './theme-toggle';

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
  const { login } = useAuth();

  useEffect(() => {
    if (error && password) {
      setError('');
    }
  }, [password, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('La password è richiesta');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il login');
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle>Accesso Amministratore</CardTitle>
              <CardDescription>
                Inserisci la password master per accedere al pannello.
              </CardDescription>
            </div>
            <div className="-mt-1">
              <ThemeToggle />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {error && (
               <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Accesso in corso...' : 'Accedi'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
