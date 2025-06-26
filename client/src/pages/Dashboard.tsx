import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { DataStats } from '../services/api';
import { 
  BarChart3, 
  FileText, 
  Database, 
  Activity, 
  RefreshCw,
  Settings,
  Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from '@/components/PageContainer';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DataStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const statsData = await apiService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Errore nel caricamento dati dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('it-IT');
  };

  if (loading) {
    return (
      <PageContainer intensity={1}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Caricamento dashboard...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer intensity={2}>
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Panoramica generale del sistema Vicsam Group
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="enhanced-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">File Totali</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalFiles || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="enhanced-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spazio Utilizzato</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(stats?.totalSize || 0)}</div>
          </CardContent>
        </Card>
        
        <Card className="enhanced-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dati Generali</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.generalDataCount || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="enhanced-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ultimo Aggiornamento</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{formatDate(stats?.lastUpdate || null)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-3 enhanced-card">
          <CardHeader>
            <CardTitle>Azioni Rapide</CardTitle>
            <CardDescription>
              Accesso rapido alle funzioni principali del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => navigate('/files')} className="w-full justify-start" variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Gestione File
            </Button>
            <Button onClick={() => navigate('/save-data')} className="w-full justify-start" variant="outline">
              <Database className="mr-2 h-4 w-4" />
              Carica File JSON
            </Button>
            <Button onClick={() => navigate('/stats')} className="w-full justify-start" variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              Statistiche
            </Button>
            <Button onClick={() => navigate('/settings')} className="w-full justify-start" variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Impostazioni
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};
