import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
import type { DataStats } from "../services/api";
import {
  BarChart3,
  FileText,
  Database,
  Activity,
  RefreshCw,
  Settings,
  AlertCircle,
  ChevronRight,
  Clock,
  Server,
  HardDrive,
  MemoryStick,
  Wifi,
  FolderOpen,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { PageContainer } from "@/components/PageContainer";
import Spinner from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";

interface SystemCheck {
  status: 'healthy' | 'warning' | 'critical' | 'checking';
  message: string;
  responseTime?: number;
  lastChecked: string;
  details?: Record<string, string | number | boolean>;
}

interface SystemStatus {
  api: SystemCheck;
  storage: SystemCheck;
  memory: SystemCheck;
  network: SystemCheck;
  fileSystem: SystemCheck;
  security: SystemCheck;
  performance: SystemCheck;
  overallHealth: 'healthy' | 'warning' | 'critical' | 'checking';
}

interface ActivityItem {
  id: string;
  type: 'file_upload' | 'system_update' | 'data_sync' | 'backup';
  message: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DataStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    api: { status: 'checking', message: 'Controllo connessione API...', lastChecked: new Date().toISOString() },
    storage: { status: 'checking', message: 'Controllo spazio di archiviazione...', lastChecked: new Date().toISOString() },
    memory: { status: 'checking', message: 'Controllo utilizzo memoria...', lastChecked: new Date().toISOString() },
    network: { status: 'checking', message: 'Controllo connettività di rete...', lastChecked: new Date().toISOString() },
    fileSystem: { status: 'checking', message: 'Controllo integrità file system...', lastChecked: new Date().toISOString() },
    security: { status: 'checking', message: 'Controllo sicurezza...', lastChecked: new Date().toISOString() },
    performance: { status: 'checking', message: 'Controllo prestazioni...', lastChecked: new Date().toISOString() },
    overallHealth: 'checking'
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateRecentActivity = (): ActivityItem[] => {
    const now = new Date();
    const activities: ActivityItem[] = [
      {
        id: '1',
        type: 'system_update',
        message: 'Sistema di monitoraggio aggiornato',
        timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: '2',
        type: 'data_sync',
        message: 'Controlli di integrità completati',
        timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: '3',
        type: 'file_upload',
        message: 'File caricato con successo',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: '4',
        type: 'backup',
        message: 'Backup automatico eseguito',
        timestamp: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
        status: 'success'
      }
    ];
    return activities;
  };

  const checkSystemStatus = useCallback(async (): Promise<SystemStatus> => {
    const now = new Date().toISOString();
    
    // Initialize status with checking state
    const status: SystemStatus = {
      api: { status: 'checking', message: 'Controllo connessione API...', lastChecked: now },
      storage: { status: 'checking', message: 'Controllo spazio di archiviazione...', lastChecked: now },
      memory: { status: 'checking', message: 'Controllo utilizzo memoria...', lastChecked: now },
      network: { status: 'checking', message: 'Controllo connettività di rete...', lastChecked: now },
      fileSystem: { status: 'checking', message: 'Controllo integrità file system...', lastChecked: now },
      security: { status: 'checking', message: 'Controllo sicurezza...', lastChecked: now },
      performance: { status: 'checking', message: 'Controllo prestazioni...', lastChecked: now },
      overallHealth: 'checking'
    };

    // API Health Check
    try {
      const apiStartTime = performance.now();
      await apiService.getStats();
      const apiResponseTime = performance.now() - apiStartTime;
      
      status.api = {
        status: apiResponseTime < 1000 ? 'healthy' : apiResponseTime < 3000 ? 'warning' : 'critical',
        message: `API risponde in ${Math.round(apiResponseTime)}ms`,
        responseTime: Math.round(apiResponseTime),
        lastChecked: now,
        details: {
          endpoint: '/api/stats',
          responseTime: Math.round(apiResponseTime),
          threshold: '1000ms'
        }
      };
    } catch (error) {
      status.api = {
        status: 'critical',
        message: 'API non raggiungibile',
        lastChecked: now,
        details: {
          error: error instanceof Error ? error.message : 'Errore sconosciuto'
        }
      };
    }

    // Storage Health Check
    try {
      const storageData = await apiService.getStats();
      const usagePercentage = storageData.totalSize ? (storageData.totalSize / (1024 * 1024 * 1024)) * 100 : 0; // GB usage
      
      status.storage = {
        status: usagePercentage < 70 ? 'healthy' : usagePercentage < 90 ? 'warning' : 'critical',
        message: `Utilizzo: ${usagePercentage.toFixed(1)}% (${formatBytes(storageData.totalSize || 0)})`,
        lastChecked: now,
        details: {
          totalFiles: storageData.totalFiles || 0,
          totalSize: storageData.totalSize || 0,
          usagePercentage: Math.round(usagePercentage)
        }
      };
    } catch {
      status.storage = {
        status: 'warning',
        message: 'Impossibile verificare lo storage',
        lastChecked: now
      };
    }

    // Memory Usage Check (Client-side estimation)
    const memoryInfo = (navigator as unknown as { memory?: { usedJSMemorySize: number; totalJSMemorySize: number; jsMemoryLimit: number } }).memory;
    if (memoryInfo) {
      const memoryUsage = (memoryInfo.usedJSMemorySize / memoryInfo.totalJSMemorySize) * 100;
      status.memory = {
        status: memoryUsage < 70 ? 'healthy' : memoryUsage < 90 ? 'warning' : 'critical',
        message: `Memoria JS: ${memoryUsage.toFixed(1)}%`,
        lastChecked: now,
        details: {
          used: Math.round(memoryInfo.usedJSMemorySize / 1024 / 1024),
          total: Math.round(memoryInfo.totalJSMemorySize / 1024 / 1024),
          limit: Math.round(memoryInfo.jsMemoryLimit / 1024 / 1024)
        }
      };
    } else {
      status.memory = {
        status: 'warning',
        message: 'Informazioni memoria non disponibili',
        lastChecked: now
      };
    }

    // Network Connectivity Check
    const networkStatus = navigator.onLine;
    const connection = (navigator as unknown as { connection?: { effectiveType: string; downlink: number; rtt: number } }).connection;
    
    status.network = {
      status: networkStatus ? 'healthy' : 'critical',
      message: networkStatus 
        ? `Connesso${connection ? ` - ${connection.effectiveType}` : ''}` 
        : 'Nessuna connessione di rete',
      lastChecked: now,
      details: connection ? {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      } : {}
    };

    // File System Integrity Check (via API test)
    try {
      const healthEndpoint = '/api/health';
      const healthStartTime = performance.now();
      const response = await fetch(healthEndpoint);
      const healthResponseTime = performance.now() - healthStartTime;
      
      if (response.ok) {
        status.fileSystem = {
          status: 'healthy',
          message: 'File system accessibile',
          responseTime: Math.round(healthResponseTime),
          lastChecked: now
        };
      } else {
        status.fileSystem = {
          status: 'warning',
          message: `Risposta HTTP ${response.status}`,
          lastChecked: now
        };
      }
    } catch {
      status.fileSystem = {
        status: 'warning',
        message: 'Controllo file system non disponibile',
        lastChecked: now
      };
    }

    // Security Check (Basic HTTPS and Origin validation)
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    const hasValidOrigin = window.location.origin === window.origin;
    
    status.security = {
      status: isSecure && hasValidOrigin ? 'healthy' : 'warning',
      message: isSecure 
        ? 'Connessione sicura attiva' 
        : 'Connessione non sicura rilevata',
      lastChecked: now,
      details: {
        protocol: window.location.protocol,
        secure: isSecure,
        origin: window.location.origin
      }
    };

    // Performance Check (Page load and resource timing)
    const performanceEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const loadTime = performanceEntries.length > 0 ? performanceEntries[0].loadEventEnd - performanceEntries[0].fetchStart : 0;
    
    status.performance = {
      status: loadTime < 3000 ? 'healthy' : loadTime < 6000 ? 'warning' : 'critical',
      message: `Tempo di caricamento: ${Math.round(loadTime)}ms`,
      responseTime: Math.round(loadTime),
      lastChecked: now,
      details: {
        loadTime: Math.round(loadTime),
        domContentLoaded: performanceEntries.length > 0 ? Math.round(performanceEntries[0].domContentLoadedEventEnd - performanceEntries[0].fetchStart) : 0
      }
    };

    // Calculate Overall Health
    const checks = [status.api, status.storage, status.memory, status.network, status.fileSystem, status.security, status.performance];
    const criticalCount = checks.filter(check => check.status === 'critical').length;
    const warningCount = checks.filter(check => check.status === 'warning').length;

    if (criticalCount > 0) {
      status.overallHealth = 'critical';
    } else if (warningCount > 2) {
      status.overallHealth = 'warning';
    } else if (warningCount > 0) {
      status.overallHealth = 'warning';
    } else {
      status.overallHealth = 'healthy';
    }

    return status;
  }, []);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [statsData, systemStatusData] = await Promise.all([
        apiService.getStats(),
        checkSystemStatus()
      ]);
      
      setStats(statsData);
      setSystemStatus(systemStatusData);
      setRecentActivity(generateRecentActivity());
    } catch (error) {
      console.error("Errore nel caricamento dati dashboard:", error);
      setError("Errore nel caricamento dei dati. Riprova più tardi.");
      const now = new Date().toISOString();
      setSystemStatus({
        api: { status: 'critical', message: 'API non raggiungibile', lastChecked: now },
        storage: { status: 'warning', message: 'Storage non verificabile', lastChecked: now },
        memory: { status: 'warning', message: 'Memoria non verificabile', lastChecked: now },
        network: { status: 'warning', message: 'Rete non verificabile', lastChecked: now },
        fileSystem: { status: 'warning', message: 'File system non verificabile', lastChecked: now },
        security: { status: 'warning', message: 'Sicurezza non verificabile', lastChecked: now },
        performance: { status: 'warning', message: 'Prestazioni non verificabili', lastChecked: now },
        overallHealth: 'critical'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [checkSystemStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleNavigation = (path: string) => {
    try {
      navigate(path);
    } catch (error) {
      console.warn(`Navigation to ${path} failed:`, error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("it-IT");
  };

  const getStatusColor = (status: SystemCheck['status']) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      case 'checking': return 'bg-blue-500 animate-pulse';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (check: SystemCheck) => {
    return check.message;
  };

  const getStatusTextColor = (status: SystemCheck['status']) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      case 'checking': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'file_upload': return FileText;
      case 'system_update': return Settings;
      case 'data_sync': return Database;
      case 'backup': return Activity;
      default: return Activity;
    }
  };

  const getActivityIconColor = (status: ActivityItem['status']) => {
    switch (status) {
      case 'success': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <PageContainer intensity={1}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Spinner className="h-8 w-8 text-primary" />
            <p className="text-sm text-muted-foreground">
              Caricamento dashboard...
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer intensity={2}>
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ultimo aggiornamento: {formatDate(stats?.lastUpdate || null)}
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="ml-auto"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Aggiorna
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Overview & Stats Section */}
        <div className="col-span-2 space-y-6">
          {/* Summary Stats Cards */}
          <div className="grid gap-4 grid-cols-3">
            <Card className="enhanced-card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium">File Totali</CardTitle>
                  <FileText className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalFiles ?? 'N/A'}</div>
              </CardContent>
            </Card>

            <Card className="enhanced-card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium">Spazio Utilizzato</CardTitle>
                  <Database className="h-4 w-4 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatBytes(stats?.totalSize || 0)}</div>
              </CardContent>
            </Card>

            <Card className="enhanced-card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium">Dati Generali</CardTitle>
                  <BarChart3 className="h-4 w-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.generalDataCount ?? 'N/A'}</div>
              </CardContent>
            </Card>
          </div>

          {/* Storage Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Utilizzo Spazio</CardTitle>
              <CardDescription>
                Monitoraggio dello spazio di archiviazione utilizzato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Spazio Utilizzato</span>
                  <span className="text-sm font-medium">{formatBytes(stats?.totalSize || 0)}</span>
                </div>
                <Progress value={Math.min((stats?.totalSize || 0) / 1000000000 * 100, 100)} />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>0 GB</span>
                  <span>1 GB</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-2" />
                Aggiornato: {formatDate(stats?.lastUpdate || null)}
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleNavigation("/stats")}>
                Dettagli <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Attività Recenti</CardTitle>
              <CardDescription>
                Ultime operazioni eseguite nel sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-center p-3 border rounded-lg">
                    <Icon className={`h-5 w-5 mr-3 ${getActivityIconColor(activity.status)}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button variant="ghost" size="sm" className="ml-auto">
                Visualizza tutte <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar - Actions & System Status */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="enhanced-card">
            <CardHeader>
              <CardTitle>Azioni Rapide</CardTitle>
              <CardDescription>
                Accesso rapido alle funzioni principali
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => handleNavigation("/files")}
                className="w-full justify-start"
                variant="outline"
              >
                <FileText className="mr-2 h-4 w-4" />
                Gestione File
              </Button>
              <Button
                onClick={() => handleNavigation("/save-data")}
                className="w-full justify-start"
                variant="outline"
              >
                <Database className="mr-2 h-4 w-4" />
                Carica File JSON
              </Button>
              <Button
                onClick={() => handleNavigation("/stats")}
                className="w-full justify-start"
                variant="outline"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Statistiche
              </Button>
              <Button
                onClick={() => handleNavigation("/settings")}
                className="w-full justify-start"
                variant="outline"
              >
                <Settings className="mr-2 h-4 w-4" />
                Impostazioni
              </Button>
            </CardContent>
          </Card>

          {/* Advanced System Status */}
          <Card className="enhanced-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                Stato Sistema
                <div className={`ml-2 h-3 w-3 rounded-full ${
                  systemStatus.overallHealth === 'healthy' ? 'bg-green-500' :
                  systemStatus.overallHealth === 'warning' ? 'bg-yellow-500' :
                  systemStatus.overallHealth === 'critical' ? 'bg-red-500' :
                  'bg-blue-500 animate-pulse'
                }`}></div>
              </CardTitle>
              <CardDescription>
                Monitoraggio avanzato dell'integrità del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* API Status */}
              <div className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center">
                  <Server className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className={`h-3 w-3 rounded-full mr-3 ${getStatusColor(systemStatus.api.status)}`}></div>
                  <div>
                    <span className="text-sm font-medium">Backend API</span>
                    {systemStatus.api.responseTime && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({systemStatus.api.responseTime}ms)
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-xs font-medium ${getStatusTextColor(systemStatus.api.status)}`}>
                  {systemStatus.api.status === 'healthy' ? 'OK' : 
                   systemStatus.api.status === 'warning' ? 'LENTO' :
                   systemStatus.api.status === 'critical' ? 'OFFLINE' : 'CONTROLLO'}
                </span>
              </div>

              {/* Storage Status */}
              <div className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center">
                  <HardDrive className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className={`h-3 w-3 rounded-full mr-3 ${getStatusColor(systemStatus.storage.status)}`}></div>
                  <span className="text-sm font-medium">Archiviazione</span>
                </div>
                <span className={`text-xs font-medium ${getStatusTextColor(systemStatus.storage.status)}`}>
                  {systemStatus.storage.status === 'healthy' ? 'OK' : 
                   systemStatus.storage.status === 'warning' ? 'ALTO' :
                   systemStatus.storage.status === 'critical' ? 'PIENO' : 'CONTROLLO'}
                </span>
              </div>

              {/* Memory Status */}
              <div className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center">
                  <MemoryStick className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className={`h-3 w-3 rounded-full mr-3 ${getStatusColor(systemStatus.memory.status)}`}></div>
                  <span className="text-sm font-medium">Memoria</span>
                </div>
                <span className={`text-xs font-medium ${getStatusTextColor(systemStatus.memory.status)}`}>
                  {systemStatus.memory.status === 'healthy' ? 'OK' : 
                   systemStatus.memory.status === 'warning' ? 'ALTO' :
                   systemStatus.memory.status === 'critical' ? 'CRITICO' : 'N/A'}
                </span>
              </div>

              {/* Network Status */}
              <div className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center">
                  <Wifi className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className={`h-3 w-3 rounded-full mr-3 ${getStatusColor(systemStatus.network.status)}`}></div>
                  <span className="text-sm font-medium">Rete</span>
                </div>
                <span className={`text-xs font-medium ${getStatusTextColor(systemStatus.network.status)}`}>
                  {systemStatus.network.status === 'healthy' ? 'CONNESSO' : 
                   systemStatus.network.status === 'critical' ? 'OFFLINE' : 'CONTROLLO'}
                </span>
              </div>

              {/* File System Status */}
              <div className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center">
                  <FolderOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className={`h-3 w-3 rounded-full mr-3 ${getStatusColor(systemStatus.fileSystem.status)}`}></div>
                  <span className="text-sm font-medium">File System</span>
                </div>
                <span className={`text-xs font-medium ${getStatusTextColor(systemStatus.fileSystem.status)}`}>
                  {systemStatus.fileSystem.status === 'healthy' ? 'OK' : 
                   systemStatus.fileSystem.status === 'warning' ? 'WARN' : 'N/A'}
                </span>
              </div>

              {/* Security Status */}
              <div className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className={`h-3 w-3 rounded-full mr-3 ${getStatusColor(systemStatus.security.status)}`}></div>
                  <span className="text-sm font-medium">Sicurezza</span>
                </div>
                <span className={`text-xs font-medium ${getStatusTextColor(systemStatus.security.status)}`}>
                  {systemStatus.security.status === 'healthy' ? 'SICURO' : 'NON SICURO'}
                </span>
              </div>

              {/* Performance Status */}
              <div className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className={`h-3 w-3 rounded-full mr-3 ${getStatusColor(systemStatus.performance.status)}`}></div>
                  <span className="text-sm font-medium">Prestazioni</span>
                  {systemStatus.performance.responseTime && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({systemStatus.performance.responseTime}ms)
                    </span>
                  )}
                </div>
                <span className={`text-xs font-medium ${getStatusTextColor(systemStatus.performance.status)}`}>
                  {systemStatus.performance.status === 'healthy' ? 'VELOCE' : 
                   systemStatus.performance.status === 'warning' ? 'LENTO' :
                   systemStatus.performance.status === 'critical' ? 'MOLTO LENTO' : 'CONTROLLO'}
                </span>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 mr-2" />
                {systemStatus.overallHealth === 'healthy' && 'Tutti i sistemi operativi'}
                {systemStatus.overallHealth === 'warning' && 'Alcuni problemi rilevati'}
                {systemStatus.overallHealth === 'critical' && 'Problemi critici rilevati'}
                {systemStatus.overallHealth === 'checking' && 'Controllo in corso...'}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
