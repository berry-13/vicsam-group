import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useSettings } from "../hooks/useSettings";
import { useTheme } from "../hooks/useTheme";
import { useToastContext } from "../hooks/useToast";
import {
  ArrowLeft,
  Save,
  Moon,
  Sun,
  Monitor,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
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
import { PageContainer } from "@/components/PageContainer";

interface SimpleSettings {
  debug: boolean;
  soundEnabled: boolean;
  notifications: boolean;
  language: "it" | "en";
}

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const { theme, setTheme } = useTheme();
  const toast = useToastContext();

  const [tempSettings, setTempSettings] = useState<SimpleSettings>({
    debug: settings.debug || false,
    soundEnabled: true,
    notifications: true,
    language: "it",
  });

  const [hasChanges, setHasChanges] = useState(false);

  React.useEffect(() => {
    setHasChanges(JSON.stringify(tempSettings) !== JSON.stringify(settings));
  }, [tempSettings, settings]);

  const handleSave = () => {
    updateSettings(tempSettings);
    setHasChanges(false);
    toast.success("Impostazioni salvate!");
  };

  return (
    <PageContainer>
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
    </PageContainer>
  );
};
