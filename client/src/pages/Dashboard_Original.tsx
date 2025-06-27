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
    api: 'checking',
    database: 'checking',
    storage: 'checking'
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateRecentActivity = (): ActivityItem[] => {
    const now = new Date();
    const activities: ActivityItem[] = [
      {
        id: '1',
        type: 'system_update',
        message: 'Dashboard aggiornato',
        timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: '2',
        type: 'data_sync',
        message: 'Sincronizzazione dati completata',
        timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: '3',
        type: 'file_upload',
        message: 'File caricato con successo',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        status: 'success'
      }
    ];
    return activities;
  };

  const checkSystemStatus = async (): Promise<SystemStatus> => {
    const status: SystemStatus = {
      api: 'checking',
      database: 'checking',
      storage: 'checking'
    };

    try {
      // Test API connection
      await apiService.getStats();
      status.api = 'online';
      status.database = 'online';
      status.storage = 'online';
    } catch (error) {
      console.error('System status check failed:', error);
      status.api = 'offline';
      status.database = 'offline';
      status.storage = 'offline';
    }

    return status;
  };

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
      setSystemStatus({
        api: 'offline',
        database: 'offline',
        storage: 'offline'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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

  const getStatusColor = (status: 'online' | 'offline' | 'checking') => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'checking': return 'bg-yellow-500 animate-pulse';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: 'online' | 'offline' | 'checking') => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'checking': return 'Controllo...';
      default: return 'Sconosciuto';
    }
  };

  const getStatusTextColor = (status: 'online' | 'offline' | 'checking') => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      case 'checking': return 'text-yellow-500';
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

          {/* System Status */}
          <Card className="enhanced-card">
            <CardHeader>
              <CardTitle>Stato Sistema</CardTitle>
              <CardDescription>
                Informazioni sullo stato attuale del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`h-3 w-3 rounded-full mr-2 ${getStatusColor(systemStatus.api)}`}></div>
                  <span className="text-sm">Backend API</span>
                </div>
                <span className={`text-sm font-medium ${getStatusTextColor(systemStatus.api)}`}>
                  {getStatusText(systemStatus.api)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`h-3 w-3 rounded-full mr-2 ${getStatusColor(systemStatus.database)}`}></div>
                  <span className="text-sm">Database</span>
                </div>
                <span className={`text-sm font-medium ${getStatusTextColor(systemStatus.database)}`}>
                  {getStatusText(systemStatus.database)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`h-3 w-3 rounded-full mr-2 ${getStatusColor(systemStatus.storage)}`}></div>
                  <span className="text-sm">Storage</span>
                </div>
                <span className={`text-sm font-medium ${getStatusTextColor(systemStatus.storage)}`}>
                  {getStatusText(systemStatus.storage)}
                </span>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 mr-2" />
                {systemStatus.api === 'online' && systemStatus.database === 'online' && systemStatus.storage === 'online' 
                  ? 'Tutti i sistemi operativi'
                  : 'Problemi di sistema rilevati'
                }
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
