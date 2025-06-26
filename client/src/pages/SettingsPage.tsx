import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "../hooks/useSettings";
import { useToastContext } from "../hooks/useToast";
import {
  ArrowLeft,
  Save,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Monitor,
  Palette,
  Volume2,
  VolumeX,
  Download,
  Upload,
  RotateCcw,
  Search,
  Bell,
  Shield,
  Database,
  Zap,
  Globe,
  Eye,
  Smartphone,
  Laptop,
  Tablet,
  CheckCircle,
  XCircle,
  HelpCircle,
  Star,
  Sparkles,
  RefreshCw,
  Copy,
  CloudDownload,
  CloudUpload,
  Trash2,
  Plus,
  Minus,
  Type,
  Languages,
  Clock,
  Gauge,
  Lock,
  Unlock,
  Music,
  Image,
  Video,
  FileText,
  Heart,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageContainer } from "@/components/PageContainer";

type Theme =
  | "light"
  | "dark"
  | "system"
  | "sunset"
  | "ocean"
  | "forest"
  | "midnight"
  | "rose";
type FontSize = "small" | "medium" | "large" | "xl";
type Language = "it" | "en" | "es" | "fr" | "de";
type AnimationSpeed = "slow" | "normal" | "fast" | "none";

interface EnhancedSettings {
  debug: boolean;
  theme: Theme;
  fontSize: FontSize;
  language: Language;
  animations: boolean;
  animationSpeed: AnimationSpeed;
  soundEnabled: boolean;
  notifications: boolean;
  autoSave: boolean;
  compactMode: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  showTooltips: boolean;
  dataCollection: boolean;
  performanceMode: boolean;
  customAccentColor: string;
  autoBackup: boolean;
  maxBackups: number;
}

const themeOptions = [
  {
    value: "light",
    label: "Chiaro",
    icon: Sun,
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    value: "dark",
    label: "Scuro",
    icon: Moon,
    color: "bg-gray-700 text-gray-200",
  },
  {
    value: "system",
    label: "Sistema",
    icon: Monitor,
    color: "bg-blue-100 text-blue-600",
  },
  {
    value: "sunset",
    label: "Tramonto",
    icon: Sparkles,
    color: "bg-gradient-to-r from-orange-400 to-pink-400",
  },
  {
    value: "ocean",
    label: "Oceano",
    icon: Sparkles,
    color: "bg-gradient-to-r from-blue-400 to-cyan-400",
  },
  {
    value: "forest",
    label: "Foresta",
    icon: Sparkles,
    color: "bg-gradient-to-r from-green-400 to-emerald-400",
  },
  {
    value: "midnight",
    label: "Mezzanotte",
    icon: Sparkles,
    color: "bg-gradient-to-r from-purple-400 to-indigo-400",
  },
  {
    value: "rose",
    label: "Rosa",
    icon: Heart,
    color: "bg-gradient-to-r from-pink-400 to-rose-400",
  },
];

