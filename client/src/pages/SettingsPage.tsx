import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useSettings } from "../hooks/useSettings";
import { useTheme } from "../hooks/useTheme";
import { useToastContext } from "../hooks/useToast";
import { useAuth } from "../contexts/AuthContext";
import {
  ArrowLeft,
  Save,
  Moon,
  Sun,
  Monitor,
  User,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SimpleSettings {
  debug: boolean;
  language: "it" | "en";
}

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const { theme, setTheme } = useTheme();
  const { user, hasRole, hasPermission } = useAuth();
  const toast = useToastContext();

  const [tempSettings, setTempSettings] = useState<SimpleSettings>({
    debug: settings.debug || false,
    language: "it",
  });

  const [hasChanges, setHasChanges] = useState(false);

  React.useEffect(() => {
    // Only compare the properties that exist in both objects
    const hasDebugChanges = tempSettings.debug !== settings.debug;
    setHasChanges(hasDebugChanges);
  }, [tempSettings, settings]);

  const handleSave = () => {
    // Only update the properties that exist in the settings object
    updateSettings({ debug: tempSettings.debug });
    setHasChanges(false);
    toast.success("Impostazioni salvate!");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <h1 className="text-2xl font-bold">Impostazioni</h1>
          </div>
        </div>

        {/* Settings Cards */}
        <div className="space-y-4">
          {/* Debug Info - Prima sezione per essere più visibile */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                <Shield className="h-5 w-5" />
                🔍 Debug Autorizzazioni
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Test Ruoli</Label>
                  <div className="space-y-2 mt-2">
                    <div className="text-sm">
                      <strong>hasRole('admin'):</strong> <span className={hasRole('admin') ? 'text-green-600' : 'text-red-600'}>{hasRole('admin') ? '✅ Sì' : '❌ No'}</span>
                    </div>
                    <div className="text-sm">
                      <strong>hasRole('user'):</strong> <span className={hasRole('user') ? 'text-green-600' : 'text-red-600'}>{hasRole('user') ? '✅ Sì' : '❌ No'}</span>
                    </div>
                    <div className="text-sm">
                      <strong>hasPermission('user_management'):</strong> <span className={hasPermission('user_management') ? 'text-green-600' : 'text-red-600'}>{hasPermission('user_management') ? '✅ Sì' : '❌ No'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Ruoli Assegnati</Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {user?.roles && user.roles.length > 0 ? (
                      user.roles.map((role, index) => {
                        const roleDisplay = typeof role === 'string' ? role : role.name;
                        const roleKey = typeof role === 'string' ? role : `${role.name}-${index}`;
                        return (
                          <span 
                            key={roleKey}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                          >
                            {roleDisplay}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-sm text-muted-foreground">❌ Nessun ruolo assegnato</span>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Permessi</Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {user?.permissions && user.permissions.length > 0 ? (
                    user.permissions.map((permission) => (
                      <span 
                        key={permission} 
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                      >
                        {permission}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">❌ Nessun permesso assegnato</span>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Accesso Admin Panel</Label>
                <p className={`text-sm mt-1 ${hasRole('admin') ? 'text-green-600' : 'text-red-600'}`}>
                  {hasRole('admin') ? '✅ Puoi accedere al pannello admin (/admin)' : '❌ Non puoi accedere al pannello admin - serve il ruolo "admin"'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Debug Nome Utente</Label>
                <div className="text-xs bg-muted p-2 rounded mt-1">
                  <div><strong>typeof user?.name:</strong> {typeof user?.name}</div>
                  <div><strong>user?.name raw:</strong> {JSON.stringify(user?.name)}</div>
                  <div><strong>user?.firstName:</strong> {JSON.stringify(user?.firstName)}</div>
                  <div><strong>user?.lastName:</strong> {JSON.stringify(user?.lastName)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Informazioni Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{user?.email || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                  <p className="text-sm bg-muted px-2 py-1 rounded">
                    {typeof user?.name === 'string' ? user.name : `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Stato Account</Label>
                  <p className="text-sm bg-muted px-2 py-1 rounded">
                    {user?.isActive ? "✅ Attivo" : "❌ Disattivato"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Verificato</Label>
                  <p className="text-sm bg-muted px-2 py-1 rounded">
                    {user?.isVerified ? "✅ Verificato" : "⚠️ Non verificato"}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Ruoli Assegnati
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {user?.roles && user.roles.length > 0 ? (
                    user.roles.map((role, index) => {
                      const roleDisplay = typeof role === 'string' ? role : role.name;
                      const roleKey = typeof role === 'string' ? role : `${role.name}-${index}`;
                      return (
                        <span 
                          key={roleKey}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                        >
                          {roleDisplay}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-sm text-muted-foreground">Nessun ruolo assegnato</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aspetto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Tema</Label>
                <Select
                  value={theme}
                  onValueChange={(value: "light" | "dark" | "system") =>
                    setTheme(value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Chiaro
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Scuro
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Sistema
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Lingua</Label>
                <Select
                  value={tempSettings.language}
                  onValueChange={(value: "it" | "en") =>
                    setTempSettings((prev) => ({ ...prev, language: value }))
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="it">🇮🇹 Italiano</SelectItem>
                    <SelectItem value="en">🇺🇸 English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preferenze</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Modalità debug</Label>
                <Switch
                  checked={tempSettings.debug}
                  onCheckedChange={(checked) =>
                    setTempSettings((prev) => ({ ...prev, debug: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Hai modifiche non salvate
                  </span>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Salva
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};