const languageOptions = [
  { value: "it", label: "Italiano", flag: "🇮🇹" },
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "es", label: "Español", flag: "🇪🇸" },
  { value: "fr", label: "Français", flag: "🇫🇷" },
  { value: "de", label: "Deutsch", flag: "🇩🇪" },
];

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, resetSettings } = useSettings();
  const toast = useToastContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("appearance");
  const [isLoading, setIsLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [tempSettings, setTempSettings] = useState<EnhancedSettings>({
    debug: settings.debug || false,
    theme: "system",
    fontSize: "medium",
    language: "it",
    animations: true,
    animationSpeed: "normal",
    soundEnabled: true,
    notifications: true,
    autoSave: true,
    compactMode: false,
    highContrast: false,
    reducedMotion: false,
    showTooltips: true,
    dataCollection: false,
    performanceMode: false,
    customAccentColor: "#3b82f6",
    autoBackup: true,
    maxBackups: 5,
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasChanges(JSON.stringify(tempSettings) !== JSON.stringify(settings));
    }, 100);
    return () => clearTimeout(timer);
  }, [tempSettings, settings]);

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      updateSettings(tempSettings);
      setLastSaved(new Date());
      setHasChanges(false);
      toast.success("Impostazioni salvate con successo!", "Le tue preferenze sono state aggiornate.");
    } catch {
      toast.error("Errore nel salvataggio", "Si è verificato un errore. Riprova.");
    } finally {
      setIsLoading(false);
    }
  }, [tempSettings, updateSettings, toast]);

  const handleExportSettings = useCallback(async () => {
    setExportProgress(0);
    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          const dataStr = JSON.stringify(tempSettings, null, 2);
          const dataBlob = new Blob([dataStr], { type: "application/json" });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `settings-backup-${
            new Date().toISOString().split("T")[0]
          }.json`;
          link.click();
          URL.revokeObjectURL(url);
          toast.success("Impostazioni esportate!");
          return 0;
        }
        return prev + 10;
      });
    }, 100);
  }, [tempSettings, toast]);

  const handleImportSettings = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedSettings = JSON.parse(e.target?.result as string);
            setTempSettings((prev) => ({ ...prev, ...importedSettings }));
            toast.success("Impostazioni importate!");
          } catch {
            toast.error("File non valido");
          }
        };
        reader.readAsText(file);
      }
    },
    [toast]
  );

  const filteredSections = useCallback(() => {
    if (!searchTerm) return null;
    const sections = [
      "appearance",
      "behavior",
      "performance",
      "privacy",
      "advanced",
    ];
    return sections.filter((section) =>
      section.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const SettingCard: React.FC<{
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    children: React.ReactNode;
    badge?: string;
    premium?: boolean;
  }> = ({ title, description, icon: Icon, children, badge, premium }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="enhanced-card group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/20 hover:border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  {title}
                  {premium && (
                    <Badge variant="secondary" className="text-xs">
                      Pro
                    </Badge>
                  )}
                  {badge && (
                    <Badge variant="outline" className="text-xs">
                      {badge}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  {description}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">{children}</CardContent>
      </Card>
    </motion.div>
  );

  return (
    <TooltipProvider>
      <PageContainer intensity={3}>
        {/* Header with enhanced styling */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-lg" />
          <div className="relative flex items-center justify-between p-6">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="hover:bg-primary/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Indietro
              </Button>

              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Impostazioni
                </h1>
                <p className="text-muted-foreground mt-1">
                  Personalizza ogni aspetto della tua esperienza
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {lastSaved && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Salvato {lastSaved.toLocaleTimeString()}
                </div>
              )}

              {hasChanges && (
                <Badge variant="secondary" className="animate-pulse">
                  Modifiche non salvate
                </Badge>
              )}
            </div>
          </div>
        </motion.div>

        {/* Enhanced Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative max-w-md mx-auto mb-8"
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca impostazioni..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-8"
          >
            {/* Enhanced Tab Navigation */}
            <TabsList className="grid w-full grid-cols-5 h-14 p-1 bg-muted/50">
              <TabsTrigger
                value="appearance"
                className="flex flex-col gap-1 h-12"
              >
                <Palette className="h-4 w-4" />
                <span className="text-xs">Aspetto</span>
              </TabsTrigger>
              <TabsTrigger
                value="behavior"
                className="flex flex-col gap-1 h-12"
              >
                <SettingsIcon className="h-4 w-4" />
                <span className="text-xs">Comportamento</span>
              </TabsTrigger>
              <TabsTrigger
                value="performance"
                className="flex flex-col gap-1 h-12"
              >
                <Zap className="h-4 w-4" />
                <span className="text-xs">Performance</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex flex-col gap-1 h-12">
                <Shield className="h-4 w-4" />
                <span className="text-xs">Privacy</span>
              </TabsTrigger>
              <TabsTrigger
                value="advanced"
                className="flex flex-col gap-1 h-12"
              >
                <Database className="h-4 w-4" />
                <span className="text-xs">Avanzate</span>
              </TabsTrigger>
            </TabsList>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Theme Selection */}
                <SettingCard
                  title="Tema dell'interfaccia"
                  description="Scegli lo stile visivo che preferisci"
                  icon={Palette}
                  badge="Nuovo"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {themeOptions.map((theme) => {
                      const Icon = theme.icon;
                      return (
                        <Tooltip key={theme.value}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={
                                tempSettings.theme === theme.value
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() =>
                                setTempSettings((prev) => ({
                                  ...prev,
                                  theme: theme.value as Theme,
                                }))
                              }
                              className="h-20 flex flex-col gap-2 relative overflow-hidden"
                            >
                              <div
                                className={`absolute inset-0 ${theme.color} opacity-20`}
                              />
                              <Icon className="h-5 w-5 relative z-10" />
                              <span className="text-xs relative z-10">
                                {theme.label}
                              </span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Applica tema {theme.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </SettingCard>

                {/* Font Size */}
                <SettingCard
                  title="Dimensione del testo"
                  description="Regola la leggibilità del testo"
                  icon={Type}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Dimensione: {tempSettings.fontSize}</Label>
                      <div className="flex gap-2">
                        {(["small", "medium", "large", "xl"] as FontSize[]).map(
                          (size) => (
                            <Button
                              key={size}
                              variant={
                                tempSettings.fontSize === size
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                setTempSettings((prev) => ({
                                  ...prev,
                                  fontSize: size,
                                }))
                              }
                            >
                              {size === "small" && "S"}
                              {size === "medium" && "M"}
                              {size === "large" && "L"}
                              {size === "xl" && "XL"}
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted">
                      <p
                        className={`
                        ${tempSettings.fontSize === "small" ? "text-sm" : ""}
                        ${tempSettings.fontSize === "medium" ? "text-base" : ""}
                        ${tempSettings.fontSize === "large" ? "text-lg" : ""}
                        ${tempSettings.fontSize === "xl" ? "text-xl" : ""}
                      `}
                      >
                        Esempio di testo con la dimensione selezionata
                      </p>
                    </div>
                  </div>
                </SettingCard>

                {/* Custom Accent Color */}
                <SettingCard
                  title="Colore di accento personalizzato"
                  description="Personalizza il colore principale dell'interfaccia"
                  icon={Sparkles}
                  premium
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={tempSettings.customAccentColor}
                      onChange={(e) =>
                        setTempSettings((prev) => ({
                          ...prev,
                          customAccentColor: e.target.value,
                        }))
                      }
                      className="w-12 h-12 rounded-lg border-2 border-muted cursor-pointer"
                    />
                    <div className="flex-1">
                      <Input
                        value={tempSettings.customAccentColor}
                        onChange={(e) =>
                          setTempSettings((prev) => ({
                            ...prev,
                            customAccentColor: e.target.value,
                          }))
                        }
                        placeholder="#3b82f6"
                      />
                    </div>
                    <Button size="sm" variant="outline">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </SettingCard>

                {/* Accessibility Options */}
                <SettingCard
                  title="Accessibilità"
                  description="Opzioni per migliorare l'accessibilità"
                  icon={Eye}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Alto contrasto</Label>
                        <p className="text-xs text-muted-foreground">
                          Aumenta il contrasto per una migliore leggibilità
                        </p>
                      </div>
                      <Switch
                        checked={tempSettings.highContrast}
                        onCheckedChange={(checked) =>
                          setTempSettings((prev) => ({
                            ...prev,
                            highContrast: checked,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Riduzione movimento</Label>
                        <p className="text-xs text-muted-foreground">
                          Riduce animazioni e transizioni
                        </p>
                      </div>
                      <Switch
                        checked={tempSettings.reducedMotion}
                        onCheckedChange={(checked) =>
                          setTempSettings((prev) => ({
                            ...prev,
                            reducedMotion: checked,
                          }))
                        }
                      />
                    </div>
                  </div>
                </SettingCard>
              </motion.div>
            </TabsContent>

            {/* Behavior Tab */}
            <TabsContent value="behavior" className="space-y-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Language Selection */}
                <SettingCard
                  title="Lingua dell'interfaccia"
                  description="Seleziona la lingua dell'applicazione"
                  icon={Languages}
                >
                  <Select
                    value={tempSettings.language}
                    onValueChange={(value: Language) =>
                      setTempSettings((prev) => ({ ...prev, language: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          <div className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SettingCard>

                {/* Animations */}
                <SettingCard
                  title="Animazioni e transizioni"
                  description="Controlla le animazioni dell'interfaccia"
                  icon={Sparkles}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Abilita animazioni</Label>
                      <Switch
                        checked={tempSettings.animations}
                        onCheckedChange={(checked) =>
                          setTempSettings((prev) => ({
                            ...prev,
                            animations: checked,
                          }))
                        }
                      />
                    </div>
                    {tempSettings.animations && (
                      <div className="space-y-2">
                        <Label>Velocità animazioni</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {(
                            [
                              "slow",
                              "normal",
                              "fast",
                              "none",
                            ] as AnimationSpeed[]
                          ).map((speed) => (
                            <Button
                              key={speed}
                              variant={
                                tempSettings.animationSpeed === speed
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                setTempSettings((prev) => ({
                                  ...prev,
                                  animationSpeed: speed,
                                }))
                              }
                            >
                              {speed === "slow" && "Lenta"}
                              {speed === "normal" && "Normale"}
                              {speed === "fast" && "Veloce"}
                              {speed === "none" && "Nessuna"}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </SettingCard>

                {/* Sound Settings */}
                <SettingCard
                  title="Audio e suoni"
                  description="Gestisci i feedback audio dell'applicazione"
                  icon={tempSettings.soundEnabled ? Volume2 : VolumeX}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Abilita suoni</Label>
                      <Switch
                        checked={tempSettings.soundEnabled}
                        onCheckedChange={(checked) =>
                          setTempSettings((prev) => ({
                            ...prev,
                            soundEnabled: checked,
                          }))
                        }
                      />
                    </div>
                    {tempSettings.soundEnabled && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <VolumeX className="h-4 w-4" />
                          <Slider
                            defaultValue={[50]}
                            max={100}
                            step={10}
                            className="flex-1"
                          />
                          <Volume2 className="h-4 w-4" />
                        </div>
                        <Button size="sm" variant="outline" className="w-full">
                          <Music className="h-4 w-4 mr-2" />
                          Testa suono
                        </Button>
                      </div>
                    )}
                  </div>
                </SettingCard>

                {/* Auto-save and Tooltips */}
                <SettingCard
                  title="Esperienza utente"
                  description="Ottimizza l'usabilità dell'applicazione"
                  icon={Star}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Salvataggio automatico</Label>
                        <p className="text-xs text-muted-foreground">
                          Salva automaticamente le modifiche
                        </p>
                      </div>
                      <Switch
                        checked={tempSettings.autoSave}
                        onCheckedChange={(checked) =>
                          setTempSettings((prev) => ({
                            ...prev,
                            autoSave: checked,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Mostra suggerimenti</Label>
                        <p className="text-xs text-muted-foreground">
                          Visualizza tooltip informativi
                        </p>
                      </div>
                      <Switch
                        checked={tempSettings.showTooltips}
                        onCheckedChange={(checked) =>
                          setTempSettings((prev) => ({
                            ...prev,
                            showTooltips: checked,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Modalità compatta</Label>
                        <p className="text-xs text-muted-foreground">
                          Interfaccia più densa
                        </p>
                      </div>
                      <Switch
                        checked={tempSettings.compactMode}
                        onCheckedChange={(checked) =>
                          setTempSettings((prev) => ({
                            ...prev,
                            compactMode: checked,
                          }))
                        }
                      />
                    </div>
                  </div>
                </SettingCard>
              </motion.div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <SettingCard
                  title="Ottimizzazione performance"
                  description="Migliora le prestazioni dell'applicazione"
                  icon={Gauge}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Modalità performance</Label>
                        <p className="text-xs text-muted-foreground">
                          Ottimizza per dispositivi più lenti
                        </p>
                      </div>
                      <Switch
                        checked={tempSettings.performanceMode}
                        onCheckedChange={(checked) =>
                          setTempSettings((prev) => ({
                            ...prev,
                            performanceMode: checked,
                          }))
                        }
                      />
                    </div>

                    {tempSettings.performanceMode && (
                      <Alert>
                        <Zap className="h-4 w-4" />
                        <AlertDescription>
                          La modalità performance riduce alcune animazioni e
                          effetti per migliorare la fluidità.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </SettingCard>

                <SettingCard
                  title="Gestione memoria"
                  description="Controlla l'utilizzo della memoria"
                  icon={Database}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Cache utilizzata</span>
                        <span>12.5 MB</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                    <Button variant="outline" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Pulisci cache
                    </Button>
                  </div>
                </SettingCard>
              </motion.div>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="space-y-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <SettingCard
                  title="Raccolta dati"
                  description="Controlla quali dati condividere per migliorare l'app"
                  icon={Shield}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Dati di utilizzo anonimi</Label>
                        <p className="text-xs text-muted-foreground">
                          Aiutaci a migliorare l'app
                        </p>
                      </div>
                      <Switch
                        checked={tempSettings.dataCollection}
                        onCheckedChange={(checked) =>
                          setTempSettings((prev) => ({
                            ...prev,
                            dataCollection: checked,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Notifiche</Label>
                        <p className="text-xs text-muted-foreground">
                          Ricevi aggiornamenti importanti
                        </p>
                      </div>
                      <Switch
                        checked={tempSettings.notifications}
                        onCheckedChange={(checked) =>
                          setTempSettings((prev) => ({
                            ...prev,
                            notifications: checked,
                          }))
                        }
                      />
                    </div>

                    {!tempSettings.dataCollection && (
                      <Alert>
                        <HelpCircle className="h-4 w-4" />
                        <AlertDescription>
                          Disabilitando la raccolta dati, potresti perdere
                          alcune funzionalità personalizzate.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </SettingCard>

                <SettingCard
                  title="Backup e sicurezza"
                  description="Gestisci i backup automatici dei tuoi dati"
                  icon={tempSettings.autoBackup ? Lock : Unlock}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Backup automatico</Label>
                        <p className="text-xs text-muted-foreground">
                          Salva automaticamente i tuoi dati
                        </p>
                      </div>
                      <Switch
                        checked={tempSettings.autoBackup}
                        onCheckedChange={(checked) =>
                          setTempSettings((prev) => ({
                            ...prev,
                            autoBackup: checked,
                          }))
                        }
                      />
                    </div>

                    {tempSettings.autoBackup && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>
                            Numero massimo backup: {tempSettings.maxBackups}
                          </Label>
                          <div className="flex items-center gap-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setTempSettings((prev) => ({
                                  ...prev,
                                  maxBackups: Math.max(1, prev.maxBackups - 1),
                                }))
                              }
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">
                              {tempSettings.maxBackups}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setTempSettings((prev) => ({
                                  ...prev,
                                  maxBackups: Math.min(10, prev.maxBackups + 1),
                                }))
                              }
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Button size="sm" variant="outline">
                            <CloudDownload className="h-4 w-4 mr-2" />
                            Backup ora
                          </Button>
                          <Button size="sm" variant="outline">
                            <CloudUpload className="h-4 w-4 mr-2" />
                            Ripristina
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </SettingCard>
              </motion.div>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <SettingCard
                  title="Modalità sviluppatore"
                  description="Strumenti avanzati per debug e sviluppo"
                  icon={SettingsIcon}
                  badge="Avanzato"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Debug avanzato</Label>
                        <p className="text-xs text-muted-foreground">
                          Abilita logging dettagliato e strumenti di debug
                        </p>
                      </div>
                      <Switch
                        checked={tempSettings.debug}
                        onCheckedChange={(checked) =>
                          setTempSettings((prev) => ({
                            ...prev,
                            debug: checked,
                          }))
                        }
                      />
                    </div>

                    <AnimatePresence>
                      {tempSettings.debug && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3"
                        >
                          <div className="p-4 bg-muted rounded-lg border-l-4 border-l-yellow-500">
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <Zap className="h-4 w-4 text-yellow-500" />
                              Funzionalità Debug Attive
                            </h4>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              <li className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                Logging dettagliato API calls
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                Console di debug nell'interfaccia
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                Stack trace completi degli errori
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                Timing delle operazioni
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                Stato interno dei componenti
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                Network monitoring avanzato
                              </li>
                            </ul>
                          </div>

                          <Alert className="border-orange-200 bg-orange-50">
                            <HelpCircle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-800">
                              La modalità debug può rallentare l'applicazione.
                              Disabilitala quando non necessaria.
                            </AlertDescription>
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </SettingCard>

                <SettingCard
                  title="Import/Export configurazione"
                  description="Backup e ripristino delle impostazioni"
                  icon={Database}
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button
                        onClick={handleExportSettings}
                        variant="outline"
                        className="h-12 flex flex-col gap-1"
                        disabled={exportProgress > 0}
                      >
                        <Download className="h-4 w-4" />
                        <span className="text-xs">Esporta</span>
                      </Button>

                      <div className="relative">
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportSettings}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Button
                          variant="outline"
                          className="w-full h-12 flex flex-col gap-1"
                        >
                          <Upload className="h-4 w-4" />
                          <span className="text-xs">Importa</span>
                        </Button>
                      </div>
                    </div>

                    {exportProgress > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Esportazione in corso...</span>
                          <span>{exportProgress}%</span>
                        </div>
                        <Progress value={exportProgress} className="h-2" />
                      </div>
                    )}
                  </div>
                </SettingCard>

                <SettingCard
                  title="Reset e manutenzione"
                  description="Ripristina impostazioni di default e pulizia sistema"
                  icon={RotateCcw}
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button
                        onClick={() => {
                          setTempSettings({
                            debug: false,
                            theme: "system",
                            fontSize: "medium",
                            language: "it",
                            animations: true,
                            animationSpeed: "normal",
                            soundEnabled: true,
                            notifications: true,
                            autoSave: true,
                            compactMode: false,
                            highContrast: false,
                            reducedMotion: false,
                            showTooltips: true,
                            dataCollection: false,
                            performanceMode: false,
                            customAccentColor: "#3b82f6",
                            autoBackup: true,
                            maxBackups: 5,
                          });
                          toast.success("Impostazioni ripristinate");
                        }}
                        variant="outline"
                        className="h-12 flex flex-col gap-1"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span className="text-xs">Reset</span>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-12 flex flex-col gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="text-xs">Pulisci tutto</span>
                      </Button>
                    </div>

                    <Alert className="border-red-200 bg-red-50">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        Attenzione: queste operazioni sono irreversibili.
                        Assicurati di aver fatto un backup.
                      </AlertDescription>
                    </Alert>
                  </div>
                </SettingCard>

                {/* System Information */}
                <SettingCard
                  title="Informazioni sistema"
                  description="Dettagli tecnici e statistiche dell'applicazione"
                  icon={Monitor}
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between p-2 rounded bg-muted">
                          <span className="text-muted-foreground">
                            Versione:
                          </span>
                          <span className="font-mono">2.1.0</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-muted">
                          <span className="text-muted-foreground">Build:</span>
                          <span className="font-mono">
                            #{new Date().getTime().toString().slice(-6)}
                          </span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-muted">
                          <span className="text-muted-foreground">
                            Ambiente:
                          </span>
                          <Badge variant="outline">
                            {import.meta.env.MODE}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between p-2 rounded bg-muted">
                          <span className="text-muted-foreground">
                            Browser:
                          </span>
                          <span className="font-mono">
                            {navigator.userAgent.split(" ")[0]}
                          </span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-muted">
                          <span className="text-muted-foreground">
                            Piattaforma:
                          </span>
                          <span className="font-mono">
                            {navigator.platform}
                          </span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-muted">
                          <span className="text-muted-foreground">
                            Lingua sistema:
                          </span>
                          <span className="font-mono">
                            {navigator.language}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const info = {
                          version: "2.1.0",
                          build: new Date().getTime().toString().slice(-6),
                          environment: import.meta.env.MODE,
                          browser: navigator.userAgent,
                          platform: navigator.platform,
                          language: navigator.language,
                          settings: tempSettings,
                        };
                        navigator.clipboard.writeText(
                          JSON.stringify(info, null, 2)
                        );
                        toast.success("Informazioni copiate negli appunti");
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copia info sistema
                    </Button>
                  </div>
                </SettingCard>
              </motion.div>
            </TabsContent>
          </Tabs>

          {/* Enhanced Action Bar */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky bottom-6 z-10"
          >
            <Card className="bg-background/95 backdrop-blur-sm border-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {hasChanges ? (
                        <>
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                          <span>Modifiche non salvate</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Tutto salvato</span>
                        </>
                      )}
                    </div>

                    {lastSaved && (
                      <div className="text-xs text-muted-foreground">
                        Ultimo salvataggio: {lastSaved.toLocaleTimeString()}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => {
                            setTempSettings({
                              debug: false,
                              theme: "system",
                              fontSize: "medium",
                              language: "it",
                              animations: true,
                              animationSpeed: "normal",
                              soundEnabled: true,
                              notifications: true,
                              autoSave: true,
                              compactMode: false,
                              highContrast: false,
                              reducedMotion: false,
                              showTooltips: true,
                              dataCollection: false,
                              performanceMode: false,
                              customAccentColor: "#3b82f6",
                              autoBackup: true,
                              maxBackups: 5,
                            });
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ripristina default</p>
                      </TooltipContent>
                    </Tooltip>

                    <Button
                      onClick={() => navigate("/")}
                      variant="outline"
                      disabled={isLoading}
                    >
                      Annulla
                    </Button>

                    <Button
                      onClick={handleSave}
                      disabled={!hasChanges || isLoading}
                      className="min-w-[120px]"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Salva tutto
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {hasChanges && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 pt-3 border-t"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {
                          Object.keys(tempSettings).filter(
                            (key) =>
                              tempSettings[key as keyof EnhancedSettings] !==
                              settings[key as keyof typeof settings]
                          ).length
                        }{" "}
                        impostazioni modificate
                      </span>

                      {tempSettings.autoSave && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Salvataggio automatico: ON</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Settings Floating Panel */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed right-6 top-1/2 transform -translate-y-1/2 z-20"
          >
            <Card className="bg-background/95 backdrop-blur-sm border-2 w-16">
              <CardContent className="p-2 space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={
                        tempSettings.theme === "dark" ? "default" : "ghost"
                      }
                      onClick={() =>
                        setTempSettings((prev) => ({
                          ...prev,
                          theme: prev.theme === "dark" ? "light" : "dark",
                        }))
                      }
                      className="w-full h-10"
                    >
                      {tempSettings.theme === "dark" ? (
                        <Sun className="h-4 w-4" />
                      ) : (
                        <Moon className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Cambia tema</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={tempSettings.soundEnabled ? "default" : "ghost"}
                      onClick={() =>
                        setTempSettings((prev) => ({
                          ...prev,
                          soundEnabled: !prev.soundEnabled,
                        }))
                      }
                      className="w-full h-10"
                    >
                      {tempSettings.soundEnabled ? (
                        <Volume2 className="h-4 w-4" />
                      ) : (
                        <VolumeX className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Toggle audio</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={tempSettings.notifications ? "default" : "ghost"}
                      onClick={() =>
                        setTempSettings((prev) => ({
                          ...prev,
                          notifications: !prev.notifications,
                        }))
                      }
                      className="w-full h-10"
                    >
                      <Bell className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Toggle notifiche</p>
                  </TooltipContent>
                </Tooltip>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </PageContainer>
    </TooltipProvider>
  );
};
